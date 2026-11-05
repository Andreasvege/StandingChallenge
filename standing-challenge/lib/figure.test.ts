import { describe, it, expect } from 'vitest'
import { DEFAULT_FIGURE, DESK_ITEMS, EYEWEAR, HEADWEAR, SHIRT_COLORS, TOPS, isFigure, randomFigure } from './figure'

describe('isFigure', () => {
  it('accepts the default figure', () => {
    expect(isFigure(DEFAULT_FIGURE)).toBe(true)
  })
  it('accepts every eyewear, beard and mustache combination', () => {
    for (const eyewear of EYEWEAR) {
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
  it('accepts every hand-drawn option (DEFAULT_FIGURE itself has no headwear, like figures saved before it existed)', () => {
    expect('headwear' in DEFAULT_FIGURE).toBe(false)
    for (const headwear of HEADWEAR) expect(isFigure({ ...DEFAULT_FIGURE, headwear })).toBe(true)
    for (const deskItem of DESK_ITEMS) expect(isFigure({ ...DEFAULT_FIGURE, deskItem })).toBe(true)
  })
  it('rejects head art that does not exist', () => {
    expect(isFigure({ ...DEFAULT_FIGURE, headwear: 'tiara' })).toBe(false)
  })
  it('accepts every top with any under colour, and figures saved before tops existed', () => {
    expect('top' in DEFAULT_FIGURE).toBe(false)
    for (const top of TOPS) for (const under of SHIRT_COLORS) expect(isFigure({ ...DEFAULT_FIGURE, top, under })).toBe(true)
  })
  it('rejects unknown tops and under colours outside the palette', () => {
    expect(isFigure({ ...DEFAULT_FIGURE, top: 'poncho' })).toBe(false)
    expect(isFigure({ ...DEFAULT_FIGURE, top: 'blazer', under: '#123456' })).toBe(false)
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
    expect(randomFigure(() => 0.999999)).toMatchObject({ eyewear: 'none', beard: 'none', mustache: false, headwear: 'none' })
  })
})
