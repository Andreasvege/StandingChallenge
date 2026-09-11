import { describe, it, expect } from 'vitest'
import { isAllowedEmail } from './access'
import { isFigure } from './figure'
import { DEMO_PEOPLE, demoRoom, demoSessions, demoSnapshot } from './demo-office'
import { osloHour } from './time'

const NOW = Date.parse('2026-09-11T10:00:00Z')

describe('demo office', () => {
  it('has 16 valid people on unique seats with allowed e-mails', () => {
    expect(DEMO_PEOPLE).toHaveLength(16)
    expect(new Set(DEMO_PEOPLE.map(p => p.seat)).size).toBe(16)
    for (const p of DEMO_PEOPLE) {
      expect(isFigure(p.figure)).toBe(true)
      expect(isAllowedEmail(p.email)).toBe(true)
    }
  })
  it('keeps open demo sessions running at `now`', () => {
    for (const s of demoSessions(NOW).filter(s => s.endedAt === null)) {
      expect(s.roundEndsAt).toBeGreaterThan(NOW)
    }
  })
  it('produces a lively snapshot: seven standing and a leader', () => {
    const snap = demoSnapshot(NOW)
    expect(snap.employees.filter(e => e.session).length).toBe(7)
    expect(snap.leaderId).toBe('even@thebrave.no')
  })
  it('demoRoom can preview a given Oslo hour', () => {
    const room = demoRoom(8)
    expect(osloHour(room.now)).toBe(8)
    expect(room.employees.filter(e => e.phase === 'standing').length).toBe(7)
  })
})
