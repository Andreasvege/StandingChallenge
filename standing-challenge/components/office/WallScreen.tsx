import type { CSSProperties } from 'react'
import { PixelHead } from '@/components/PixelPerson'
import { cheerOptions, type Cheer } from '@/lib/cheers'
import { formatDuration } from '@/lib/format'
import type { LiveEmployee } from '@/lib/snapshot'
import { Bubble, type BubbleTone } from './Bubble'
import styles from './OfficeRoom.module.css'

interface WallScreenProps {
  employee: LiveEmployee
  isLeader: boolean
  isMe: boolean
  open: boolean
  floats: Cheer[]
  onToggle: () => void
  onCheer?: (toId: string, emoji: string) => void
}

/**
 * A colleague who works somewhere else (`remoteFrom`), shown as a pixel video screen on the office
 * wall — an endless call. Rain falls behind them, because of course it does in Bergen.
 */
export function WallScreen({ employee: e, isLeader, isMe, open, floats, onToggle, onCheer }: WallScreenProps) {
  const standing = e.phase !== 'sitting'
  const tone: BubbleTone =
    e.phase === 'sitting' ? 'sitting' : e.phase === 'awaiting' ? 'awaiting' : isLeader ? 'leader' : 'standing'
  const name = `${isLeader ? '👑 ' : ''}${e.name}`
  const info = e.phase === 'sitting' ? '💤' : `${formatDuration(e.elapsedSeconds)}${e.phase === 'awaiting' ? ' ⏰' : ''}`
  const canCheer = onCheer !== undefined && !isMe
  const classes = [styles.screen, standing ? styles.up : styles.sit, isMe ? styles.me : ''].filter(Boolean).join(' ')

  return (
    <div className={classes} style={{ '--s': 2 } as CSSProperties} data-seat>
      {open && (
        <div className={styles.cheerMenu} role="dialog" aria-label={canCheer ? `Heiarop til ${e.name}` : e.name}>
          <span>
            {e.name} · i dag {formatDuration(e.todaySeconds)}
          </span>
          {canCheer && (
            <span className={styles.emojis}>
              {cheerOptions(standing).map(emoji => (
                <button key={emoji} type="button" aria-label={`Send ${emoji} til ${e.name}`} onClick={() => onCheer(e.id, emoji)}>
                  {emoji}
                </button>
              ))}
            </span>
          )}
          {canCheer && !standing && <span className={styles.menuHint}>⬆️ = «reis deg!»</span>}
        </div>
      )}
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
        title={`${e.name} jobber fra ${e.remoteFrom} · i dag: ${formatDuration(e.todaySeconds)}`}
      >
        <Bubble tone={tone}>{`${name} · ${info}`}</Bubble>
        <span className={styles.screenFrame}>
          <span className={styles.screenRain} aria-hidden="true" />
          <PixelHead figure={e.figure} crown={isLeader} size={40} className={styles.screenHead} />
        </span>
        <span className={styles.screenPlace}>{e.remoteFrom}</span>
      </button>
    </div>
  )
}
