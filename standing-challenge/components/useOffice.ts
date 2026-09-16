// Client hooks for the main page: polling, a server-corrected clock, sound setting, alerts, tab title, favicon.

import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react'
import { playPling, showStillStandingNotification } from '@/lib/alerts'
import type { Figure } from '@/lib/figure'
import { formatClock } from '@/lib/format'
import { DEFAULT_LANG, t, type Lang } from '@/lib/i18n'
import type { LiveEmployee, OfficeSnapshot } from '@/lib/snapshot'
import { HEAD_BOX, spriteRects } from '@/lib/sprite'

/** Polls /api/office every `intervalMs` and when the tab regains focus. */
export function useOfficeSnapshot(initial: OfficeSnapshot, intervalMs = 5000) {
  const router = useRouter()
  const [snapshot, setSnapshot] = useState(initial)
  const [offline, setOffline] = useState(false)

  /** Keep whichever snapshot is newest, so a slow poll never undoes a fresh action result. */
  const accept = useCallback((next: OfficeSnapshot) => {
    setSnapshot(prev => (next.now >= prev.now ? next : prev))
  }, [])

  useEffect(() => {
    async function refresh() {
      try {
        const res = await fetch('/api/office', { cache: 'no-store' })
        if (res.status === 401) {
          router.replace('/login')
          return
        }
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        accept((await res.json()) as OfficeSnapshot)
        setOffline(false)
      } catch {
        setOffline(true)
      }
    }
    const id = setInterval(refresh, intervalMs)
    const onVisible = () => {
      if (document.visibilityState === 'visible') void refresh()
    }
    window.addEventListener('focus', onVisible)
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      clearInterval(id)
      window.removeEventListener('focus', onVisible)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [accept, intervalMs, router])

  return { snapshot, accept, offline }
}

/** Ticks every second on the server's clock (corrected by the offset seen in the last snapshot). */
export function useServerNow(serverNow: number): number {
  const offset = useRef(0)
  const [now, setNow] = useState(serverNow)
  useEffect(() => {
    offset.current = serverNow - Date.now()
  }, [serverNow])
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now() + offset.current), 1000)
    return () => clearInterval(id)
  }, [])
  return Math.max(now, serverNow)
}

const SOUND_KEY = 'stapa-sound'
const soundListeners = new Set<() => void>()

function subscribeSound(cb: () => void) {
  soundListeners.add(cb)
  window.addEventListener('storage', cb)
  return () => {
    soundListeners.delete(cb)
    window.removeEventListener('storage', cb)
  }
}

function readSound(): boolean {
  try {
    return localStorage.getItem(SOUND_KEY) !== '0'
  } catch {
    return true
  }
}

/** Sound on/off, persisted in localStorage (default on). */
export function useSoundSetting() {
  const on = useSyncExternalStore(subscribeSound, readSound, () => true)
  const toggle = useCallback(() => {
    try {
      localStorage.setItem(SOUND_KEY, on ? '0' : '1')
    } catch {
      // Storage unavailable — the toggle just won't stick.
    }
    soundListeners.forEach(l => l())
  }, [on])
  return { on, toggle }
}

/** Plays the pling and shows the notification once per round end. */
export function useStandAlerts(me: LiveEmployee | null, soundOn: boolean, lang: Lang = DEFAULT_LANG) {
  const firedFor = useRef<number | null>(null)
  const awaiting = me?.phase === 'awaiting'
  const roundEndsAt = me?.session?.roundEndsAt ?? null
  const minutes = me ? Math.round(me.elapsedSeconds / 60) : 0
  useEffect(() => {
    if (!awaiting || roundEndsAt === null || firedFor.current === roundEndsAt) return
    firedFor.current = roundEndsAt
    if (soundOn) playPling()
    showStillStandingNotification(minutes, lang)
  }, [awaiting, roundEndsAt, soundOn, minutes, lang])
}

/** "32:10 · Står" while standing, "⏰ Står du fortsatt?" while awaiting an answer. */
export function useTabTitle(me: LiveEmployee | null, now: number, lang: Lang = DEFAULT_LANG) {
  const phase = me?.phase ?? 'sitting'
  const roundEndsAt = me?.session?.roundEndsAt ?? null
  useEffect(() => {
    if (phase === 'standing' && roundEndsAt !== null) document.title = t(lang, 'tab.standing', { clock: formatClock((roundEndsAt - now) / 1000) })
    else if (phase === 'awaiting') document.title = t(lang, 'tab.stillStanding')
    else document.title = 'Stå på!'
  }, [phase, roundEndsAt, now, lang])
}

/** Draws my pixel head (awake or dozing) as the tab icon — same trick as pomodorotimer's favicon. */
export function useDynamicFavicon(figure: Figure | null, standing: boolean) {
  useEffect(() => {
    if (!figure) return
    const scale = 3
    const dy = standing ? 0 : 6 // the sitting head is drawn 6 px lower
    const canvas = document.createElement('canvas')
    canvas.width = HEAD_BOX.w * scale
    canvas.height = HEAD_BOX.h * scale
    const g = canvas.getContext('2d')
    if (!g) return
    for (const r of spriteRects(figure, { pose: standing ? 'stand' : 'sit' })) {
      g.fillStyle = r.fill
      g.fillRect((r.x - HEAD_BOX.x) * scale, (r.y - HEAD_BOX.y - dy) * scale, r.w * scale, r.h * scale)
    }
    let link = document.querySelector<HTMLLinkElement>('link#dynamic-favicon')
    if (!link) {
      link = document.createElement('link')
      link.id = 'dynamic-favicon'
      link.rel = 'icon'
      link.type = 'image/png'
      document.head.appendChild(link)
    }
    link.href = canvas.toDataURL('image/png')
  }, [figure, standing])
}
