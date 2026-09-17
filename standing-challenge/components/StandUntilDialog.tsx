import { useState } from 'react'
import { MAX_ROUND_MINUTES, minutesUntil, nextHalfHour } from '@/lib/sessions'
import { useTranslation } from './useLang'
import styles from './OfficeApp.module.css'

interface StandUntilDialogProps {
  now: number
  pending: boolean
  onStart: (minutes: number) => void
  onClose: () => void
}

/**
 * «Stå til 11:00». The round length is worked out from the colleague's own clock, so the time they
 * type means what it says on the wall in front of them — no time zone anywhere in the round trip.
 * The server only ever receives a number of minutes.
 */
export function StandUntilDialog({ now, pending, onStart, onClose }: StandUntilDialogProps) {
  const { t } = useTranslation()
  const [time, setTime] = useState(() => nextHalfHour(now))
  const minutes = minutesUntil(now, time)
  const tooLong = minutes !== null && minutes > MAX_ROUND_MINUTES
  const ok = minutes !== null && !tooLong

  return (
    <div className={styles.backdrop}>
      <div className={styles.dialog} role="dialog" aria-modal="true" aria-labelledby="stand-until-title">
        <h2 id="stand-until-title">{t('standUntil.title')}</h2>
        <label className={styles.timeField}>
          <span>{t('standUntil.field')}</span>
          <input type="time" value={time} onChange={e => setTime(e.target.value)} />
        </label>
        <p className={styles.countdown}>
          {ok
            ? t('standUntil.preview', { minutes })
            : tooLong
              ? t('standUntil.tooLong')
              : t('standUntil.passed')}
        </p>
        <div className={styles.dialogActions}>
          <button
            type="button"
            className={`${styles.pill} ${styles.go}`}
            onClick={() => minutes !== null && ok && onStart(minutes)}
            disabled={pending || !ok}
          >
            {t('standUntil.start')}
          </button>
          <button type="button" className={styles.pill} onClick={onClose} disabled={pending}>
            {t('standUntil.cancel')}
          </button>
        </div>
      </div>
    </div>
  )
}
