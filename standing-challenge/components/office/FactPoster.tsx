import { useState } from 'react'
import { useTranslation } from '@/components/useLang'
import { factOfTheDay, nextFact, type FunFact } from '@/lib/fun-facts'
import { OUTLINE } from '@/lib/sprite'
import { osloDayStart } from '@/lib/time'
import styles from './OfficeRoom.module.css'

type R = readonly [x: number, y: number, w: number, h: number, fill: string]

// A pinned-up sheet with a question mark on it. The facts themselves are far too long to read at
// pixel size, so the poster is only the invitation — the text opens in a panel below it.
const POSTER: readonly R[] = [
  [0, 0, 22, 28, OUTLINE],
  [1, 1, 20, 26, '#fff3dc'],
  [1, 1, 20, 6, '#ff6fa8'],
  [3, 3, 2, 2, '#fff3dc'],
  [6, 3, 2, 2, '#fff3dc'],
  [9, 10, 5, 2, '#2b1f4d'],
  [13, 11, 2, 3, '#2b1f4d'],
  [11, 14, 3, 2, '#2b1f4d'],
  [11, 16, 2, 3, '#2b1f4d'],
  [11, 21, 2, 2, '#2b1f4d'],
  [4, 24, 14, 1, '#cfc4ea'],
]

/**
 * «Visste du?» on the office wall. Everyone gets the same fact on the same day, and tapping through
 * shows the rest. Every fact carries its source, in small print under the text — the list is only
 * worth having on the wall if you can check it.
 */
export function FactPoster({ now }: { now: number }) {
  const { lang, t } = useTranslation()
  const [open, setOpen] = useState(false)
  // Which fact is on show, once you start tapping through. Null means today's.
  const [browsing, setBrowsing] = useState<FunFact | null>(null)
  const fact = browsing ?? factOfTheDay(osloDayStart(now))

  function close() {
    setOpen(false)
    setBrowsing(null) // reopening always starts at today's fact again
  }

  return (
    <div className={styles.poster}>
      {open && (
        <div className={styles.factPanel} role="dialog" aria-label={t('room.factTitle')}>
          <p className={styles.factText}>{fact[lang]}</p>
          <p className={styles.factSource}>{t('room.factSource', { source: fact.source })}</p>
          <div className={styles.factActions}>
            <button type="button" onClick={() => setBrowsing(nextFact(fact))}>
              {t('room.factNext')}
            </button>
            <button type="button" onClick={close}>
              {t('room.factClose')}
            </button>
          </div>
        </div>
      )}
      <button
        type="button"
        className={styles.posterButton}
        onClick={() => (open ? close() : setOpen(true))}
        aria-expanded={open}
        title={t('room.factTitle')}
      >
        <svg viewBox="0 0 22 28" className={styles.posterSvg} shapeRendering="crispEdges" aria-hidden="true">
          {POSTER.map(([x, y, w, h, fill], i) => (
            <rect key={i} x={x} y={y} width={w} height={h} fill={fill} />
          ))}
        </svg>
        <span className={styles.posterLabel}>{t('room.factTitle')}</span>
      </button>
    </div>
  )
}
