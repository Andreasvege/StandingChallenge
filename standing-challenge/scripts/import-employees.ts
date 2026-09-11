// Imports the real employees from data/employees.json (exported from the figure builder).
// Upserts by e-mail (name, figure, seat), frees seats that are being taken, never deletes anyone.
// Usage: npm run db:import            → dev branch (.env.development.local)
//        npm run db:import:prod       → production (.env.local)
//        npm run db:import -- other.json

import { existsSync, readFileSync } from 'node:fs'
import { loadEnvConfig } from '@next/env'

async function main() {
  const isProd = process.env.DB_TARGET === 'prod'
  const file = process.argv[2] ?? 'data/employees.json'
  if (!existsSync(file)) throw new Error(`Fant ikke ${file}. Eksporter fra figurbyggeren og legg fila der.`)
  if (!isProd && !existsSync('.env.development.local')) {
    throw new Error('Mangler .env.development.local (dev-branchen). Bruk «npm run db:import:prod» for produksjon.')
  }
  loadEnvConfig(process.cwd(), !isProd)

  const { parseEmployeesFile } = await import('../lib/employee-import')
  const { employees: people, errors } = parseEmployeesFile(JSON.parse(readFileSync(file, 'utf8')))
  if (errors.length > 0) {
    console.error(`Fila har ${errors.length} feil – ingenting er importert:`)
    for (const e of errors) console.error(`  • ${e}`)
    process.exit(1)
  }

  const { eq, inArray } = await import('drizzle-orm')
  const { db } = await import('../db/client')
  const { employees } = await import('../db/schema')

  console.log(`Importerer ${people.length} ansatte til ${isProd ? 'PRODUKSJON' : 'dev'} (${new URL(process.env.DATABASE_URL!).host}) …`)

  const existing = new Set((await db.select({ email: employees.email }).from(employees)).map(r => r.email))
  for (const p of people) {
    await db
      .insert(employees)
      .values({ email: p.email, name: p.name, figure: p.figure })
      .onConflictDoUpdate({ target: employees.email, set: { name: p.name, figure: p.figure } })
  }

  // Seats in one transaction: free everyone in the file and everyone sitting on a target seat, then assign.
  const emails = people.map(p => p.email)
  const targetSeats = people.flatMap(p => (p.seat === null ? [] : [p.seat]))
  const [first, ...rest] = [
    db.update(employees).set({ seat: null }).where(inArray(employees.email, emails)),
    ...(targetSeats.length > 0 ? [db.update(employees).set({ seat: null }).where(inArray(employees.seat, targetSeats))] : []),
    ...people.flatMap(p => (p.seat === null ? [] : [db.update(employees).set({ seat: p.seat }).where(eq(employees.email, p.email))])),
  ]
  await db.batch([first, ...rest])

  const created = people.filter(p => !existing.has(p.email)).length
  console.log(`✓ ${created} nye, ${people.length - created} oppdatert, ${targetSeats.length} med plass. Ingen er slettet.`)
}

main().catch(err => {
  console.error(err instanceof Error ? err.message : err)
  process.exit(1)
})
