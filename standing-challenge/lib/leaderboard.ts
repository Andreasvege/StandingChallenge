// Leaderboard rows for «I dag» and «Denne uka».

import type { OfficeEmployee } from './snapshot'

export type RankKey = 'todaySeconds' | 'weekSeconds' | 'monthSeconds'
export type Rankable = Pick<OfficeEmployee, 'id' | 'name' | 'figure' | 'todaySeconds' | 'weekSeconds' | 'monthSeconds'>

export interface RankRow {
  id: string
  name: string
  figure: OfficeEmployee['figure']
  seconds: number
  rank: number
  isMe: boolean
}

/**
 * Top `top` people with time > 0, plus me at the bottom if I'm ranked below the cut.
 * Ties go alphabetically — except the month, where they go to the lower id like `podiumTop`, the panel
 * and the vandrepokal, so the lists never disagree with the podium about who leads.
 */
export function rankBy(employees: Rankable[], key: RankKey, meId: string | null, top = 5): RankRow[] {
  const ranked = employees
    .filter(e => e[key] > 0)
    .sort((a, b) => b[key] - a[key] || (key === 'monthSeconds' ? (a.id < b.id ? -1 : a.id > b.id ? 1 : 0) : a.name.localeCompare(b.name, 'nb')))
    .map((e, i) => ({ id: e.id, name: e.name, figure: e.figure, seconds: e[key], rank: i + 1, isMe: e.id === meId }))
  const rows = ranked.slice(0, top)
  const me = ranked.find(r => r.isMe)
  if (me && me.rank > top) rows.push(me)
  return rows
}

/**
 * Månedens ståere on the wall: the top `n` this month, most seconds first. An exact tie goes to the
 * lower employee id — the order `rankBetween` (lib/trophy.ts) uses — so the wall, the month panel and
 * the vandrepokal never crown different people.
 */
export function podiumTop<T extends Pick<Rankable, 'id' | 'monthSeconds'>>(employees: readonly T[], n = 3): T[] {
  return employees
    .filter(e => e.monthSeconds > 0)
    .sort((a, b) => b.monthSeconds - a.monthSeconds || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0))
    .slice(0, n)
}
