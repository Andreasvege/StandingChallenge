import { useState } from 'react'
import { formatDuration } from '@/lib/format'
import { rankBy, type RankKey } from '@/lib/leaderboard'
import type { LiveEmployee } from '@/lib/snapshot'
import { PixelHead } from './PixelPerson'
import styles from './OfficeApp.module.css'

const BOARDS: { key: RankKey; title: string }[] = [
  { key: 'todaySeconds', title: 'I dag' },
  { key: 'weekSeconds', title: 'Denne uka' },
]

/** Rows shown on phones before «Vis alle»; desktop always shows the whole list. */
const COLLAPSED_ROWS = 5

export function Leaderboard({ employees, meId }: { employees: LiveEmployee[]; meId: string }) {
  const [expanded, setExpanded] = useState(false)
  return (
    <section className={styles.board}>
      {BOARDS.map(({ key, title }) => {
        // Everyone who has stood — there is room for all 16 on a desktop, and CSS collapses the list on phones.
        const rows = rankBy(employees, key, meId, employees.length)
        return (
          <div key={key}>
            <h2>{title}</h2>
            {rows.length === 0 ? (
              <p className={styles.empty}>Ingen har stått ennå – bli den første! 🌱</p>
            ) : (
              <>
                <ol className={expanded ? styles.expanded : undefined}>
                  {rows.map(r => (
                    <li key={r.id} className={r.isMe ? styles.meRow : undefined}>
                      <span className={styles.rank}>{r.rank}</span>
                      <PixelHead figure={r.figure} size={28} className={styles.headBox} />
                      <span>{r.name}</span>
                      <span className={styles.time}>{formatDuration(r.seconds)}</span>
                    </li>
                  ))}
                </ol>
                {rows.length > COLLAPSED_ROWS && (
                  <button type="button" className={styles.showAll} onClick={() => setExpanded(v => !v)}>
                    {expanded ? 'Vis færre' : `Vis alle (${rows.length})`}
                  </button>
                )}
              </>
            )}
          </div>
        )
      })}
    </section>
  )
}
