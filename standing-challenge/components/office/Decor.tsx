// Pixel-art props for the office room: string lights, windows, clock and the hanging plant.
// The dogs live in lib/dogs.ts, because one of them is picked per day.

import type { StaticImageData } from 'next/image'
import { WINDOW_GLASS, WINDOW_MULLION, windowRects, type Sky } from '@/lib/sky'
import { OUTLINE, type Rect } from '@/lib/sprite'

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

/** A window onto the Oslo sky, with this month's hand-drawn view (if any) between the city and the mullion. */
export function PixelWindow({ sky, view, className }: { sky: Sky; view?: StaticImageData; className?: string }) {
  const g = WINDOW_GLASS
  return (
    <svg viewBox="0 0 64 36" className={className} shapeRendering="crispEdges" aria-hidden="true">
      <rect width="64" height="36" fill={OUTLINE} />
      <Rects rects={windowRects(sky)} />
      {view && (
        <image
          href={view.src}
          x={g.x}
          y={g.y}
          width={g.w}
          height={g.h}
          preserveAspectRatio="none"
          style={{ imageRendering: 'pixelated', filter: sky.outside < 1 ? `brightness(${sky.outside})` : undefined }}
        />
      )}
      <Rects rects={[WINDOW_MULLION]} />
    </svg>
  )
}

function Rects({ rects }: { rects: readonly Rect[] }) {
  return <Pixels rects={rects.map(r => [r.x, r.y, r.w, r.h, r.fill] as const)} />
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

