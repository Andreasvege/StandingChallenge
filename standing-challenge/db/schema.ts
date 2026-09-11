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
  /** 0–15; 0–7 is the front row on desktop. Null = no desk yet. */
  seat: integer('seat').unique(),
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
  },
  t => [
    // At most one open session per person — makes a double-clicked «Start» harmless.
    uniqueIndex('stand_sessions_one_open').on(t.employeeId).where(sql`${t.endedAt} is null`),
    index('stand_sessions_started_at').on(t.startedAt),
  ],
)

export type EmployeeRecord = typeof employees.$inferSelect
export type StandSessionRecord = typeof standSessions.$inferSelect
