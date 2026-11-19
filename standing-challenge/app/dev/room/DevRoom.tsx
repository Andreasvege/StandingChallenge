'use client'

import { useState, type ComponentProps } from 'react'
import { Leaderboard } from '@/components/Leaderboard'
import { OfficeRoom } from '@/components/office/OfficeRoom'
import { demoMonthBoard } from '@/lib/demo-office'

type DevRoomProps = ComponentProps<typeof OfficeRoom> & {
  /** Make the colleague menu's buttons work (they only log). */
  actions: boolean
}

/** The room for /dev/room: the month panel reads demo months, and with `actions` every menu button logs. */
export function DevRoom({ actions, ...props }: DevRoomProps) {
  const [podiumShown, setPodiumShown] = useState(true)
  const loadMonth = async ({ monthStart }: { monthStart: number }) => demoMonthBoard(props.employees, props.now, monthStart)
  return (
    <>
    <OfficeRoom
      {...props}
      loadMonth={loadMonth}
      onPodiumShown={setPodiumShown}
      onCheer={actions ? (to, emoji) => console.log('[dev] cheer', to, emoji) : undefined}
      onSitDown={actions ? to => console.log('[dev] sit down', to) : undefined}
      onStartFor={actions ? (to, back) => console.log('[dev] start for', to, back) : undefined}
    />
    <Leaderboard employees={props.employees} meId={props.meId ?? ''} now={props.now} podiumShown={podiumShown} loadMonth={loadMonth} />
    </>
  )
}
