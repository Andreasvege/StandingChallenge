'use client'

import { useEffect, useState, type CSSProperties, type ReactNode } from 'react'
import { EmptyDesk, PixelPerson } from '@/components/PixelPerson'
import { useTranslation } from '@/components/useLang'
import { activeCheers, type Cheer } from '@/lib/cheers'
import { formatDuration } from '@/lib/format'
import { DESKTOP_MAX_PER_ROW, MOBILE_MAX_PER_ROW, ROOM_LAYERS, balancedRows, roomMetrics, rowStyles, rowZIndex, type RowStyle } from '@/lib/room-layout'
import { SKIES, skyPhase } from '@/lib/sky'
import type { LiveEmployee } from '@/lib/snapshot'
import { osloHour } from '@/lib/time'
import { Bubble, type BubbleTone } from './Bubble'
import { CheerMenu } from './CheerMenu'
import { HangingPlant, Lights, PixelWindow } from './Decor'
import { FactPoster } from './FactPoster'
import { OfficeDog } from './OfficeDog'
import { OfficePlant } from './OfficePlant'
import { WallClock } from './WallClock'
import { WallScreen } from './WallScreen'
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
  /** Admins only: end a round for somebody who forgot to stop. */
  onSitDown?: (toId: string) => void
}

/**
 * The pixel office. The room follows the office: as many desks as there are seated colleagues,
 * split into balanced rows — up to nine per row on desktop, four on phones. Colleagues who work
 * somewhere else hang on the wall as video screens. Both layouts are rendered and CSS shows one,
 * so the row geometry is handed over as custom properties.
 */
export function OfficeRoom({ employees, leaderId, now, meId = null, cheers = [], onCheer, onSitDown }: OfficeRoomProps) {
  const [openId, setOpenId] = useState<string | null>(null)
  const [factOpen, setFactOpen] = useState(false)
  const remotePeople = employees.filter(e => e.remoteFrom)
  const bySeat = new Map<number, LiveEmployee>()
  for (const e of employees) if (e.seat !== null && !e.remoteFrom) bySeat.set(e.seat, e)
  const sky = SKIES[skyPhase(osloHour(now))]
  const fresh = activeCheers(cheers, now)
  const weekTotal = employees.reduce((sum, e) => sum + e.weekSeconds, 0)
  // The wall-screen strip is a stacking context too, so it has to rise for its own menu to clear the poster.
  const openIsRemote = openId !== null && remotePeople.some(e => e.id === openId)

  const seatCount = Math.max(0, ...[...bySeat.keys()].map(s => s + 1))
  const desktopSeats = balancedRows(seatCount, DESKTOP_MAX_PER_ROW)
  const mobileSeats = balancedRows(seatCount, MOBILE_MAX_PER_ROW)
  const desktopStyles = rowStyles(desktopSeats.length, 'desktop')
  const mobileStyles = rowStyles(mobileSeats.length, 'mobile')
  const desktop = roomMetrics(desktopStyles, 'desktop', remotePeople.length)
  const mobile = roomMetrics(mobileStyles, 'mobile', remotePeople.length)

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
  const sitDown = onSitDown
    ? (toId: string) => {
        onSitDown(toId)
        setOpenId(null)
      }
    : undefined
  // One pop-up at a time. A row is a single stacking context, so lifting a menu clear of the
  // noticeboard lifts the whole row of name bubbles with it — tidier to put the board away instead.
  const toggle = (id: string) => () => {
    setOpenId(openId === id ? null : id)
    setFactOpen(false)
  }

  function rows(seatRows: number[][], rowStyleList: RowStyle[], compact: boolean) {
    return seatRows.map((seats, depth) => {
      const row = rowStyleList[depth]
      const hasOpenMenu = openId !== null && seats.some(seat => bySeat.get(seat)?.id === openId)
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
            gridTemplateColumns: `repeat(${seats.length}, minmax(0, 1fr))`,
            zIndex: rowZIndex(depth, hasOpenMenu),
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
                onToggle={toggle(e.id)}
                onCheer={cheer}
                onSitDown={sitDown}
              />
            )
          })}
        </div>
      )
    })
  }

  return (
    <div
      className={styles.room}
      style={
        {
          '--room-h': `${desktop.height}px`,
          '--floor-h': `${desktop.floor}px`,
          '--room-h-mobile': `${mobile.height}px`,
          '--floor-h-mobile': `${mobile.floor}px`,
        } as CSSProperties
      }
    >
      <Lights className={styles.lights} />
      <PixelWindow sky={sky} className={`${styles.window} ${styles.windowLeft}`} />
      <PixelWindow sky={sky} className={`${styles.window} ${styles.windowRight}`} />
      <WallClock />
      <HangingPlant className={styles.hanging} />
      <OfficePlant weekSeconds={weekTotal} />
      <FactPoster
        now={now}
        open={factOpen}
        onOpenChange={next => {
          setFactOpen(next)
          if (next) setOpenId(null)
        }}
      />
      {remotePeople.length > 0 && (
        <div className={styles.screens} style={openIsRemote ? { zIndex: ROOM_LAYERS.openMenu } : undefined}>
          {remotePeople.map(e => (
            <WallScreen
              key={e.id}
              employee={e}
              isLeader={e.id === leaderId}
              isMe={e.id === meId}
              open={openId === e.id}
              floats={fresh.filter(c => c.toId === e.id)}
              onToggle={toggle(e.id)}
              onCheer={cheer}
              onSitDown={sitDown}
            />
          ))}
        </div>
      )}
      <div className={styles.floor} />
      <div className={styles.desktopOnly}>{rows(desktopSeats, desktopStyles, false)}</div>
      <div className={styles.mobileOnly}>{rows(mobileSeats, mobileStyles, true)}</div>
      <OfficeDog now={now} />
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
  onSitDown?: (toId: string) => void
}

