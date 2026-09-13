import { describe, it, expect } from 'vitest'
import { BLOOM_STAGE, PLANT_H, PLANT_W, WEEKLY_GOAL_HOURS, plantLabel, plantProgress, plantRects, plantSign, plantStage } from './plant'

const HOUR = 3600
const GOAL = WEEKLY_GOAL_HOURS * HOUR

describe('plant growth', () => {
  it('measures progress toward the weekly goal, clamped to 0–1', () => {
    expect(WEEKLY_GOAL_HOURS).toBe(30)
    expect(plantProgress(0)).toBe(0)
    expect(plantProgress(GOAL / 2)).toBe(0.5)
    expect(plantProgress(GOAL * 3)).toBe(1)
    expect(plantProgress(-10)).toBe(0)
  })
  it('grows one stage per fifth of the goal and blooms only at the goal', () => {
    expect(plantStage(0)).toBe(0)
    expect(plantStage(0.19)).toBe(0)
    expect(plantStage(0.2)).toBe(1)
    expect(plantStage(0.99)).toBe(4)
    expect(plantStage(1)).toBe(BLOOM_STAGE)
  })
  it('labels progress and celebrates the goal', () => {
    expect(plantLabel(12 * HOUR + 59 * 60)).toBe('12 t av 30 t denne uka 🌱')
    expect(plantLabel(GOAL)).toBe('Ukesmålet er nådd! 30 t av 30 t 🌸')
    expect(plantSign(12 * HOUR)).toBe('12/30 t')
  })
})

describe('plantRects', () => {
  const topOf = (stage: number) => Math.min(...plantRects(stage).map(r => r.y))
  it('stays inside its 20×32 canvas at every stage', () => {
    for (let s = 0; s <= BLOOM_STAGE; s++) {
      expect(plantRects(s).every(r => r.x >= 0 && r.y >= 0 && r.x + r.w <= PLANT_W && r.y + r.h <= PLANT_H)).toBe(true)
    }
  })
  it('gets taller stage by stage', () => {
    for (let s = 1; s <= BLOOM_STAGE; s++) expect(topOf(s)).toBeLessThan(topOf(s - 1))
  })
  it('has a flower only when in bloom', () => {
    const hasPetals = (s: number) => plantRects(s).some(r => r.fill === '#ffd166')
    expect(hasPetals(BLOOM_STAGE - 1)).toBe(false)
    expect(hasPetals(BLOOM_STAGE)).toBe(true)
  })
})
