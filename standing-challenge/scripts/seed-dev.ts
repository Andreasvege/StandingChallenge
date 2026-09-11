// Fills the DEV database (Neon "dev" branch) with the demo office. Never runs against production.
// Usage: npm run db:seed

import { existsSync } from 'node:fs'
import { loadEnvConfig } from '@next/env'

async function main() {
  if (process.env.DB_TARGET === 'prod') throw new Error('db:seed kjøres aldri mot produksjon.')
  if (!existsSync('.env.development.local')) {
    throw new Error('Mangler .env.development.local med DATABASE_URL til Neon-branchen «dev».')
  }
  loadEnvConfig(process.cwd(), true)

  // Imported after the env is loaded: db/client reads DATABASE_URL at import time.
  const { inArray } = await import('drizzle-orm')
  const { db } = await import('../db/client')
  const { employees, standSessions } = await import('../db/schema')
  const { DEMO_PEOPLE, demoSessions } = await import('../lib/demo-office')

  console.log(`Seeder dev-databasen: ${new URL(process.env.DATABASE_URL!).host}`)

  for (const p of DEMO_PEOPLE) {
    await db
      .insert(employees)
      .values({ email: p.email, name: p.name, figure: p.figure })
      .onConflictDoUpdate({ target: employees.email, set: { name: p.name, figure: p.figure } })
  }

  const emails = DEMO_PEOPLE.map(p => p.email)
  const rows = await db.select().from(employees).where(inArray(employees.email, emails))
  const idByEmail = new Map(rows.map(r => [r.email, r.id]))

  // Seats: free the demo seats first so the unique index never clashes, then assign.
  const seats = DEMO_PEOPLE.map(p => p.seat)
  await db.update(employees).set({ seat: null }).where(inArray(employees.seat, seats))
  for (const p of DEMO_PEOPLE) {
    await db.update(employees).set({ seat: p.seat }).where(inArray(employees.email, [p.email]))
  }

  // Fresh sessions relative to now, so the room always looks lively.
  const ids = [...idByEmail.values()]
  await db.delete(standSessions).where(inArray(standSessions.employeeId, ids))
  const sessions = demoSessions(Date.now()).map(s => ({
    employeeId: idByEmail.get(s.email)!,
    startedAt: new Date(s.startedAt),
    roundMinutes: s.roundMinutes,
    roundEndsAt: new Date(s.roundEndsAt),
    endedAt: s.endedAt === null ? null : new Date(s.endedAt),
    endReason: s.endedAt === null ? null : ('completed' as const),
  }))
  await db.insert(standSessions).values(sessions)

  console.log(`✓ ${DEMO_PEOPLE.length} demo-ansatte og ${sessions.length} økter.`)
}

main().catch(err => {
  console.error(err instanceof Error ? err.message : err)
  process.exit(1)
})
