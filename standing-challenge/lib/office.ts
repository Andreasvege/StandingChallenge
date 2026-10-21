// Database side of the office snapshot. The maths lives in lib/snapshot.ts.

import { and, asc, gte, isNull, lt, or, sql } from 'drizzle-orm'
import { db } from '@/db/client'
import { cheers, employees, standSessions, type CheerRecord, type EmployeeRecord, type StandSessionRecord } from '@/db/schema'
import { CHEER_SHOW_MS, type Cheer } from './cheers'
import { currentGraceMs } from './clock-config'
import { buildSnapshot, type EmployeeRow, type OfficeSnapshot, type SessionRow } from './snapshot'
import { osloMonthStart, osloPrevMonthStart, osloWeekStart } from './time'
import { lastMonthTrophy, type Trophy } from './trophy'
import { loadWeather } from './yr'

export function toEmployeeRow(e: EmployeeRecord): EmployeeRow {
  return { id: e.id, name: e.name, figure: e.figure, seat: e.seat, remoteFrom: e.remoteFrom }
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
    startedBy: s.startedBy ?? null,
  }
}

export function toCheer(c: CheerRecord): Cheer {
  return { id: c.id, fromId: c.fromEmployeeId, toId: c.toEmployeeId, emoji: c.emoji, at: c.createdAt.getTime() }
}

/** Lazy timeout: close every session whose «Står du fortsatt?» went unanswered. No cron needed. */
export async function closeExpiredSessions(now: number, grace: number): Promise<void> {
  await db
    .update(standSessions)
    .set({ endedAt: sql`${standSessions.roundEndsAt}`, endReason: 'timeout' })
    .where(and(isNull(standSessions.endedAt), lt(standSessions.roundEndsAt, new Date(now - grace))))
}

/** Last month's winner. Rounds that touch last month: started before this month, ended (if at all) after last began. */
async function loadTrophy(now: number): Promise<Trophy | null> {
  const rows = await db
    .select()
    .from(standSessions)
    .where(
      and(
        lt(standSessions.startedAt, new Date(osloMonthStart(now))),
        or(isNull(standSessions.endedAt), gte(standSessions.endedAt, new Date(osloPrevMonthStart(now)))),
      ),
    )
  return lastMonthTrophy(rows.map(toSessionRow), now)
}

export async function loadOfficeSnapshot(now = Date.now()): Promise<OfficeSnapshot> {
  const grace = currentGraceMs()
  await closeExpiredSessions(now, grace)
  const weekStart = new Date(osloWeekStart(now))
  const [employeeRows, sessionRows, cheerRows, weather, trophy] = await Promise.all([
    db.select().from(employees),
    db
      .select()
      .from(standSessions)
      .where(or(isNull(standSessions.endedAt), gte(standSessions.endedAt, weekStart))),
    db
      .select()
      .from(cheers)
      .where(gte(cheers.createdAt, new Date(now - CHEER_SHOW_MS)))
      .orderBy(asc(cheers.createdAt)),
    loadWeather(now),
    loadTrophy(now),
  ])
  const snapshot = buildSnapshot(employeeRows.map(toEmployeeRow), sessionRows.map(toSessionRow), now, grace, cheerRows.map(toCheer))
  return { ...snapshot, weather, trophy }
}
