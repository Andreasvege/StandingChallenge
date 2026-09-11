// Database side of the office snapshot. The maths lives in lib/snapshot.ts.

import { and, gte, isNull, lt, or, sql } from 'drizzle-orm'
import { db } from '@/db/client'
import { employees, standSessions, type EmployeeRecord, type StandSessionRecord } from '@/db/schema'
import { currentGraceMs } from './clock-config'
import { buildSnapshot, type EmployeeRow, type OfficeSnapshot, type SessionRow } from './snapshot'
import { osloWeekStart } from './time'

export function toEmployeeRow(e: EmployeeRecord): EmployeeRow {
  return { id: e.id, name: e.name, figure: e.figure, seat: e.seat }
}

export function toSessionRow(s: StandSessionRecord): SessionRow {
  return {
    id: s.id,
    employeeId: s.employeeId,
    startedAt: s.startedAt.getTime(),
    roundMinutes: s.roundMinutes,
    roundEndsAt: s.roundEndsAt.getTime(),
    endedAt: s.endedAt ? s.endedAt.getTime() : null,
    endReason: s.endReason ?? null,
  }
}

/** Lazy timeout: close every session whose «Står du fortsatt?» went unanswered. No cron needed. */
export async function closeExpiredSessions(now: number, grace: number): Promise<void> {
  await db
    .update(standSessions)
    .set({ endedAt: sql`${standSessions.roundEndsAt}`, endReason: 'timeout' })
    .where(and(isNull(standSessions.endedAt), lt(standSessions.roundEndsAt, new Date(now - grace))))
}

export async function loadOfficeSnapshot(now = Date.now()): Promise<OfficeSnapshot> {
  const grace = currentGraceMs()
  await closeExpiredSessions(now, grace)
  const weekStart = new Date(osloWeekStart(now))
  const [employeeRows, sessionRows] = await Promise.all([
    db.select().from(employees),
    db
      .select()
      .from(standSessions)
      .where(or(isNull(standSessions.endedAt), gte(standSessions.endedAt, weekStart))),
  ])
  return buildSnapshot(employeeRows.map(toEmployeeRow), sessionRows.map(toSessionRow), now, grace)
}
