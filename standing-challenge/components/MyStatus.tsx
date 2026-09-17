import { formatClock } from '@/lib/format'
import { ROUND_OPTIONS, type RoundMinutes } from '@/lib/sessions'
import type { LiveEmployee } from '@/lib/snapshot'
import { useTranslation } from './useLang'
import styles from './OfficeApp.module.css'

interface MyStatusProps {
  me: LiveEmployee | null
  now: number
  pending: boolean
  error: string | null
  onStart: (minutes: RoundMinutes) => void
  onStop: () => void
  /** Opens the «stå til klokka» dialog; the round length is worked out there. */
  onStandUntil: () => void
}

export function MyStatus({ me, now, pending, error, onStart, onStop, onStandUntil }: MyStatusProps) {
  const { t } = useTranslation()

  if (me?.session && me.phase === 'standing') {
    const { startedAt, roundEndsAt } = me.session
    const progress = Math.min(1, (now - startedAt) / (roundEndsAt - startedAt))
    return (
      <div className={styles.status}>
        <span className={styles.statusLabel}>
          {t('status.standing')} <b>{formatClock((roundEndsAt - now) / 1000)}</b> {t('status.left')}
        </span>
        <span className={styles.progress} aria-hidden="true">
          <i style={{ width: `${progress * 100}%` }} />
        </span>
        <button type="button" className={styles.pill} onClick={onStop} disabled={pending}>
          {t('status.sitDown')}
        </button>
        {error && <span className={styles.error}>{error}</span>}
      </div>
    )
  }

  if (me?.phase === 'awaiting') {
    return (
      <div className={styles.status}>
        <span className={styles.statusLabel}>{t('status.timeUp')}</span>
      </div>
    )
  }

  return (
    <div className={styles.status}>
      <span className={styles.statusLabel}>{t('status.sitting')}</span>
      <span className={styles.pills}>
        {ROUND_OPTIONS.map(m => (
          <button
            key={m}
            type="button"
            className={m === 60 ? `${styles.pill} ${styles.go}` : styles.pill}
            onClick={() => onStart(m)}
            disabled={pending}
          >
            {m === 60 ? t('status.stand60') : t('format.minutes', { minutes: m })}
          </button>
        ))}
        <button type="button" className={styles.pill} onClick={onStandUntil} disabled={pending}>
          {t('status.standUntil')}
        </button>
      </span>
      {error && <span className={styles.error}>{error}</span>}
    </div>
  )
}
