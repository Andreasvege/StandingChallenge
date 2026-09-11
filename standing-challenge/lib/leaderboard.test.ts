import { describe, it, expect } from 'vitest'
import { DEFAULT_FIGURE } from './figure'
import { rankBy, type Rankable } from './leaderboard'

const p = (id: string, name: string, todaySeconds: number, weekSeconds = todaySeconds): Rankable =>
  ({ id, name, figure: DEFAULT_FIGURE, todaySeconds, weekSeconds })

const people = [
  p('1', 'Even', 7000, 20000), p('2', 'Vilde', 5000, 30000), p('3', 'Sander', 5000), p('4', 'Emma', 3000),
  p('5', 'Ingrid', 2000), p('6', 'Thea', 1000), p('7', 'Andreas', 500), p('8', 'Mina', 0),
]

describe('rankBy', () => {
  it('orders by the key, breaking ties alphabetically', () => {
    expect(rankBy(people, 'todaySeconds', null).map(r => r.name)).toEqual(['Even', 'Sander', 'Vilde', 'Emma', 'Ingrid'])
  })
  it('ranks by week when asked', () => {
    expect(rankBy(people, 'weekSeconds', null)[0]).toMatchObject({ name: 'Vilde', seconds: 30000, rank: 1 })
  })
  it('appends me with my real rank when I am outside the top 5', () => {
    const rows = rankBy(people, 'todaySeconds', '7')
    expect(rows).toHaveLength(6)
    expect(rows[5]).toMatchObject({ name: 'Andreas', rank: 7, isMe: true })
  })
  it('marks me in place when I am in the top 5', () => {
    const rows = rankBy(people, 'todaySeconds', '4')
    expect(rows).toHaveLength(5)
    expect(rows[3]).toMatchObject({ name: 'Emma', isMe: true })
  })
  it('leaves out people with no time', () => {
    expect(rankBy(people, 'todaySeconds', '8', 10).some(r => r.name === 'Mina')).toBe(false)
  })
})
