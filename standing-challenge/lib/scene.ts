// Hand-drawn scene art: plain PNGs from sprites/scene/, shown as they are (no conversion script).
// The list of drawings lives in components/office/scene-art.ts, because a PNG import only works
// inside the Next build; the rules for picking one live here so they can be tested.

/** Scene props (pumpkins, leaf piles …) are drawn at the same scale as the figures: 1 drawn pixel = 3 screen pixels. */
export const SCENE_SCALE = 3

/** A drawing that is only shown in some months, e.g. autumn trees in September–November. */
export interface Seasonal {
  /** 1–12 (January = 1), in Oslo time. */
  months: readonly number[]
}

export const ALL_YEAR: readonly number[] = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]

/** The first drawing that belongs to this month – or none, and the room looks as it always has. */
export function forMonth<T extends Seasonal>(list: readonly T[], month: number): T | undefined {
  return list.find(item => item.months.includes(month))
}

/**
 * Size on screen of one frame of a sprite strip: animations are drawn as frames side by side
 * in one PNG, so a 3-frame 16×16 flame is a 48×16 file.
 */
export function frameSize(width: number, height: number, frames: number, scale = SCENE_SCALE): { w: number; h: number } {
  if (!Number.isInteger(frames) || frames < 1 || width % frames !== 0) {
    throw new Error(`A ${width}px wide strip can't be split into ${frames} equal frames`)
  }
  return { w: (width / frames) * scale, h: height * scale }
}

/** CSS for a tile repeated over the wall or the floor, scaled like everything else in the room. */
export function tileStyle(tile: { src: string; width: number; height: number } | undefined, scale = SCENE_SCALE) {
  if (!tile) return undefined
  return {
    backgroundImage: `url(${tile.src})`,
    backgroundSize: `${tile.width * scale}px ${tile.height * scale}px`,
    backgroundRepeat: 'repeat',
    imageRendering: 'pixelated',
  } as const
}

/** One leaf blowing past the window: a 2×1 pixel at `x, y` (window viewBox), looping every `duration` s. */
export interface FallingLeaf {
  x: number
  y: number
  color: string
  duration: number
  /** How far into its fall it starts, so the leaves don't all set off together. */
  offset: number
}

const LEAF_COLORS = ['#f78e00', '#f76200', '#f7af00', '#d2401c'] as const

/**
 * A handful of leaves drifting down and sideways past one window. A fixed pseudo-random sequence
 * (seeded per side) rather than Math.random, so polling and re-rendering never reshuffle them and
 * the two windows don't show the same leaves.
 */
export function fallingLeaves(side: 'left' | 'right', count = 5): FallingLeaf[] {
  let seed = side === 'left' ? 11 : 23
  const rand = () => {
    seed = (seed * 16807) % 2147483647
    return (seed - 1) / 2147483646
  }
  return Array.from({ length: count }, (_, i) => {
    const duration = Math.round((6 + rand() * 3) * 100) / 100
    return {
      // The leaves blow 6px to the right on the way down, so they start a little to the left.
      x: Math.floor(rand() * 56),
      y: 2 + Math.floor(rand() * 30),
      color: LEAF_COLORS[i % LEAF_COLORS.length],
      duration,
      offset: Math.round(rand() * duration * 100) / 100,
    }
  })
}
