import { describe, it, expect } from 'vitest'
import { DEFAULT_FIGURE } from './figure'
import { buildSnapshot, liveEmployee, type EmployeeRow, type OfficeEmployee, type SessionRow } from './snapshot'

const MIN = 60_000
const GRACE = 5 * MIN
const NOW = Date.parse('2026-09-11T10:00:00Z') // Friday 12:00 in Oslo
const t = (s: string) => Date.parse(s)

const emp = (id: string, name: string, seat: number | null): EmployeeRow => ({ id, name, seat, figure: DEFAULT_FIGURE })

function sess(id: string, employeeId: string, start: string, roundMinutes: number, end: string | null, ended: string | null): SessionRow {
  const startedAt = t(start)
  return {
    id,
    employeeId,
    startedAt,
    roundMinutes,
    roundEndsAt: end ? t(end) : startedAt + roundMinutes * MIN,
    endedAt: ended ? t(ended) : null,
    endReason: ended ? 'sat_down' : null,
  }
}

describe('buildSnapshot', () => {
  const employees = [emp('a', 'Anna', 1), emp('b', 'Bjørn', 0), emp('c', 'Cecilie', null), emp('d', 'Dag', 2)]
  const sessions = [
    sess('1', 'a', '2026-09-10T08:00:00Z', 30, null, '2026-09-10T08:30:00Z'), // yesterday: week only
    sess('2', 'a', '2026-09-11T09:30:00Z', 60, null, null), // standing now
    sess('3', 'b', '2026-09-11T07:00:00Z', 60, null, '2026-09-11T08:00:00Z'), // done this morning
    sess('4', 'd', '2026-09-11T08:00:00Z', 30, null, null), // expired, never answered
  ]
  const snap = buildSnapshot(employees, sessions, NOW, GRACE)
  const byId = Object.fromEntries(snap.employees.map(e => [e.id, e]))

  it('sorts by seat with unseated people last', () => {
    expect(snap.employees.map(e => e.id)).toEqual(['b', 'a', 'd', 'c'])
  })
  it('sums today and this week in Oslo time', () => {
    expect(byId.a.todaySeconds).toBe(1800)
    expect(byId.a.weekSeconds).toBe(3600)
    expect(byId.b.todaySeconds).toBe(3600)
    expect(byId.c.todaySeconds).toBe(0)
  })
  it('exposes only running sessions', () => {
    expect(byId.a.session).toEqual({ startedAt: t('2026-09-11T09:30:00Z'), roundEndsAt: t('2026-09-11T10:30:00Z'), roundMinutes: 60 })
    expect(byId.b.session).toBeNull()
  })
  it('credits an expired, unanswered session up to its round end but shows it as sitting', () => {
    expect(byId.d.todaySeconds).toBe(1800)
    expect(byId.d.session).toBeNull()
  })
  it('totals today and picks the leader', () => {
    expect(snap.todayTotalSeconds).toBe(1800 + 3600 + 1800)
    expect(snap.leaderId).toBe('b')
    expect(snap.graceMs).toBe(GRACE)
    expect(snap.now).toBe(NOW)
  })
  it('breaks leader ties alphabetically and has no leader before anyone stands', () => {
    const tie = buildSnapshot(
      [emp('x', 'Bjørn', 0), emp('y', 'Anna', 1)],
      [sess('1', 'x', '2026-09-11T07:00:00Z', 30, null, '2026-09-11T07:30:00Z'), sess('2', 'y', '2026-09-11T08:00:00Z', 30, null, '2026-09-11T08:30:00Z')],
      NOW,
      GRACE,
    )
    expect(tie.leaderId).toBe('y')
    expect(buildSnapshot([emp('x', 'Bjørn', 0)], [], NOW, GRACE).leaderId).toBeNull()
  })
  it('splits a session that crosses Oslo midnight', () => {
    const snap2 = buildSnapshot([emp('a', 'Anna', 0)], [sess('1', 'a', '2026-09-10T21:30:00Z', 60, null, '2026-09-10T22:30:00Z')], NOW, GRACE)
    expect(snap2.employees[0].todaySeconds).toBe(1800)
    expect(snap2.employees[0].weekSeconds).toBe(3600)
  })
})

describe('liveEmployee', () => {
  const base: OfficeEmployee = {
    id: 'a', name: 'Anna', figure: DEFAULT_FIGURE, seat: 0,
    session: { startedAt: NOW - 10 * MIN, roundEndsAt: NOW + 20 * MIN, roundMinutes: 30 },
    todaySeconds: 600, weekSeconds: 900,
  }
  it('ticks totals and elapsed time forward while standing', () => {
    const live = liveEmployee(base, NOW, NOW + MIN, GRACE)
    expect(live.phase).toBe('standing')
    expect(live.elapsedSeconds).toBe(660)
    expect(live.todaySeconds).toBe(660)
    expect(live.weekSeconds).toBe(960)
  })
  it('freezes at the round end while awaiting an answer', () => {
    const live = liveEmployee(base, NOW, NOW + 20 * MIN + 10_000, GRACE)
    expect(live.phase).toBe('awaiting')
    expect(live.elapsedSeconds).toBe(1800)
    expect(live.todaySeconds).toBe(1800)
  })
  it('shows sitting after the grace period and for people without a session', () => {
    expect(liveEmployee(base, NOW, NOW + 26 * MIN, GRACE).phase).toBe('sitting')
    expect(liveEmployee({ ...base, session: null }, NOW, NOW + MIN, GRACE)).toMatchObject({ phase: 'sitting', elapsedSeconds: 0, todaySeconds: 600 })
  })
})
