// How the seats are arranged in the pixel room. Seats fill up front row first: 0–7 front,
// 8–15 middle, 16–23 back (desktop). The numbers here go with the room height in
// components/office/OfficeRoom.module.css — change them together.

export const SEAT_COUNT = 24

/** Seat numbers grouped into rows, front row first. */
export function seatRows(total: number, perRow: number): number[][] {
  const rows: number[][] = []
  for (let start = 0; start < total; start += perRow) {
    rows.push(Array.from({ length: Math.min(perRow, total - start) }, (_, i) => start + i))
  }
  return rows
}

const ROW_NAMES = ['fremste', 'midterste', 'bakerste']

/** «fremste rad», «midterste rad» … for the row a seat sits in (rows of eight, front first). */
export function seatRowName(seat: number, perRow = 8): string {
  return `${ROW_NAMES[Math.floor(seat / perRow)] ?? ROW_NAMES[ROW_NAMES.length - 1]} rad`
}

export interface RowStyle {
  /** Pixel scale of the sprites in this row (front rows are bigger). */
  scale: number
  /** Distance in px from the bottom of the room to the row's feet. */
  bottom: number
  /** Left/right inset in % — staggers rows so faces behind stay visible. */
  inset: [number, number]
}

/** Three rows of eight; the left edge stays clear of the plant shelf. */
export const DESKTOP_ROWS: RowStyle[] = [
  { scale: 3, bottom: 14, inset: [0, 0] },
  { scale: 2.5, bottom: 150, inset: [8, 2] },
  { scale: 2.1, bottom: 272, inset: [12, 0] },
]

/** Six rows of four on phones. */
export const MOBILE_ROWS: RowStyle[] = [
  { scale: 2, bottom: 10, inset: [0, 0] },
  { scale: 1.75, bottom: 118, inset: [6, 0] },
  { scale: 1.5, bottom: 212, inset: [2, 4] },
  { scale: 1.25, bottom: 294, inset: [8, 0] },
  { scale: 1.15, bottom: 366, inset: [3, 5] },
  { scale: 1.05, bottom: 430, inset: [9, 0] },
]
