// Kontorplanten: a potted plant in the room that grows with how long the whole office has stood this
// week, and blooms when the weekly goal is reached. Starts over every Monday (the week totals do).

import { DEFAULT_LANG, t, type Lang } from './i18n'
import { OUTLINE, type Rect } from './sprite'

export const WEEKLY_GOAL_HOURS = 30
export const PLANT_W = 20
export const PLANT_H = 32
/** Stages 0 (sleepy sprout) … 4 (almost there); 5 = in bloom. */
export const BLOOM_STAGE = 5

const STEM = '#3e7b47'
const LEAF = '#5fae62'
const LEAF_LIGHT = '#7dcf76'
const POT = '#e08a5b'
const RIM = '#efa173'
const PETAL = '#ffd166'
const FLOWER_HEART = '#ff6fa8'
const BLUSH = '#ff8fa3'
const STEM_HEIGHTS = [3, 6, 9, 12, 15, 18]

export function plantProgress(weekSeconds: number, goalHours = WEEKLY_GOAL_HOURS): number {
  return Math.max(0, Math.min(1, weekSeconds / (goalHours * 3600)))
}

export function plantStage(progress: number): number {
  return progress >= 1 ? BLOOM_STAGE : Math.min(BLOOM_STAGE - 1, Math.floor(progress * BLOOM_STAGE))
}

/** «12 t av 30 t denne uka 🌱», or a little celebration once the goal is reached. */
export function plantLabel(weekSeconds: number, lang: Lang = DEFAULT_LANG, goalHours = WEEKLY_GOAL_HOURS): string {
  const hours = Math.floor(weekSeconds / 3600)
  return t(lang, weekSeconds >= goalHours * 3600 ? 'plant.goal' : 'plant.progress', { hours, goal: goalHours })
}

/** The short sign on the shelf: «12/30 t». */
export function plantSign(weekSeconds: number, lang: Lang = DEFAULT_LANG, goalHours = WEEKLY_GOAL_HOURS): string {
  return t(lang, 'plant.sign', { hours: Math.floor(weekSeconds / 3600), goal: goalHours })
}

export function plantRects(stage: number): Rect[] {
  const s = Math.max(0, Math.min(BLOOM_STAGE, Math.floor(stage)))
  const rects: Rect[] = []
  const r = (x: number, y: number, w: number, h: number, fill: string) => {
    rects.push({ x, y, w, h, fill })
  }
  const h = STEM_HEIGHTS[s]
  const top = 23 - h

  r(9, top, 2, h, STEM)
  // Leaves up the stem, alternating sides every 3 px.
  for (let y = 20, i = 0; y > top + 1; y -= 3, i++) {
    if (i % 2 === 0) {
      r(6, y, 3, 1, LEAF)
      r(5, y + 1, 4, 1, LEAF_LIGHT)
    } else {
      r(11, y, 3, 1, LEAF)
      r(11, y + 1, 4, 1, LEAF_LIGHT)
    }
  }
  // A fresh pair of leaves on top.
  r(7, top - 1, 2, 1, LEAF_LIGHT)
  r(11, top - 1, 2, 1, LEAF_LIGHT)
  if (s === BLOOM_STAGE) {
    r(8, top - 5, 4, 1, PETAL)
    r(7, top - 4, 6, 2, PETAL)
    r(8, top - 2, 4, 1, PETAL)
    r(9, top - 4, 2, 2, FLOWER_HEART)
  }

  // The pot has a face: sleepy at the start of the week, smiling as the plant grows, blushing near the goal.
  r(3, 23, 14, 4, OUTLINE)
  r(4, 24, 12, 2, RIM)
  r(4, 26, 12, 6, OUTLINE)
  r(5, 26, 10, 5, POT)
  if (s === 0) {
    r(7, 28, 2, 1, OUTLINE)
    r(11, 28, 2, 1, OUTLINE)
  } else {
    r(7, 28, 1, 1, OUTLINE)
    r(12, 28, 1, 1, OUTLINE)
    r(9, 29, 2, 1, OUTLINE)
  }
  if (s >= 4) {
    r(6, 29, 1, 1, BLUSH)
    r(13, 29, 1, 1, BLUSH)
  }
  return rects
}
