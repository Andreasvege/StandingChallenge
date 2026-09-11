'use client'

import { useMemo, useState, useTransition } from 'react'
import { extendStanding, startStanding, stopStanding } from '@/app/actions/stand'
import { requestNotificationPermission, warmUpAudio } from '@/lib/alerts'
import type { RoundMinutes } from '@/lib/sessions'
import { liveEmployee, type OfficeSnapshot } from '@/lib/snapshot'
import { Leaderboard } from './Leaderboard'
import { MyStatus } from './MyStatus'
import { OfficeHeader } from './OfficeHeader'
import { OfficeRoom } from './office/OfficeRoom'
import { StillStandingDialog } from './StillStandingDialog'
import { useDynamicFavicon, useOfficeSnapshot, useServerNow, useSoundSetting, useStandAlerts, useTabTitle } from './useOffice'
import styles from './OfficeApp.module.css'

interface OfficeAppProps {
  initial: OfficeSnapshot
  meId: string
  isAdmin: boolean
}

export function OfficeApp({ initial, meId, isAdmin }: OfficeAppProps) {
  const { snapshot, accept, offline } = useOfficeSnapshot(initial)
  const now = useServerNow(snapshot.now)
  const sound = useSoundSetting()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const live = useMemo(
    () => snapshot.employees.map(e => liveEmployee(e, snapshot.now, now, snapshot.graceMs)),
    [snapshot, now],
  )
  const me = live.find(e => e.id === meId) ?? null

  useStandAlerts(me, sound.on)
  useTabTitle(me, now)
  useDynamicFavicon(me?.figure ?? null, me ? me.phase !== 'sitting' : false)

  function run(action: () => Promise<OfficeSnapshot>) {
    setError(null)
    startTransition(async () => {
      try {
        accept(await action())
      } catch {
        setError('Noe gikk galt. Prøv igjen.')
      }
    })
  }

  function start(minutes: RoundMinutes) {
    warmUpAudio() // unlock audio from this click so the pling can play when the round ends
    void requestNotificationPermission()
    run(() => startStanding(minutes))
  }

  const standing = live.filter(e => e.phase !== 'sitting').length
  const todayTotal = live.reduce((sum, e) => sum + e.todaySeconds, 0)

  return (
    <div className={styles.app}>
      <OfficeHeader
        me={me}
        standing={standing}
        total={live.length}
        todayTotalSeconds={todayTotal}
        isAdmin={isAdmin}
        offline={offline}
        soundOn={sound.on}
        onToggleSound={sound.toggle}
      >
        <MyStatus me={me} now={now} pending={pending} error={error} onStart={start} onStop={() => run(stopStanding)} />
      </OfficeHeader>
      <OfficeRoom employees={live} leaderId={snapshot.leaderId} now={now} meId={meId} />
      <Leaderboard employees={live} meId={meId} />
      {me?.phase === 'awaiting' && me.session && (
        <StillStandingDialog
          me={me}
          session={me.session}
          now={now}
          graceMs={snapshot.graceMs}
          pending={pending}
          onExtend={() => run(extendStanding)}
          onStop={() => run(stopStanding)}
        />
      )}
    </div>
  )
}
