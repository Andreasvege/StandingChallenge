import { describe, it, expect } from 'vitest'
import { ALL_YEAR, forMonth, frameSize, tileStyle } from './scene'
import { SKIES, WINDOW_GLASS, WINDOW_MULLION, weatherSky, windowRects } from './sky'
import { weatherFromSymbol } from './weather'

describe('forMonth', () => {
  const list = [
    { id: 'autumn', months: [9, 10, 11] },
    { id: 'winter', months: [12, 1, 2] },
  ]
  it('picks the drawing whose months include this one', () => {
    expect(forMonth(list, 10)?.id).toBe('autumn')
    expect(forMonth(list, 1)?.id).toBe('winter')
  })
  it('gives nothing in a month without a drawing', () => {
    expect(forMonth(list, 6)).toBeUndefined()
    expect(forMonth([], 10)).toBeUndefined()
  })
})

describe('frameSize', () => {
  it('scales a single image by 3', () => {
    expect(frameSize(16, 14, 1)).toEqual({ w: 48, h: 42 })
  })
  it('splits a strip into equal frames', () => {
    expect(frameSize(48, 16, 3)).toEqual({ w: 48, h: 48 })
  })
  it('refuses a strip that does not divide evenly', () => {
    expect(() => frameSize(50, 16, 3)).toThrow()
    expect(() => frameSize(48, 16, 0)).toThrow()
  })
})

describe('windowRects', () => {
  it('stays on the glass for every sky', () => {
    for (const sky of Object.values(SKIES)) {
      for (const r of windowRects(sky)) {
        expect(r.x).toBeGreaterThanOrEqual(WINDOW_GLASS.x)
        expect(r.y).toBeGreaterThanOrEqual(WINDOW_GLASS.y)
        expect(r.x + r.w).toBeLessThanOrEqual(WINDOW_GLASS.x + WINDOW_GLASS.w)
        expect(r.y + r.h).toBeLessThanOrEqual(WINDOW_GLASS.y + WINDOW_GLASS.h)
      }
    }
  })
  it('puts the mullion in the middle of the glass', () => {
    expect(WINDOW_MULLION.x - WINDOW_GLASS.x).toBe(WINDOW_GLASS.x + WINDOW_GLASS.w - (WINDOW_MULLION.x + WINDOW_MULLION.w))
  })
  it('dims what is outside at night', () => {
    expect(SKIES.evening.outside).toBeLessThan(SKIES.day.outside)
  })
})

describe('tileStyle', () => {
  it('repeats the tile at 3×', () => {
    expect(tileStyle({ src: '/v.png', width: 32, height: 16 })).toMatchObject({
      backgroundImage: 'url(/v.png)',
      backgroundSize: '96px 48px',
      imageRendering: 'pixelated',
    })
  })
  it('leaves the built-in colours alone without a tile', () => {
    expect(tileStyle(undefined)).toBeUndefined()
  })
  it('lets an all-year tile give way to a seasonal one listed above it', () => {
    const list = [{ id: 'jul', months: [12] }, { id: 'vanlig', months: ALL_YEAR }]
    expect(forMonth(list, 12)?.id).toBe('jul')
    expect(forMonth(list, 3)?.id).toBe('vanlig')
  })
})

describe('weatherSky', () => {
  it('leaves a clear sky alone', () => {
    expect(weatherSky(SKIES.day, weatherFromSymbol('fair_day'))).toBe(SKIES.day)
    expect(weatherSky(SKIES.day, undefined)).toBe(SKIES.day)
  })
  it('hides the sun and greys the sky when it rains', () => {
    const wet = weatherSky(SKIES.day, weatherFromSymbol('rain'))
    expect(wet.hideBody).toBe(true)
    expect(wet.bands).not.toEqual(SKIES.day.bands)
    expect(windowRects(wet).some(r => r.fill === SKIES.day.body.color)).toBe(false)
  })
  it('puts out the stars behind clouds', () => {
    expect(weatherSky(SKIES.evening, weatherFromSymbol('cloudy')).stars).toBe(false)
  })
})
