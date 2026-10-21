import { describe, expect, it } from 'vitest'
import type { SessionRow } from './snapshot'
import { osloMonthStart, osloPrevMonthStart } from './time'
import { lastMonthTrophy } from './trophy'

const t = (iso: string) => new Date(iso).getTime()
function closed(id: string, employeeId: string, start: string, end: string): SessionRow {
  return { id, employeeId, startedAt: t(start), roundMinutes: 60, roundEndsAt: t(end), endedAt: t(end), endReason: 'completed' }
}

describe('osloMonthStart / osloPrevMonthStart', () => {
  it('finds the first of the month at Oslo midnight, across the new year', () => {
    expect(osloMonthStart(t('2026-10-21T09:00:00Z'))).toBe(t('2026-09-30T22:00:00Z'))
    expect(osloPrevMonthStart(t('2026-10-21T09:00:00Z'))).toBe(t('2026-08-31T22:00:00Z'))
    expect(osloPrevMonthStart(t('2027-01-05T09:00:00Z'))).toBe(t('2026-11-30T23:00:00Z'))
  })
})

describe('lastMonthTrophy', () => {
  const now = t('2026-10-21T09:00:00Z')

  it('goes to whoever stood the most last month', () => {
    const sessions = [
      closed('1', 'even', '2026-09-10T08:00:00Z', '2026-09-10T11:00:00Z'),
      closed('2', 'mina', '2026-09-11T08:00:00Z', '2026-09-11T09:00:00Z'),
      closed('3', 'mina', '2026-10-02T08:00:00Z', '2026-10-02T14:00:00Z'), // this month: doesn't count
    ]
    expect(lastMonthTrophy(sessions, now)).toEqual({ employeeId: 'even', month: 9 })
  })

  it('counts only the part of a round inside last month', () => {
    // 21:00–01:00 Oslo across 30 Sep → 1 Oct: three hours fall in September.
    const sessions = [
      closed('1', 'a', '2026-09-30T19:00:00Z', '2026-09-30T23:00:00Z'),
      closed('2', 'b', '2026-09-15T08:00:00Z', '2026-09-15T10:30:00Z'),
    ]
    expect(lastMonthTrophy(sessions, now)?.employeeId).toBe('a')
  })

  it('is nobody when nobody stood', () => {
    expect(lastMonthTrophy([], now)).toBeNull()
  })
})