function Seat({ employee: e, scale, isLeader, isMe, open, compact, floats, onToggle, onCheer, onSitDown }: SeatProps) {
  const { lang, t } = useTranslation()
  const standing = e.phase !== 'sitting'
  const tone: BubbleTone =
    e.phase === 'sitting' ? 'sitting' : e.phase === 'awaiting' ? 'awaiting' : isLeader ? 'leader' : 'standing'
  const name = `${isLeader ? '👑 ' : ''}${e.name}`
  const info = e.phase === 'sitting' ? '💤' : `${formatDuration(e.elapsedSeconds, lang)}${e.phase === 'awaiting' ? ' ⏰' : ''}`
  const classes = [styles.seat, standing ? styles.up : styles.sit, isMe ? styles.me : ''].filter(Boolean).join(' ')
  let label: ReactNode
  if (compact && standing) label = <span className={styles.compact}><span>{name}</span><span className={styles.info}>{info}</span></span>
  else label = standing ? `${name} · ${info}` : `${name} ${info}`
  return (
    <div className={classes} style={{ '--s': scale } as CSSProperties} data-seat>
      {open && <CheerMenu employee={e} standing={standing} isMe={isMe} onCheer={onCheer} onSitDown={onSitDown} />}
      {floats.map((c, i) => (
        <span key={c.id} className={styles.float} style={{ marginLeft: i * 18 }} aria-hidden="true">
          {c.emoji}
        </span>
      ))}
      <button
        type="button"
        className={styles.seatButton}
        onClick={onToggle}
        aria-expanded={open}
        title={t('room.seatTitle', { name: e.name, duration: formatDuration(e.todaySeconds, lang) })}
      >
        <Bubble tone={tone}>{label}</Bubble>
        <PixelPerson figure={e.figure} pose={standing ? 'stand' : 'sit'} crown={isLeader} scale={scale} />
      </button>
    </div>
  )
}
