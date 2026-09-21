import { describe, it, expect } from 'vitest'
import { DOGS, dogOfTheDay } from './dogs'

const DAY = 86_400_000
// An arbitrary day well inside the epoch, so the maths is not accidentally testing day 0.
const SOME_DAY = 20_000 * DAY

describe('DOGS', () => {
  it('gives every dog a unique id, a name and an owner', () => {
    const ids = DOGS.map(d => d.id)
    expect(new Set(ids).size).toBe(ids.length)
    for (const dog of DOGS) {
      expect(dog.name.length).toBeGreaterThan(0)
      expect(dog.owner.length).toBeGreaterThan(0)
    }
  })

  it('keeps every dog inside its own box, so the walk never clips', () => {
    for (const dog of DOGS) {
      expect(dog.rects.length).toBeGreaterThan(0)
      for (const r of dog.rects) {
        expect(r.x).toBeGreaterThanOrEqual(0)
        expect(r.y).toBeGreaterThanOrEqual(0)
        expect(r.x + r.w).toBeLessThanOrEqual(dog.w)
        expect(r.y + r.h).toBeLessThanOrEqual(dog.h)
      }
    }
  })
})

describe('dogOfTheDay', () => {
  it('gives the whole office the same dog all day, and a different one tomorrow', () => {
    expect(dogOfTheDay(SOME_DAY)).toBe(dogOfTheDay(SOME_DAY))
    expect(dogOfTheDay(SOME_DAY + DAY)).not.toBe(dogOfTheDay(SOME_DAY))
  })

  it('works through the whole list and comes back around', () => {
    const seen = DOGS.map((_, i) => dogOfTheDay(SOME_DAY + i * DAY))
    expect(new Set(seen).size).toBe(DOGS.length)
    expect(dogOfTheDay(SOME_DAY + DOGS.length * DAY)).toBe(dogOfTheDay(SOME_DAY))
  })

  // JS gives a negative remainder for negative numbers, so a plain `% length` would index off
  // the front of the list for any day before 1970.
  it('never falls off the list, even before 1970', () => {
    for (let day = -400; day < 400; day++) {
      expect(DOGS).toContain(dogOfTheDay(day * DAY))
    }
  })
})
