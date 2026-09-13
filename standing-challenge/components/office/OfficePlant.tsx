import { useState } from 'react'
import { PLANT_H, PLANT_W, plantLabel, plantProgress, plantRects, plantSign, plantStage } from '@/lib/plant'
import styles from './OfficeRoom.module.css'

/** Kontorplanten on its wall shelf: grows with the office's standing this week. Tap for the numbers. */
export function OfficePlant({ weekSeconds }: { weekSeconds: number }) {
  const [open, setOpen] = useState(false)
  const label = plantLabel(weekSeconds)
  const rects = plantRects(plantStage(plantProgress(weekSeconds)))
  return (
    <button type="button" className={styles.plant} onClick={() => setOpen(o => !o)} aria-label={`Kontorplanten: ${label}`} title={`Kontorplanten: ${label}`}>
      {open && <span className={`${styles.bubble} ${styles.standing} ${styles.plantBubble}`}>Kontorplanten: {label}</span>}
      <svg viewBox={`0 0 ${PLANT_W} ${PLANT_H}`} shapeRendering="crispEdges" className={styles.plantSvg} aria-hidden="true">
        {rects.map((r, i) => (
          <rect key={i} x={r.x} y={r.y} width={r.w} height={r.h} fill={r.fill} />
        ))}
      </svg>
      <span className={styles.shelf} />
      <span className={styles.plantSign}>{plantSign(weekSeconds)}</span>
    </button>
  )
}
