import { PixelHead } from '@/components/PixelPerson'
import type { AdminEmployee } from './AdminPanel'
import styles from './Admin.module.css'

// Laid out like the room seen from the front: back row on top.
const ROWS = [
  { label: 'Bakerste rad · plass 9–16', seats: [8, 9, 10, 11, 12, 13, 14, 15] },
  { label: 'Fremste rad · plass 1–8', seats: [0, 1, 2, 3, 4, 5, 6, 7] },
]

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
