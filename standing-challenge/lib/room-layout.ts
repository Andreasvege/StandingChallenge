// How the desks are arranged in the pixel room. The room follows the office: the number of desks is
// the number of seated colleagues, split into balanced rows, so it never looks half empty.
// Row geometry is derived here and handed to the CSS as custom properties.

import { DEFAULT_LANG, t, type Lang } from './i18n'

/** Upper bound for a seat number (admin and import validation). */
export const MAX_SEATS = 24
export const DESKTOP_MAX_PER_ROW = 9
export const MOBILE_MAX_PER_ROW = 4

/**
 * Seat numbers split into rows of roughly equal size, front row first:
 * 17 desks on desktop → [9, 8], on a phone → [4, 4, 3, 3, 3].
 */
export function balancedRows(seats: number, maxPerRow: number): number[][] {
  if (seats <= 0) return []
  const rowCount = Math.ceil(seats / maxPerRow)
  const rows: number[][] = []
  let next = 0
  for (let i = 0; i < rowCount; i++) {
    const size = Math.ceil((seats - next) / (rowCount - i))
    rows.push(Array.from({ length: size }, (_, j) => next + j))
    next += size
  }
  return rows
}

export interface RowStyle {
  /** Pixel scale of the sprites in this row (front rows are bigger). */
  scale: number
  /** Distance in px from the bottom of the room to the row's feet. */
  bottom: number
  /** Left/right inset in % — staggers rows so faces behind stay visible. */
  inset: [number, number]
}

export type Layout = 'desktop' | 'mobile'

const BASE: Record<Layout, { scale: number; bottom: number; step: number; shrink: number }> = {
  desktop: { scale: 3, bottom: 14, step: 136, shrink: 0.84 },
  mobile: { scale: 2, bottom: 10, step: 108, shrink: 0.88 },
}
/** Rows further back are nudged sideways so nobody hides behind the row in front. */
const INSETS: [number, number][] = [
  [0, 0],
  [8, 2],
  [12, 0],
  [3, 5],
  [9, 0],
  [2, 6],
]

/** One style per row, shrinking and lifting toward the back wall. */
export function rowStyles(rowCount: number, layout: Layout): RowStyle[] {
  const base = BASE[layout]
  const rows: RowStyle[] = []
  let bottom = base.bottom
  let scale = base.scale
  let step = base.step
  for (let i = 0; i < rowCount; i++) {
    rows.push({ scale: Math.round(scale * 100) / 100, bottom: Math.round(bottom), inset: INSETS[i % INSETS.length] })
    bottom += step
    step *= base.shrink
    scale *= base.shrink
  }
  return rows
}

/**
 * Stacking order inside the room. The desk rows sit *under* the wall props, so the noticeboard's
 * fact panel can open out over the desks instead of behind them. That is also the trap: a row with
 * a z-index is a stacking context, so the heiarop menu inside it cannot rise past the row on its
 * own — whatever holds the open menu has to be lifted itself.
 */
export const ROOM_LAYERS = {
  /** The front desk row. Rows further back count down from here. */
  frontRow: 20,
  /** Colleagues working elsewhere, hanging on the wall as video screens. */
  screens: 25,
  /** The fun-facts noticeboard and the panel it opens. */
  poster: 26,
  /** The row or wall-screen strip holding the open menu — above every wall prop. */
  openMenu: 40,
} as const

/** z-index for a desk row: behind the wall props, unless it is the one holding the open menu. */
export function rowZIndex(depth: number, hasOpenMenu: boolean): number {
  return hasOpenMenu ? ROOM_LAYERS.openMenu : ROOM_LAYERS.frontRow - depth
}

export interface RoomMetrics {
  /** Room height in px. */
  height: number
  /** Floor height in px, measured from the bottom of the room. */
  floor: number
}

/**
 * Room and floor heights that fit the back row, with wall left over for windows and the clock —
 * plus a little more when colleagues elsewhere hang on the wall as video screens.
 */
export function roomMetrics(rows: RowStyle[], layout: Layout, screens = 0): RoomMetrics {
  const base = BASE[layout]
  const back = rows[rows.length - 1] ?? { scale: base.scale, bottom: base.bottom }
  const headroom = layout === 'desktop' ? 34 : 26
  const wall = layout === 'desktop' ? 152 : 120
  const behindFeet = layout === 'desktop' ? 46 : 34
  const screenWall = screens > 0 ? (layout === 'desktop' ? 96 : 78) : 0
  return {
    height: Math.round(back.bottom + 48 * back.scale + headroom + wall + screenWall),
    floor: Math.round(back.bottom + behindFeet),
  }
}

/** «fremste rad», «midterste rad», «bakerste rad» — or «rad 2 forfra» when there are many rows. */
export function seatRowName(seat: number, rows: number[][], lang: Lang = DEFAULT_LANG): string {
  const i = rows.findIndex(r => r.includes(seat))
  if (i < 0) return t(lang, 'seat.row.none')
  if (i === 0) return t(lang, 'seat.row.front')
  if (i === rows.length - 1) return t(lang, 'seat.row.back')
  if (rows.length === 3) return t(lang, 'seat.row.middle')
  return t(lang, 'seat.row.nth', { number: i + 1 })
}
