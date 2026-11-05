// A pixel figure's look. Colours come from fixed palettes so every figure fits the scene.
// The same keys are used in data/employees.json (exported from the figure-builder prototype).
// Hand-drawn extras (sprites/hode/, sprites/pult/) arrive through lib/sprite-art.generated.ts.

import { DESK_ART, HEAD_ART } from './sprite-art.generated'

export const HAIR_STYLES = ['short', 'buzz', 'long', 'bun', 'curly'] as const
export type HairStyle = (typeof HAIR_STYLES)[number]

/** 'sunglasses' is the wayfarer: the id predates the other two, so saved figures keep it. */
export const EYEWEAR = ['none', 'glasses', 'sunglasses', 'aviators', 'sport'] as const
export type Eyewear = (typeof EYEWEAR)[number]

export const BEARDS = ['none', 'stubble', 'full'] as const
export type Beard = (typeof BEARDS)[number]

/** Desk items drawn in code; the hand-drawn ones from sprites/pult/ come after them. */
export const BUILTIN_DESK_ITEMS = ['mug', 'plant'] as const
export const DESK_ITEMS: readonly string[] = [...BUILTIN_DESK_ITEMS, ...DESK_ART.map(a => a.id)]
export type DeskItem = string

/** 'none' plus the hand-drawn head art from sprites/hode/. */
export const HEADWEAR: readonly string[] = ['none', ...HEAD_ART.map(a => a.id)]
export type Headwear = string

// Palettes only ever grow: saved figures point at these exact values, so removing one breaks them.
export const HAIR_COLORS = [
  '#1f1a2e', '#2b2140', '#3a2a1e', '#4a2e1c', '#5a3a22', '#6b4a2e', '#7a4a2a', '#8a3b2a', '#c2452d',
  '#d9a24a', '#e7b04a', '#e6c07a', '#f0d58a', '#bfa27a', '#9a9aa8', '#ff8fb1', '#6fb8ff',
  '#d8d4e3', '#f4f1ea', '#b06a3b', '#e0703a', '#9b6fe0', '#5fcf9a', '#3a5fd9',
] as const

export const SKIN_COLORS = [
  '#fbe2cc', '#f6d0b0', '#f6c7a1', '#e8b48c', '#d9a074', '#c98e62', '#a8714a', '#8d5a3b', '#6e4530', '#5e3a26', '#432a1d',
] as const

export const SHIRT_COLORS = [
  '#8fb8ff', '#6fb8ff', '#a3b4ff', '#c7a4ff', '#d9a4ff', '#ff7ab0', '#ff8fa3', '#ff9fc4', '#ff9f6b',
  '#ffa26b', '#ffb86b', '#ffd166', '#9ad17a', '#7fd49a', '#8fd694', '#6fd3d0', '#fff3dc', '#3d3a5c',
  // Darker and quieter tones: real office clothes, not only candy colours.
  '#f4f1ea', '#c9c6d4', '#8a879c', '#57546b', '#2e2b3d', '#2c3e66', '#4a6aa8', '#2a7a7a', '#2f5e46',
  '#6b7a3a', '#c9a227', '#d6b98c', '#a0704a', '#6b4430', '#7a2e3b', '#c2404f', '#5c3d7a',
] as const

/** What is worn on top. 'sweater' is the original plain jumper; the others have a second colour, `under`. */
export const TOPS = ['sweater', 'hoodie', 'cardigan', 'blazer'] as const
export type Top = (typeof TOPS)[number]
/** Tops that open at the front and show the garment underneath. */
export const OPEN_TOPS: readonly Top[] = ['cardigan', 'blazer']
export const DEFAULT_UNDER = '#f4f1ea'

export interface Figure {
  hairStyle: HairStyle
  hair: string
  skin: string
  shirt: string
  eyewear: Eyewear
  beard: Beard
  mustache: boolean
  deskItem: DeskItem
  /** Hand-drawn head art. Optional: figures saved before head art existed have none (= 'none'). */
  headwear?: Headwear
  /** Optional like headwear: figures saved before tops existed wear the plain 'sweater'. */
  top?: Top
  /** The garment under an open top (cardigan, blazer), from SHIRT_COLORS. */
  under?: string
}

export const DEFAULT_FIGURE: Figure = {
  hairStyle: 'short',
  hair: '#4a2e1c',
  skin: '#f6c7a1',
  shirt: '#8fb8ff',
  eyewear: 'none',
  beard: 'none',
  mustache: false,
  deskItem: 'mug',
}

function oneOf(list: readonly string[], value: unknown): boolean {
  return typeof value === 'string' && list.includes(value)
}

export function isFigure(value: unknown): value is Figure {
  if (!value || typeof value !== 'object') return false
  const f = value as Record<string, unknown>
  return (
    oneOf(HAIR_STYLES, f.hairStyle) &&
    oneOf(HAIR_COLORS, f.hair) &&
    oneOf(SKIN_COLORS, f.skin) &&
    oneOf(SHIRT_COLORS, f.shirt) &&
    oneOf(EYEWEAR, f.eyewear) &&
    oneOf(BEARDS, f.beard) &&
    typeof f.mustache === 'boolean' &&
    oneOf(DESK_ITEMS, f.deskItem) &&
    (f.headwear === undefined || oneOf(HEADWEAR, f.headwear)) &&
    (f.top === undefined || oneOf(TOPS, f.top)) &&
    (f.under === undefined || oneOf(SHIRT_COLORS, f.under))
  )
}

/** Same odds as the figure-builder prototype's 🎲 button, plus a small chance of head art. */
export function randomFigure(rand: () => number = Math.random): Figure {
  function pick<T>(list: readonly T[]): T {
    return list[Math.min(list.length - 1, Math.floor(rand() * list.length))]
  }
  const e = rand()
  const b = rand()
  return {
    hairStyle: pick(HAIR_STYLES),
    hair: pick(HAIR_COLORS),
    skin: pick(SKIN_COLORS),
    shirt: pick(SHIRT_COLORS),
    eyewear: e < 0.22 ? 'glasses' : e < 0.26 ? 'sunglasses' : e < 0.28 ? 'aviators' : e < 0.3 ? 'sport' : 'none',
    beard: b < 0.12 ? 'stubble' : b < 0.22 ? 'full' : 'none',
    mustache: rand() < 0.12,
    deskItem: pick(DESK_ITEMS),
    headwear: HEAD_ART.length > 0 && rand() < 0.15 ? pick(HEAD_ART).id : 'none',
    top: pick(TOPS),
    under: pick(SHIRT_COLORS),
  }
}
