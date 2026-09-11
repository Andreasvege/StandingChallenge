// Pixel sprites as plain rectangles on a 40×48 grid (figure + desk), ported from the approved
// figure-builder prototype. Render with shape-rendering="crispEdges".

import type { DeskItem, Figure } from './figure'

export type Pose = 'stand' | 'sit'
export interface Rect { x: number; y: number; w: number; h: number; fill: string }
export interface SpriteOptions { pose: Pose; crown?: boolean }

export const SPRITE_W = 40
export const SPRITE_H = 48
export const OUTLINE = '#120d22'
export const CROWN = '#ffd166'
export const LENS = '#d4f1ff'
/** The part of the standing sprite that shows just the head (avatars, favicon). Aspect ratio 18:21. */
export const HEAD_BOX = { x: 3, y: 4, w: 18, h: 21 } as const
export const HEAD_VIEWBOX = `${HEAD_BOX.x} ${HEAD_BOX.y} ${HEAD_BOX.w} ${HEAD_BOX.h}`

const METAL = '#8b88a3'
const PANTS = '#3d3a5c'
const CHAIR = '#6f5ca8'
const WOOD = '#d49a64'
const WOOD_DARK = '#a86f42'
const LAPTOP = '#cfcbe0'
const SCREEN = '#8fe3ff'
const MUG = '#fff7ea'
const POT = '#e08a5b'
const LEAF = '#5fae62'
const LEAF_LIGHT = '#7dcf76'
const BLUSH = '#ff8fa3'
const EYE_SHINE = '#ffffff'
const SUNGLASS_GLINT = '#7d6fc0'

function channels(hex: string): number[] {
  const n = parseInt(hex.slice(1), 16)
  return [n >> 16, (n >> 8) & 255, n & 255]
}

/** Mix two #rrggbb colours per channel: t = 0 gives a, t = 1 gives b. */
export function blend(a: string, b: string, t: number): string {
  const x = channels(a)
  const y = channels(b)
  const [r, g, bl] = x.map((u, i) => Math.round(u + (y[i] - u) * t))
  return '#' + ((1 << 24) + (r << 16) + (g << 8) + bl).toString(16).slice(1)
}

/** Darken: shade('#ff0000') === '#cc0000'. */
export function shade(hex: string, factor = 0.8): string {
  return blend(hex, '#000000', 1 - factor)
}

export function lighten(hex: string, amount = 0.35): string {
  return blend(hex, '#ffffff', amount)
}

function painter() {
  const rects: Rect[] = []
  const r = (x: number, y: number, w: number, h: number, fill: string) => {
    rects.push({ x, y, w, h, fill })
  }
  /** Filled rect with a 1px outline around it. */
  const o = (x: number, y: number, w: number, h: number, fill: string) => {
    r(x - 1, y - 1, w + 2, h + 2, OUTLINE)
    r(x, y, w, h, fill)
  }
  const dots = (x: number, y: number, list: [number, number][], fill: string) => {
    for (const [dx, dy] of list) r(x + dx, y + dy, 1, 1, fill)
  }
  return { rects, r, o, dots }
}
type Painter = ReturnType<typeof painter>

function desk({ r, o }: Painter, top: number, item: DeskItem, laptopOpen: boolean) {
  r(22, top + 3, 2, 46 - (top + 3), METAL)
  r(34, top + 3, 2, 46 - (top + 3), METAL)
  r(21, 46, 4, 1, OUTLINE)
  r(33, 46, 4, 1, OUTLINE)
  o(20, top, 18, 2, WOOD)
  r(20, top + 1, 18, 1, WOOD_DARK)
  if (laptopOpen) {
    r(23, top - 2, 8, 1, LAPTOP)
    r(30, top - 8, 1, 6, LAPTOP)
    r(29, top - 7, 1, 4, SCREEN)
  } else {
    r(23, top - 3, 8, 2, LAPTOP)
  }
  if (item === 'plant') {
    r(34, top - 3, 3, 2, POT)
    r(35, top - 6, 1, 3, LEAF)
    r(34, top - 5, 1, 2, LEAF_LIGHT)
    r(36, top - 5, 1, 2, LEAF_LIGHT)
  } else {
    o(34, top - 3, 3, 2, MUG)
  }
}

function chair({ r, o }: Painter) {
  o(5, 27, 2, 11, CHAIR)
  o(6, 38, 12, 2, CHAIR)
  r(11, 41, 2, 4, METAL)
  r(7, 45, 10, 1, METAL)
  r(7, 46, 2, 1, OUTLINE)
  r(15, 46, 2, 1, OUTLINE)
}

