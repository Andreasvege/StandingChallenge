import type { CSSProperties } from 'react'
import { PixelHead } from '@/components/PixelPerson'
import { useTranslation } from '@/components/useLang'
import type { Cheer } from '@/lib/cheers'
import { formatDuration } from '@/lib/format'
import type { LiveEmployee } from '@/lib/snapshot'
import { Bubble, type BubbleTone } from './Bubble'
import { CheerMenu } from './CheerMenu'
import styles from './OfficeRoom.module.css'

interface WallScreenProps {
  employee: LiveEmployee
  isLeader: boolean
  isMe: boolean
  open: boolean
  floats: Cheer[]
  onToggle: () => void
  onCheer?: (toId: string, emoji: string) => void
  onSitDown?: (toId: string) => void
}

/**
 * A colleague who works somewhere else (`remoteFrom`), shown as a pixel video screen on the office
 * wall — an endless call. Rain falls behind them, because of course it does in Bergen.
 */
export function WallScreen({ employee: e, isLeader, isMe, open, floats, onToggle, onCheer, onSitDown }: WallScreenProps) {
  const { lang, t } = useTranslation()
  const standing = e.phase !== 'sitting'
  const tone: BubbleTone =
    e.phase === 'sitting' ? 'sitting' : e.phase === 'awaiting' ? 'awaiting' : isLeader ? 'leader' : 'standing'
  const name = `${isLeader ? '👑 ' : ''}${e.name}`
  const info = e.phase === 'sitting' ? '💤' : `${formatDuration(e.elapsedSeconds, lang)}${e.phase === 'awaiting' ? ' ⏰' : ''}`
  const classes = [styles.screen, standing ? styles.up : styles.sit, isMe ? styles.me : ''].filter(Boolean).join(' ')

  return (
    <div className={classes} style={{ '--s': 2 } as CSSProperties} data-seat>
      {open && <CheerMenu employee={e} standing={standing} isMe={isMe} onCheer={onCheer} onSitDown={onSitDown} />}
      {floats.map((c, i) => (
        <span key={c.id} className={styles.float} style={{ marginLeft: i * 18 }} aria-hidden="true">
          {c.emoji}
        </span>
      ))}
      <button
        type="button"
        className={styles.screenButton}
        onClick={onToggle}
        aria-expanded={open}
        title={t('room.screenTitle', { name: e.name, place: e.remoteFrom ?? '', duration: formatDuration(e.todaySeconds, lang) })}
      >
        <Bubble tone={tone}>{`${name} · ${info}`}</Bubble>
        <span className={styles.screenFrame}>
          <span className={styles.screenRain} aria-hidden="true" />
          <PixelHead figure={e.figure} crown={isLeader} size={40} className={styles.screenHead} />
          <span className={styles.screenLive} aria-hidden="true">{t('room.live')}</span>
          <span className={styles.screenPlace}>{e.remoteFrom}</span>
        </span>
        <span className={styles.screenStand} aria-hidden="true" />
      </button>
    </div>
  )
}
