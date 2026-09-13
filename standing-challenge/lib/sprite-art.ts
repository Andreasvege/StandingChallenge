// Hand-drawn pixel art (sprites/*.png) turned into rects. scripts/build-sprites.ts reads the PNGs
// and writes lib/sprite-art.generated.ts; the pure pieces live here so they can be unit-tested.

import type { Rect } from './sprite'

export interface ArtPiece {
  id: string
  label: string
  /** Rects relative to the top-left of the art's canvas. */
  rects: Rect[]
}

/** Head art is drawn on a 26×22 canvas whose top-left sits 6 px left of and 8 px above the face's top-left. */
export const HEAD_CANVAS = { w: 26, h: 22, dx: -6, dy: -8 } as const
/** Desk art is drawn on an 18×12 canvas spanning the desk's width and ending just above the desk top. */
export const DESK_CANVAS = { w: 18, h: 12, x: 20, dy: -12 } as const

const hex2 = (n: number) => n.toString(16).padStart(2, '0')

/**
 * RGBA pixels → rects, one per run of equal colour in a row. Pixels with alpha below 128 are empty.
 * With a template, pixels identical to the template are ignored too, so artists can draw straight on it.
 */
export function pixelsToRects(width: number, height: number, data: ArrayLike<number>, template?: ArrayLike<number>): Rect[] {
  const colourAt = (i: number): string | null => {
    const o = i * 4
    if (data[o + 3] < 128) return null
    if (template && [0, 1, 2, 3].every(c => template[o + c] === data[o + c])) return null
    return '#' + hex2(data[o]) + hex2(data[o + 1]) + hex2(data[o + 2])
  }
  const rects: Rect[] = []
  for (let y = 0; y < height; y++) {
    let x = 0
    while (x < width) {
      const fill = colourAt(y * width + x)
      if (!fill) {
        x++
        continue
      }
      let end = x + 1
      while (end < width && colourAt(y * width + end) === fill) end++
      rects.push({ x, y, w: end - x, h: 1, fill })
      x = end
    }
  }
  return rects
}

/** Paint rects (later ones on top) into an opaque-where-painted RGBA buffer covering `box`. */
export function rasterize(rects: Rect[], box: { x: number; y: number; w: number; h: number }): Uint8Array {
  const out = new Uint8Array(box.w * box.h * 4)
  for (const r of rects) {
    const n = parseInt(r.fill.slice(1), 16)
    for (let y = Math.max(r.y, box.y); y < Math.min(r.y + r.h, box.y + box.h); y++) {
      for (let x = Math.max(r.x, box.x); x < Math.min(r.x + r.w, box.x + box.w); x++) {
        const o = ((y - box.y) * box.w + (x - box.x)) * 4
        out[o] = n >> 16
        out[o + 1] = (n >> 8) & 255
        out[o + 2] = n & 255
        out[o + 3] = 255
      }
    }
  }
  return out
}

/** 'rosa lue.png' → { id: 'rosa-lue', label: 'Rosa lue' }; null for names that aren't simple words. */
export function artNameFromFile(file: string): { id: string; label: string } | null {
  const base = file.replace(/\.png$/i, '').trim().toLowerCase()
  if (!/^[a-z0-9æøå][a-z0-9æøå _-]*$/.test(base)) return null
  const id = base.replace(/[ _]+/g, '-')
  const words = id.replace(/-/g, ' ')
  return { id, label: words.charAt(0).toUpperCase() + words.slice(1) }
}
