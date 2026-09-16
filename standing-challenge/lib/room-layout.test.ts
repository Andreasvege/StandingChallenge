import { describe, it, expect } from 'vitest'
import { DESKTOP_MAX_PER_ROW, MOBILE_MAX_PER_ROW, ROOM_LAYERS, balancedRows, roomMetrics, rowStyles, rowZIndex, seatRowName } from './room-layout'

const sizes = (rows: number[][]) => rows.map(r => r.length)

describe('balancedRows', () => {
  it('splits the desks into rows of roughly equal size', () => {
    expect(sizes(balancedRows(17, DESKTOP_MAX_PER_ROW))).toEqual([9, 8])
    expect(sizes(balancedRows(17, MOBILE_MAX_PER_ROW))).toEqual([4, 4, 3, 3, 3])
    expect(sizes(balancedRows(24, DESKTOP_MAX_PER_ROW))).toEqual([8, 8, 8])
    expect(sizes(balancedRows(16, DESKTOP_MAX_PER_ROW))).toEqual([8, 8])
  })
  it('numbers the seats from the front row and leaves none out', () => {
    const rows = balancedRows(17, DESKTOP_MAX_PER_ROW)
    expect(rows[0][0]).toBe(0)
    expect(rows.flat()).toEqual(Array.from({ length: 17 }, (_, i) => i))
  })
  it('keeps a single row while the office is small, and handles an empty office', () => {
    expect(sizes(balancedRows(3, DESKTOP_MAX_PER_ROW))).toEqual([3])
    expect(balancedRows(0, DESKTOP_MAX_PER_ROW)).toEqual([])
  })
  it('never puts more than the maximum in a row', () => {
    for (let seats = 1; seats <= 40; seats++) {
      expect(Math.max(...sizes(balancedRows(seats, DESKTOP_MAX_PER_ROW)))).toBeLessThanOrEqual(DESKTOP_MAX_PER_ROW)
      expect(Math.max(...sizes(balancedRows(seats, MOBILE_MAX_PER_ROW)))).toBeLessThanOrEqual(MOBILE_MAX_PER_ROW)
    }
  })
})

describe('rowStyles', () => {
  it('keeps the front row full size and shrinks and lifts the rows behind', () => {
    const rows = rowStyles(3, 'desktop')
    expect(rows).toHaveLength(3)
    expect(rows[0]).toMatchObject({ scale: 3, bottom: 14 })
    for (let i = 1; i < rows.length; i++) {
      expect(rows[i].scale).toBeLessThan(rows[i - 1].scale)
      expect(rows[i].bottom).toBeGreaterThan(rows[i - 1].bottom)
    }
  })
  it('staggers the rows sideways', () => {
    const rows = rowStyles(2, 'mobile')
    expect(rows[0].inset).toEqual([0, 0])
    expect(rows[1].inset).not.toEqual([0, 0])
  })
})

describe('roomMetrics', () => {
  it('grows the room and the floor as rows are added', () => {
    const two = roomMetrics(rowStyles(2, 'desktop'), 'desktop')
    const three = roomMetrics(rowStyles(3, 'desktop'), 'desktop')
    expect(three.height).toBeGreaterThan(two.height)
    expect(three.floor).toBeGreaterThan(two.floor)
  })
  it('adds wall for colleagues on video screens, without moving the floor', () => {
    const rows = rowStyles(2, 'desktop')
    const plain = roomMetrics(rows, 'desktop')
    const withScreens = roomMetrics(rows, 'desktop', 2)
    expect(withScreens.height).toBeGreaterThan(plain.height)
    expect(withScreens.floor).toBe(plain.floor)
  })
  it('leaves the back row standing on the floor, with wall left above it', () => {
    for (const layout of ['desktop', 'mobile'] as const) {
      for (const rowCount of [1, 2, 3, 5]) {
        const rows = rowStyles(rowCount, layout)
        const { height, floor } = roomMetrics(rows, layout)
        const back = rows[rows.length - 1]
        expect(floor).toBeGreaterThan(back.bottom)
        expect(height).toBeGreaterThan(floor + 48 * back.scale)
      }
    }
  })
})

describe('seatRowName', () => {
  it('names the row a desk sits in', () => {
    const two = balancedRows(17, DESKTOP_MAX_PER_ROW)
    expect(seatRowName(0, two)).toBe('fremste rad')
    expect(seatRowName(16, two)).toBe('bakerste rad')
    const three = balancedRows(24, DESKTOP_MAX_PER_ROW)
    expect(seatRowName(10, three)).toBe('midterste rad')
    const many = balancedRows(17, MOBILE_MAX_PER_ROW)
    expect(seatRowName(5, many)).toBe('rad 2 forfra')
    expect(seatRowName(99, two)).toBe('uten plass')
  })
})

describe('rowZIndex', () => {
  it('keeps the desk rows behind the wall props, the front row nearest', () => {
    expect(rowZIndex(0, false)).toBe(ROOM_LAYERS.frontRow)
    expect(rowZIndex(1, false)).toBe(ROOM_LAYERS.frontRow - 1)
    expect(rowZIndex(0, false)).toBeLessThan(ROOM_LAYERS.poster)
  })

  // A row is a stacking context, so the menu's own z-index cannot leave it: the row has to rise.
  it('lifts the row holding an open menu above the noticeboard and the wall screens', () => {
    for (const depth of [0, 1, 4]) {
      expect(rowZIndex(depth, true)).toBeGreaterThan(ROOM_LAYERS.poster)
      expect(rowZIndex(depth, true)).toBeGreaterThan(ROOM_LAYERS.screens)
    }
  })
})
