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

/** The longest a round may be. The pills never reach it; «stå til …» can, up to four hours ahead. */
export const MAX_ROUND_MINUTES = 240

/**
 * What the server accepts as a round length — the presets and «stå til …» alike. Wider than
 * `isRoundMinutes`, which stays the type for the fixed pills.
 */
export function isValidRoundMinutes(n: unknown): boolean {
  return typeof n === 'number' && Number.isInteger(n) && n >= 1 && n <= MAX_ROUND_MINUTES
}

/**
 * Minutes from `now` until «HH:MM», rounded up so the round actually reaches the clock time.
 * Null when the text is not a clock time, or the moment has passed — standing overnight is not a
 * thing. Read off the local clock on purpose: it is the standing colleague's own, which sidesteps
 * time zones entirely (this is the one place where Europe/Oslo is not imposed).
 */
export function minutesUntil(now: number, time: string): number | null {
  const parts = /^(\d{2}):(\d{2})$/.exec(time)
  if (!parts) return null
  const hours = Number(parts[1])
  const mins = Number(parts[2])
  if (hours > 23 || mins > 59) return null
  const target = new Date(now)
  target.setHours(hours, mins, 0, 0)
  const ms = target.getTime() - now
  return ms > 0 ? Math.ceil(ms / 60_000) : null
}

/** The coming :00 or :30 as «HH:MM», so the «stå til …» field opens on a sensible guess. */
export function nextHalfHour(now: number): string {
  const d = new Date(now)
  d.setSeconds(0, 0)
  d.setMinutes(d.getMinutes() < 30 ? 30 : 60) // 60 rolls the hour over, and midnight with it
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
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

/**
 * A new round. `backMinutes` counts minutes already stood before the start was pressed («Har du stått
 * en stund allerede?»): the start moves back, the round still runs its full length from now.
 */
export function planStart(now: number, minutes: number, minute: number, backMinutes = 0, lastEndedAt: number | null = null) {
  return { startedAt: backdatedStart(now, backMinutes, minute, lastEndedAt), roundMinutes: minutes, roundEndsAt: now + minutes * minute }
}

/** Reaching back `backMinutes`, but never into time already credited, so a round that ended five minutes ago is not counted twice. */
export function backdatedStart(now: number, backMinutes: number, minute: number, lastEndedAt: number | null): number {
  return Math.min(Math.max(now - backMinutes * minute, lastEndedAt ?? -Infinity), now)
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

/**
 * «Start for en kollega»: somebody sees a colleague standing without the timer and starts it for
 * them. Always a short round — the colleague isn't at the screen to answer «Står du fortsatt?», so a
 * long one would credit time they may have spent sitting — and they take over with «Én runde til».
 */
export const PROXY_ROUND_MINUTES = 15
/** «Har stått i …»: how far back a round may start, for minutes already stood — for yourself or a colleague. */
export const BACKDATE_OPTIONS = [0, 10, 20, 30] as const
/** Starts for others per sender per Oslo day — plenty for honest use, too few to farm a friend's total. */
export const PROXY_DAILY_LIMIT = 3

export function isBackdate(n: unknown): n is (typeof BACKDATE_OPTIONS)[number] {
  return typeof n === 'number' && (BACKDATE_OPTIONS as readonly number[]).includes(n)
}

/** The round started on someone's behalf: a fixed short round, reaching back like planStart. */
export function planProxyStart(now: number, backMinutes: number, minute: number, lastEndedAt: number | null) {
  return planStart(now, PROXY_ROUND_MINUTES, minute, backMinutes, lastEndedAt)
}
