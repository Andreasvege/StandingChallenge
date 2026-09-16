import { describe, it, expect } from 'vitest'
import { DEFAULT_FIGURE } from './figure'
import { parseEmployeesFile } from './employee-import'
import { SEAT_COUNT } from './room-layout'

const row = (over: Record<string, unknown> = {}) => ({ name: 'Emma', email: 'emma@thebrave.no', seat: 1, figure: DEFAULT_FIGURE, ...over })
const file = (...employees: unknown[]) => ({ version: 1, exportedAt: '2026-09-11T10:00:00Z', employees })

describe('parseEmployeesFile', () => {
  it('parses a valid file, normalising e-mail, name and colour casing', () => {
    const { employees, errors } = parseEmployeesFile(
      file(row({ name: ' Emma ', email: 'Emma@TheBrave.no', figure: { ...DEFAULT_FIGURE, shirt: '#FFF3DC' } }), row({ name: 'Mina', email: 'mina@thebrave.no', seat: null })),
    )
    expect(errors).toEqual([])
    expect(employees).toEqual([
      { name: 'Emma', email: 'emma@thebrave.no', seat: 1, figure: { ...DEFAULT_FIGURE, shirt: '#fff3dc' } },
      { name: 'Mina', email: 'mina@thebrave.no', seat: null, figure: DEFAULT_FIGURE },
    ])
  })
  it('drops unknown keys from the figure', () => {
    const { employees } = parseEmployeesFile(file(row({ figure: { ...DEFAULT_FIGURE, extra: 'x' } })))
    expect(employees[0].figure).toEqual(DEFAULT_FIGURE)
  })
  it('accepts older exports with facialHair or glasses/beard booleans', () => {
    const legacy = { hairStyle: 'short', hair: '#4a2e1c', skin: '#f6c7a1', shirt: '#8fb8ff', deskItem: 'mug' }
    const old = (extra: Record<string, unknown>) => row({ figure: { ...legacy, ...extra } })
    const { employees, errors } = parseEmployeesFile(
      file(
        old({ facialHair: 'beard' }),
        { ...old({ facialHair: 'mustache', eyewear: 'sunglasses' }), email: 'b@thebrave.no', seat: 2 },
        { ...old({ glasses: true, beard: true }), email: 'c@thebrave.no', seat: 3 },
      ),
    )
    expect(errors).toEqual([])
    expect(employees.map(e => [e.figure.eyewear, e.figure.beard, e.figure.mustache])).toEqual([
      ['none', 'full', false],
      ['sunglasses', 'none', true],
      ['glasses', 'full', false],
    ])
  })
  it('treats a missing seat as unseated', () => {
    const { employees } = parseEmployeesFile(file({ name: 'Emma', email: 'emma@thebrave.no', figure: DEFAULT_FIGURE }))
    expect(employees[0].seat).toBeNull()
  })
  it('rejects other domains', () => {
    const { employees, errors } = parseEmployeesFile(file(row({ email: 'emma@gmail.com' })))
    expect(employees).toEqual([])
    expect(errors[0]).toContain('@thebrave.no')
  })
  it('rejects duplicate e-mails and seats, keeping the first', () => {
    const { employees, errors } = parseEmployeesFile(file(row(), row({ name: 'Emma 2', seat: 5 }), row({ name: 'Mina', email: 'mina@thebrave.no' })))
    expect(employees.map(e => e.name)).toEqual(['Emma'])
    expect(errors).toHaveLength(2)
    expect(errors[1]).toContain('plass 1')
  })
  it('rejects seats out of range, bad names and bad figures', () => {
    const { errors } = parseEmployeesFile(
      file(
        // One past the last seat, whatever SEAT_COUNT happens to be.
        row({ seat: SEAT_COUNT }),
        row({ email: 'a@thebrave.no', seat: 2.5 }),
        row({ email: 'b@thebrave.no', seat: 3, name: '' }),
        row({ email: 'c@thebrave.no', seat: 4, figure: { ...DEFAULT_FIGURE, hair: '#123456' } }),
      ),
    )
    expect(errors).toHaveLength(4)
  })
  it('rejects a file without an employees array and warns about unknown versions', () => {
    expect(parseEmployeesFile({ foo: 1 }).errors).toHaveLength(1)
    expect(parseEmployeesFile(null).errors).toHaveLength(1)
    expect(parseEmployeesFile({ version: 2, employees: [] }).errors[0]).toContain('versjon')
  })
})
