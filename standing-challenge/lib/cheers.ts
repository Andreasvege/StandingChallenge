// Heiarop: tap a colleague and send a little emoji that floats up above their head for everyone.
// Pure rules here; app/actions/cheer.ts stores them and lib/office.ts puts recent ones in the snapshot.

import { DEFAULT_LANG, t, type Lang, type MessageKey } from './i18n'

/** For someone standing: cheer them on. */
export const STANDING_CHEERS = ['👏', '🔥', '💪', '☕'] as const
/** For someone sitting: a friendly nudge («reis deg!»), a look, or a coffee. */
export const SITTING_CHEERS = ['⬆️', '👀', '☕'] as const
export const CHEER_EMOJIS: readonly string[] = [...new Set<string>([...STANDING_CHEERS, ...SITTING_CHEERS])]

/** One person can cheer the same colleague at most once per 30 s. */
export const CHEER_COOLDOWN_MS = 30_000
/** Recent cheers stay in the snapshot this long – longer than one poll, so everyone gets to see them. */
export const CHEER_SHOW_MS = 8_000

export interface Cheer {
  id: string
  fromId: string
  toId: string
  emoji: string
  /** Epoch ms when it was sent. */
  at: number
}

export function isCheerEmoji(value: unknown): value is string {
  return typeof value === 'string' && CHEER_EMOJIS.includes(value)
}

export function cheerOptions(targetStanding: boolean): readonly string[] {
  return targetStanding ? STANDING_CHEERS : SITTING_CHEERS
}

export function canCheer(
  a: { fromId: string; toId: string; lastCheerAt: number | null; now: number },
  lang: Lang = DEFAULT_LANG,
): { ok: true } | { ok: false; reason: string } {
  if (a.fromId === a.toId) return { ok: false, reason: t(lang, 'cheer.self') }
  if (a.lastCheerAt !== null && a.now - a.lastCheerAt < CHEER_COOLDOWN_MS) {
    return { ok: false, reason: t(lang, 'cheer.cooldown') }
  }
  return { ok: true }
}

/** Cheers still worth showing at `now`, with a little slack for clock skew between browser and server. */
export function activeCheers(cheers: readonly Cheer[], now: number): Cheer[] {
  return cheers.filter(c => now - c.at < CHEER_SHOW_MS && c.at - now < 2_000)
}

const MESSAGE_KEYS: Record<string, MessageKey> = {
  '⬆️': 'cheer.nudge',
  '👀': 'cheer.watching',
  '☕': 'cheer.coffee',
}

/** What the receiver sees, e.g. «Emma heiet på deg 🔥». */
export function cheerMessage(c: Cheer, fromName: string, lang: Lang = DEFAULT_LANG): string {
  const key = MESSAGE_KEYS[c.emoji]
  return key ? t(lang, key, { name: fromName }) : t(lang, 'cheer.default', { name: fromName, emoji: c.emoji })
}
