// Who is logged in, as an employee row. Server-only (imports the DB and Auth.js).

import { eq } from 'drizzle-orm'
import { redirect } from 'next/navigation'
import { auth } from '@/auth'
import { db } from '@/db/client'
import { employees, type EmployeeRecord } from '@/db/schema'
import { firstName, isAdminEmail, isAllowedEmail, normalizeEmail } from './access'
import { randomFigure } from './figure'

/** Finds the employee by e-mail, creating one (random figure, no desk) on first login. */
export async function ensureEmployee(email: string, name: string | null | undefined): Promise<EmployeeRecord> {
  const normalized = normalizeEmail(email)
  const [created] = await db
    .insert(employees)
    .values({ email: normalized, name: firstName(name, normalized), figure: randomFigure() })
    .onConflictDoNothing({ target: employees.email })
    .returning()
  if (created) return created
  const [existing] = await db.select().from(employees).where(eq(employees.email, normalized))
  return existing
}

/** The logged-in @thebrave.no e-mail, or null. Cheap: no database access. */
export async function getSessionEmail(): Promise<string | null> {
  const session = await auth()
  const email = session?.user?.email
  return email && isAllowedEmail(email) ? normalizeEmail(email) : null
}

export async function getCurrentEmployee(): Promise<EmployeeRecord | null> {
  const session = await auth()
  const email = session?.user?.email
  if (!email || !isAllowedEmail(email)) return null
  return ensureEmployee(email, session.user?.name)
}

export async function requireEmployee(): Promise<EmployeeRecord> {
  const me = await getCurrentEmployee()
  if (!me) redirect('/login')
  return me
}

export async function requireAdmin(): Promise<EmployeeRecord> {
  const me = await requireEmployee()
  if (!isAdminEmail(me.email)) redirect('/')
  return me
}

/** For server actions: throw instead of redirecting. */
export async function requireAdminAction(): Promise<EmployeeRecord> {
  const me = await getCurrentEmployee()
  if (!me || !isAdminEmail(me.email)) throw new Error('Bare admin kan gjøre dette')
  return me
}
