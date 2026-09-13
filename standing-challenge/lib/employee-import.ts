// Parses data/employees.json (exported from the figure-builder prototype) into validated rows.
// Pure: scripts/import-employees.ts does the database work.

import { isAllowedEmail, normalizeEmail } from './access'
import { isFigure, type Figure } from './figure'
import { SEAT_COUNT } from './room-layout'

export interface ImportedEmployee {
  name: string
  email: string
  seat: number | null
  figure: Figure
}

/**
 * Keeps only the known figure keys and lowercases colours. Also accepts older exports:
 * `facialHair: 'beard' | 'mustache' | 'none'` and the boolean `glasses` / `beard` fields.
 */
function cleanFigure(raw: unknown): unknown {
  if (!raw || typeof raw !== 'object') return raw
  const f = raw as Record<string, unknown>
  const lower = (v: unknown) => (typeof v === 'string' ? v.toLowerCase() : v)
  const beard =
    typeof f.beard === 'string' ? f.beard : f.beard === true || f.facialHair === 'beard' ? 'full' : 'none'
  const mustache = typeof f.mustache === 'boolean' ? f.mustache : f.facialHair === 'mustache'
  const eyewear = typeof f.eyewear === 'string' ? f.eyewear : f.glasses === true ? 'glasses' : 'none'
  return {
    hairStyle: f.hairStyle,
    hair: lower(f.hair),
    skin: lower(f.skin),
    shirt: lower(f.shirt),
    eyewear,
    beard,
    mustache,
    deskItem: f.deskItem,
    ...(typeof f.headwear === 'string' ? { headwear: f.headwear } : {}),
  }
}

export function parseEmployeesFile(json: unknown): { employees: ImportedEmployee[]; errors: string[] } {
  const employees: ImportedEmployee[] = []
  const errors: string[] = []
  const root = json as { version?: unknown; employees?: unknown } | null
  if (!root || typeof root !== 'object' || !Array.isArray(root.employees)) {
    return { employees, errors: ['Fila må ha formen { "version": 1, "employees": [ … ] }'] }
  }
  if (root.version !== 1) errors.push(`Ukjent versjon ${String(root.version)} (forventet 1)`)

  const seenEmails = new Set<string>()
  const seatOwner = new Map<number, string>()

  root.employees.forEach((raw, i) => {
    if (!raw || typeof raw !== 'object') {
      errors.push(`Rad ${i + 1}: ikke et objekt`)
      return
    }
    const r = raw as Record<string, unknown>
    const name = typeof r.name === 'string' ? r.name.trim() : ''
    const email = typeof r.email === 'string' ? normalizeEmail(r.email) : ''
    const label = `Rad ${i + 1} (${email || name || '?'})`
    const seat = r.seat === undefined ? null : r.seat
    const figure = cleanFigure(r.figure)
    const before = errors.length

    if (name.length < 1 || name.length > 30) errors.push(`${label}: navnet må være 1–30 tegn`)
    if (!isAllowedEmail(email)) errors.push(`${label}: e-posten må slutte på @thebrave.no`)
    else if (seenEmails.has(email)) errors.push(`${label}: e-posten står flere ganger`)
    if (seat !== null && !(typeof seat === 'number' && Number.isInteger(seat) && seat >= 0 && seat < SEAT_COUNT)) {
      errors.push(`${label}: plass må være 0–${SEAT_COUNT - 1} eller null`)
    } else if (typeof seat === 'number' && seatOwner.has(seat)) {
      errors.push(`${label}: plass ${seat} er allerede gitt til ${seatOwner.get(seat)}`)
    }
    if (!isFigure(figure)) errors.push(`${label}: ugyldig figur`)
    if (errors.length > before) return

    seenEmails.add(email)
    if (typeof seat === 'number') seatOwner.set(seat, email)
    employees.push({ name, email, seat: seat as number | null, figure: figure as Figure })
  })

  return { employees, errors }
}
