// The hand-drawn scene PNGs in sprites/scene/, one import per drawing. Importing them (rather than
// putting them in public/) lets Next read the size and give each file a cache-busting name.
// Adding a drawing: save the PNG in sprites/scene/, import it here and add it to a list.
// Each list is searched top to bottom and the first entry for this month wins, so a one-off
// (Christmas in December) goes above the all-year default.

import type { StaticImageData } from 'next/image'
import type { Seasonal } from '@/lib/scene'
import gresskar from '@/sprites/scene/gresskar.png'
import gresskarLite from '@/sprites/scene/gresskar-lite.png'
import gresskarStort from '@/sprites/scene/gresskar-stort.png'
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

/**
 * Where one copy of a floor prop stands: on the floor of the front desk row, in the gap after desk
 * `after` (0 = the leftmost desk). The rows follow the office, so a spot is tied to a gap rather
 * than a pixel position: it moves with the desks and is skipped when the row is too short to have
 * that gap. Phones have only four desks a row, so they get their own gap (`phoneAfter`; left out =
 * not shown on phones). `scale` is screen pixels per drawn pixel (whole numbers only, so the pixels
 * stay even); phones draw one step smaller, since their gaps are narrower.
 */
export interface FloorSpot {
  after: number
  phoneAfter?: number
  scale: number
  flip?: boolean
}

/** Things standing on the floor between the desks. Unlike the lists above, every prop for the month is shown. */
export interface FloorProp extends Seasonal {
  art: StaticImageData
  spots: FloorSpot[]
}

export const FLOOR_PROPS: FloorProp[] = [
  // Three hand-drawn pumpkins at one scale, so their pixels match; the size difference is in the drawings.
  { art: gresskarStort, months: [10], spots: [{ after: 1, phoneAfter: 1, scale: 2 }, { after: 6, scale: 2, flip: true }] },
  { art: gresskar, months: [10], spots: [{ after: 3, phoneAfter: 0, scale: 2, flip: true }] },
  { art: gresskarLite, months: [10], spots: [{ after: 4, phoneAfter: 2, scale: 2 }] },
]
