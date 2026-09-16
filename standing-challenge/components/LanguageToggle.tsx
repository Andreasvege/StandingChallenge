'use client'

import { useEffect } from 'react'
import { LANG_NAMES, t } from '@/lib/i18n'
import { setLang, useLang } from './useLang'

/** Switches between Norwegian bokmål and English, and remembers the choice on this device. */
export function LanguageToggle({ className }: { className?: string }) {
  const lang = useLang()
  const other = lang === 'nb' ? 'en' : 'nb'

  // Keep <html lang> honest for screen readers and hyphenation once the client language is known.
  useEffect(() => {
    document.documentElement.lang = lang
  }, [lang])

  return (
    <button type="button" className={className} onClick={() => setLang(other)} title={t(lang, 'lang.switch')} aria-label={t(lang, 'lang.switch')}>
      🌐 {LANG_NAMES[other]}
    </button>
  )
}
