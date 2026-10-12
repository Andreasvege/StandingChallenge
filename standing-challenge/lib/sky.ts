// The window sky follows the time of day in Oslo.

import type { Rect } from './sprite'

export type SkyPhase = 'morning' | 'day' | 'sunset' | 'evening'

export function skyPhase(osloHour: number): SkyPhase {
  if (osloHour >= 6 && osloHour < 10) return 'morning'
  if (osloHour >= 10 && osloHour < 16) return 'day'
  if (osloHour >= 16 && osloHour < 19) return 'sunset'
  return 'evening'
}

export interface Sky {
  /** Five horizontal colour bands, top to bottom (the window viewBox is 64×36). */
  bands: [string, string, string, string, string]
  /** Top-left corner of the 8×8 sun or moon inside the window. */
  body: { kind: 'sun' | 'moon'; x: number; y: number; color: string }
  stars: boolean
  /** Lit windows in the city silhouette. */
  litWindows: boolean
  cloud: string
  city: string
  /** Brightness of hand-drawn art outside the window (trees and the like), so a daytime drawing dusks with the sky. */
  outside: number
}

export const SKIES: Record<SkyPhase, Sky> = {
  morning: {
    bands: ['#9fc6ff', '#b9d6ff', '#ffd6e8', '#ffe3c2', '#fff1d6'],
    body: { kind: 'sun', x: 10, y: 20, color: '#fff4c2' },
    stars: false,
    litWindows: false,
    cloud: '#ffffff',
    city: '#8a9ad6',
    outside: 0.95,
  },
  day: {
    bands: ['#6fb6ff', '#83c2ff', '#9dcfff', '#b8dcff', '#d4ebff'],
    body: { kind: 'sun', x: 44, y: 5, color: '#fff9d6' },
    stars: false,
    litWindows: false,
    cloud: '#ffffff',
    city: '#6f86c9',
    outside: 1,
  },
  sunset: {
    bands: ['#6b5bb5', '#9a6cc2', '#e889b6', '#ffab8a', '#ffd39c'],
    body: { kind: 'sun', x: 42, y: 18, color: '#fff1b8' },
    stars: false,
    litWindows: true,
    cloud: '#f6d2ec',
    city: '#4b3f7a',
    outside: 0.8,
  },
  evening: {
    bands: ['#1c1640', '#261d52', '#322664', '#3d2f72', '#4b3a80'],
    body: { kind: 'moon', x: 46, y: 5, color: '#f4f1ff' },
    stars: true,
    litWindows: true,
    cloud: '#4b3f7a',
    city: '#241c4a',
    outside: 0.45,
  },
}

/** The glass inside the 64×36 window frame. Hand-drawn window views (lib/scene.ts) are this size. */
export const WINDOW_GLASS = { x: 2, y: 2, w: 60, h: 32 } as const
/** The bar between the two panes, drawn over everything seen through the glass. */
export const WINDOW_MULLION: Rect = { x: 31, y: 2, w: 2, h: 32, fill: '#120d22' }

const BAND_Y = [2, 9, 15, 21, 27]
const BAND_H = [7, 6, 6, 6, 7]
const CITY = [[2, 27, 5, 7], [7, 24, 4, 10], [11, 29, 6, 5], [17, 25, 5, 9], [22, 28, 7, 6], [34, 27, 5, 7], [39, 29, 4, 5], [43, 23, 5, 11], [48, 28, 6, 6], [54, 25, 8, 9]] as const
const LIT = [[8, 26], [18, 27], [24, 30], [44, 25], [46, 28], [56, 27]] as const
const STARS = [[4, 4], [24, 3], [58, 3], [14, 8], [38, 6], [60, 11]] as const
const CLOUDS = [[8, 7, 10, 2], [10, 5, 5, 2], [36, 11, 8, 2], [38, 9, 3, 2]] as const

/** Everything seen through the glass – sky, sun or moon, clouds and city – back to front, without frame or mullion. */
export function windowRects(sky: Sky): Rect[] {
  const { body } = sky
  const px = (x: number, y: number, fill: string): Rect => ({ x, y, w: 1, h: 1, fill })
  return [
    ...sky.bands.map((fill, i) => ({ x: 2, y: BAND_Y[i], w: 60, h: BAND_H[i], fill })),
    ...(sky.stars ? STARS.map(([x, y]) => px(x, y, '#ffffff')) : []),
    { x: body.x + 1, y: body.y, w: 6, h: 8, fill: body.color },
    { x: body.x, y: body.y + 1, w: 8, h: 6, fill: body.color },
    ...(body.kind === 'moon' ? [px(body.x + 2, body.y + 2, '#d9d3f0'), { x: body.x + 5, y: body.y + 4, w: 2, h: 1, fill: '#d9d3f0' }] : []),
    ...CLOUDS.map(([x, y, w, h]) => ({ x, y, w, h, fill: sky.cloud })),
    ...CITY.map(([x, y, w, h]) => ({ x, y, w, h, fill: sky.city })),
    ...(sky.litWindows ? LIT.map(([x, y]) => px(x, y, '#ffd166')) : []),
  ]
}
