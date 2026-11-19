'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { loadMonthBoard, type MonthBoardResult } from '@/app/actions/month'
import { PixelHead } from '@/components/PixelPerson'
import { useTranslation } from '@/components/useLang'
import { formatDuration } from '@/lib/format'
import type { Lang } from '@/lib/i18n'
import { nextMonthStart } from '@/lib/month-board'
import { osloPrevMonthStart } from '@/lib/time'
import { MonthPodium } from './MonthPodium'
import styles from './MonthBoardView.module.css'

export type MonthLoader = (input: { monthStart: number }) => Promise<MonthBoardResult>

interface MonthBoardViewProps {
  meId: string | null
  /** osloMonthStart of the current month: where the panel opens, and as far forward as the arrows go. */
  initialMonthStart: number
  /** Where boards come from. /dev/room hands in a demo loader so the panel works without a login. */
  load?: MonthLoader
}

const locale = (lang: Lang) => (lang === 'en' ? 'en-GB' : 'nb-NO')

function monthTitle(monthStart: number, lang: Lang): string {
  const s = new Intl.DateTimeFormat(locale(lang), { month: 'long', year: 'numeric', timeZone: 'Europe/Oslo' }).format(monthStart)
  return s.charAt(0).toUpperCase() + s.slice(1)
}

/** The month on its own, as it reads inside a sentence: «vant oktober», «won October». */
function monthInSentence(monthStart: number, lang: Lang): string {
  return new Intl.DateTimeFormat(locale(lang), { month: 'long', timeZone: 'Europe/Oslo' }).format(monthStart)
}

/** A sentence with the name picked out in bold, without building the copy out of pieces. */
function withName(text: string, name: string) {
  const at = text.indexOf(name)
  if (at < 0) return text
  return (
    <>
      {text.slice(0, at)}
      <b>{name}</b>
      {text.slice(at + name.length)}
    </>
  )
}

/**
 * Månedens ståere for one month at a time: the arrows, the podium at 3×, who won (or leads), «Mest
 * framgang», everyone's hours and the office total. Finished months never change, so they are kept
 * once fetched; the current month is fetched again every time it is opened.
 */
export function MonthBoardView({ meId, initialMonthStart, load = loadMonthBoard }: MonthBoardViewProps) {
  const { lang, t } = useTranslation()
  const [monthStart, setMonthStart] = useState(initialMonthStart)
  const [boards, setBoards] = useState<Map<number, MonthBoardResult>>(() => new Map())
  const [failed, setFailed] = useState<number | null>(null)

  // Kept in a ref so a loader made fresh on every render (an inline arrow) doesn't refetch each time.
  const loadRef = useRef(load)
  useEffect(() => {
    loadRef.current = load
  }, [load])

  const fetchMonth = useCallback(
    (wanted: number) => {
      loadRef.current({ monthStart: wanted })
        .then(board => {
          setBoards(prev => new Map(prev).set(board.monthStart, board))
          // The server clamps a month outside the range; follow it there.
          if (board.monthStart !== wanted) setMonthStart(m => (m === wanted ? board.monthStart : m))
        })
        .catch(() => setFailed(wanted))
    },
    [],
  )

  useEffect(() => {
    fetchMonth(initialMonthStart)
  }, [fetchMonth, initialMonthStart])

  function go(target: number) {
    setMonthStart(target)
    setFailed(null)
    if (!boards.get(target)?.done) fetchMonth(target)
  }

  const board = boards.get(monthStart) ?? null
  const firstMonthStart = board?.firstMonthStart ?? [...boards.values()][0]?.firstMonthStart ?? null
  const canGoBack = firstMonthStart !== null && monthStart > firstMonthStart
  const canGoForward = monthStart < initialMonthStart
  const top = useMemo(() => (boards.get(monthStart)?.rows ?? []).slice(0, 3).map(r => r.figure), [boards, monthStart])

  let body
  if (!board) {
    body = <p className={styles.note}>{failed === monthStart ? t('month.error') : t('month.loading')}</p>
  } else {
    const [first] = board.rows
    const max = first?.seconds ?? 0
    const prevName = monthInSentence(osloPrevMonthStart(board.monthStart), lang)
    const progress = board.progress
    body = (
      <>
        {!first ? (
          <p className={styles.note}>{t('month.empty')}</p>
        ) : board.done ? (
          <p className={styles.winner}>
            {withName(t('month.won', { name: first.name, month: monthInSentence(board.monthStart, lang), hours: formatDuration(first.seconds, lang) }), first.name)}
          </p>
        ) : (
          <p className={styles.live}>{t('month.leading', { name: first.name })}</p>
        )}
        {progress && (
          <p className={styles.progress}>
            {withName(
              t(board.done ? 'month.progress' : 'month.progressSoFar', { name: progress.name, hours: formatDuration(progress.gainSeconds, lang), prev: prevName }),
              progress.name,
            )}
          </p>
        )}
        {board.rows.length > 0 && (
          <ol className={styles.rows}>
            {board.rows.map(r => (
              <li key={r.id} className={r.id === meId ? styles.me : undefined}>
                <span className={styles.rank}>{r.rank}</span>
                <PixelHead figure={r.figure} size={28} className={styles.head} />
                <span className={styles.name}>
                  <i>{r.name}</i>
                  <span className={styles.bar}>
                    <b style={{ width: `${Math.max(2, Math.round((r.seconds / max) * 100))}%` }} />
                  </span>
                </span>
                <span className={styles.hours}>{formatDuration(r.seconds, lang)}</span>
              </li>
            ))}
          </ol>
        )}
        <p className={styles.foot}>{t('month.total', { hours: formatDuration(board.totalSeconds, lang) })}</p>
      </>
    )
  }

  return (
    <div className={styles.view}>
      <div className={styles.header}>
        <button type="button" className={styles.arrow} aria-label={t('month.prev')} disabled={!canGoBack} onClick={() => go(osloPrevMonthStart(monthStart))}>
          ‹
        </button>
        <h3 className={styles.title} aria-live="polite">
          {monthTitle(monthStart, lang)}
        </h3>
        <button type="button" className={styles.arrow} aria-label={t('month.next')} disabled={!canGoForward} onClick={() => go(nextMonthStart(monthStart))}>
          ›
        </button>
      </div>
      <div className={styles.podium}>
        <MonthPodium top={top} scale={3} />
      </div>
      {body}
    </div>
  )
}
