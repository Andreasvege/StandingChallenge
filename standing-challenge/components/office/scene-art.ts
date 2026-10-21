// The hand-drawn scene PNGs in sprites/scene/, one import per drawing. Importing them (rather than
// putting them in public/) lets Next read the size and give each file a cache-busting name.
// Adding a drawing: save the PNG in sprites/scene/, import it here and add it to a list.
// Each list is searched top to bottom and the first entry for this month wins, so a one-off
// (Christmas in December) goes above the all-year default.

import type { StaticImageData } from 'next/image'
import type { Seasonal } from '@/lib/scene'
import gresskar from '@/sprites/scene/gresskar.png'
import gresskarStort from '@/sprites/scene/gresskar-stort.png'
import høsttrær from '@/sprites/scene/høsttrær.png'
import lykt from '@/sprites/scene/lykt.png'
import lyktTent from '@/sprites/scene/lykt-tent.png'
import løv1 from '@/sprites/scene/løv-1.png'
import løv2 from '@/sprites/scene/løv-2.png'

/**
 * What is seen through the windows, drawn over the sky and city: 60×32 with a transparent
 * background. `right` defaults to `left`, so one drawing can serve both windows. `city: false`
 * leaves the buildings out, for a drawing that fills the view on its own.
 */
export interface WindowView extends Seasonal {
  left: StaticImageData
  right?: StaticImageData
  city?: boolean
  /** Leaves blowing past the glass. */
  leaves?: boolean
}

/** A tile repeated across the wall or the floor in place of the built-in colours. */
export interface Tile extends Seasonal {
  art: StaticImageData
}

export const WINDOW_VIEWS: WindowView[] = [
  // Big orange trees and no city: the tree pixels of Andreas' Vindumedtre3.png, the sky left to the
  // code so it still follows the time of day and the weather. The same drawing serves both windows.
  { left: høsttrær, months: [9, 10, 11], city: false, leaves: true },
]

export const WALL_TILES: Tile[] = [
  // { art: vegg, months: ALL_YEAR },  ← ALL_YEAR from '@/lib/scene'
]

export const FLOOR_TILES: Tile[] = []

/**
 * Where one copy of a floor prop stands: in desk row `row` (0 = the front row), in the gap after
 * desk `after` (0 = the leftmost desk). The rows follow the office, so a spot is tied to a gap
 * rather than a pixel position: it moves with the desks and is skipped when the room has no such
 * gap. Phones have only four desks a row, so they get their own spot (`phone`; left out = not shown
 * on phones). `scale` is screen pixels per drawn pixel (whole numbers only, so the pixels stay even);
 * phones draw one step smaller, since their gaps are narrower.
 */
export interface FloorSpot {
  row: number
  after: number
  phone?: { row: number; after: number }
  scale: number
  flip?: boolean
}

/**
 * Things standing on the floor between the desks. Unlike the lists above, every prop for the month
 * is shown. `lit` is shown instead of `art` once it is dark outside, with a soft glow round it.
 */
export interface FloorProp extends Seasonal {
  art: StaticImageData
  lit?: StaticImageData
  spots: FloorSpot[]
}

export const FLOOR_PROPS: FloorProp[] = [
  // Andreas' FinalPumpkins1/2.png, all at one scale so their pixels match; the size difference is in
  // the drawings. Big ones by the front desks, small ones further back, which also reads as depth.
  {
    art: gresskarStort,
    months: [10],
    spots: [
      { row: 0, after: 1, phone: { row: 0, after: 1 }, scale: 2 },
      { row: 0, after: 6, scale: 2, flip: true },
    ],
  },
  {
    art: gresskar,
    months: [10],
    spots: [
      { row: 1, after: 1, phone: { row: 1, after: 1 }, scale: 2, flip: true },
      { row: 0, after: 3, phone: { row: 3, after: 0 }, scale: 2 },
    ],
  },
  // Fallen leaves, in the trees' colours plus a red and a yellow; flat, so they lie right at the feet.
  {
    art: løv1,
    months: [9, 10, 11],
    spots: [
      { row: 0, after: 2, phone: { row: 1, after: 0 }, scale: 2 },
      { row: 1, after: 3, phone: { row: 3, after: 1 }, scale: 2, flip: true },
    ],
  },
  {
    art: løv2,
    months: [9, 10, 11],
    spots: [
      { row: 0, after: 5, phone: { row: 0, after: 0 }, scale: 2 },
      { row: 1, after: 4, phone: { row: 2, after: 1 }, scale: 2, flip: true },
    ],
  },
  // The jack-o'-lanterns: by day Andreas' newer face; from sunset (the hours the city's windows used
  // to light up) his older lit drawing, glowing.
  {
    art: lykt,
    lit: lyktTent,
    months: [10],
    spots: [
      { row: 0, after: 4, phone: { row: 0, after: 2 }, scale: 2 },
      { row: 1, after: 2, phone: { row: 2, after: 2 }, scale: 2, flip: true },
      { row: 1, after: 5, scale: 2 },
    ],
  },
]
