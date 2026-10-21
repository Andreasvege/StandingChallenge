// Database schema (Neon Postgres via Drizzle). Relative imports only: drizzle-kit loads this file
// outside Next and does not resolve the "@/" alias.

import { sql } from 'drizzle-orm'
import { index, integer, jsonb, pgTable, text, timestamp, uniqueIndex, uuid } from 'drizzle-orm/pg-core'
import type { Figure } from '../lib/figure'
import type { EndReason } from '../lib/sessions'

export const employees = pgTable('employees', {
  id: uuid('id').primaryKey().defaultRandom(),
  email: text('email').notNull().unique(),
  name: text('name').notNull(),
  figure: jsonb('figure').$type<Figure>().notNull(),
  /** Desk number, counted from the front row. Null = no desk (not placed, or working elsewhere). */
  seat: integer('seat').unique(),
  /** Works somewhere else (e.g. Bergen): shown on a video screen on the wall instead of at a desk. */
  remoteFrom: text('remote_from'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

export const standSessions = pgTable(
  'stand_sessions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    employeeId: uuid('employee_id')
      .notNull()
      .references(() => employees.id, { onDelete: 'cascade' }),
    startedAt: timestamp('started_at', { withTimezone: true }).notNull(),
    roundMinutes: integer('round_minutes').notNull(),
    roundEndsAt: timestamp('round_ends_at', { withTimezone: true }).notNull(),
    endedAt: timestamp('ended_at', { withTimezone: true }),
    endReason: text('end_reason').$type<EndReason>(),
    /** Set when a colleague started this round for them («start for en kollega»); null when they did it themselves. */
    startedBy: uuid('started_by').references(() => employees.id, { onDelete: 'set null' }),
  },
  t => [
    // At most one open session per person — makes a double-clicked «Start» harmless.
    uniqueIndex('stand_sessions_one_open').on(t.employeeId).where(sql`${t.endedAt} is null`),
    index('stand_sessions_started_at').on(t.startedAt),
  ],
)

/** Heiarop: a little emoji one colleague sends another. Kept after showing, for future stats. */
export const cheers = pgTable(
  'cheers',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    fromEmployeeId: uuid('from_employee_id')
      .notNull()
      .references(() => employees.id, { onDelete: 'cascade' }),
    toEmployeeId: uuid('to_employee_id')
      .notNull()
      .references(() => employees.id, { onDelete: 'cascade' }),
    emoji: text('emoji').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  },
  t => [index('cheers_created_at').on(t.createdAt), index('cheers_from_to').on(t.fromEmployeeId, t.toEmployeeId)],
)

export type EmployeeRecord = typeof employees.$inferSelect
export type StandSessionRecord = typeof standSessions.$inferSelect
export type CheerRecord = typeof cheers.$inferSelect
