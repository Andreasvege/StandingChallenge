import { describe, expect, it } from 'vitest'
import type { Figure } from './figure'
import { clampMonth, monthBoard, nextMonthStart, type BoardPerson } from './month-board'
import type { SessionRow } from './snapshot'
import { osloMonthStart, osloWallToUtc } from './time'

const figure: Figure = { hairStyle: 'short', hair: '#000000', skin: '#f6c7a1', shirt: '#8fb8ff', deskItem: 'mug', eyewear: 'none', beard: 'none', mustache: false }
const person = (id: string, name: string, archived = false): BoardPerson => ({ id, name, figure, archived })
const at = (y: number, mo: number, d: number, h = 12, mi = 0) => osloWallToUtc(y, mo, d, h, mi)
const now = at(2026, 11, 16)
const OCT = at(2026, 10, 1, 0)
const NOV = at(2026, 11, 1, 0)
const SEP = at(2026, 9, 1, 0)

let n = 0
function round(employeeId: string, start: number, hours: number): SessionRow {
  const end = start + hours * 3600_000
  return { id: String(++n), employeeId, startedAt: start, roundMinutes: 60, roundEndsAt: end, endedAt: end, endReason: 'completed' }
}

const people = [person('even', 'Even'), person('anja', 'Anja'), person('bo', 'Bo'), person('george', 'George')]

describe('monthBoard', () => {
  it('ranks a finished month by seconds, exact ties by employee id', () => {
    const s = [round('even', at(2026, 10, 5, 8), 3), round('bo', at(2026, 10, 6, 8), 1), round('anja', at(2026, 10, 7, 8), 1)]
    const b = monthBoard(people, s, now, OCT, SEP)
    expect(b.rows.map((r) => r.name)).toEqual(['Even', 'Anja', 'Bo'])
    expect(b.rows.map((r) => r.rank)).toEqual([1, 2, 3])
    expect(b.done).toBe(true)
    expect(b.totalSeconds).toBe(5 * 3600)
  })

  it('splits a round across the month boundary', () => {
    const s = [round('even', at(2026, 10, 31, 23, 30), 1)]
    expect(monthBoard(people, s, now, OCT, SEP).rows[0].seconds).toBe(1800)
    expect(monthBoard(people, s, now, NOV, SEP).rows[0].seconds).toBe(1800)
  })

  it('current month leaves archived people out, finished months keep them', () => {
    const ppl = [...people, person('kari', 'Kari', true)]
    const s = [round('kari', at(2026, 10, 5, 8), 1), round('kari', at(2026, 11, 2, 8), 1)]
    expect(monthBoard(ppl, s, now, OCT, SEP).rows.map((r) => r.name)).toContain('Kari')
    const nov = monthBoard(ppl, s, now, NOV, SEP)
    expect(nov.done).toBe(false)
    expect(nov.rows.map((r) => r.name)).not.toContain('Kari')
  })

  it('progress is the largest gain in hours over own previous month', () => {
    const s = [
      round('even', at(2026, 10, 5, 8), 10), round('george', at(2026, 10, 6, 8), 1),
      round('even', at(2026, 11, 3, 8), 12), round('george', at(2026, 11, 4, 8), 9),
    ]
    expect(monthBoard(people, s, now, NOV, OCT).progress).toEqual({ id: 'george', name: 'George', gainSeconds: 8 * 3600 })
  })

  it('the winner can win progress', () => {
    const s = [round('even', at(2026, 10, 5, 8), 1), round('even', at(2026, 11, 3, 8), 10), round('anja', at(2026, 11, 4, 8), 2)]
    expect(monthBoard(people, s, now, NOV, OCT).progress?.name).toBe('Even')
  })

  it('no progress when nobody gained, or in the first month', () => {
    const down = [round('even', at(2026, 10, 5, 8), 5), round('even', at(2026, 11, 3, 8), 2)]
    expect(monthBoard(people, down, now, NOV, OCT).progress).toBeNull()
    expect(monthBoard(people, down, now, OCT, OCT).progress).toBeNull()
  })

  it('progress ties go to the higher-ranked person', () => {
    // Both gain 2 h; Bo ranks first (4 h vs 3 h) although Anja is first by name.
    const bo = [round('anja', at(2026, 10, 5, 8), 1), round('bo', at(2026, 10, 5, 8), 2), round('anja', at(2026, 11, 3, 8), 3), round('bo', at(2026, 11, 3, 8), 4)]
    expect(monthBoard(people, bo, now, NOV, OCT).progress?.name).toBe('Bo')
    // And the other way round, so it is rank and not name or order that decides.
    const anja = [round('anja', at(2026, 10, 5, 8), 2), round('bo', at(2026, 10, 5, 8), 1), round('anja', at(2026, 11, 3, 8), 4), round('bo', at(2026, 11, 3, 8), 3)]
    expect(monthBoard(people, anja, now, NOV, OCT).progress?.name).toBe('Anja')
  })

  it('an exact tie follows rankBetween (employee id), so the board and the trophy agree', () => {
    const ppl = [person('z1', 'Anja'), person('a1', 'Bo')]
    const s = [round('z1', at(2026, 10, 5, 8), 1), round('a1', at(2026, 10, 6, 8), 1)]
    expect(monthBoard(ppl, s, now, OCT, SEP).rows.map((r) => r.name)).toEqual(['Bo', 'Anja'])
  })

  it('a month where only one or two people stood', () => {
    const one = monthBoard(people, [round('even', at(2026, 10, 5, 8), 2)], now, OCT, OCT)
    expect(one.rows).toHaveLength(1)
    expect(one.progress).toBeNull()
    const two = monthBoard(people, [round('even', at(2026, 10, 5, 8), 2), round('anja', at(2026, 10, 6, 8), 1), round('anja', at(2026, 9, 6, 8), 1)], now, OCT, SEP)
    expect(two.rows).toHaveLength(2)
    expect(two.progress?.name).toBe('Even') // Anja stood the same hour in September
  })

  it('empty month', () => {
    const b = monthBoard(people, [], now, OCT, SEP)
    expect(b).toMatchObject({ rows: [], progress: null, totalSeconds: 0 })
  })
})

describe('month bounds', () => {
  it('nextMonthStart steps one Oslo month, across the new year', () => {
    expect(nextMonthStart(OCT)).toBe(NOV)
    expect(nextMonthStart(at(2026, 12, 1, 0))).toBe(at(2027, 1, 1, 0))
  })

  it('clampMonth keeps months inside first..current', () => {
    expect(clampMonth(SEP, OCT, now)).toBe(OCT)
    expect(clampMonth(at(2027, 2, 1, 0), OCT, now)).toBe(osloMonthStart(now))
    expect(clampMonth(OCT, SEP, now)).toBe(OCT)
    // a first month after the current one: the current month still wins
    expect(clampMonth(SEP, at(2027, 1, 1, 0), now)).toBe(osloMonthStart(now))
  })
})
