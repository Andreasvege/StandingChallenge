import { useEffect, useState } from 'react'
import { formatDuration } from '@/lib/format'
import type { MessageKey } from '@/lib/i18n'
import { rankBy, type RankKey } from '@/lib/leaderboard'
import type { LiveEmployee } from '@/lib/snapshot'
import { osloMonthStart } from '@/lib/time'
import { MonthBoardView, type MonthLoader } from './office/MonthBoardView'
import { PixelHead } from './PixelPerson'
import { useTranslation } from './useLang'
import styles from './OfficeApp.module.css'

const BOARDS: { key: RankKey; title: MessageKey }[] = [
  { key: 'todaySeconds', title: 'board.today' },
  { key: 'weekSeconds', title: 'board.week' },
]
const MONTH_BOARD = { key: 'monthSeconds', title: 'board.month' } as const

/** Rows shown on phones before «Vis alle»; desktop always shows the whole list. */
const COLLAPSED_ROWS = 5

interface LeaderboardProps {
  employees: LiveEmployee[]
  meId: string
  now: number
  /** Whether the wall podium is on screen. Where it isn't, «Denne måneden» and «Tidligere måneder» take its place here. */
  podiumShown?: boolean
  /** Where «Tidligere måneder» gets its boards; without it there is no button. */
  loadMonth?: MonthLoader
}

export function Leaderboard({ employees, meId, now, podiumShown = true, loadMonth }: LeaderboardProps) {
  const [expanded, setExpanded] = useState(false)
  const [pastOpen, setPastOpen] = useState(false)
  const { lang, t } = useTranslation()
  useEffect(() => {
    if (!pastOpen) return
    const onKey = (ev: KeyboardEvent) => {
      if (ev.key === 'Escape') setPastOpen(false)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [pastOpen])
  return (
    <section className={styles.board}>
      {(podiumShown ? BOARDS : [...BOARDS, MONTH_BOARD]).map(({ key, title }) => {
        // Everyone who has stood — there is room for all 16 on a desktop, and CSS collapses the list on phones.
        const rows = rankBy(employees, key, meId, employees.length)
        return (
          <div key={key}>
            <h2>{t(title)}</h2>
            {rows.length === 0 ? (
              <p className={styles.empty}>{t('board.empty')}</p>
            ) : (
              <>
                <ol className={expanded ? styles.expanded : undefined}>
                  {rows.map(r => (
                    <li key={r.id} className={r.isMe ? styles.meRow : undefined}>
                      <span className={styles.rank}>{r.rank}</span>
                      <PixelHead figure={r.figure} size={28} className={styles.headBox} />
                      <span>{r.name}</span>
                      <span className={styles.time}>{formatDuration(r.seconds, lang)}</span>
                    </li>
                  ))}
                </ol>
                {rows.length > COLLAPSED_ROWS && (
                  <button type="button" className={styles.showAll} onClick={() => setExpanded(v => !v)}>
                    {expanded ? t('board.showFewer') : t('board.showAll', { count: rows.length })}
                  </button>
                )}
              </>
            )}
            {key === 'monthSeconds' && loadMonth && (
              <button type="button" className={styles.pastMonths} onClick={() => setPastOpen(true)}>
                {t('board.pastMonths')}
              </button>
            )}
          </div>
        )
      })}
      {pastOpen && loadMonth && (
        <div className={styles.backdrop} onClick={ev => ev.target === ev.currentTarget && setPastOpen(false)}>
          <div className={`${styles.dialog} ${styles.monthDialog}`} role="dialog" aria-modal="true" aria-label={t('month.title')}>
            <MonthBoardView meId={meId} initialMonthStart={osloMonthStart(now)} load={loadMonth} />
            <button type="button" className={styles.pill} onClick={() => setPastOpen(false)}>
              {t('month.close')}
            </button>
          </div>
        </div>
      )}
    </section>
  )
}
