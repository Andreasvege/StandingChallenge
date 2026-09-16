// Pure rules for a standing session ("ståøkt"). Times are epoch milliseconds.
// The server persists the fields returned by the plan* functions; nothing here touches the DB.

import { overlapSeconds } from './time'

export const ROUND_OPTIONS = [15, 30, 60, 90] as const
export type RoundMinutes = (typeof ROUND_OPTIONS)[number]
export type EndReason = 'sat_down' | 'completed' | 'timeout' | 'admin'
/** standing: round running · awaiting: round over, «Står du fortsatt?» grace · expired: grace passed, not yet closed · ended: closed */
export type Phase = 'standing' | 'awaiting' | 'expired' | 'ended'

export interface StandSession {
  startedAt: number
  roundMinutes: number
  roundEndsAt: number
  endedAt: number | null
  endReason: EndReason | null
}

export function isRoundMinutes(n: unknown): n is RoundMinutes {
  return typeof n === 'number' && (ROUND_OPTIONS as readonly number[]).includes(n)
}

/** Length of one "minute" in ms. DEV_FAST_TIME turns minutes into seconds for manual testing. */
export function minuteMs(fast: boolean): number {
  return fast ? 1000 : 60_000
}

/** How long «Står du fortsatt?» waits for an answer before the session times out. */
export function graceMs(fast: boolean): number {
  return fast ? 30_000 : 5 * 60_000
}

export function phaseAt(s: StandSession, now: number, grace: number): Phase {
  if (s.endedAt !== null) return 'ended'
  if (now < s.roundEndsAt) return 'standing'
  if (now <= s.roundEndsAt + grace) return 'awaiting'
  return 'expired'
}

/** The instant up to which standing time counts. The grace period never counts. */
export function creditedEnd(s: StandSession, now: number): number {
  return s.endedAt ?? Math.min(now, s.roundEndsAt)
}

export function creditedSeconds(s: StandSession, now: number): number {
  return Math.max(0, creditedEnd(s, now) - s.startedAt) / 1000
}

/** Credited seconds that fall inside [from, to) — used for per-day and per-week totals. */
export function creditedSecondsBetween(s: StandSession, now: number, from: number, to: number): number {
  return overlapSeconds(s.startedAt, creditedEnd(s, now), from, to)
}

/** Whole seconds left to answer «Står du fortsatt?». */
export function graceSecondsLeft(s: StandSession, now: number, grace: number): number {
  return Math.max(0, Math.ceil((s.roundEndsAt + grace - now) / 1000))
}

export function planStart(now: number, minutes: RoundMinutes, minute: number) {
  return { startedAt: now, roundMinutes: minutes, roundEndsAt: now + minutes * minute }
}

/** «Én runde til»: only while awaiting an answer. The new round continues from the old round's end. */
export function planExtend(s: StandSession, now: number, minute: number, grace: number): { roundEndsAt: number } | null {
  if (phaseAt(s, now, grace) !== 'awaiting') return null
  return { roundEndsAt: s.roundEndsAt + s.roundMinutes * minute }
}

/** «Jeg satte meg» / «Nei, jeg sitter». */
export function planStop(s: StandSession, now: number, grace: number): { endedAt: number; endReason: EndReason } | null {
  const phase = phaseAt(s, now, grace)
  if (phase === 'standing') return { endedAt: now, endReason: 'sat_down' }
  if (phase === 'awaiting') return { endedAt: s.roundEndsAt, endReason: 'completed' }
  return null
}

/**
 * An admin sitting somebody down who forgot to stop. Credits exactly what the person would have got
 * by pressing «Jeg satte meg» themselves — built on planStop so the two can never drift apart — but
 * records that it was not their own doing.
 */
export function planAdminStop(s: StandSession, now: number, grace: number): { endedAt: number; endReason: 'admin' } | null {
  const plan = planStop(s, now, grace)
  return plan && { endedAt: plan.endedAt, endReason: 'admin' }
}

/** No answer within the grace period: close at the round's end. */
export function planExpire(s: StandSession, now: number, grace: number): { endedAt: number; endReason: 'timeout' } | null {
  return phaseAt(s, now, grace) === 'expired' ? { endedAt: s.roundEndsAt, endReason: 'timeout' } : null
}
