// Vandrepokalen: last month's winner keeps a gold trophy on their desk for the whole of this month.
// Pure; lib/office.ts feeds it last month's sessions.

import { creditedSecondsBetween } from './sessions'
import type { SessionRow } from './snapshot'
import { osloMonthStart, osloParts, osloPrevMonthStart } from './time'

export interface Trophy {
  employeeId: string
  /** The month that was won, 1–12, for «Vant september». */
  month: number
}

/**
 * Who stood the most last month (Oslo time), or null when nobody stood at all. A tie goes to whoever
 * got there first in `sessions` order — in practice it never happens to the second.
 */
export function lastMonthTrophy(sessions: readonly SessionRow[], now: number): Trophy | null {
  const from = osloPrevMonthStart(now)
  const [best] = rankBetween(sessions, now, from, osloMonthStart(now))
  return best ? { employeeId: best.employeeId, month: osloParts(from).month } : null
}

/** Everyone who stood in [from, to), most seconds first. Ties keep `sessions` order. */
export function rankBetween(sessions: readonly SessionRow[], now: number, from: number, to: number): { employeeId: string; seconds: number }[] {
  const totals = new Map<string, number>()
  for (const s of sessions) {
    const seconds = creditedSecondsBetween(s, now, from, to)
    if (seconds > 0) totals.set(s.employeeId, (totals.get(s.employeeId) ?? 0) + seconds)
  }
  return [...totals].map(([employeeId, seconds]) => ({ employeeId, seconds })).sort((a, b) => b.seconds - a.seconds)
}
