import { memo } from 'react'
import type { Figure } from '@/lib/figure'
import { PODIUM_H, PODIUM_HEADS, PODIUM_W, podiumRects } from '@/lib/podium'
import { HEAD_BOX, HEAD_VIEWBOX, spriteRects, type Rect } from '@/lib/sprite'

function Rects({ rects }: { rects: Rect[] }) {
  return (
    <>
      {rects.map((r, i) => (
        <rect key={i} x={r.x} y={r.y} width={r.w} height={r.h} fill={r.fill} />
      ))}
    </>
  )
}

interface MonthPodiumProps {
  /** [gold, silver, bronze]; null or missing leaves the block empty. */
  top: (Figure | null)[]
  /** Screen pixels per podium unit. */
  scale: number
  className?: string
}

export const MonthPodium = memo(function MonthPodium({ top, scale, className }: MonthPodiumProps) {
  return (
    <svg
      viewBox={`0 0 ${PODIUM_W} ${PODIUM_H}`}
      width={PODIUM_W * scale}
      height={PODIUM_H * scale}
      shapeRendering="crispEdges"
      className={className}
      aria-hidden="true"
    >
      <Rects rects={podiumRects()} />
      {PODIUM_HEADS.map((pos, place) => {
        const fig = top[place]
        return fig ? (
          <svg key={place} x={pos.x} y={pos.y} width={HEAD_BOX.w} height={HEAD_BOX.h} viewBox={HEAD_VIEWBOX}>
            <Rects rects={spriteRects(fig, { pose: 'stand', crown: place === 0 })} />
          </svg>
        ) : null
      })}
    </svg>
  )
})
