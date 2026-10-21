'use client'

import { useMemo, useState, useTransition } from 'react'
import { sitEmployeeDown } from '@/app/actions/admin'
import { sendCheer } from '@/app/actions/cheer'
import { extendStanding, rejectStartedForMe, startStanding, startStandingFor, stopStanding } from '@/app/actions/stand'
import { requestNotificationPermission, warmUpAudio } from '@/lib/alerts'
import { activeCheers, cheerMessage } from '@/lib/cheers'
import { liveEmployee, type OfficeSnapshot } from '@/lib/snapshot'
import { CheerToasts } from './CheerToasts'
import { Leaderboard } from './Leaderboard'
import { MyStatus } from './MyStatus'
import { OfficeHeader } from './OfficeHeader'
import { OfficeRoom } from './office/OfficeRoom'
import { StandUntilDialog } from './StandUntilDialog'
import { StillStandingDialog } from './StillStandingDialog'
import { useTranslation } from './useLang'
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
  const { lang, t } = useTranslation()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [standUntilOpen, setStandUntilOpen] = useState(false)

  const live = useMemo(
    () => snapshot.employees.map(e => liveEmployee(e, snapshot.now, now, snapshot.graceMs)),
    [snapshot, now],
  )
  const me = live.find(e => e.id === meId) ?? null
  const cheers = snapshot.cheers ?? []
  const incoming = activeCheers(cheers, now)
    .filter(c => c.toId === meId)
    .map(c => ({ id: c.id, text: cheerMessage(c, live.find(e => e.id === c.fromId)?.name ?? t('app.someone'), lang) }))

  useStandAlerts(me, sound.on, lang)
  useTabTitle(me, now, lang)
  useDynamicFavicon(me?.figure ?? null, me ? me.phase !== 'sitting' : false)

  function run(action: () => Promise<OfficeSnapshot>) {
    setError(null)
    startTransition(async () => {
      try {
        accept(await action())
      } catch {
        setError(t('app.error.generic'))
      }
    })
  }

  function start(minutes: number) {
    warmUpAudio() // unlock audio from this click so the pling can play when the round ends
    void requestNotificationPermission()
    run(() => startStanding(minutes, lang))
  }

  function cheer(toId: string, emoji: string) {
    setError(null)
    startTransition(async () => {
      try {
        const result = await sendCheer(toId, emoji, lang)
        accept(result.snapshot)
        if (!result.ok) setError(result.message)
      } catch {
        setError(t('app.error.generic'))
      }
    })
  }

  function startFor(toId: string, backMinutes: number) {
    setError(null)
    startTransition(async () => {
      try {
        const result = await startStandingFor(toId, backMinutes, lang)
        accept(result.snapshot)
        if (!result.ok) setError(result.message)
      } catch {
        setError(t('app.error.generic'))
      }
    })
  }

  const startedByName = me?.session?.startedById ? (live.find(e => e.id === me.session?.startedById)?.name ?? t('app.someone')) : null

  // Admin only: end a round for a colleague who left the desk raised without stopping.
  const sitDown = (toId: string) => run(() => sitEmployeeDown({ employeeId: toId }, lang))

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
        <MyStatus
          me={me}
          now={now}
          pending={pending}
          error={error}
          onStart={start}
          onStop={() => run(() => stopStanding(lang))}
          onStandUntil={() => setStandUntilOpen(true)}
          startedByName={startedByName}
          onReject={() => run(() => rejectStartedForMe(lang))}
        />
      </OfficeHeader>
      <OfficeRoom
        employees={live}
        leaderId={snapshot.leaderId}
        now={now}
        meId={meId}
        cheers={cheers}
        weather={snapshot.weather}
        trophy={snapshot.trophy}
        onCheer={cheer}
        onSitDown={isAdmin ? sitDown : undefined}
        onStartFor={startFor}
      />
      <Leaderboard employees={live} meId={meId} />
      <CheerToasts messages={incoming} />
      {standUntilOpen && (
        <StandUntilDialog
          now={now}
          pending={pending}
          onStart={minutes => {
            setStandUntilOpen(false)
            start(minutes)
          }}
          onClose={() => setStandUntilOpen(false)}
        />
      )}
      {me?.phase === 'awaiting' && me.session && (
        <StillStandingDialog
          me={me}
          session={me.session}
          now={now}
          graceMs={snapshot.graceMs}
          pending={pending}
          onExtend={() => run(() => extendStanding(lang))}
          onStop={() => run(() => stopStanding(lang))}
        />
      )}
    </div>
  )
}
