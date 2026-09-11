// A pixel figure's look. Colours come from fixed palettes so every figure fits the scene.
// The same keys are used in data/employees.json (exported from the figure-builder prototype).

export const HAIR_STYLES = ['short', 'buzz', 'long', 'bun', 'curly'] as const
export type HairStyle = (typeof HAIR_STYLES)[number]

export const EYEWEAR = ['none', 'glasses', 'sunglasses'] as const
export type Eyewear = (typeof EYEWEAR)[number]

export const BEARDS = ['none', 'stubble', 'full'] as const
export type Beard = (typeof BEARDS)[number]

export const DESK_ITEMS = ['mug', 'plant'] as const
export type DeskItem = (typeof DESK_ITEMS)[number]

export const HAIR_COLORS = [
  '#1f1a2e', '#2b2140', '#3a2a1e', '#4a2e1c', '#5a3a22', '#6b4a2e', '#7a4a2a', '#8a3b2a', '#c2452d',
  '#d9a24a', '#e7b04a', '#e6c07a', '#f0d58a', '#bfa27a', '#9a9aa8', '#ff8fb1', '#6fb8ff',
] as const

export const SKIN_COLORS = ['#f6d0b0', '#f6c7a1', '#e8b48c', '#c98e62', '#8d5a3b', '#5e3a26'] as const

export const SHIRT_COLORS = [
  '#8fb8ff', '#6fb8ff', '#a3b4ff', '#c7a4ff', '#d9a4ff', '#ff7ab0', '#ff8fa3', '#ff9fc4', '#ff9f6b',
  '#ffa26b', '#ffb86b', '#ffd166', '#9ad17a', '#7fd49a', '#8fd694', '#6fd3d0', '#fff3dc', '#3d3a5c',
] as const

export interface Figure {
  hairStyle: HairStyle
  hair: string
  skin: string
  shirt: string
  eyewear: Eyewear
  beard: Beard
  mustache: boolean
  deskItem: DeskItem
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
    oneOf(DESK_ITEMS, f.deskItem)
  )
}

/** Same odds as the figure-builder prototype's 🎲 button. */
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
    eyewear: e < 0.22 ? 'glasses' : e < 0.28 ? 'sunglasses' : 'none',
    beard: b < 0.12 ? 'stubble' : b < 0.22 ? 'full' : 'none',
    mustache: rand() < 0.12,
    deskItem: pick(DESK_ITEMS),
  }
}
