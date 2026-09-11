import { describe, it, expect } from 'vitest'
import { BEARDS, DEFAULT_FIGURE, EYEWEAR, HAIR_STYLES, type Figure } from './figure'
import { CROWN, HEAD_VIEWBOX, LENS, OUTLINE, SPRITE_H, SPRITE_W, blend, emptyDeskRects, lighten, shade, spriteRects, type Rect } from './sprite'

const stand = (f: Figure, crown = false) => spriteRects(f, { pose: 'stand', crown })
const deskTop = (rects: Rect[]) => rects.find(r => r.fill === '#d49a64' && r.w === 18)?.y
const has = (rects: Rect[], match: Partial<Rect>) =>
  rects.some(r => Object.entries(match).every(([k, v]) => r[k as keyof Rect] === v))
// Standing head is drawn at (7, 11); the mouth pixel sits at (x + 11, y + 9).
const MOUTH = { x: 18, y: 20, w: 1, h: 1, fill: OUTLINE }

function inBounds(rects: Rect[]) {
  return rects.every(r => r.x >= 0 && r.y >= 0 && r.x + r.w <= SPRITE_W && r.y + r.h <= SPRITE_H)
}

describe('colour helpers', () => {
  it('blend mixes per channel', () => {
    expect(blend('#000000', '#ffffff', 0.5)).toBe('#808080')
    expect(blend('#ff0000', '#0000ff', 0)).toBe('#ff0000')
    expect(blend('#ff0000', '#0000ff', 1)).toBe('#0000ff')
  })
  it('shade darkens and lighten brightens', () => {
    expect(shade('#ff0000')).toBe('#cc0000')
    expect(shade('#ffffff')).toBe('#cccccc')
    expect(lighten('#000000')).toBe('#595959')
  })
})

describe('HEAD_VIEWBOX', () => {
  it('crops to the head at an 18:21 ratio', () => {
    expect(HEAD_VIEWBOX).toBe('3 4 18 21')
  })
})

describe('spriteRects', () => {
  it('is deterministic', () => {
    expect(stand(DEFAULT_FIGURE)).toEqual(stand(DEFAULT_FIGURE))
  })
  it('raises the desk when standing and lowers it when sitting', () => {
    expect(deskTop(stand(DEFAULT_FIGURE))).toBe(26)
    expect(deskTop(spriteRects(DEFAULT_FIGURE, { pose: 'sit' }))).toBe(34)
  })
  it('draws a crown only for the leader', () => {
    const count = (rects: Rect[]) => rects.filter(r => r.fill === CROWN).length
    expect(count(stand(DEFAULT_FIGURE))).toBe(0)
    expect(count(stand(DEFAULT_FIGURE, true))).toBe(4)
  })
  it('draws glasses as a frame of five outline rects around a light lens', () => {
    const glasses = stand({ ...DEFAULT_FIGURE, eyewear: 'glasses' })
    const outlines = (rects: Rect[]) => rects.filter(r => r.fill === OUTLINE).length
    expect(outlines(glasses) - outlines(stand(DEFAULT_FIGURE))).toBe(5)
    expect(has(glasses, { fill: LENS, w: 3, h: 3 })).toBe(true)
  })
  it('draws sunglasses as a solid dark block', () => {
    expect(has(stand({ ...DEFAULT_FIGURE, eyewear: 'sunglasses' }), { x: 14, y: 15, w: 6, h: 4, fill: OUTLINE })).toBe(true)
  })
  it('hides the mouth under a mustache or full beard, but not under stubble', () => {
    expect(has(stand(DEFAULT_FIGURE), MOUTH)).toBe(true)
    expect(has(stand({ ...DEFAULT_FIGURE, beard: 'stubble' }), MOUTH)).toBe(true)
    expect(has(stand({ ...DEFAULT_FIGURE, mustache: true }), MOUTH)).toBe(false)
    expect(has(stand({ ...DEFAULT_FIGURE, beard: 'full' }), MOUTH)).toBe(false)
  })
  it('tints stubble between skin and hair colour', () => {
    const f: Figure = { ...DEFAULT_FIGURE, beard: 'stubble' }
    expect(has(stand(f), { fill: blend(f.skin, f.hair, 0.35), w: 7, h: 3 })).toBe(true)
  })
  it('gives the buzz cut a thin cap instead of the three-row fringe', () => {
    const f: Figure = { ...DEFAULT_FIGURE, hairStyle: 'buzz' }
    expect(has(stand(f), { fill: f.hair, w: 13, h: 3 })).toBe(false)
    expect(has(stand(f), { fill: blend(f.hair, f.skin, 0.15), w: 13, h: 1 })).toBe(true)
  })
  it('stays inside the 40×48 grid for every combination', () => {
    for (const hairStyle of HAIR_STYLES) {
      for (const eyewear of EYEWEAR) {
        for (const beard of BEARDS) {
          for (const pose of ['stand', 'sit'] as const) {
            const f: Figure = { ...DEFAULT_FIGURE, hairStyle, eyewear, beard, mustache: true }
            expect(inBounds(spriteRects(f, { pose, crown: true }))).toBe(true)
          }
        }
      }
    }
  })
})

describe('emptyDeskRects', () => {
  it('draws a lowered desk inside the grid', () => {
    const rects = emptyDeskRects()
    expect(deskTop(rects)).toBe(34)
    expect(inBounds(rects)).toBe(true)
  })
})
