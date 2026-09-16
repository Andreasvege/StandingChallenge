// Norwegian bokmål (default) and English. The two dictionaries in `locales/*.json` are the single
// source of truth; this is the thin typed loader plus the pure `t()` helper. Nothing here touches
// React, so server actions can translate their error messages too.

import en from '@/locales/en.json'
import nb from '@/locales/nb.json'

export const LANGS = ['nb', 'en'] as const
export type Lang = (typeof LANGS)[number]

/** Norwegian bokmål — what the server renders and what everyone gets unless their browser is English. */
export const DEFAULT_LANG: Lang = 'nb'

/** The language's own name, for the toggle — never translated. */
export const LANG_NAMES: Record<Lang, string> = { nb: 'Norsk', en: 'English' }

/** Every key in `locales/nb.json`. A key missing from `en.json` is a type error on DICTIONARIES. */
export type MessageKey = keyof typeof nb

export type MessageParams = Record<string, string | number>

export const DICTIONARIES: Record<Lang, Record<MessageKey, string>> = { nb, en }

export function isLang(value: unknown): value is Lang {
  return typeof value === 'string' && (LANGS as readonly string[]).includes(value)
}

/** Narrows anything crossing a boundary (a server action argument, localStorage) to a language. */
export function toLang(value: unknown): Lang {
  return isLang(value) ? value : DEFAULT_LANG
}

/**
 * The language to use for a browser: English only when the browser's preferred language is English,
 * Norwegian for everything else. Pass `navigator.languages` (or a single tag).
 */
export function langFromBrowser(languages: readonly string[] | string | undefined | null): Lang {
  const list = typeof languages === 'string' ? [languages] : (languages ?? [])
  const preferred = list.find(l => typeof l === 'string' && l.trim() !== '')
  return preferred?.trim().toLowerCase().startsWith('en') ? 'en' : DEFAULT_LANG
}

/** Fills `{name}` placeholders; a placeholder without a value is left alone. */
function fill(template: string, params?: MessageParams): string {
  if (!params) return template
  return template.replace(/\{(\w+)\}/g, (whole, name: string) => (name in params ? String(params[name]) : whole))
}

/** The translated string, falling back to Norwegian if a language is somehow missing the key. */
export function t(lang: Lang, key: MessageKey, params?: MessageParams): string {
  const dictionary = DICTIONARIES[lang] ?? DICTIONARIES[DEFAULT_LANG]
  return fill(dictionary[key] ?? DICTIONARIES[DEFAULT_LANG][key], params)
}
