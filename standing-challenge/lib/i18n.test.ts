import { describe, it, expect } from 'vitest'
import { formatDuration } from './format'
import { DEFAULT_LANG, DICTIONARIES, LANGS, isLang, langFromBrowser, t, toLang, type MessageKey } from './i18n'

const placeholders = (s: string) => [...s.matchAll(/\{(\w+)\}/g)].map(m => m[1]).sort()

describe('dictionaries', () => {
  it('has exactly the same keys in both languages', () => {
    const nbKeys = Object.keys(DICTIONARIES.nb).sort()
    const enKeys = Object.keys(DICTIONARIES.en).sort()
    expect(enKeys).toEqual(nbKeys)
    expect(nbKeys.length).toBeGreaterThan(0)
  })
  it('has no empty or whitespace-only strings', () => {
    for (const lang of LANGS) {
      for (const [key, value] of Object.entries(DICTIONARIES[lang])) {
        expect(typeof value, `${lang}.${key}`).toBe('string')
        expect(value.trim(), `${lang}.${key}`).not.toBe('')
      }
    }
  })
  it('uses the same placeholders in both languages', () => {
    for (const key of Object.keys(DICTIONARIES.nb) as MessageKey[]) {
      expect(placeholders(DICTIONARIES.en[key]), key).toEqual(placeholders(DICTIONARIES.nb[key]))
    }
  })
})

describe('t', () => {
  it('translates and fills placeholders', () => {
    expect(t('nb', 'board.today')).toBe('I dag')
    expect(t('en', 'board.today')).toBe('Today')
    expect(t('nb', 'board.showAll', { count: 12 })).toBe('Vis alle (12)')
    expect(t('en', 'board.showAll', { count: 12 })).toBe('Show all (12)')
  })
  it('leaves a placeholder alone when no value is given', () => {
    expect(t('en', 'board.showAll')).toBe('Show all ({count})')
  })
})

describe('langFromBrowser', () => {
  it('picks English only when the browser prefers English', () => {
    expect(langFromBrowser(['en-GB', 'nb'])).toBe('en')
    expect(langFromBrowser('en')).toBe('en')
    expect(langFromBrowser('EN-US')).toBe('en')
    expect(langFromBrowser(['nb-NO', 'en'])).toBe('nb')
    expect(langFromBrowser(['de-DE'])).toBe('nb')
    expect(langFromBrowser([])).toBe('nb')
    expect(langFromBrowser(undefined)).toBe('nb')
    expect(langFromBrowser([' ', 'en'])).toBe('en')
  })
})

describe('isLang', () => {
  it('accepts only the languages we ship', () => {
    expect(isLang('nb')).toBe(true)
    expect(isLang('en')).toBe(true)
    expect(isLang('de')).toBe(false)
    expect(isLang(null)).toBe(false)
    expect(DEFAULT_LANG).toBe('nb')
  })
  it('falls back to Norwegian for anything else', () => {
    expect(toLang('en')).toBe('en')
    expect(toLang('nb')).toBe('nb')
    expect(toLang('de')).toBe('nb')
    expect(toLang(undefined)).toBe('nb')
    expect(toLang(7)).toBe('nb')
  })
})

describe('formatDuration per language', () => {
  it('keeps the Norwegian wording and uses hours in English', () => {
    expect(formatDuration(1920, 'nb')).toBe('32 min')
    expect(formatDuration(1920, 'en')).toBe('32 min')
    expect(formatDuration(3600, 'nb')).toBe('1 t')
    expect(formatDuration(3600, 'en')).toBe('1 h')
    expect(formatDuration(3900, 'nb')).toBe('1 t 5 min')
    expect(formatDuration(3900, 'en')).toBe('1 h 5 min')
    expect(formatDuration(7250, 'en')).toBe('2 h')
  })
  it('defaults to Norwegian', () => {
    expect(formatDuration(3900)).toBe('1 t 5 min')
  })
})
