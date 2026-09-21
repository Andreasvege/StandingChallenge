// The office dogs. One walks the floor each day, picked from the date so the whole office sees the
// same dog until Oslo midnight — the same trick as the fun fact on the noticeboard.
// Adding a dog is one entry here plus its drawing; nothing else in the room needs to change.

import { OUTLINE, type Rect } from './sprite'

const r = (x: number, y: number, w: number, h: number, fill: string): Rect => ({ x, y, w, h, fill })

const BODY = '#d49a64'
const EAR = '#8a5a36'
const BELLY = '#f3d6a6'
const COLLAR = '#ff6fa8'
const GINKO_BODY = '#e3b083'
const GINKO_EAR = '#a86f42'

export interface OfficeDog {
  id: string
  name: string
  /** The colleague whose dog it is, shown when you tap. */
  owner: string
  /** Drawing box in sprite pixels; the room renders it at three times this. */
  w: number
  h: number
  rects: Rect[]
}

/** Anja's dog: the one who has always walked this floor, now with a name. */
const ANTONIO: OfficeDog = {
  id: 'antonio',
  name: 'Antonio Conte',
  owner: 'Anja',
  w: 17,
  h: 12,
  rects: [
    r(0, 2, 3, 2, OUTLINE),
    r(2, 3, 12, 7, OUTLINE),
    r(10, 0, 7, 7, OUTLINE),
    r(3, 4, 10, 5, BODY),
    r(11, 1, 5, 5, BODY),
    r(1, 3, 2, 1, BODY),
    r(11, 1, 2, 3, EAR),
    r(14, 3, 1, 1, OUTLINE),
    r(16, 4, 1, 1, OUTLINE),
    r(4, 7, 6, 2, BELLY),
    r(3, 10, 2, 2, OUTLINE),
    r(11, 10, 2, 2, OUTLINE),
    r(8, 4, 2, 1, COLLAR),
  ],
}

/** Joar's dog: a light brown dachshund, so long body and short legs. */
const GINKO: OfficeDog = {
  id: 'ginko',
  name: 'Ginko',
  owner: 'Joar',
  // A wider box than the others: the head end needs eight pixels across (ear 2, skull 3, snout 2,
  // nose 1) before a face reads at all, and the body still has to be long enough to be a dachshund.
  w: 26,
  h: 12,
  rects: [
    r(0, 2, 3, 3, OUTLINE), // tail, joined to the body's back corner
    r(2, 4, 18, 6, OUTLINE), // the long body
    r(4, 9, 2, 3, OUTLINE), // four short legs
    r(8, 9, 2, 3, OUTLINE),
    r(14, 9, 2, 3, OUTLINE),
    r(18, 9, 2, 3, OUTLINE),
    r(18, 0, 8, 6, OUTLINE), // head, overlapping the body so the neck merges
    r(1, 3, 1, 1, GINKO_BODY),
    r(3, 5, 16, 4, GINKO_BODY),
    r(5, 8, 11, 1, BELLY),
    r(20, 1, 3, 4, GINKO_BODY), // skull
    r(23, 2, 2, 3, GINKO_BODY), // snout, stepped down from the skull
    r(18, 1, 2, 5, GINKO_EAR), // ear at the very back, so it never crowds the face
    r(21, 2, 1, 1, OUTLINE), // eye
    r(17, 5, 1, 3, COLLAR), // collar on the neck, where a collar goes
  ],
}

export const DOGS: OfficeDog[] = [ANTONIO, GINKO]

/**
 * The dog on the floor today. Picked from the day so everyone sees the same one and it changes at
 * midnight; `dayStart` is the Oslo midnight from lib/time.ts. The doubled modulo keeps the index on
 * the list for days before 1970, where a plain `%` returns a negative remainder.
 */
export function dogOfTheDay(dayStart: number, dogs: OfficeDog[] = DOGS): OfficeDog {
  const day = Math.floor(dayStart / 86_400_000)
  return dogs[((day % dogs.length) + dogs.length) % dogs.length]
}
