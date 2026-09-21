import { useState } from 'react'
import { useTranslation } from '@/components/useLang'
import { dogOfTheDay } from '@/lib/dogs'
import { osloDayStart } from '@/lib/time'
import styles from './OfficeRoom.module.css'

/**
 * The dog on the floor today, picked from the date so the whole office sees the same one until
 * midnight. Tapping stops the walk while the name is up: a dog crossing the room is no fun to
 * chase with a finger.
 */
export function OfficeDog({ now }: { now: number }) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const dog = dogOfTheDay(osloDayStart(now))
  const caption = t('room.dog', { name: dog.name, owner: dog.owner })
  return (
    <button
      type="button"
      className={`${styles.dog} ${open ? styles.dogPaused : ''}`}
      style={{ width: dog.w * 3, height: dog.h * 3 }}
      onClick={() => setOpen(o => !o)}
      aria-label={caption}
      title={caption}
    >
      {open && <span className={`${styles.bubble} ${styles.standing} ${styles.dogBubble}`}>{caption}</span>}
      <svg viewBox={`0 0 ${dog.w} ${dog.h}`} shapeRendering="crispEdges" aria-hidden="true">
        {dog.rects.map((r, i) => (
          <rect key={i} x={r.x} y={r.y} width={r.w} height={r.h} fill={r.fill} />
        ))}
      </svg>
    </button>
  )
}
