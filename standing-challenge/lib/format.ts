// Duration/clock formatting shared by bubbles, lists and the tab title. The words come from the
// dictionaries, so «1 t 5 min» reads «1 h 5 min» in English while the clock stays language-neutral.

import { DEFAULT_LANG, t, type Lang } from './i18n'

/** Compact duration: «32 min», «1 t 5 min», «2 t» (English: "32 min", "1 h 5 min", "2 h"). */
export function formatDuration(totalSeconds: number, lang: Lang = DEFAULT_LANG): string {
  const s = Math.max(0, Math.floor(totalSeconds))
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  if (h === 0) return t(lang, 'format.minutes', { minutes: m })
  return m === 0 ? t(lang, 'format.hours', { hours: h }) : t(lang, 'format.hoursMinutes', { hours: h, minutes: m })
}

/** Clock-style time: "32:10", "5:03", "1:02:05". The same in every language. */
export function formatClock(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds))
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = String(s % 60).padStart(2, '0')
  return h > 0 ? `${h}:${String(m).padStart(2, '0')}:${sec}` : `${m}:${sec}`
}

/** «september» / «September»: the month's name (1–12) in the reader's language. */
export function monthName(month: number, lang: Lang = DEFAULT_LANG): string {
  return new Intl.DateTimeFormat(lang === 'en' ? 'en-GB' : 'nb-NO', { month: 'long', timeZone: 'UTC' }).format(Date.UTC(2026, month - 1, 15))
}
