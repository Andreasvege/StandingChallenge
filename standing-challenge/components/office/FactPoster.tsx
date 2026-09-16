import { useState } from 'react'
import { useTranslation } from '@/components/useLang'
import { factOfTheDay, nextFact, type FunFact } from '@/lib/fun-facts'
import { OUTLINE } from '@/lib/sprite'
import { osloDayStart } from '@/lib/time'
import styles from './OfficeRoom.module.css'

type R = readonly [x: number, y: number, w: number, h: number, fill: string]

// A corkboard in a wooden frame with a note pinned to it. The facts run to a couple of sentences,
// which is unreadable at pixel size, so the board is only the invitation — the text opens below it.
const POSTER: readonly R[] = [
  [0, 0, 28, 24, OUTLINE],
  [1, 1, 26, 22, '#8a5a36'],
  [3, 3, 22, 18, '#c98a55'],
  [5, 6, 1, 1, '#a8703f'],
  [22, 7, 1, 1, '#a8703f'],
  [7, 17, 1, 1, '#a8703f'],
  [21, 18, 1, 1, '#a8703f'],
  [8, 5, 12, 14, '#ffe066'],
  [8, 18, 12, 1, '#e9c84f'],
  [10, 9, 8, 1, '#b08b1e'],
  [10, 12, 8, 1, '#b08b1e'],
  [10, 15, 5, 1, '#b08b1e'],
  [13, 3, 2, 3, '#ff4d6d'],
  [13, 3, 2, 1, '#ff8fb1'],
]

interface FactPosterProps {
  now: number
  /** Whether the panel is open. The room owns this: only one pop-up is open at a time. */
  open: boolean
  onOpenChange: (open: boolean) => void
}

/**
 * «Visste du?» on the office wall. Everyone gets the same fact on the same day, and tapping through
 * shows the rest. Every fact carries its source, in small print under the text — the list is only
 * worth having on the wall if you can check it.
 */
export function FactPoster({ now, open, onOpenChange }: FactPosterProps) {
  const { lang, t } = useTranslation()
  // Which fact is on show, once you start tapping through. Null means today's.
  const [browsing, setBrowsing] = useState<FunFact | null>(null)
  const fact = browsing ?? factOfTheDay(osloDayStart(now))

  function close() {
    onOpenChange(false)
    setBrowsing(null) // reopening always starts at today's fact again
  }

  // Reset here too: the room closes the panel behind our back when a colleague's menu opens.
  function openPanel() {
    setBrowsing(null)
    onOpenChange(true)
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
        onClick={() => (open ? close() : openPanel())}
        aria-expanded={open}
        title={t('room.factTitle')}
      >
        <span className={styles.posterLabel}>{t('room.factTitle')}</span>
        <svg viewBox="0 0 28 24" className={styles.posterSvg} shapeRendering="crispEdges" aria-hidden="true">
          {POSTER.map(([x, y, w, h, fill], i) => (
            <rect key={i} x={x} y={y} width={w} height={h} fill={fill} />
          ))}
        </svg>
      </button>
    </div>
  )
}
