import { describe, it, expect } from 'vitest'
import { DEFAULT_FIGURE, isFigure, randomFigure } from './figure'

describe('isFigure', () => {
  it('accepts the default figure', () => {
    expect(isFigure(DEFAULT_FIGURE)).toBe(true)
  })
  it('accepts every eyewear, beard and mustache combination', () => {
    for (const eyewear of ['none', 'glasses', 'sunglasses'] as const) {
      for (const beard of ['none', 'stubble', 'full'] as const) {
        for (const mustache of [false, true]) expect(isFigure({ ...DEFAULT_FIGURE, eyewear, beard, mustache })).toBe(true)
      }
    }
  })
  it('rejects colours outside the palettes (palettes are lowercase)', () => {
    expect(isFigure({ ...DEFAULT_FIGURE, hair: '#123456' })).toBe(false)
    expect(isFigure({ ...DEFAULT_FIGURE, shirt: '#FFF3DC' })).toBe(false)
  })
  it('rejects unknown options and old boolean fields', () => {
    expect(isFigure({ ...DEFAULT_FIGURE, hairStyle: 'mohawk' })).toBe(false)
    expect(isFigure({ ...DEFAULT_FIGURE, deskItem: 'cat' })).toBe(false)
    expect(isFigure({ ...DEFAULT_FIGURE, eyewear: true })).toBe(false)
    expect(isFigure({ ...DEFAULT_FIGURE, beard: true })).toBe(false)
    expect(isFigure({ ...DEFAULT_FIGURE, mustache: 'yes' })).toBe(false)
  })
  it('rejects non-objects', () => {
    expect(isFigure(null)).toBe(false)
    expect(isFigure('figure')).toBe(false)
  })
})

describe('randomFigure', () => {
  it('always produces a valid figure', () => {
    for (let i = 0; i < 300; i++) expect(isFigure(randomFigure())).toBe(true)
  })
  it('is deterministic for a given random source, including the edge values', () => {
    expect(randomFigure(() => 0)).toEqual(randomFigure(() => 0))
    expect(randomFigure(() => 0)).toMatchObject({ eyewear: 'glasses', beard: 'stubble', mustache: true })
    expect(randomFigure(() => 0.999999)).toMatchObject({ eyewear: 'none', beard: 'none', mustache: false })
  })
})
