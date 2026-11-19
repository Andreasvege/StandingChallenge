'use server'

import { and, isNull, lt, min, gte, or } from 'drizzle-orm'
import { db } from '@/db/client'
import { employees, standSessions } from '@/db/schema'
import { getCurrentEmployee } from '@/lib/current-employee'
import { clampMonth, monthBoard, nextMonthStart, type MonthBoard } from '@/lib/month-board'
import { toSessionRow } from '@/lib/office'
import { osloMonthStart, osloPrevMonthStart } from '@/lib/time'

export type MonthBoardResult = MonthBoard & { firstMonthStart: number }

// One month's board for the panel. Server actions are reachable by direct POST, so the login is
// checked here. Archived people are loaded too: a finished month keeps those who have left.
export async function loadMonthBoard(input: { monthStart: number }): Promise<MonthBoardResult> {
  const me = await getCurrentEmployee()
  if (!me) throw new Error('Not signed in')
  if (!input || typeof input.monthStart !== 'number' || !Number.isFinite(input.monthStart)) throw new Error('Invalid month')

  const now = Date.now()
  const [{ first }] = await db.select({ first: min(standSessions.startedAt) }).from(standSessions)
  const firstMonthStart = first ? osloMonthStart(first.getTime()) : osloMonthStart(now)
  const monthStart = clampMonth(input.monthStart, firstMonthStart, now)

  // Rounds touching [previous month, end of the month shown): the previous month feeds «Mest framgang».
  const [people, sessions] = await Promise.all([
    db.select().from(employees),
    db
      .select()
      .from(standSessions)
      .where(
        and(
          lt(standSessions.startedAt, new Date(nextMonthStart(monthStart))),
          or(isNull(standSessions.endedAt), gte(standSessions.endedAt, new Date(osloPrevMonthStart(monthStart)))),
        ),
      ),
  ])
  const board = monthBoard(
    people.map(e => ({ id: e.id, name: e.name, figure: e.figure, archived: e.archivedAt != null })),
    sessions.map(toSessionRow),
    now,
    monthStart,
    firstMonthStart,
  )
  return { ...board, firstMonthStart }
}
