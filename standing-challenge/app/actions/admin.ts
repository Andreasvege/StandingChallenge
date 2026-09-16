'use server'

import { eq } from 'drizzle-orm'
import { revalidatePath } from 'next/cache'
import { db } from '@/db/client'
import { employees } from '@/db/schema'
import { isAllowedEmail, normalizeEmail } from '@/lib/access'
import { requireAdminAction } from '@/lib/current-employee'
import { isFigure, randomFigure, type Figure } from '@/lib/figure'
import { t, toLang, type Lang } from '@/lib/i18n'
import { MAX_SEATS } from '@/lib/room-layout'

function cleanName(name: string, lang: Lang): string {
  const trimmed = name.trim()
  if (trimmed.length < 1 || trimmed.length > 30) throw new Error(t(lang, 'error.badName'))
  return trimmed
}

function refresh() {
  revalidatePath('/admin')
  revalidatePath('/')
}

/** Empty means «at the office»; anything else is the place shown on their screen on the wall. */
function cleanPlace(place: string | null | undefined): string | null {
  const trimmed = (place ?? '').trim().slice(0, 20)
  return trimmed === '' ? null : trimmed
}

export async function saveEmployee(input: { id: string; name: string; figure: Figure; remoteFrom?: string | null }, lang?: string): Promise<void> {
  const language = toLang(lang)
  await requireAdminAction(language)
  if (!isFigure(input.figure)) throw new Error(t(language, 'error.badFigure'))
  await db
    .update(employees)
    .set({ name: cleanName(input.name, language), figure: input.figure, remoteFrom: cleanPlace(input.remoteFrom) })
    .where(eq(employees.id, input.id))
  refresh()
}

export async function createEmployee(input: { email: string; name: string }, lang?: string): Promise<void> {
  const language = toLang(lang)
  await requireAdminAction(language)
  const email = normalizeEmail(input.email)
  if (!isAllowedEmail(email)) throw new Error(t(language, 'error.badEmail'))
  await db
    .insert(employees)
    .values({ email, name: cleanName(input.name, language), figure: randomFigure() })
    .onConflictDoNothing({ target: employees.email })
  refresh()
}

/** Puts someone on a desk (or none). Whoever sat there swaps to the mover's old desk (or none). */
export async function placeEmployee(input: { employeeId: string; seat: number | null }, lang?: string): Promise<void> {
  const language = toLang(lang)
  await requireAdminAction(language)
  const { employeeId, seat } = input
  if (seat !== null && !(Number.isInteger(seat) && seat >= 0 && seat < MAX_SEATS)) throw new Error(t(language, 'error.badSeat'))
  const [mover] = await db.select().from(employees).where(eq(employees.id, employeeId))
  if (!mover) throw new Error(t(language, 'error.personNotFound'))

  const clear = db.update(employees).set({ seat: null }).where(eq(employees.id, employeeId))
  if (seat === null) {
    await clear
  } else {
    const take = db.update(employees).set({ seat }).where(eq(employees.id, employeeId))
    const [holder] = await db.select().from(employees).where(eq(employees.seat, seat))
    if (holder && holder.id !== employeeId) {
      // One transaction, in this order, so the unique seat index never sees two people on one desk.
      await db.batch([clear, db.update(employees).set({ seat: mover.seat }).where(eq(employees.id, holder.id)), take])
    } else {
      await db.batch([clear, take])
    }
  }
  refresh()
}

export async function deleteEmployee(input: { id: string }, lang?: string): Promise<void> {
  const language = toLang(lang)
  const me = await requireAdminAction(language)
  if (input.id === me.id) throw new Error(t(language, 'error.removeSelf'))
  await db.delete(employees).where(eq(employees.id, input.id)) // their sessions go too (on delete cascade)
  refresh()
}
