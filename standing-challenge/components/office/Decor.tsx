// Pixel-art props for the office room: string lights, windows, clock and the hanging plant.
// The dogs live in lib/dogs.ts, because one of them is picked per day.

import type { Sky } from '@/lib/sky'
import { OUTLINE } from '@/lib/sprite'

type R = readonly [x: number, y: number, w: number, h: number, fill: string]

function Pixels({ rects }: { rects: readonly R[] }) {
  return (
    <>
      {rects.map(([x, y, w, h, fill], i) => (
        <rect key={i} x={x} y={y} width={w} height={h} fill={fill} />
      ))}
    </>
  )
}

export function Lights({ className }: { className?: string }) {
  return <div className={className} aria-hidden="true" />
}

const BAND_Y = [2, 9, 15, 21, 27]
const BAND_H = [7, 6, 6, 6, 7]
const CITY = [[2, 27, 5, 7], [7, 24, 4, 10], [11, 29, 6, 5], [17, 25, 5, 9], [22, 28, 7, 6], [34, 27, 5, 7], [39, 29, 4, 5], [43, 23, 5, 11], [48, 28, 6, 6], [54, 25, 8, 9]] as const
const LIT = [[8, 26], [18, 27], [24, 30], [44, 25], [46, 28], [56, 27]] as const
const STARS = [[4, 4], [24, 3], [58, 3], [14, 8], [38, 6], [60, 11]] as const
const CLOUDS = [[8, 7, 10, 2], [10, 5, 5, 2], [36, 11, 8, 2], [38, 9, 3, 2]] as const

export function PixelWindow({ sky, className }: { sky: Sky; className?: string }) {
  const { body } = sky
  return (
    <svg viewBox="0 0 64 36" className={className} shapeRendering="crispEdges" aria-hidden="true">
      <rect width="64" height="36" fill={OUTLINE} />
      {sky.bands.map((color, i) => (
        <rect key={i} x="2" y={BAND_Y[i]} width="60" height={BAND_H[i]} fill={color} />
      ))}
      {sky.stars && STARS.map(([x, y]) => <rect key={`${x}-${y}`} x={x} y={y} width="1" height="1" fill="#ffffff" />)}
      <rect x={body.x + 1} y={body.y} width="6" height="8" fill={body.color} />
      <rect x={body.x} y={body.y + 1} width="8" height="6" fill={body.color} />
      {body.kind === 'moon' && (
        <>
          <rect x={body.x + 2} y={body.y + 2} width="1" height="1" fill="#d9d3f0" />
          <rect x={body.x + 5} y={body.y + 4} width="2" height="1" fill="#d9d3f0" />
        </>
      )}
      {CLOUDS.map(([x, y, w, h]) => <rect key={`${x}-${y}`} x={x} y={y} width={w} height={h} fill={sky.cloud} />)}
      {CITY.map(([x, y, w, h]) => <rect key={`${x}-${y}`} x={x} y={y} width={w} height={h} fill={sky.city} />)}
      {sky.litWindows && LIT.map(([x, y]) => <rect key={`${x}-${y}`} x={x} y={y} width="1" height="1" fill="#ffd166" />)}
      <rect x="31" y="2" width="2" height="32" fill={OUTLINE} />
    </svg>
  )
}

const CLOCK: readonly R[] = [
  [4, 1, 10, 16, OUTLINE], [1, 4, 16, 10, OUTLINE], [2, 2, 14, 14, OUTLINE],
  [5, 2, 8, 14, '#fff3dc'], [2, 5, 14, 8, '#fff3dc'], [3, 3, 12, 12, '#fff3dc'],
  [8, 4, 2, 6, '#221a3a'], [9, 8, 4, 2, '#ff6fa8'],
]

export function Clock({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 18 18" className={className} shapeRendering="crispEdges" aria-hidden="true">
      <Pixels rects={CLOCK} />
    </svg>
  )
}

const PLANT: readonly R[] = [
  [7, 0, 2, 8, OUTLINE], [3, 8, 10, 6, OUTLINE], [4, 9, 8, 4, '#e08a5b'],
  [2, 7, 5, 2, '#5fae62'], [9, 6, 5, 2, '#7dcf76'], [2, 13, 2, 6, '#5fae62'], [1, 18, 2, 4, '#7dcf76'],
  [12, 13, 2, 8, '#5fae62'], [13, 20, 2, 5, '#7dcf76'], [7, 14, 2, 4, '#7dcf76'],
]

export function HangingPlant({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 16 28" className={className} shapeRendering="crispEdges" aria-hidden="true">
      <Pixels rects={PLANT} />
    </svg>
  )
}

