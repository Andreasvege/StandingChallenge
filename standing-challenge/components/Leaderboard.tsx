import { formatDuration } from '@/lib/format'
import { rankBy, type RankKey } from '@/lib/leaderboard'
import type { LiveEmployee } from '@/lib/snapshot'
import { PixelHead } from './PixelPerson'
import styles from './OfficeApp.module.css'

const BOARDS: { key: RankKey; title: string }[] = [
  { key: 'todaySeconds', title: 'I dag' },
  { key: 'weekSeconds', title: 'Denne uka' },
]

export function Leaderboard({ employees, meId }: { employees: LiveEmployee[]; meId: string }) {
  return (
    <section className={styles.board}>
      {BOARDS.map(({ key, title }) => {
        const rows = rankBy(employees, key, meId)
        return (
          <div key={key}>
            <h2>{title}</h2>
            {rows.length === 0 ? (
              <p className={styles.empty}>Ingen har stått ennå – bli den første! 🌱</p>
            ) : (
              <ol>
                {rows.map(r => (
                  <li key={r.id} className={r.isMe ? styles.meRow : undefined}>
                    <span className={styles.rank}>{r.rank}</span>
                    <PixelHead figure={r.figure} size={28} className={styles.headBox} />
                    <span>{r.name}</span>
                    <span className={styles.time}>{formatDuration(r.seconds)}</span>
                  </li>
                ))}
              </ol>
            )}
          </div>
        )
      })}
    </section>
  )
}