function head(p: Painter, f: Figure, x: number, y: number, awake: boolean, crown: boolean) {
  const { r, o, dots } = p
  const hairLight = lighten(f.hair)
  const hairDark = shade(f.hair, 0.72)

  // Hair behind the head.
  if (f.hairStyle === 'long') o(x - 1, y + 2, 4, 14, f.hair)
  if (f.hairStyle === 'bun') o(x + 1, y - 3, 5, 4, f.hair)
  if (f.hairStyle === 'curly') {
    o(x - 1, y - 2, 15, 5, f.hair)
    o(x - 1, y + 3, 4, 6, f.hair)
    for (const b of [-1, 3, 7, 11]) {
      r(x + b, y - 4, 3, 1, OUTLINE)
      r(x + b, y - 3, 3, 1, f.hair)
    }
  }

  // Face.
  o(x, y, 13, 13, f.skin)

  // Hair on top of the face.
  if (f.hairStyle === 'curly') {
    r(x - 1, y - 2, 15, 5, f.hair)
    r(x - 1, y + 3, 4, 6, f.hair)
    dots(x, y, [[0, -3], [4, -3], [8, -3], [0, -1], [4, -2], [8, -1], [12, -2], [2, 1], [6, 0], [10, 1], [0, 5], [1, 7]], hairLight)
    dots(x, y, [[2, -2], [6, -1], [10, -2], [4, 1], [8, 1], [12, 0], [1, 4], [0, 7], [-1, 2], [13, 1]], hairDark)
    r(x + 5, y + 2, 1, 1, f.skin)
    r(x + 9, y + 2, 1, 1, f.skin)
  } else if (f.hairStyle === 'buzz') {
    // Clean close crop: a thin cap tinted toward the skin, stepped taper at the back.
    const buzz = blend(f.hair, f.skin, 0.15)
    r(x, y, 13, 1, buzz)
    r(x, y + 1, 12, 1, buzz)
    r(x, y + 2, 4, 3, buzz)
    r(x, y + 5, 2, 1, buzz)
  } else {
    r(x, y, 13, 3, f.hair)
    r(x, y + 3, 4, 5, f.hair)
    r(x + 4, y + 3, 3, 1, f.hair)
  }

  // Beard: stubble is a soft tint over jaw and upper lip, a full beard is solid hair.
  if (f.beard === 'stubble') {
    const stubble = blend(f.skin, f.hair, 0.35)
    r(x + 6, y + 10, 7, 3, stubble)
    r(x + 8, y + 9, 5, 1, stubble)
    r(x + 5, y + 11, 1, 2, stubble)
  } else if (f.beard === 'full') {
    r(x + 6, y + 9, 7, 4, f.hair)
  }
  // Cheek.
  if (f.beard !== 'full') r(f.mustache ? x + 6 : x + 7, y + 8, 2, 1, BLUSH)
  // Mustache: thick under the nose, tail sweeping back.
  if (f.mustache) {
    r(x + 10, y + 8, 3, 1, f.hair)
    r(x + 8, y + 9, 5, 1, f.hair)
  }
  // Mouth.
  if (!f.mustache && f.beard !== 'full') r(x + 11, y + 9, 1, 1, OUTLINE)

  // Eyes and eyewear.
  const eye = () => {
    if (awake) {
      r(x + 9, y + 5, 2, 2, OUTLINE)
      r(x + 9, y + 5, 1, 1, EYE_SHINE)
    } else {
      r(x + 8, y + 6, 3, 1, OUTLINE)
    }
  }
  if (f.eyewear === 'glasses') {
    r(x + 8, y + 5, 3, 3, LENS)
    eye()
    r(x + 7, y + 4, 5, 1, OUTLINE)
    r(x + 7, y + 8, 5, 1, OUTLINE)
    r(x + 7, y + 5, 1, 3, OUTLINE)
    r(x + 11, y + 5, 1, 3, OUTLINE)
    r(x + 3, y + 5, 4, 1, OUTLINE)
  } else if (f.eyewear === 'sunglasses') {
    r(x + 7, y + 4, 6, 4, OUTLINE)
    r(x + 8, y + 5, 1, 1, SUNGLASS_GLINT)
    r(x + 3, y + 5, 4, 1, OUTLINE)
  } else {
    eye()
  }

  if (crown) {
    r(x + 3, y - 3, 7, 2, CROWN)
    r(x + 3, y - 5, 1, 2, CROWN)
    r(x + 6, y - 5, 1, 2, CROWN)
    r(x + 9, y - 5, 1, 2, CROWN)
  }
}

/** A person at their desk: standing at a raised desk, or dozing on a chair at a lowered one. */
export function spriteRects(f: Figure, { pose, crown = false }: SpriteOptions): Rect[] {
  const p = painter()
  const { r, o } = p
  const shirtShade = shade(f.shirt)
  if (pose === 'stand') {
    desk(p, 26, f.deskItem, true)
    o(11, 34, 2, 12, PANTS)
    o(15, 34, 2, 12, PANTS)
    r(11, 46, 3, 1, OUTLINE)
    r(15, 46, 3, 1, OUTLINE)
    o(9, 25, 9, 9, f.shirt)
    r(15, 27, 4, 2, shirtShade)
    r(19, 25, 2, 2, shirtShade)
    r(21, 24, 2, 2, f.skin)
    head(p, f, 7, 11, true, crown)
  } else {
    desk(p, 34, f.deskItem, true)
    chair(p)
    o(18, 38, 3, 8, PANTS)
    r(18, 46, 4, 1, OUTLINE)
    o(9, 30, 8, 8, f.shirt)
    o(12, 36, 8, 2, PANTS)
    r(16, 32, 5, 2, shirtShade)
    r(21, 32, 2, 2, f.skin)
    head(p, f, 7, 17, false, crown)
  }
  return p.rects
}

/** An unoccupied seat: lowered desk, closed laptop and an empty chair. */
export function emptyDeskRects(): Rect[] {
  const p = painter()
  desk(p, 34, 'plant', false)
  chair(p)
  return p.rects
}
