'use client'

// The language this device shows, kept the same way useSoundSetting keeps the sound setting:
// localStorage read through useSyncExternalStore. The server snapshot is always Norwegian, so the
// server-rendered HTML and the hydration pass agree; the real language is read after mount and the
// UI swaps then — no hydration mismatch.

import { useCallback, useSyncExternalStore } from 'react'
import { DEFAULT_LANG, isLang, langFromBrowser, t as translate, type Lang, type MessageKey, type MessageParams } from '@/lib/i18n'

const LANG_KEY = 'stapa-lang'
const listeners = new Set<() => void>()

function subscribe(cb: () => void) {
  listeners.add(cb)
  window.addEventListener('storage', cb)
  return () => {
    listeners.delete(cb)
    window.removeEventListener('storage', cb)
  }
}

/** The manual choice when there is one, otherwise whatever the browser asks for. */
function readLang(): Lang {
  try {
    const saved = localStorage.getItem(LANG_KEY)
    if (isLang(saved)) return saved
  } catch {
    // Storage unavailable — follow the browser instead.
  }
  if (typeof navigator === 'undefined') return DEFAULT_LANG
  return langFromBrowser(navigator.languages ?? navigator.language)
}

export function useLang(): Lang {
  return useSyncExternalStore(subscribe, readLang, () => DEFAULT_LANG)
}

/** Remembers the override on this device and swaps every open component over. */
export function setLang(lang: Lang): void {
  try {
    localStorage.setItem(LANG_KEY, lang)
  } catch {
    // Storage unavailable — the choice just won't stick.
  }
  listeners.forEach(l => l())
}

/** The current language and a `t()` bound to it. */
export function useTranslation(): { lang: Lang; t: (key: MessageKey, params?: MessageParams) => string } {
  const lang = useLang()
  const t = useCallback((key: MessageKey, params?: MessageParams) => translate(lang, key, params), [lang])
  return { lang, t }
}
