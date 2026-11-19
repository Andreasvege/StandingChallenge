'use client'

import { useTranslation } from '@/components/useLang'
import { ROOM_LAYERS } from '@/lib/room-layout'
import { MonthBoardView, type MonthLoader } from './MonthBoardView'
import styles from './OfficeRoom.module.css'

interface MonthPanelProps {
  meId: string | null
  /** osloMonthStart of the current month. */
  monthStart: number
  load: MonthLoader
  onClose: () => void
}

/**
 * The podium's panel: like the noticeboard's, a dialog that opens inside the room. It is a sibling of
 * the podium rather than its child, so it can use the room's full height instead of the wall's.
 */
export function MonthPanel({ meId, monthStart, load, onClose }: MonthPanelProps) {
  const { t } = useTranslation()
  return (
    <div className={styles.monthPanel} style={{ zIndex: ROOM_LAYERS.openMenu }} role="dialog" aria-label={t('month.title')} data-month>
      <MonthBoardView meId={meId} initialMonthStart={monthStart} load={load} />
      <button type="button" className={styles.monthClose} onClick={onClose}>
        {t('month.close')}
      </button>
    </div>
  )
}
