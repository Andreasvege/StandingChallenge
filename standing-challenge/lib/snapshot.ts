// The office "snapshot" sent to every browser: who sits where, who stands, today's/this week's totals
// and the latest heiarop. Pure: the DB layer (lib/office.ts) feeds it rows and a timestamp.

import type { Cheer } from './cheers'
import type { Figure } from './figure'
import { creditedSecondsBetween, phaseAt, type StandSession } from './sessions'
import { osloDayStart, osloNextDayStart, osloWeekStart } from './time'

export interface EmployeeRow {
  id: string
  name: string
  figure: Figure
  seat: number | null
  /** Set for colleagues working somewhere else (e.g. «Bergen»): shown on a screen on the wall. */
  remoteFrom?: string | null
}
export interface SessionRow extends StandSession { id: string; employeeId: string }

export interface OpenSession { startedAt: number; roundEndsAt: number; roundMinutes: number }

export interface OfficeEmployee {
  id: string
  name: string
  figure: Figure
  seat: number | null
  remoteFrom: string | null
  /** The running (or awaiting-answer) session, if any. */
  session: OpenSession | null
  todaySeconds: number
  weekSeconds: number
}

export interface OfficeSnapshot {
  now: number
  graceMs: number
  employees: OfficeEmployee[]
  todayTotalSeconds: number
  /** Today's leader (gets the crown), or null when nobody has stood yet. */
  leaderId: string | null
  /** Heiarop from the last few seconds (see CHEER_SHOW_MS); browsers animate the ones they haven't shown. */
  cheers: Cheer[]
}

export function buildSnapshot(
  employees: EmployeeRow[],
  sessions: SessionRow[],
  now: number,
  grace: number,
  cheers: Cheer[] = [],
): OfficeSnapshot {
  const dayStart = osloDayStart(now)
  const dayEnd = osloNextDayStart(now)
  const weekStart = osloWeekStart(now)

  const byEmployee = new Map<string, SessionRow[]>()
  for (const s of sessions) {
    const list = byEmployee.get(s.employeeId) ?? []
    list.push(s)
    byEmployee.set(s.employeeId, list)
  }

  const list: OfficeEmployee[] = employees.map(e => {
    let today = 0
    let week = 0
    let open: OpenSession | null = null
    for (const s of byEmployee.get(e.id) ?? []) {
      today += creditedSecondsBetween(s, now, dayStart, dayEnd)
      week += creditedSecondsBetween(s, now, weekStart, dayEnd)
      const phase = phaseAt(s, now, grace)
      if (phase === 'standing' || phase === 'awaiting') {
        open = { startedAt: s.startedAt, roundEndsAt: s.roundEndsAt, roundMinutes: s.roundMinutes }
      }
    }
    return {
      id: e.id,
      name: e.name,
      figure: e.figure,
      seat: e.seat,
      remoteFrom: e.remoteFrom ?? null,
      session: open,
      todaySeconds: Math.floor(today),
      weekSeconds: Math.floor(week),
    }
  })

  list.sort((a, b) => (a.seat ?? Infinity) - (b.seat ?? Infinity) || a.name.localeCompare(b.name, 'nb'))

  let leader: OfficeEmployee | null = null
  for (const e of list) {
    if (e.todaySeconds <= 0) continue
    if (
      !leader ||
      e.todaySeconds > leader.todaySeconds ||
      (e.todaySeconds === leader.todaySeconds && e.name.localeCompare(leader.name, 'nb') < 0)
    ) {
      leader = e
    }
  }

  return {
    now,
    graceMs: grace,
    employees: list,
    todayTotalSeconds: list.reduce((sum, e) => sum + e.todaySeconds, 0),
    leaderId: leader?.id ?? null,
    cheers,
  }
}

export type LivePhase = 'standing' | 'awaiting' | 'sitting'
export interface LiveEmployee extends OfficeEmployee {
  phase: LivePhase
  /** Seconds stood in the current session (frozen at the round end while awaiting). */
  elapsedSeconds: number
}

/** Advance an employee from the last snapshot to `now`, so timers tick between polls. */
export function liveEmployee(e: OfficeEmployee, snapshotNow: number, now: number, grace: number): LiveEmployee {
  if (!e.session) return { ...e, phase: 'sitting', elapsedSeconds: 0 }
  const { startedAt, roundEndsAt } = e.session
  const creditedUntil = Math.min(now, roundEndsAt)
  const gained = Math.max(0, creditedUntil - Math.max(snapshotNow, startedAt)) / 1000
  const phase: LivePhase = now < roundEndsAt ? 'standing' : now <= roundEndsAt + grace ? 'awaiting' : 'sitting'
  return {
    ...e,
    phase,
    elapsedSeconds: Math.floor(Math.max(0, creditedUntil - startedAt) / 1000),
    todaySeconds: Math.floor(e.todaySeconds + gained),
    weekSeconds: Math.floor(e.weekSeconds + gained),
  }
}
