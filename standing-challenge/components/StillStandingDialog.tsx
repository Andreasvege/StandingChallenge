import { formatClock, formatDuration } from '@/lib/format'
import { graceSecondsLeft } from '@/lib/sessions'
import type { LiveEmployee, OpenSession } from '@/lib/snapshot'
import { PixelPerson } from './PixelPerson'
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
  const left = graceSecondsLeft({ ...session, endedAt: null, endReason: null }, now, graceMs)
  return (
    <div className={styles.backdrop}>
      <div className={styles.dialog} role="alertdialog" aria-modal="true" aria-labelledby="still-standing-title">
        <div className={styles.figure}>
          <PixelPerson figure={me.figure} pose="stand" scale={3} />
        </div>
        <h2 id="still-standing-title">Står du fortsatt?</h2>
        <p>Du har stått i {formatDuration(me.elapsedSeconds)} 🎉</p>
        <p className={styles.countdown}>Økta avsluttes om {formatClock(left)}</p>
        <div className={styles.dialogActions}>
          <button type="button" className={`${styles.pill} ${styles.go}`} onClick={onExtend} disabled={pending}>
            Én runde til ({session.roundMinutes} min)
          </button>
          <button type="button" className={styles.pill} onClick={onStop} disabled={pending}>
            Nei, jeg sitter
          </button>
        </div>
      </div>
    </div>
  )
}
