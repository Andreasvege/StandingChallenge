'use client'

import { useState, type CSSProperties, type ReactNode } from 'react'
import { EmptyDesk, PixelPerson } from '@/components/PixelPerson'
import { formatDuration } from '@/lib/format'
import { DESKTOP_ROWS, MOBILE_ROWS, SEAT_COUNT, seatRows, type RowStyle } from '@/lib/room-layout'
import { SKIES, skyPhase } from '@/lib/sky'
import type { LiveEmployee } from '@/lib/snapshot'
import { osloHour } from '@/lib/time'
import { Bubble, type BubbleTone } from './Bubble'
import { Clock, Dog, HangingPlant, Lights, PixelWindow } from './Decor'
import styles from './OfficeRoom.module.css'

interface OfficeRoomProps {
  employees: LiveEmployee[]
  leaderId: string | null
  now: number
  meId?: string | null
}

/** The pixel office. Desktop: 2 rows × 8. Phones (≤700px): 4 rows × 4. Both are rendered; CSS shows one. */
export function OfficeRoom({ employees, leaderId, now, meId = null }: OfficeRoomProps) {
  const [openId, setOpenId] = useState<string | null>(null)
  const bySeat = new Map<number, LiveEmployee>()
  for (const e of employees) if (e.seat !== null) bySeat.set(e.seat, e)
  const sky = SKIES[skyPhase(osloHour(now))]

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
                onToggle={() => setOpenId(openId === e.id ? null : e.id)}
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
      <HangingPlant className={styles.plant} />
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
  onToggle: () => void
}

function Seat({ employee: e, scale, isLeader, isMe, open, compact, onToggle }: SeatProps) {
  const standing = e.phase !== 'sitting'
  const tone: BubbleTone =
    e.phase === 'sitting' ? 'sitting' : e.phase === 'awaiting' ? 'awaiting' : isLeader ? 'leader' : 'standing'
  const name = `${isLeader ? '👑 ' : ''}${e.name}`
  const info = e.phase === 'sitting' ? '💤' : `${formatDuration(e.elapsedSeconds)}${e.phase === 'awaiting' ? ' ⏰' : ''}`
  const classes = [styles.seat, standing ? styles.up : styles.sit, isMe ? styles.me : ''].filter(Boolean).join(' ')
  let label: ReactNode
  if (open) label = `I dag: ${formatDuration(e.todaySeconds)}`
  else if (compact && standing) label = <span className={styles.compact}><span>{name}</span><span className={styles.info}>{info}</span></span>
  else label = standing ? `${name} · ${info}` : `${name} ${info}`
  return (
    <button
      type="button"
      className={classes}
      style={{ '--s': scale } as CSSProperties}
      onClick={onToggle}
      title={`${e.name} · i dag: ${formatDuration(e.todaySeconds)}`}
    >
      <Bubble tone={tone}>{label}</Bubble>
      <PixelPerson figure={e.figure} pose={standing ? 'stand' : 'sit'} crown={isLeader} scale={scale} />
    </button>
  )
}
