'use server'

import { and, eq, isNull } from 'drizzle-orm'
import { db } from '@/db/client'
import { standSessions } from '@/db/schema'
import { currentGraceMs, currentMinuteMs } from '@/lib/clock-config'
import { getCurrentEmployee } from '@/lib/current-employee'
import { closeExpiredSessions, loadOfficeSnapshot, toSessionRow } from '@/lib/office'
import { isRoundMinutes, planExtend, planStart, planStop } from '@/lib/sessions'
import type { OfficeSnapshot } from '@/lib/snapshot'

// Server actions are reachable by direct POST, so each one checks the login itself.
async function currentEmployeeId(): Promise<string> {
  const me = await getCurrentEmployee()
  if (!me) throw new Error('Du er ikke logget inn')
  return me.id
}

async function openSession(employeeId: string) {
  const [row] = await db
    .select()
    .from(standSessions)
    .where(and(eq(standSessions.employeeId, employeeId), isNull(standSessions.endedAt)))
  return row
}

export async function startStanding(minutes: number): Promise<OfficeSnapshot> {
  const employeeId = await currentEmployeeId()
  if (!isRoundMinutes(minutes)) throw new Error('Velg 30, 60 eller 90 minutter')
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

export async function extendStanding(): Promise<OfficeSnapshot> {
  const employeeId = await currentEmployeeId()
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

export async function stopStanding(): Promise<OfficeSnapshot> {
  const employeeId = await currentEmployeeId()
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
