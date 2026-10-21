import { describe, it, expect } from 'vitest'
import { CLEAR, currentSymbol, precipitation, weatherFromSymbol } from './weather'

describe('weatherFromSymbol', () => {
  it('reads clear and partly cloudy skies as clear', () => {
    expect(weatherFromSymbol('clearsky_day')).toEqual(CLEAR)
    expect(weatherFromSymbol('fair_night')).toEqual(CLEAR)
    expect(weatherFromSymbol('partlycloudy_polartwilight')).toEqual(CLEAR)
  })
  it('greys the sky for cloud and fog', () => {
    expect(weatherFromSymbol('cloudy')).toMatchObject({ precip: 'none', overcast: true, fog: false })
    expect(weatherFromSymbol('fog')).toMatchObject({ precip: 'none', overcast: true, fog: true })
  })
  it('tells rain, sleet and snow apart, with intensity', () => {
    expect(weatherFromSymbol('lightrain')).toMatchObject({ precip: 'rain', intensity: 1, overcast: true })
    expect(weatherFromSymbol('rainshowers_day')).toMatchObject({ precip: 'rain', intensity: 2 })
    expect(weatherFromSymbol('heavysleet')).toMatchObject({ precip: 'sleet', intensity: 3 })
    expect(weatherFromSymbol('lightsnowshowers_night')).toMatchObject({ precip: 'snow', intensity: 1 })
  })
  it('spots thunder', () => {
    expect(weatherFromSymbol('heavyrainandthunder')).toMatchObject({ precip: 'rain', intensity: 3, thunder: true })
    expect(weatherFromSymbol('snowshowersandthunder_day')).toMatchObject({ precip: 'snow', thunder: true })
    expect(weatherFromSymbol('rain').thunder).toBe(false)
  })
  it('falls back to clear for codes it does not know', () => {
    expect(weatherFromSymbol('')).toEqual(CLEAR)
    expect(weatherFromSymbol('volcano')).toEqual(CLEAR)
  })
})

describe('currentSymbol', () => {
  const at = (iso: string) => Date.parse(iso)
  const step = (time: string, symbol_code: string) => ({ time, data: { next_1_hours: { summary: { symbol_code } } } })
  const forecast = {
    properties: {
      timeseries: [step('2026-10-12T10:00:00Z', 'cloudy'), step('2026-10-12T11:00:00Z', 'lightrain'), step('2026-10-12T12:00:00Z', 'rain')],
    },
  }
  it('picks the hour that now falls in', () => {
    expect(currentSymbol(forecast, at('2026-10-12T10:59:59Z'))).toBe('cloudy')
    expect(currentSymbol(forecast, at('2026-10-12T11:00:00Z'))).toBe('lightrain')
  })
  it('uses the next hour when the forecast starts after now', () => {
    expect(currentSymbol(forecast, at('2026-10-12T09:30:00Z'))).toBe('cloudy')
  })
  it('gives null for a response it does not understand', () => {
    expect(currentSymbol(null, 0)).toBeNull()
    expect(currentSymbol({ properties: {} }, 0)).toBeNull()
    expect(currentSymbol({ properties: { timeseries: [{ time: '2026-10-12T10:00:00Z', data: {} }] } }, at('2026-10-12T10:30:00Z'))).toBeNull()
  })
})

describe('precipitation', () => {
  it('has nothing to draw without precipitation', () => {
    expect(precipitation(undefined)).toEqual([])
    expect(precipitation(weatherFromSymbol('cloudy'))).toEqual([])
  })
  it('falls harder the heavier it rains', () => {
    const n = (s: string) => precipitation(weatherFromSymbol(s)).length
    expect(n('lightrain')).toBeLessThan(n('rain'))
    expect(n('rain')).toBeLessThan(n('heavyrain'))
  })
  it('is the same every time, so polling never reshuffles it', () => {
    expect(precipitation(weatherFromSymbol('snow'))).toEqual(precipitation(weatherFromSymbol('snow')))
  })
  it('draws rain as far drops plus drops on the pane and splashes, snow as flakes only, sleet as all of it', () => {
    const kinds = (s: string) => new Set(precipitation(weatherFromSymbol(s)).map(p => p.kind))
    expect(kinds('rain')).toEqual(new Set(['drop', 'pane', 'splash']))
    expect(kinds('snow')).toEqual(new Set(['flake']))
    expect(kinds('sleet')).toEqual(new Set(['drop', 'flake', 'pane', 'splash']))
  })
  it('puts more drops on the pane and more splashes on the sill the harder it rains', () => {
    const count = (s: string, kind: string) => precipitation(weatherFromSymbol(s)).filter(p => p.kind === kind).length
    expect([count('lightrain', 'pane'), count('rain', 'pane'), count('heavyrain', 'pane')]).toEqual([3, 5, 8])
    expect([count('lightrain', 'splash'), count('rain', 'splash'), count('heavyrain', 'splash')]).toEqual([0, 3, 6])
    expect(count('heavysnow', 'pane')).toBe(0)
    expect(count('heavysnow', 'splash')).toBe(0)
  })
  it('lands pane drops high enough to slide 12 px, and splashes on the sill', () => {
    for (const p of precipitation(weatherFromSymbol('heavyrain'))) {
      if (p.kind === 'pane') {
        expect(p.y).toBeGreaterThanOrEqual(3)
        expect(p.y + 12).toBeLessThanOrEqual(33)
      }
      if (p.kind === 'splash') {
        expect(p.y).toBe(33)
        expect(p.x).toBeGreaterThanOrEqual(3)
        expect(p.x).toBeLessThanOrEqual(60)
      }
    }
  })
  it('keeps every particle on the glass, each kind at its own pace', () => {
    const pace = { drop: [1, 1.5], flake: [3, 6], pane: [4, 7], splash: [1.2, 2] } as const
    for (const p of precipitation(weatherFromSymbol('heavysleet'))) {
      expect(p.x).toBeGreaterThanOrEqual(2)
      expect(p.x).toBeLessThanOrEqual(61)
      expect(p.offset).toBeLessThanOrEqual(p.duration)
      expect(p.duration).toBeGreaterThanOrEqual(pace[p.kind][0])
      expect(p.duration).toBeLessThanOrEqual(pace[p.kind][1])
    }
  })
})
