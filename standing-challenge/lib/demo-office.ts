// Demo office used by the dev seed, the /dev/room preview and the blurred login background.
// Everyone except Mina, Emma, Aslak, Vilde and Even is made up.

import type { Cheer } from './cheers'
import type { Figure } from './figure'
import type { RoundMinutes } from './sessions'
import { buildSnapshot, liveEmployee, type EmployeeRow, type LiveEmployee, type OfficeSnapshot, type SessionRow } from './snapshot'
import { osloDayStart } from './time'

export interface DemoPerson {
  name: string
  email: string
  seat: number
  figure: Figure
  /** Works somewhere else: shown on a video screen on the wall instead of at a desk. */
  remoteFrom?: string
  /** Minutes ago the current session started (standing now), if any. */
  standingFor?: number
  roundMinutes?: RoundMinutes
  /** Earlier finished sessions today: [minutes ago it started, length in minutes]. */
  earlier?: [number, number][]
}

const f = (hairStyle: Figure['hairStyle'], hair: string, skin: string, shirt: string, deskItem: Figure['deskItem'], extra: Partial<Figure> = {}): Figure =>
  ({ hairStyle, hair, skin, shirt, deskItem, eyewear: 'none', beard: 'none', mustache: false, ...extra })

// Same looks as the demo people in the figure-builder prototype.
export const DEMO_PEOPLE: DemoPerson[] = [
  { name: 'Mina', email: 'mina@thebrave.no', seat: 0, figure: f('long', '#2b2140', '#f6c7a1', '#8fb8ff', 'katt'), earlier: [[180, 40]] },
  { name: 'Emma', email: 'emma@thebrave.no', seat: 1, figure: f('bun', '#e7b04a', '#f6c7a1', '#ff9f6b', 'plant'), standingFor: 32, roundMinutes: 60, earlier: [[200, 40]] },
  { name: 'Aslak', email: 'aslak@thebrave.no', seat: 2, figure: f('short', '#7a4a2a', '#e8b48c', '#7fd49a', 'mug', { beard: 'full' }), earlier: [[150, 25]] },
  { name: 'Vilde', email: 'vilde@thebrave.no', seat: 3, figure: f('long', '#c2452d', '#f6d0b0', '#c7a4ff', 'plant'), standingFor: 61, roundMinutes: 90, earlier: [[240, 50]] },
  { name: 'Even', email: 'even@thebrave.no', seat: 4, figure: f('buzz', '#4a2e1c', '#c98e62', '#ff7ab0', 'mug', { eyewear: 'sunglasses', beard: 'stubble', headwear: 'caps' }), standingFor: 120, roundMinutes: 90, earlier: [[260, 70]] },
  { name: 'Andreas', email: 'av@thebrave.no', seat: 5, figure: f('short', '#6b4a2e', '#f6c7a1', '#ffd166', 'plant', { eyewear: 'glasses' }), standingFor: 9, roundMinutes: 30 },
  { name: 'Sofie', email: 'sofie@thebrave.no', seat: 6, figure: f('curly', '#1f1a2e', '#8d5a3b', '#ff8fa3', 'mug') },
  { name: 'Jonas', email: 'jonas@thebrave.no', seat: 7, figure: f('short', '#d9a24a', '#f6d0b0', '#6fd3d0', 'mug', { eyewear: 'glasses' }), earlier: [[190, 30]] },
  { name: 'Ingrid', email: 'ingrid@thebrave.no', seat: 8, figure: f('long', '#f0d58a', '#f6d0b0', '#9ad17a', 'plant'), standingFor: 45, roundMinutes: 60, earlier: [[210, 45]] },
  { name: 'Magnus', email: 'magnus@thebrave.no', seat: 9, figure: f('curly', '#3a2a1e', '#c98e62', '#a3b4ff', 'mug', { beard: 'stubble' }) },
  { name: 'Thea', email: 'thea@thebrave.no', seat: 10, figure: f('bun', '#8a3b2a', '#e8b48c', '#ffb86b', 'mug', { eyewear: 'glasses' }), standingFor: 21, roundMinutes: 30 },
  { name: 'Henrik', email: 'henrik@thebrave.no', seat: 11, figure: f('buzz', '#bfa27a', '#f6c7a1', '#8fd694', 'plant', { mustache: true }) },
  { name: 'Nora', email: 'nora@thebrave.no', seat: 12, figure: f('bun', '#2b2140', '#f6d0b0', '#d9a4ff', 'mug'), earlier: [[170, 20]] },
  { name: 'Sander', email: 'sander@thebrave.no', seat: 13, figure: f('short', '#1f1a2e', '#8d5a3b', '#6fb8ff', 'plant', { beard: 'stubble', mustache: true }), standingFor: 80, roundMinutes: 90, earlier: [[230, 45]] },
  { name: 'Ida', email: 'ida@thebrave.no', seat: 14, figure: f('long', '#e6c07a', '#f6c7a1', '#ff9fc4', 'plant') },
  { name: 'Kasper', email: 'kasper@thebrave.no', seat: 15, remoteFrom: 'Bergen', figure: f('curly', '#5a3a22', '#f6d0b0', '#ffa26b', 'mug', { mustache: true }) },
]

