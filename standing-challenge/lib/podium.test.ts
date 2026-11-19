import { describe, expect, it } from 'vitest'
import { PODIUM_H, PODIUM_HEADS, PODIUM_W, podiumRects } from './podium'
import { OUTLINE } from './sprite'

describe('podiumRects', () => {
  it('stays inside 68×54', () => {
    for (const r of podiumRects()) {
      expect(r.x).toBeGreaterThanOrEqual(0)
      expect(r.y).toBeGreaterThanOrEqual(0)
      expect(r.x + r.w).toBeLessThanOrEqual(PODIUM_W)
      expect(r.y + r.h).toBeLessThanOrEqual(PODIUM_H)
    }
  })

  it('the outline frame is the first rect', () => {
    expect(podiumRects()[0]).toEqual({ x: 0, y: 0, w: 68, h: 54, fill: OUTLINE })
  })

  it('blocks match the spec', () => {
    const outlines = podiumRects().filter((r) => r.fill === OUTLINE && r.w === 21)
    expect(outlines.map((r) => [r.x, r.y])).toEqual([[4, 35], [24, 29], [44, 39]])
  })

  it('heads sit where the spec says', () => {
    expect(PODIUM_HEADS).toEqual([{ x: 25, y: 8 }, { x: 5, y: 14 }, { x: 45, y: 18 }])
  })
})
