import { describe, it, expect } from 'vitest'
import { DEFAULT_FIGURE } from './figure'
import { podiumTop, rankBy, type Rankable } from './leaderboard'

const p = (id: string, name: string, todaySeconds: number, weekSeconds = todaySeconds, monthSeconds = weekSeconds): Rankable =>
  ({ id, name, figure: DEFAULT_FIGURE, todaySeconds, weekSeconds, monthSeconds })

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
  it('works on monthSeconds', () => {
    const month = [p('1', 'Even', 100, 200, 9000), p('2', 'Vilde', 100, 900, 5000), p('3', 'Emma', 0, 0, 0)]
    expect(rankBy(month, 'monthSeconds', null).map(r => r.name)).toEqual(['Even', 'Vilde'])
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
  it('shows everyone with time when the cut is raised, and me only once', () => {
    expect(rankBy(people, 'todaySeconds', null, people.length).map(r => r.name)).toEqual([
      'Even', 'Sander', 'Vilde', 'Emma', 'Ingrid', 'Thea', 'Andreas',
    ])
    expect(rankBy(people, 'todaySeconds', '7', people.length).filter(r => r.isMe)).toHaveLength(1)
  })
  it('leaves out people with no time', () => {
    expect(rankBy(people, 'todaySeconds', '8', 10).some(r => r.name === 'Mina')).toBe(false)
  })
})

describe('podiumTop', () => {
  it('takes the top three by month, leaving out people with no time', () => {
    const month = [p('1', 'Even', 0, 0, 100), p('2', 'Vilde', 0, 0, 900), p('3', 'Emma', 0, 0, 0), p('4', 'Aslak', 0, 0, 500), p('5', 'Mina', 0, 0, 50)]
    expect(podiumTop(month).map(r => r.name)).toEqual(['Vilde', 'Aslak', 'Even'])
  })
  it('breaks an exact tie by employee id, like rankBetween, not by name', () => {
    const month = [p('b', 'Anna', 0, 0, 700), p('a', 'Zed', 0, 0, 700)]
    expect(podiumTop(month).map(r => r.name)).toEqual(['Zed', 'Anna'])
  })
  it('returns fewer than three when fewer have stood', () => {
    expect(podiumTop([p('1', 'Even', 0, 0, 10), p('2', 'Vilde', 0, 0, 0)])).toHaveLength(1)
    expect(podiumTop([])).toEqual([])
  })
})

describe('rankBy month ties', () => {
  it('goes to the lower id like podiumTop, not to the alphabet', () => {
    const tied = [p('b', 'Aase', 0, 0, 500), p('a', 'Zoe', 0, 0, 500)]
    expect(rankBy(tied, 'monthSeconds', null).map(r => r.name)).toEqual(['Zoe', 'Aase'])
    expect(rankBy(tied, 'monthSeconds', null).map(r => r.id)).toEqual(podiumTop(tied).map(e => e.id))
  })
})
