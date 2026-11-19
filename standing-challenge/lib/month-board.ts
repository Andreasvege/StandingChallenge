// Månedstavla: one month's leaderboard and «Mest framgang». Pure; the wall, the panel and the
// vandrepokal all rank with `rankBetween`, so they can never disagree on a winner.

import type { Figure } from './figure'
import type { SessionRow } from './snapshot'
import { osloMonthStart, osloParts, osloPrevMonthStart, osloWallToUtc } from './time'
import { rankBetween } from './trophy'

export interface BoardPerson { id: string; name: string; figure: Figure; archived: boolean }
export interface MonthRow { id: string; name: string; figure: Figure; seconds: number; rank: number }
export interface Progress { id: string; name: string; gainSeconds: number }
export interface MonthBoard {
  /** osloMonthStart of the month shown. */
  monthStart: number
  /** The month is over. */
  done: boolean
  /** Most seconds first; exact ties in `rankBetween`'s order (employee id), the same as the trophy. */
  rows: MonthRow[]
  totalSeconds: number
  /** «Mest framgang»: largest gain in seconds over one's own previous month, or null. */
  progress: Progress | null
}

/** The 1st, 00:00 Oslo time, of the month after the one starting at `monthStart`. */
export function nextMonthStart(monthStart: number): number {
  const p = osloParts(monthStart)
  return p.month === 12 ? osloWallToUtc(p.year + 1, 1, 1) : osloWallToUtc(p.year, p.month + 1, 1)
}

/** Keeps `monthStart` between the first month with rounds and the current one. */
export function clampMonth(monthStart: number, firstMonthStart: number, now: number): number {
  const current = osloMonthStart(now)
  if (monthStart > current) return current
  return Math.max(monthStart, Math.min(firstMonthStart, current))
}

export function monthBoard(people: BoardPerson[], sessions: SessionRow[], now: number, monthStart: number, firstMonthStart: number): MonthBoard {
  const done = monthStart < osloMonthStart(now)
  const byId = new Map(people.map((p) => [p.id, p]))
  const rows = rankBetween(sessions, now, monthStart, nextMonthStart(monthStart))
    .flatMap(({ employeeId, seconds }) => {
      const p = byId.get(employeeId)
      return p && (done || !p.archived) ? [{ id: p.id, name: p.name, figure: p.figure, seconds }] : []
    })
    .map((r, i) => ({ ...r, rank: i + 1 }))

  let progress: Progress | null = null
  if (monthStart > firstMonthStart) {
    const before = new Map(rankBetween(sessions, now, osloPrevMonthStart(monthStart), monthStart).map((r) => [r.employeeId, r.seconds]))
    // rows are already in rank order, so a strict > keeps the higher-ranked person on a tie.
    for (const r of rows) {
      const gain = r.seconds - (before.get(r.id) ?? 0)
      if (gain > 0 && (!progress || gain > progress.gainSeconds)) progress = { id: r.id, name: r.name, gainSeconds: gain }
    }
  }

  return { monthStart, done, rows, totalSeconds: rows.reduce((sum, r) => sum + r.seconds, 0), progress }
}
