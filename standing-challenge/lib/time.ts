// Oslo calendar math without dependencies. All inputs/outputs are epoch milliseconds.

export const OSLO = 'Europe/Oslo'

const WEEKDAYS: Record<string, number> = { Mon: 0, Tue: 1, Wed: 2, Thu: 3, Fri: 4, Sat: 5, Sun: 6 }

const formatter = new Intl.DateTimeFormat('en-GB', {
  timeZone: OSLO,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hourCycle: 'h23',
  weekday: 'short',
})

export interface OsloParts {
  year: number
  month: number // 1–12
  day: number
  hour: number
  minute: number
  second: number
  weekday: number // 0 = Monday … 6 = Sunday
}

export function osloParts(ms: number): OsloParts {
  const parts: Record<string, string> = {}
  for (const p of formatter.formatToParts(new Date(ms))) parts[p.type] = p.value
  return {
    year: Number(parts.year),
    month: Number(parts.month),
    day: Number(parts.day),
    hour: Number(parts.hour),
    minute: Number(parts.minute),
    second: Number(parts.second),
    weekday: WEEKDAYS[parts.weekday],
  }
}

/** Oslo wall-clock minus UTC, in ms, at the given instant. */
function offsetAt(ms: number): number {
  const p = osloParts(ms)
  const wallAsUtc = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second)
  return wallAsUtc - Math.floor(ms / 1000) * 1000
}

/** The UTC instant of an Oslo wall-clock time. Midnight never falls in a DST gap in Oslo. */
export function osloWallToUtc(year: number, month: number, day: number, hour = 0, minute = 0): number {
  const wall = Date.UTC(year, month - 1, day, hour, minute)
  const first = wall - offsetAt(wall)
  return wall - offsetAt(first)
}

function osloMidnightOf(year: number, month: number, day: number): number {
  // Date.UTC normalises overflow (e.g. day 32 → next month) before we convert.
  const d = new Date(Date.UTC(year, month - 1, day))
  return osloWallToUtc(d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate())
}

export function osloDayStart(ms: number): number {
  const p = osloParts(ms)
  return osloMidnightOf(p.year, p.month, p.day)
}

export function osloNextDayStart(ms: number): number {
  const p = osloParts(ms)
  return osloMidnightOf(p.year, p.month, p.day + 1)
}

/** Monday 00:00 Oslo time of the week containing `ms`. */
export function osloWeekStart(ms: number): number {
  const p = osloParts(ms)
  return osloMidnightOf(p.year, p.month, p.day - p.weekday)
}

export function osloHour(ms: number): number {
  return osloParts(ms).hour
}

/** Length in seconds of the overlap between [a, b) and [c, d). */
export function overlapSeconds(a: number, b: number, c: number, d: number): number {
  return Math.max(0, Math.min(b, d) - Math.max(a, c)) / 1000
}
