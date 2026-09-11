// How the 16 seats are arranged in the pixel room. Seat 0–7 = front row on desktop.

export const SEAT_COUNT = 16

/** Seat numbers grouped into rows, front row first. */
export function seatRows(total: number, perRow: number): number[][] {
  const rows: number[][] = []
  for (let start = 0; start < total; start += perRow) {
    rows.push(Array.from({ length: Math.min(perRow, total - start) }, (_, i) => start + i))
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

export const DESKTOP_ROWS: RowStyle[] = [
  { scale: 3, bottom: 14, inset: [0, 0] },
  { scale: 2.5, bottom: 148, inset: [8, 2] },
]

export const MOBILE_ROWS: RowStyle[] = [
  { scale: 2, bottom: 10, inset: [0, 0] },
  { scale: 1.75, bottom: 118, inset: [6, 0] },
  { scale: 1.5, bottom: 212, inset: [2, 4] },
  { scale: 1.25, bottom: 294, inset: [8, 0] },
]
