import { memo } from 'react'
import type { Figure } from '@/lib/figure'
import { HEAD_BOX, HEAD_VIEWBOX, SPRITE_H, SPRITE_W, emptyDeskRects, spriteRects, type Pose, type Rect } from '@/lib/sprite'

function Rects({ rects }: { rects: Rect[] }) {
  return (
    <>
      {rects.map((r, i) => (
        <rect key={i} x={r.x} y={r.y} width={r.w} height={r.h} fill={r.fill} />
      ))}
    </>
  )
}

interface PixelPersonProps {
  figure: Figure
  pose: Pose
  crown?: boolean
  /** Last month's winner: a trophy on the desk. */
  trophy?: boolean
  /** Screen pixels per sprite pixel. */
  scale?: number
  className?: string
}

export const PixelPerson = memo(function PixelPerson({ figure, pose, crown = false, trophy = false, scale = 3, className }: PixelPersonProps) {
  return (
    <svg
      viewBox={`0 0 ${SPRITE_W} ${SPRITE_H}`}
      width={SPRITE_W * scale}
      height={SPRITE_H * scale}
      shapeRendering="crispEdges"
      className={className}
      aria-hidden="true"
    >
      <Rects rects={spriteRects(figure, { pose, crown, trophy })} />
    </svg>
  )
})

interface PixelHeadProps {
  figure: Figure
  crown?: boolean
  /** Height in px; the width follows the head crop's 18:21 ratio so nothing outside it shows. */
  size?: number
  className?: string
}

export const PixelHead = memo(function PixelHead({ figure, crown = false, size = 28, className }: PixelHeadProps) {
  return (
    <svg
      viewBox={HEAD_VIEWBOX}
      width={Math.round((size * HEAD_BOX.w) / HEAD_BOX.h)}
      height={size}
      shapeRendering="crispEdges"
      className={className}
      aria-hidden="true"
    >
      <Rects rects={spriteRects(figure, { pose: 'stand', crown })} />
    </svg>
  )
})

export function EmptyDesk({ scale = 3, className }: { scale?: number; className?: string }) {
  return (
    <svg
      viewBox={`0 0 ${SPRITE_W} ${SPRITE_H}`}
      width={SPRITE_W * scale}
      height={SPRITE_H * scale}
      shapeRendering="crispEdges"
      className={className}
      aria-hidden="true"
    >
      <Rects rects={emptyDeskRects()} />
    </svg>
  )
}
