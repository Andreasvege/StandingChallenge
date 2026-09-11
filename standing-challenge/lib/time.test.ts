import { describe, it, expect } from 'vitest'
import { osloDayStart, osloNextDayStart, osloWeekStart, osloHour, overlapSeconds } from './time'

const t = (s: string) => Date.parse(s)
const iso = (ms: number) => new Date(ms).toISOString()

describe('osloDayStart', () => {
  it('returns Oslo midnight in summer (UTC+2)', () => {
    expect(iso(osloDayStart(t('2026-09-11T10:00:00Z')))).toBe('2026-09-10T22:00:00.000Z')
  })
  it('returns Oslo midnight in winter (UTC+1)', () => {
    expect(iso(osloDayStart(t('2026-01-15T12:00:00Z')))).toBe('2026-01-14T23:00:00.000Z')
  })
  it('puts 00:30 Oslo on the new day and 23:59 on the old one', () => {
    expect(iso(osloDayStart(t('2026-09-10T22:30:00Z')))).toBe('2026-09-10T22:00:00.000Z')
    expect(iso(osloDayStart(t('2026-09-10T21:59:00Z')))).toBe('2026-09-09T22:00:00.000Z')
  })
  it('handles the spring-forward and fall-back days', () => {
    expect(iso(osloDayStart(t('2026-03-29T12:00:00Z')))).toBe('2026-03-28T23:00:00.000Z')
    expect(iso(osloDayStart(t('2026-10-25T12:00:00Z')))).toBe('2026-10-24T22:00:00.000Z')
  })
})

describe('osloNextDayStart', () => {
  it('gives a 23-hour day when clocks spring forward', () => {
    expect(iso(osloNextDayStart(t('2026-03-29T12:00:00Z')))).toBe('2026-03-29T22:00:00.000Z')
  })
  it('gives a 25-hour day when clocks fall back', () => {
    expect(iso(osloNextDayStart(t('2026-10-25T12:00:00Z')))).toBe('2026-10-25T23:00:00.000Z')
  })
  it('rolls over month ends', () => {
    expect(iso(osloNextDayStart(t('2026-09-30T12:00:00Z')))).toBe('2026-09-30T22:00:00.000Z')
  })
})

describe('osloWeekStart', () => {
  it('returns Monday 00:00 Oslo time', () => {
    expect(iso(osloWeekStart(t('2026-09-11T10:00:00Z')))).toBe('2026-09-06T22:00:00.000Z')
  })
  it('keeps Sunday 23:30 in the old week and Monday 00:10 in the new one', () => {
    expect(iso(osloWeekStart(t('2026-09-13T21:30:00Z')))).toBe('2026-09-06T22:00:00.000Z')
    expect(iso(osloWeekStart(t('2026-09-13T22:10:00Z')))).toBe('2026-09-13T22:00:00.000Z')
  })
  it('crosses month boundaries', () => {
    expect(iso(osloWeekStart(t('2026-10-01T10:00:00Z')))).toBe('2026-09-27T22:00:00.000Z')
  })
})

describe('osloHour', () => {
  it('returns the Oslo wall-clock hour', () => {
    expect(osloHour(t('2026-09-11T10:00:00Z'))).toBe(12)
    expect(osloHour(t('2026-01-15T10:00:00Z'))).toBe(11)
  })
})

describe('overlapSeconds', () => {
  it('measures partial overlap', () => {
    expect(overlapSeconds(0, 10_000, 5_000, 20_000)).toBe(5)
  })
  it('is zero for touching or disjoint ranges', () => {
    expect(overlapSeconds(0, 10_000, 10_000, 20_000)).toBe(0)
    expect(overlapSeconds(0, 1_000, 5_000, 6_000)).toBe(0)
  })
})
