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
