// Månedens ståere: the winner's podium, a 68×54 pixel picture. Ported from the approved sketch
// (docs/superpowers/specs/2026-11-16-manedstavla-design.md, «Tegningen»). Heads are drawn on top by
// <MonthPodium> from `spriteRects`, so this file is only background, frame and blocks.

import { OUTLINE, type Rect } from './sprite'

export const PODIUM_W = 68
export const PODIUM_H = 54

/** Where each place's head goes: [gold, silver, bronze] top-left in podium units. */
export const PODIUM_HEADS = [{ x: 25, y: 8 }, { x: 5, y: 14 }, { x: 45, y: 18 }] as const

const r = (x: number, y: number, w: number, h: number, fill: string): Rect => ({ x, y, w, h, fill })

/** Background, frame and blocks. */
export function podiumRects(): Rect[] {
  return [
    // frame and picture
    r(0, 0, 68, 54, OUTLINE), r(1, 1, 66, 52, '#8a5a36'), r(2, 2, 64, 1, '#a8703f'),
    r(3, 3, 62, 48, '#9fd2ff'), r(3, 3, 62, 10, '#8fc4ff'),
    r(3, 40, 62, 11, '#9ab78f'), r(3, 40, 62, 1, '#86a37c'),
    // clouds
    r(10, 7, 7, 2, '#ffffff'), r(8, 8, 11, 2, '#ffffff'), r(48, 10, 6, 2, '#e8f4ff'), r(46, 11, 10, 1, '#e8f4ff'),
    // silver (left), gold (middle), bronze (right): outline, face, lighter top band, darker number mark
    r(4, 35, 21, 16, OUTLINE), r(5, 36, 19, 15, '#cfd6e6'), r(5, 36, 19, 2, '#eef1f8'), r(13, 41, 3, 6, '#8c93a6'),
    r(24, 29, 21, 22, OUTLINE), r(25, 30, 19, 21, '#ffd166'), r(25, 30, 19, 2, '#fff1b8'), r(34, 35, 2, 7, '#c99a2e'),
    r(44, 39, 21, 12, OUTLINE), r(45, 40, 19, 11, '#e0995a'), r(45, 40, 19, 2, '#ffc58f'), r(53, 43, 3, 5, '#9c5f2e'),
  ]
}
