// The hand-drawn scene PNGs in sprites/scene/, one import per drawing. Importing them (rather than
// putting them in public/) lets Next read the size and give each file a cache-busting name.
// Adding a drawing: save the PNG in sprites/scene/, import it here and add it to a list.
// Each list is searched top to bottom and the first entry for this month wins, so a one-off
// (Christmas in December) goes above the all-year default.

import type { StaticImageData } from 'next/image'
import type { Seasonal } from '@/lib/scene'
import gresskar from '@/sprites/scene/gresskar.png'
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
 * Where one copy of a windowsill prop stands: on the sill of the left or right window, `x` percent
 * in from the window's left edge, `scale` screen pixels per drawn pixel (whole numbers only, so the
 * pixels stay even) and optionally mirrored. The sill moves and shrinks with the window, so props
 * there never run into a desk, however wide the room or however many rows it has.
 */
export interface SillSpot {
  window: 'left' | 'right'
  x: number
  scale: number
  flip?: boolean
}

/** Things standing on the windowsills. Unlike the lists above, every prop for the month is shown. */
export interface SillProp extends Seasonal {
  art: StaticImageData
  spots: SillSpot[]
}

export const SILL_PROPS: SillProp[] = [
  {
    art: gresskar,
    months: [10],
    // In the gaps between the autumn trees (høsttrær.png), so the pumpkins don't hide them.
    spots: [
      { window: 'left', x: 10, scale: 3 },
      { window: 'left', x: 66, scale: 2, flip: true },
      { window: 'right', x: 13, scale: 2 },
      { window: 'right', x: 66, scale: 3, flip: true },
    ],
  },
]
