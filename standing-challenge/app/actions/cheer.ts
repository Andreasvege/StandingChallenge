'use server'

import { and, desc, eq } from 'drizzle-orm'
import { db } from '@/db/client'
import { cheers, employees } from '@/db/schema'
import { canCheer, isCheerEmoji } from '@/lib/cheers'
import { getCurrentEmployee } from '@/lib/current-employee'
import { t, toLang } from '@/lib/i18n'
import { loadOfficeSnapshot } from '@/lib/office'
import type { OfficeSnapshot } from '@/lib/snapshot'

export interface CheerResult {
  ok: boolean
  /** Shown to the sender when the cheer wasn't sent (cooldown, unknown person …). */
  message: string | null
  snapshot: OfficeSnapshot
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

// Server actions are reachable by direct POST, so this checks the login itself, and the sender is
// always the logged-in user – never taken from the request. `lang` only picks the message language.
export async function sendCheer(toId: string, emoji: string, lang?: string): Promise<CheerResult> {
  const language = toLang(lang)
  const me = await getCurrentEmployee()
  if (!me) throw new Error(t(language, 'error.notSignedIn'))
  const now = Date.now()
  const refuse = async (message: string): Promise<CheerResult> => ({ ok: false, message, snapshot: await loadOfficeSnapshot(now) })

  if (!isCheerEmoji(emoji)) return refuse(t(language, 'error.unknownCheer'))
  if (typeof toId !== 'string' || !UUID.test(toId)) return refuse(t(language, 'error.personNotFound'))
  const [target] = await db.select({ id: employees.id }).from(employees).where(eq(employees.id, toId))
  if (!target) return refuse(t(language, 'error.personNotFound'))

  const [last] = await db
    .select({ at: cheers.createdAt })
    .from(cheers)
    .where(and(eq(cheers.fromEmployeeId, me.id), eq(cheers.toEmployeeId, toId)))
    .orderBy(desc(cheers.createdAt))
    .limit(1)
  const check = canCheer({ fromId: me.id, toId, lastCheerAt: last ? last.at.getTime() : null, now }, language)
  if (!check.ok) return refuse(check.reason)

  await db.insert(cheers).values({ fromEmployeeId: me.id, toEmployeeId: toId, emoji, createdAt: new Date(now) })
  return { ok: true, message: null, snapshot: await loadOfficeSnapshot(now) }
}
