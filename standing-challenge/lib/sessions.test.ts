import { describe, it, expect } from 'vitest'
import {
  isRoundMinutes, minuteMs, graceMs, phaseAt, creditedSeconds, creditedSecondsBetween, graceSecondsLeft,
  planStart, planExtend, planStop, planAdminStop, planExpire, type StandSession,
} from './sessions'

const MIN = 60_000
const GRACE = 5 * MIN
const T0 = Date.parse('2026-09-11T08:00:00Z')

function session(overrides: Partial<StandSession> = {}): StandSession {
  return { startedAt: T0, roundMinutes: 60, roundEndsAt: T0 + 60 * MIN, endedAt: null, endReason: null, ...overrides }
}

describe('isRoundMinutes', () => {
  it('accepts only 30, 60 and 90', () => {
    expect(isRoundMinutes(30)).toBe(true)
    expect(isRoundMinutes(60)).toBe(true)
    expect(isRoundMinutes(90)).toBe(true)
    expect(isRoundMinutes(45)).toBe(false)
    expect(isRoundMinutes('60')).toBe(false)
  })
})

describe('minuteMs / graceMs', () => {
  it('uses real minutes normally and seconds in fast mode', () => {
    expect(minuteMs(false)).toBe(60_000)
    expect(minuteMs(true)).toBe(1000)
    expect(graceMs(false)).toBe(300_000)
    expect(graceMs(true)).toBe(30_000)
  })
})

describe('phaseAt', () => {
  const s = session()
  it('is standing before the round ends', () => {
    expect(phaseAt(s, T0 + 59 * MIN, GRACE)).toBe('standing')
  })
  it('is awaiting from the round end through the grace period', () => {
    expect(phaseAt(s, T0 + 60 * MIN, GRACE)).toBe('awaiting')
    expect(phaseAt(s, T0 + 65 * MIN, GRACE)).toBe('awaiting')
  })
  it('is expired after the grace period', () => {
    expect(phaseAt(s, T0 + 65 * MIN + 1, GRACE)).toBe('expired')
  })
  it('is ended once closed', () => {
    expect(phaseAt(session({ endedAt: T0 + MIN, endReason: 'sat_down' }), T0 + 2 * MIN, GRACE)).toBe('ended')
  })
})

describe('creditedSeconds', () => {
  it('counts up to now while standing', () => {
    expect(creditedSeconds(session(), T0 + 10 * MIN)).toBe(600)
  })
  it('stops at the round end during the grace period', () => {
    expect(creditedSeconds(session(), T0 + 63 * MIN)).toBe(3600)
  })
  it('uses endedAt once closed', () => {
    expect(creditedSeconds(session({ endedAt: T0 + 20 * MIN, endReason: 'sat_down' }), T0 + 90 * MIN)).toBe(1200)
  })
})

describe('creditedSecondsBetween', () => {
  it('clips to the window', () => {
    const s = session({ endedAt: T0 + 60 * MIN, endReason: 'completed' })
    expect(creditedSecondsBetween(s, T0 + 2 * 60 * MIN, T0 + 30 * MIN, T0 + 24 * 60 * MIN)).toBe(1800)
  })
})

describe('graceSecondsLeft', () => {
  it('counts down the grace period in whole seconds', () => {
    expect(graceSecondsLeft(session(), T0 + 60 * MIN, GRACE)).toBe(300)
    expect(graceSecondsLeft(session(), T0 + 64 * MIN + 500, GRACE)).toBe(60)
    expect(graceSecondsLeft(session(), T0 + 70 * MIN, GRACE)).toBe(0)
  })
})

describe('planStart', () => {
  it('starts now and ends one round later', () => {
    expect(planStart(T0, 30, MIN)).toEqual({ startedAt: T0, roundMinutes: 30, roundEndsAt: T0 + 30 * MIN })
    expect(planStart(T0, 90, 1000)).toEqual({ startedAt: T0, roundMinutes: 90, roundEndsAt: T0 + 90_000 })
  })
})

describe('planExtend', () => {
  it('adds one more round from the old round end while awaiting', () => {
    expect(planExtend(session(), T0 + 62 * MIN, MIN, GRACE)).toEqual({ roundEndsAt: T0 + 120 * MIN })
  })
  it('is not allowed while still standing, after expiry or once ended', () => {
    expect(planExtend(session(), T0 + 30 * MIN, MIN, GRACE)).toBeNull()
    expect(planExtend(session(), T0 + 70 * MIN, MIN, GRACE)).toBeNull()
    expect(planExtend(session({ endedAt: T0 + MIN, endReason: 'sat_down' }), T0 + 62 * MIN, MIN, GRACE)).toBeNull()
  })
})

describe('planStop', () => {
  it('sitting down early ends now', () => {
    expect(planStop(session(), T0 + 25 * MIN, GRACE)).toEqual({ endedAt: T0 + 25 * MIN, endReason: 'sat_down' })
  })
  it('answering «Nei» in the grace period ends at the round end', () => {
    expect(planStop(session(), T0 + 63 * MIN, GRACE)).toEqual({ endedAt: T0 + 60 * MIN, endReason: 'completed' })
  })
  it('does nothing for expired or ended sessions', () => {
    expect(planStop(session(), T0 + 70 * MIN, GRACE)).toBeNull()
    expect(planStop(session({ endedAt: T0 + MIN, endReason: 'sat_down' }), T0 + 2 * MIN, GRACE)).toBeNull()
  })
})

describe('planExpire', () => {
  it('times out at the round end once the grace period has passed', () => {
    expect(planExpire(session(), T0 + 70 * MIN, GRACE)).toEqual({ endedAt: T0 + 60 * MIN, endReason: 'timeout' })
  })
  it('leaves standing and awaiting sessions alone', () => {
    expect(planExpire(session(), T0 + 30 * MIN, GRACE)).toBeNull()
    expect(planExpire(session(), T0 + 64 * MIN, GRACE)).toBeNull()
  })
})

describe('planAdminStop', () => {
  it('credits exactly what sitting down yourself would, but records who ended it', () => {
    expect(planAdminStop(session(), T0 + 25 * MIN, GRACE)).toEqual({ endedAt: T0 + 25 * MIN, endReason: 'admin' })
  })
  it('ends at the round end when they are in the grace period', () => {
    expect(planAdminStop(session(), T0 + 63 * MIN, GRACE)).toEqual({ endedAt: T0 + 60 * MIN, endReason: 'admin' })
  })
  it('does nothing for expired or already ended sessions', () => {
    expect(planAdminStop(session(), T0 + 70 * MIN, GRACE)).toBeNull()
    expect(planAdminStop(session({ endedAt: T0 + MIN, endReason: 'sat_down' }), T0 + 2 * MIN, GRACE)).toBeNull()
  })
})
