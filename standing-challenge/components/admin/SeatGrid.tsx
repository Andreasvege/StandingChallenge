import { PixelHead } from '@/components/PixelPerson'
import { useTranslation } from '@/components/useLang'
import { DESKTOP_MAX_PER_ROW, MAX_SEATS, balancedRows, seatRowName } from '@/lib/room-layout'
import type { AdminEmployee } from './AdminPanel'
import styles from './Admin.module.css'

interface SeatGridProps {
  employees: AdminEmployee[]
  selectedId: string | null
  onSelect: (id: string) => void
}

export function SeatGrid({ employees, selectedId, onSelect }: SeatGridProps) {
  const { lang, t } = useTranslation()
  const bySeat = new Map<number, AdminEmployee>()
  for (const e of employees) if (e.seat !== null) bySeat.set(e.seat, e)
  const unseated = employees.filter(e => e.seat === null)

  // As many desks as are in use, plus one free desk to move somebody into.
  const used = Math.max(0, ...[...bySeat.keys()].map(s => s + 1))
  const seatCount = Math.min(MAX_SEATS, used + 1)
  const seatRows = balancedRows(seatCount, DESKTOP_MAX_PER_ROW)
  // Laid out like the room seen from the front: the back row on top.
  const rows = seatRows
    .map(seats => ({
      label: t('grid.rowLabel', {
        row: seatRowName(seats[0], seatRows, lang),
        from: seats[0] + 1,
        to: seats[seats.length - 1] + 1,
      }),
      seats,
    }))
    .reverse()

  const head = (e: AdminEmployee) => (
    <button
      key={e.id}
      type="button"
      className={`${styles.head} ${e.id === selectedId ? styles.headOn : ''}`}
      onClick={() => onSelect(e.id)}
      title={e.email}
    >
      <PixelHead figure={e.figure} size={42} />
      {e.name}
    </button>
  )

  return (
    <div className={styles.grid}>
      <h2 className={styles.gridTitle}>{t('grid.title', { count: employees.length })}</h2>
      {rows.map(row => (
        <div key={row.label}>
          <div className={styles.rowLabel}>{row.label}</div>
          <div className={styles.heads}>
            {row.seats.map(s => {
              const e = bySeat.get(s)
              return e ? (
                head(e)
              ) : (
                <div key={s} className={styles.slot}>
                  {t('grid.emptyDesk', { seat: s + 1 })}
                </div>
              )
            })}
          </div>
        </div>
      ))}
      {unseated.length > 0 && (
        <>
          <div className={styles.rowLabel}>{t('grid.unseated')}</div>
          <div className={styles.heads}>{unseated.map(head)}</div>
        </>
      )}
    </div>
  )
}
