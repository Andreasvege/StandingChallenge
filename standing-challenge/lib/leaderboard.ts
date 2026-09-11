// Leaderboard rows for «I dag» and «Denne uka».

import type { OfficeEmployee } from './snapshot'

export type RankKey = 'todaySeconds' | 'weekSeconds'
export type Rankable = Pick<OfficeEmployee, 'id' | 'name' | 'figure' | 'todaySeconds' | 'weekSeconds'>

export interface RankRow {
  id: string
  name: string
  figure: OfficeEmployee['figure']
  seconds: number
  rank: number
  isMe: boolean
}

/** Top `top` people with time > 0, plus me at the bottom if I'm ranked below the cut. */
export function rankBy(employees: Rankable[], key: RankKey, meId: string | null, top = 5): RankRow[] {
  const ranked = employees
    .filter(e => e[key] > 0)
    .sort((a, b) => b[key] - a[key] || a.name.localeCompare(b.name, 'nb'))
    .map((e, i) => ({ id: e.id, name: e.name, figure: e.figure, seconds: e[key], rank: i + 1, isMe: e.id === meId }))
  const rows = ranked.slice(0, top)
  const me = ranked.find(r => r.isMe)
  if (me && me.rank > top) rows.push(me)
  return rows
}
