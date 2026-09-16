import { describe, it, expect } from 'vitest'
import { FUN_FACTS, factOfTheDay, nextFact } from './fun-facts'
import { osloDayStart } from './time'

describe('FUN_FACTS', () => {
  it('has both languages for every fact, with unique ids', () => {
    expect(FUN_FACTS.length).toBeGreaterThan(5)
    for (const f of FUN_FACTS) {
      expect(f.nb.trim().length).toBeGreaterThan(20)
      expect(f.en.trim().length).toBeGreaterThan(20)
      expect(f.nb).not.toBe(f.en)
    }
    expect(new Set(FUN_FACTS.map(f => f.id)).size).toBe(FUN_FACTS.length)
  })
  it('keeps them short enough to read in one go', () => {
    // A generous ceiling: the poster opens a panel, so a fact may be a few sentences with a joke in
    // it — but not an essay nobody reads standing at their desk.
    for (const f of FUN_FACTS) {
      expect(f.nb.length, `too long: "${f.id}" (nb)`).toBeLessThanOrEqual(280)
      expect(f.en.length, `too long: "${f.id}" (en)`).toBeLessThanOrEqual(280)
    }
  })
  it('cites a real source for every fact', () => {
    // The whole point of this list: no claim goes on the wall without something to check it against.
    for (const f of FUN_FACTS) {
      expect(f.source.trim().length, `missing source for "${f.id}"`).toBeGreaterThan(0)
    }
  })
})

describe('factOfTheDay', () => {
  it('gives everyone the same fact on the same day', () => {
    const day = osloDayStart(Date.parse('2026-09-16T09:00:00Z'))
    expect(factOfTheDay(day)).toEqual(factOfTheDay(day))
  })
  it('changes from one day to the next', () => {
    const today = osloDayStart(Date.parse('2026-09-16T09:00:00Z'))
    const tomorrow = osloDayStart(Date.parse('2026-09-17T09:00:00Z'))
    expect(factOfTheDay(today).id).not.toBe(factOfTheDay(tomorrow).id)
  })
  it('works for any day, also before 1970', () => {
    for (const iso of ['1969-07-20T00:00:00Z', '2026-01-01T12:00:00Z', '2030-12-31T23:00:00Z']) {
      expect(FUN_FACTS).toContain(factOfTheDay(osloDayStart(Date.parse(iso))))
    }
  })
})

describe('nextFact', () => {
  it('cycles through every fact and comes back around', () => {
    let fact = FUN_FACTS[0]
    const seen = new Set<string>()
    for (let i = 0; i < FUN_FACTS.length; i++) {
      seen.add(fact.id)
      fact = nextFact(fact)
    }
    expect(seen.size).toBe(FUN_FACTS.length)
    expect(fact).toEqual(FUN_FACTS[0])
  })
})
