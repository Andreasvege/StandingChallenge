import { describe, it, expect } from 'vitest'
import { SKIES, skyForWindow, skyPhase } from './sky'

describe('skyPhase', () => {
  it('maps Oslo hours to phases at the boundaries', () => {
    expect(skyPhase(5)).toBe('evening')
    expect(skyPhase(6)).toBe('morning')
    expect(skyPhase(9)).toBe('morning')
    expect(skyPhase(10)).toBe('day')
    expect(skyPhase(15)).toBe('day')
    expect(skyPhase(16)).toBe('sunset')
    expect(skyPhase(18)).toBe('sunset')
    expect(skyPhase(19)).toBe('evening')
    expect(skyPhase(0)).toBe('evening')
    expect(skyPhase(23)).toBe('evening')
  })
})

describe('SKIES', () => {
  it('has a moon and stars only in the evening', () => {
    expect(SKIES.evening.body.kind).toBe('moon')
    expect(SKIES.evening.stars).toBe(true)
    expect(SKIES.day.stars).toBe(false)
  })
  it('keeps the sun or moon inside the 64×36 window', () => {
    for (const sky of Object.values(SKIES)) {
      expect(sky.body.x + 8).toBeLessThanOrEqual(62)
      expect(sky.body.y + 8).toBeLessThanOrEqual(34)
    }
  })
})

describe('skyForWindow', () => {
  it('puts the sun or moon in one window only', () => {
    for (const sky of Object.values(SKIES)) {
      const shown = (['left', 'right'] as const).filter(side => !skyForWindow(sky, side).hideBody)
      expect(shown).toHaveLength(1)
    }
    expect(skyForWindow(SKIES.morning, 'left').hideBody).toBeFalsy()
    expect(skyForWindow(SKIES.day, 'right').hideBody).toBeFalsy()
  })
  it('keeps clouds hiding it in both', () => {
    expect(skyForWindow({ ...SKIES.day, hideBody: true }, 'right').hideBody).toBe(true)
  })
})
