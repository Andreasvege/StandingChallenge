import { formatClock } from '@/lib/format'
import { ROUND_OPTIONS, type RoundMinutes } from '@/lib/sessions'
import type { LiveEmployee } from '@/lib/snapshot'
import styles from './OfficeApp.module.css'

interface MyStatusProps {
  me: LiveEmployee | null
  now: number
  pending: boolean
  error: string | null
  onStart: (minutes: RoundMinutes) => void
  onStop: () => void
}

export function MyStatus({ me, now, pending, error, onStart, onStop }: MyStatusProps) {
  if (me?.session && me.phase === 'standing') {
    const { startedAt, roundEndsAt } = me.session
    const progress = Math.min(1, (now - startedAt) / (roundEndsAt - startedAt))
    return (
      <div className={styles.status}>
        <span className={styles.statusLabel}>
          Du står! <b>{formatClock((roundEndsAt - now) / 1000)}</b> igjen
        </span>
        <span className={styles.progress} aria-hidden="true">
          <i style={{ width: `${progress * 100}%` }} />
        </span>
        <button type="button" className={styles.pill} onClick={onStop} disabled={pending}>
          Jeg satte meg
        </button>
        {error && <span className={styles.error}>{error}</span>}
      </div>
    )
  }

  if (me?.phase === 'awaiting') {
    return (
      <div className={styles.status}>
        <span className={styles.statusLabel}>⏰ Tiden er ute – står du fortsatt?</span>
      </div>
    )
  }

  return (
    <div className={styles.status}>
      <span className={styles.statusLabel}>Du sitter nå. Klar for en runde?</span>
      <span className={styles.pills}>
        {ROUND_OPTIONS.map(m => (
          <button
            key={m}
            type="button"
            className={m === 60 ? `${styles.pill} ${styles.go}` : styles.pill}
            onClick={() => onStart(m)}
            disabled={pending}
          >
            {m === 60 ? 'Stå 60 min' : `${m} min`}
          </button>
        ))}
      </span>
      {error && <span className={styles.error}>{error}</span>}
    </div>
  )
}
