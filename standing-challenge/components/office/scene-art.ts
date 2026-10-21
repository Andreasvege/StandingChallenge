// The hand-drawn scene PNGs in sprites/scene/, one import per drawing. Importing them (rather than
// putting them in public/) lets Next read the size and give each file a cache-busting name.
// Adding a drawing: save the PNG in sprites/scene/, import it here and add it to a list.
// Each list is searched top to bottom and the first entry for this month wins, so a one-off
// (Christmas in December) goes above the all-year default.

import type { StaticImageData } from 'next/image'
import type { Seasonal } from '@/lib/scene'
import høsttrær from '@/sprites/scene/høsttrær.png'

/**
 * What is seen through the windows, drawn over the sky and city: 60×32 with a transparent
 * background. `right` defaults to `left`, so one drawing can serve both windows.
 */
export interface WindowView extends Seasonal {
  left: StaticImageData
  right?: StaticImageData
}

/** A tile repeated across the wall or the floor in place of the built-in colours. */
export interface Tile extends Seasonal {
  art: StaticImageData
}

export const WINDOW_VIEWS: WindowView[] = [
  // Orange trees in front of the city, drawn on vindu-mal.png; the same drawing serves both windows.
  { left: høsttrær, months: [9, 10, 11] },
]

export const WALL_TILES: Tile[] = [
  // { art: vegg, months: ALL_YEAR },  ← ALL_YEAR from '@/lib/scene'
]

export const FLOOR_TILES: Tile[] = []
