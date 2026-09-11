import { describe, it, expect } from 'vitest'
import { DESKTOP_ROWS, MOBILE_ROWS, SEAT_COUNT, seatRows } from './room-layout'

describe('seatRows', () => {
  it('makes two rows of eight on desktop', () => {
    expect(seatRows(SEAT_COUNT, 8)).toEqual([[0, 1, 2, 3, 4, 5, 6, 7], [8, 9, 10, 11, 12, 13, 14, 15]])
  })
  it('makes four rows of four on mobile', () => {
    const rows = seatRows(SEAT_COUNT, 4)
    expect(rows).toHaveLength(4)
    expect(rows[3]).toEqual([12, 13, 14, 15])
  })
  it('leaves a short last row when seats do not divide evenly', () => {
    expect(seatRows(10, 4)).toEqual([[0, 1, 2, 3], [4, 5, 6, 7], [8, 9]])
  })
})

describe('row styles', () => {
  it('has one style per row in each layout', () => {
    expect(DESKTOP_ROWS).toHaveLength(seatRows(SEAT_COUNT, 8).length)
    expect(MOBILE_ROWS).toHaveLength(seatRows(SEAT_COUNT, 4).length)
  })
  it('shrinks and lifts rows further back', () => {
    for (const rows of [DESKTOP_ROWS, MOBILE_ROWS]) {
      for (let i = 1; i < rows.length; i++) {
        expect(rows[i].scale).toBeLessThan(rows[i - 1].scale)
        expect(rows[i].bottom).toBeGreaterThan(rows[i - 1].bottom)
      }
    }
  })
})
