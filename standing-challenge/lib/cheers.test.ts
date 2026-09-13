import { describe, it, expect } from 'vitest'
import { CHEER_COOLDOWN_MS, CHEER_EMOJIS, CHEER_SHOW_MS, activeCheers, canCheer, cheerMessage, cheerOptions, isCheerEmoji, type Cheer } from './cheers'
import { buildSnapshot } from './snapshot'

const cheer = (over: Partial<Cheer> = {}): Cheer => ({ id: 'c1', fromId: 'emma', toId: 'even', emoji: '🔥', at: 1_000_000, ...over })

describe('cheer emojis', () => {
  it('offers cheers to standing people and a nudge to sitting ones', () => {
    expect(cheerOptions(true)).toContain('👏')
    expect(cheerOptions(true)).not.toContain('⬆️')
    expect(cheerOptions(false)).toContain('⬆️')
  })
  it('knows every offered emoji and nothing else', () => {
    for (const e of [...cheerOptions(true), ...cheerOptions(false)]) expect(isCheerEmoji(e)).toBe(true)
    expect(new Set(CHEER_EMOJIS).size).toBe(CHEER_EMOJIS.length)
    expect(isCheerEmoji('💩')).toBe(false)
    expect(isCheerEmoji(42)).toBe(false)
  })
})

describe('canCheer', () => {
  const now = 5_000_000
  it('allows a first cheer', () => {
    expect(canCheer({ fromId: 'a', toId: 'b', lastCheerAt: null, now })).toEqual({ ok: true })
  })
  it('refuses cheering yourself', () => {
    expect(canCheer({ fromId: 'a', toId: 'a', lastCheerAt: null, now }).ok).toBe(false)
  })
  it('enforces the cooldown per colleague', () => {
    expect(canCheer({ fromId: 'a', toId: 'b', lastCheerAt: now - CHEER_COOLDOWN_MS + 1, now }).ok).toBe(false)
    expect(canCheer({ fromId: 'a', toId: 'b', lastCheerAt: now - CHEER_COOLDOWN_MS, now }).ok).toBe(true)
  })
})

describe('activeCheers', () => {
  it('keeps cheers from the last few seconds only', () => {
    const now = 1_000_000
    const list = [cheer({ id: 'new', at: now - 1_000 }), cheer({ id: 'edge', at: now - CHEER_SHOW_MS }), cheer({ id: 'future', at: now + 5_000 })]
    expect(activeCheers(list, now).map(c => c.id)).toEqual(['new'])
  })
})

describe('cheerMessage', () => {
  it('reads naturally for each kind', () => {
    expect(cheerMessage(cheer(), 'Emma')).toBe('Emma heiet på deg 🔥')
    expect(cheerMessage(cheer({ emoji: '⬆️' }), 'Emma')).toBe('Emma dytter deg: reis deg! ⬆️')
    expect(cheerMessage(cheer({ emoji: '☕' }), 'Emma')).toBe('Emma spanderer en kaffe ☕')
  })
})

describe('buildSnapshot', () => {
  it('passes recent cheers through to every browser', () => {
    const c = cheer()
    expect(buildSnapshot([], [], 1_000_000, 300_000, [c]).cheers).toEqual([c])
    expect(buildSnapshot([], [], 1_000_000, 300_000).cheers).toEqual([])
  })
})
