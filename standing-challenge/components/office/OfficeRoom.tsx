'use client'

import { useEffect, useState, type CSSProperties, type ReactNode } from 'react'
import { EmptyDesk, PixelPerson } from '@/components/PixelPerson'
import { activeCheers, cheerOptions, type Cheer } from '@/lib/cheers'
import { formatDuration } from '@/lib/format'
import { DESKTOP_ROWS, MOBILE_ROWS, SEAT_COUNT, seatRows, type RowStyle } from '@/lib/room-layout'
import { SKIES, skyPhase } from '@/lib/sky'
import type { LiveEmployee } from '@/lib/snapshot'
import { osloHour } from '@/lib/time'
import { Bubble, type BubbleTone } from './Bubble'
import { Clock, Dog, HangingPlant, Lights, PixelWindow } from './Decor'
import { OfficePlant } from './OfficePlant'
import styles from './OfficeRoom.module.css'

interface OfficeRoomProps {
  employees: LiveEmployee[]
  leaderId: string | null
  now: number
  meId?: string | null
  /** Recent heiarop; the ones still fresh float up above the receiver's head. */
  cheers?: Cheer[]
  /** When given, tapping a colleague offers heiarop to send. */
  onCheer?: (toId: string, emoji: string) => void
}

/** The pixel office. Desktop: 2 rows × 8. Phones (≤700px): 4 rows × 4. Both are rendered; CSS shows one. */
export function OfficeRoom({ employees, leaderId, now, meId = null, cheers = [], onCheer }: OfficeRoomProps) {
  const [openId, setOpenId] = useState<string | null>(null)
  const bySeat = new Map<number, LiveEmployee>()
  for (const e of employees) if (e.seat !== null) bySeat.set(e.seat, e)
  const sky = SKIES[skyPhase(osloHour(now))]
  const fresh = activeCheers(cheers, now)
  const weekTotal = employees.reduce((sum, e) => sum + e.weekSeconds, 0)

  // Close the heiarop menu on a click outside any seat, or on Escape.
  useEffect(() => {
    if (!openId) return
    const onPointer = (ev: PointerEvent) => {
      if (!(ev.target instanceof Element) || !ev.target.closest('[data-seat]')) setOpenId(null)
    }
    const onKey = (ev: KeyboardEvent) => {
      if (ev.key === 'Escape') setOpenId(null)
    }
    document.addEventListener('pointerdown', onPointer)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', onPointer)
      document.removeEventListener('keydown', onKey)
    }
  }, [openId])

  const cheer = onCheer
    ? (toId: string, emoji: string) => {
        onCheer(toId, emoji)
        setOpenId(null)
      }
    : undefined

  function rows(perRow: number, rowStyles: RowStyle[], compact: boolean) {
    return seatRows(SEAT_COUNT, perRow).map((seats, depth) => {
      const row = rowStyles[depth]
      return (
        <div
          key={depth}
          className={styles.row}
          data-depth={depth}
          style={{
            bottom: row.bottom,
            left: `${row.inset[0]}%`,
            right: `${row.inset[1]}%`,
            // minmax(0, …) keeps columns equal even when a bubble is wider than its column.
            gridTemplateColumns: `repeat(${perRow}, minmax(0, 1fr))`,
            zIndex: 10 - depth,
          }}
        >
          {seats.map(seat => {
            const e = bySeat.get(seat)
            if (!e) {
              return (
                <div key={seat} className={styles.seat}>
                  <EmptyDesk scale={row.scale} />
                </div>
              )
            }
            return (
              <Seat
                key={seat}
                employee={e}
                scale={row.scale}
                isLeader={e.id === leaderId}
                isMe={e.id === meId}
                open={openId === e.id}
                compact={compact}
                floats={fresh.filter(c => c.toId === e.id)}
                onToggle={() => setOpenId(openId === e.id ? null : e.id)}
                onCheer={cheer}
              />
            )
          })}
        </div>
      )
    })
  }

  return (
    <div className={styles.room}>
      <Lights className={styles.lights} />
      <PixelWindow sky={sky} className={`${styles.window} ${styles.windowLeft}`} />
      <PixelWindow sky={sky} className={`${styles.window} ${styles.windowRight}`} />
      <Clock className={styles.clock} />
      <HangingPlant className={styles.hanging} />
      <OfficePlant weekSeconds={weekTotal} />
      <div className={styles.floor} />
      <div className={styles.desktopOnly}>{rows(8, DESKTOP_ROWS, false)}</div>
      <div className={styles.mobileOnly}>{rows(4, MOBILE_ROWS, true)}</div>
      <Dog className={styles.dog} />
    </div>
  )
}

interface SeatProps {
  employee: LiveEmployee
  scale: number
  isLeader: boolean
  isMe: boolean
  open: boolean
  /** Phone layout: name and time stacked instead of on one line. */
  compact: boolean
  /** Fresh heiarop to this person, floating up above their head. */
  floats: Cheer[]
  onToggle: () => void
  onCheer?: (toId: string, emoji: string) => void
}

function Seat({ employee: e, scale, isLeader, isMe, open, compact, floats, onToggle, onCheer }: SeatProps) {
  const standing = e.phase !== 'sitting'
  const tone: BubbleTone =
    e.phase === 'sitting' ? 'sitting' : e.phase === 'awaiting' ? 'awaiting' : isLeader ? 'leader' : 'standing'
  const name = `${isLeader ? '👑 ' : ''}${e.name}`
  const info = e.phase === 'sitting' ? '💤' : `${formatDuration(e.elapsedSeconds)}${e.phase === 'awaiting' ? ' ⏰' : ''}`
  const classes = [styles.seat, standing ? styles.up : styles.sit, isMe ? styles.me : ''].filter(Boolean).join(' ')
  let label: ReactNode
  if (compact && standing) label = <span className={styles.compact}><span>{name}</span><span className={styles.info}>{info}</span></span>
  else label = standing ? `${name} · ${info}` : `${name} ${info}`
  const canCheer = onCheer !== undefined && !isMe
  return (
    <div className={classes} style={{ '--s': scale } as CSSProperties} data-seat>
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
      <button type="button" className={styles.seatButton} onClick={onToggle} aria-expanded={open} title={`${e.name} · i dag: ${formatDuration(e.todaySeconds)}`}>
        <Bubble tone={tone}>{label}</Bubble>
        <PixelPerson figure={e.figure} pose={standing ? 'stand' : 'sit'} crown={isLeader} scale={scale} />
      </button>
    </div>
  )
}