const MIN = 60_000

export interface DemoSession {
  email: string
  startedAt: number
  roundMinutes: number
  roundEndsAt: number
  endedAt: number | null
}

/** Sessions relative to `now`: one open session for people standing, plus earlier finished ones. */
export function demoSessions(now: number): DemoSession[] {
  const out: DemoSession[] = []
  for (const p of DEMO_PEOPLE) {
    for (const [ago, length] of p.earlier ?? []) {
      const startedAt = now - ago * MIN
      out.push({ email: p.email, startedAt, roundMinutes: 30, roundEndsAt: startedAt + length * MIN, endedAt: startedAt + length * MIN })
    }
    if (p.standingFor !== undefined && p.roundMinutes) {
      const startedAt = now - p.standingFor * MIN
      const rounds = Math.floor(p.standingFor / p.roundMinutes) + 1
      out.push({ email: p.email, startedAt, roundMinutes: p.roundMinutes, roundEndsAt: startedAt + rounds * p.roundMinutes * MIN, endedAt: null })
    }
  }
  return out
}

/** A ready-made snapshot of the demo office (no database needed). */
export function demoSnapshot(now: number, grace = 5 * MIN): OfficeSnapshot {
  const employees: EmployeeRow[] = DEMO_PEOPLE.map(p => ({ id: p.email, name: p.name, figure: p.figure, seat: p.seat, remoteFrom: p.remoteFrom ?? null }))
  const sessions: SessionRow[] = demoSessions(now).map((s, i) => ({
    id: String(i),
    employeeId: s.email,
    startedAt: s.startedAt,
    roundMinutes: s.roundMinutes,
    roundEndsAt: s.roundEndsAt,
    endedAt: s.endedAt,
    endReason: s.endedAt === null ? null : 'completed',
  }))
  return buildSnapshot(employees, sessions, now, grace)
}

/**
 * Everything <OfficeRoom> needs to show the demo office right now (or at `hour` o'clock Oslo time today).
 * Reads the clock here rather than in page components, which must stay pure (react-hooks/purity).
 */
export function demoRoom(hour?: number, withCheer = false): { employees: LiveEmployee[]; leaderId: string | null; now: number; cheers: Cheer[] } {
  const clock = Date.now()
  const now = hour === undefined || Number.isNaN(hour) ? clock : osloDayStart(clock) + hour * 3_600_000
  const snap = demoSnapshot(now)
  // /dev/room?cheer=1 shows Emma cheering on Even, to preview the floating emoji.
  const cheers: Cheer[] = withCheer ? [{ id: 'demo-cheer', fromId: 'emma@thebrave.no', toId: 'even@thebrave.no', emoji: '🔥', at: now - 500 }] : []
  return { employees: snap.employees.map(e => liveEmployee(e, now, now, snap.graceMs)), leaderId: snap.leaderId, now, cheers }
}
