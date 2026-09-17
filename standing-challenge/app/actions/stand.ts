'use server'

import { and, eq, isNull } from 'drizzle-orm'
import { db } from '@/db/client'
import { standSessions } from '@/db/schema'
import { currentGraceMs, currentMinuteMs } from '@/lib/clock-config'
import { getCurrentEmployee } from '@/lib/current-employee'
import { t, toLang, type Lang } from '@/lib/i18n'
import { closeExpiredSessions, loadOfficeSnapshot, toSessionRow } from '@/lib/office'
import { isValidRoundMinutes, planExtend, planStart, planStop } from '@/lib/sessions'
import type { OfficeSnapshot } from '@/lib/snapshot'

// Server actions are reachable by direct POST, so each one checks the login itself. `lang` comes from
// the caller's browser (defaulting to Norwegian) so error messages come back in their language.
async function currentEmployeeId(lang: Lang): Promise<string> {
  const me = await getCurrentEmployee()
  if (!me) throw new Error(t(lang, 'error.notSignedIn'))
  return me.id
}

async function openSession(employeeId: string) {
  const [row] = await db
    .select()
    .from(standSessions)
    .where(and(eq(standSessions.employeeId, employeeId), isNull(standSessions.endedAt)))
  return row
}

export async function startStanding(minutes: number, lang?: string): Promise<OfficeSnapshot> {
  const language = toLang(lang)
  const employeeId = await currentEmployeeId(language)
  if (!isValidRoundMinutes(minutes)) throw new Error(t(language, 'error.badRound'))
  const now = Date.now()
  await closeExpiredSessions(now, currentGraceMs())
  const plan = planStart(now, minutes, currentMinuteMs())
  await db
    .insert(standSessions)
    .values({
      employeeId,
      startedAt: new Date(plan.startedAt),
      roundMinutes: plan.roundMinutes,
      roundEndsAt: new Date(plan.roundEndsAt),
    })
    .onConflictDoNothing() // already standing (double click / second tab): keep the existing session
  return loadOfficeSnapshot(now)
}

export async function extendStanding(lang?: string): Promise<OfficeSnapshot> {
  const employeeId = await currentEmployeeId(toLang(lang))
  const now = Date.now()
  const row = await openSession(employeeId)
  const plan = row ? planExtend(toSessionRow(row), now, currentMinuteMs(), currentGraceMs()) : null
  if (row && plan) {
    await db
      .update(standSessions)
      .set({ roundEndsAt: new Date(plan.roundEndsAt) })
      .where(and(eq(standSessions.id, row.id), isNull(standSessions.endedAt)))
  }
  return loadOfficeSnapshot(now)
}

export async function stopStanding(lang?: string): Promise<OfficeSnapshot> {
  const employeeId = await currentEmployeeId(toLang(lang))
  const now = Date.now()
  const row = await openSession(employeeId)
  const plan = row ? planStop(toSessionRow(row), now, currentGraceMs()) : null
  if (row && plan) {
    await db
      .update(standSessions)
      .set({ endedAt: new Date(plan.endedAt), endReason: plan.endReason })
      .where(and(eq(standSessions.id, row.id), isNull(standSessions.endedAt)))
  }
  return loadOfficeSnapshot(now)
}
