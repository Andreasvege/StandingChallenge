import { formatClock, formatDuration } from '@/lib/format'
import { graceSecondsLeft } from '@/lib/sessions'
import type { LiveEmployee, OpenSession } from '@/lib/snapshot'
import { PixelPerson } from './PixelPerson'
import { useTranslation } from './useLang'
import styles from './OfficeApp.module.css'

interface StillStandingDialogProps {
  me: LiveEmployee
  session: OpenSession
  now: number
  graceMs: number
  pending: boolean
  onExtend: () => void
  onStop: () => void
}

export function StillStandingDialog({ me, session, now, graceMs, pending, onExtend, onStop }: StillStandingDialogProps) {
  const { lang, t } = useTranslation()
  const left = graceSecondsLeft({ ...session, endedAt: null, endReason: null }, now, graceMs)
  return (
    <div className={styles.backdrop}>
      <div className={styles.dialog} role="alertdialog" aria-modal="true" aria-labelledby="still-standing-title">
        <div className={styles.figure}>
          <PixelPerson figure={me.figure} pose="stand" scale={3} />
        </div>
        <h2 id="still-standing-title">{t('dialog.stillStanding')}</h2>
        <p>{t('dialog.stoodFor', { duration: formatDuration(me.elapsedSeconds, lang) })}</p>
        <p className={styles.countdown}>{t('dialog.endsIn', { clock: formatClock(left) })}</p>
        <div className={styles.dialogActions}>
          <button type="button" className={`${styles.pill} ${styles.go}`} onClick={onExtend} disabled={pending}>
            {t('dialog.oneMore', { minutes: session.roundMinutes })}
          </button>
          <button type="button" className={styles.pill} onClick={onStop} disabled={pending}>
            {t('dialog.noSitting')}
          </button>
        </div>
      </div>
    </div>
  )
}
