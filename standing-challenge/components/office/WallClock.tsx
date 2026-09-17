import { useTranslation } from '@/components/useLang'
import { Clock } from './Decor'
import styles from './OfficeRoom.module.css'

/** Andreas' own pomodoro timer. Opens in its own tab so a running round is never navigated away. */
const POMODORO_URL = 'https://ahv-pomodoro.vercel.app/'

/**
 * The clock on the office wall, which doubles as the way into the work timer. Hidden on phones
 * along with the rest of the narrow wall props, so the link is desktop-only by design.
 */
export function WallClock() {
  const { t } = useTranslation()
  return (
    <a
      className={styles.clock}
      href={POMODORO_URL}
      target="_blank"
      rel="noopener noreferrer"
      title={t('room.clockTitle')}
    >
      <span className={styles.clockLabel}>{t('room.clockLabel')}</span>
      <Clock className={styles.clockSvg} />
    </a>
  )
}
