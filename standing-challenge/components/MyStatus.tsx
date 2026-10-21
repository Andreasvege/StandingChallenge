import { formatClock } from '@/lib/format'
import { BACKDATE_OPTIONS, ROUND_OPTIONS, type RoundMinutes } from '@/lib/sessions'
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
  /** A colleague started this round for me («start for en kollega»); null when I did it myself. */
  startedByName?: string | null
  /** «Jeg satt egentlig»: undo a round somebody else started. */
  onReject?: () => void
  /** Minutes already stood, counted in when the next round starts (0 = none). */
  alreadyStood?: number
  onAlreadyStood?: (minutes: number) => void
}

export function MyStatus({ me, now, pending, error, onStart, onStop, onStandUntil, startedByName, onReject, alreadyStood = 0, onAlreadyStood }: MyStatusProps) {
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
        {startedByName && (
          <span className={styles.startedBy}>
            {t('proxy.startedBy', { name: startedByName })}
            {onReject && (
              <button type="button" className={styles.linkButton} onClick={onReject} disabled={pending}>
                {t('proxy.reject')}
              </button>
            )}
          </span>
        )}
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
      {onAlreadyStood && (
        <span className={styles.alreadyStood}>
          {t('status.alreadyStood')}
          {BACKDATE_OPTIONS.filter(m => m > 0).map(m => (
            <button
              key={m}
              type="button"
              className={m === alreadyStood ? `${styles.stoodChip} ${styles.stoodChipOn}` : styles.stoodChip}
              aria-pressed={m === alreadyStood}
              onClick={() => onAlreadyStood(m === alreadyStood ? 0 : m)}
              disabled={pending}
            >
              {t('format.minutes', { minutes: m })}
            </button>
          ))}
          {alreadyStood > 0 && <span>{t('status.alreadyStoodHint')}</span>}
        </span>
      )}
      {error && <span className={styles.error}>{error}</span>}
    </div>
  )
}
