import { useState } from 'react'
import { useTranslation } from '@/components/useLang'
import { PLANT_H, PLANT_W, plantLabel, plantProgress, plantRects, plantSign, plantStage } from '@/lib/plant'
import styles from './OfficeRoom.module.css'

/** Kontorplanten on its wall shelf: grows with the office's standing this week. Tap for the numbers. */
export function OfficePlant({ weekSeconds }: { weekSeconds: number }) {
  const [open, setOpen] = useState(false)
  const { lang, t } = useTranslation()
  const caption = t('room.plant', { label: plantLabel(weekSeconds, lang) })
  const rects = plantRects(plantStage(plantProgress(weekSeconds)))
  return (
    <button type="button" className={styles.plant} onClick={() => setOpen(o => !o)} aria-label={caption} title={caption}>
      {open && <span className={`${styles.bubble} ${styles.standing} ${styles.plantBubble}`}>{caption}</span>}
      <svg viewBox={`0 0 ${PLANT_W} ${PLANT_H}`} shapeRendering="crispEdges" className={styles.plantSvg} aria-hidden="true">
        {rects.map((r, i) => (
          <rect key={i} x={r.x} y={r.y} width={r.w} height={r.h} fill={r.fill} />
        ))}
      </svg>
      <span className={styles.shelf} />
      <span className={styles.plantSign}>{plantSign(weekSeconds, lang)}</span>
    </button>
  )
}
