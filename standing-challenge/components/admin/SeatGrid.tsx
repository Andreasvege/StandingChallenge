import { PixelHead } from '@/components/PixelPerson'
import { SEAT_COUNT, seatRowName, seatRows } from '@/lib/room-layout'
import type { AdminEmployee } from './AdminPanel'
import styles from './Admin.module.css'

// Laid out like the room seen from the front: the back row on top.
const ROWS = seatRows(SEAT_COUNT, 8)
  .map(seats => ({
    label: `${seatRowName(seats[0])} · plass ${seats[0] + 1}–${seats[seats.length - 1] + 1}`,
    seats,
  }))
  .reverse()

interface SeatGridProps {
  employees: AdminEmployee[]
  selectedId: string | null
  onSelect: (id: string) => void
}

export function SeatGrid({ employees, selectedId, onSelect }: SeatGridProps) {
  const bySeat = new Map<number, AdminEmployee>()
  for (const e of employees) if (e.seat !== null) bySeat.set(e.seat, e)
  const unseated = employees.filter(e => e.seat === null)

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
      <h2 className={styles.gridTitle}>Kontoret · {employees.length} personer</h2>
      {ROWS.map(row => (
        <div key={row.label}>
          <div className={styles.rowLabel}>{row.label}</div>
          <div className={styles.heads}>
            {row.seats.map(s => {
              const e = bySeat.get(s)
              return e ? (
                head(e)
              ) : (
                <div key={s} className={styles.slot}>
                  Tom pult {s + 1}
                </div>
              )
            })}
          </div>
        </div>
      ))}
      {unseated.length > 0 && (
        <>
          <div className={styles.rowLabel}>Uten plass · velg personen og gi dem en pult</div>
          <div className={styles.heads}>{unseated.map(head)}</div>
        </>
      )}
    </div>
  )
}
