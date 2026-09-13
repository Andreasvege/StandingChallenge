import { describe, it, expect } from 'vitest'
import { artNameFromFile, pixelsToRects, rasterize } from './sprite-art'

/** One row of RGBA pixels; null is fully transparent. */
function px(...colours: (string | null)[]): number[] {
  const out: number[] = []
  for (const c of colours) {
    if (!c) out.push(0, 0, 0, 0)
    else {
      const n = parseInt(c.slice(1), 16)
      out.push(n >> 16, (n >> 8) & 255, n & 255, 255)
    }
  }
  return out
}

describe('pixelsToRects', () => {
  it('merges runs of the same colour and skips transparent pixels', () => {
    expect(pixelsToRects(5, 1, px('#ff0000', '#ff0000', null, '#00ff00', '#ff0000'))).toEqual([
      { x: 0, y: 0, w: 2, h: 1, fill: '#ff0000' },
      { x: 3, y: 0, w: 1, h: 1, fill: '#00ff00' },
      { x: 4, y: 0, w: 1, h: 1, fill: '#ff0000' },
    ])
  })
  it('treats mostly transparent pixels as empty', () => {
    const data = px('#ff0000')
    data[3] = 100
    expect(pixelsToRects(1, 1, data)).toEqual([])
  })
  it('ignores pixels identical to the template, so drawing on the template is fine', () => {
    const template = px('#111111', '#222222', null)
    const drawing = px('#111111', '#333333', '#444444')
    expect(pixelsToRects(3, 1, drawing, template)).toEqual([
      { x: 1, y: 0, w: 1, h: 1, fill: '#333333' },
      { x: 2, y: 0, w: 1, h: 1, fill: '#444444' },
    ])
  })
  it('handles several rows', () => {
    expect(pixelsToRects(2, 2, [...px('#ffffff', null), ...px(null, '#ffffff')])).toEqual([
      { x: 0, y: 0, w: 1, h: 1, fill: '#ffffff' },
      { x: 1, y: 1, w: 1, h: 1, fill: '#ffffff' },
    ])
  })
})

describe('rasterize', () => {
  it('paints later rects on top and crops to the box', () => {
    const data = rasterize(
      [
        { x: 0, y: 0, w: 3, h: 1, fill: '#ff0000' },
        { x: 1, y: 0, w: 1, h: 1, fill: '#0000ff' },
      ],
      { x: 1, y: 0, w: 2, h: 1 },
    )
    expect(pixelsToRects(2, 1, data)).toEqual([
      { x: 0, y: 0, w: 1, h: 1, fill: '#0000ff' },
      { x: 1, y: 0, w: 1, h: 1, fill: '#ff0000' },
    ])
  })
})

describe('artNameFromFile', () => {
  it('turns file names into ids and Norwegian labels', () => {
    expect(artNameFromFile('katt.png')).toEqual({ id: 'katt', label: 'Katt' })
    expect(artNameFromFile('Rosa lue.PNG')).toEqual({ id: 'rosa-lue', label: 'Rosa lue' })
    expect(artNameFromFile('øre_dobber.png')).toEqual({ id: 'øre-dobber', label: 'Øre dobber' })
  })
  it('rejects names that are not simple words', () => {
    expect(artNameFromFile('.DS_Store')).toBeNull()
    expect(artNameFromFile('hei!.png')).toBeNull()
  })
})
