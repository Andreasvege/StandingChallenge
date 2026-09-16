import { useState } from 'react'
import { useTranslation } from '@/components/useLang'
import { cheerOptions } from '@/lib/cheers'
import { formatDuration } from '@/lib/format'
import type { LiveEmployee } from '@/lib/snapshot'
import styles from './OfficeRoom.module.css'

interface CheerMenuProps {
  employee: LiveEmployee
  /** At a raised desk right now — standing, or awaiting an answer to «Står du fortsatt?». */
  standing: boolean
  isMe: boolean
  onCheer?: (toId: string, emoji: string) => void
  /** Admins only: end a round somebody forgot to stop. Absent for everyone else. */
  onSitDown?: (toId: string) => void
}

/**
 * What opens when you tap a colleague — at a desk and on the wall screen alike: today's total,
 * heiarop to send, and for an admin a way to sit down somebody who left with the timer running.
 */
export function CheerMenu({ employee: e, standing, isMe, onCheer, onSitDown }: CheerMenuProps) {
  const { lang, t } = useTranslation()
  // Two steps, like removing a colleague in the figure builder: a mis-tap must not end someone's round.
  const [armed, setArmed] = useState(false)
  const canCheer = onCheer !== undefined && !isMe
  const canSitDown = onSitDown !== undefined && standing && !isMe

  return (
    <div className={styles.cheerMenu} role="dialog" aria-label={canCheer ? t('room.cheerMenu', { name: e.name }) : e.name}>
      <span>{t('room.todayIs', { name: e.name, duration: formatDuration(e.todaySeconds, lang) })}</span>
      {canCheer && onCheer && (
        <span className={styles.emojis}>
          {cheerOptions(standing).map(emoji => (
            <button key={emoji} type="button" aria-label={t('room.sendCheer', { emoji, name: e.name })} onClick={() => onCheer(e.id, emoji)}>
              {emoji}
            </button>
          ))}
        </span>
      )}
      {canCheer && !standing && <span className={styles.menuHint}>{t('room.nudgeHint')}</span>}
      {canSitDown && onSitDown && (
        <button
          type="button"
          className={`${styles.sitDown} ${armed ? styles.sitDownArmed : ''}`}
          aria-label={t('room.sitDownLabel', { name: e.name })}
          onClick={() => (armed ? onSitDown(e.id) : setArmed(true))}
          onBlur={() => setArmed(false)}
        >
          {armed ? t('room.sitDownArmed') : t('room.sitDown')}
        </button>
      )}
    </div>
  )
}
