'use server'

import { and, count, eq, gte, isNotNull, isNull, max } from 'drizzle-orm'
import { after } from 'next/server'
import { db } from '@/db/client'
import { employees, standSessions } from '@/db/schema'
import { currentGraceMs, currentMinuteMs } from '@/lib/clock-config'
import { getCurrentEmployee } from '@/lib/current-employee'
import { t, toLang, type Lang } from '@/lib/i18n'
import { closeExpiredSessions, loadOfficeSnapshot, toSessionRow } from '@/lib/office'
import {
  isBackdate, isValidRoundMinutes, planExtend, planProxyStart, planStart, planStop, PROXY_DAILY_LIMIT, PROXY_ROUND_MINUTES,
} from '@/lib/sessions'
import { APP_URL, dmByEmail } from '@/lib/slack'
import type { OfficeSnapshot } from '@/lib/snapshot'
import { osloDayStart } from '@/lib/time'

// Server actions are reachable by direct POST, so each one checks the login itself. `lang` comes from
// the caller's browser (defaulting to Norwegian) so error messages come back in their language.
async function currentEmployeeId(lang: Lang): Promise<string> {
  const me = await getCurrentEmployee()
  if (!me) throw new Error(t(lang, 'error.notSignedIn'))
  return me.id
}

async function openSession(employeeId: string) {
  const [row] = await db
    .select()
    .from(standSessions)
    .where(and(eq(standSessions.employeeId, employeeId), isNull(standSessions.endedAt)))
  return row
}

export async function startStanding(minutes: number, lang?: string, backMinutes = 0): Promise<OfficeSnapshot> {
  const language = toLang(lang)
  const employeeId = await currentEmployeeId(language)
  if (!isValidRoundMinutes(minutes) || !isBackdate(backMinutes)) throw new Error(t(language, 'error.badRound'))
  const now = Date.now()
  await closeExpiredSessions(now, currentGraceMs())
  let lastEnded: number | null = null
  if (backMinutes > 0) {
    const [row] = await db.select({ lastEnded: max(standSessions.endedAt) }).from(standSessions).where(eq(standSessions.employeeId, employeeId))
    lastEnded = row?.lastEnded ? new Date(row.lastEnded).getTime() : null
  }
  const plan = planStart(now, minutes, currentMinuteMs(), backMinutes, lastEnded)
  await db
    .insert(standSessions)
    .values({
      employeeId,
      startedAt: new Date(plan.startedAt),
      roundMinutes: plan.roundMinutes,
      roundEndsAt: new Date(plan.roundEndsAt),
    })
    .onConflictDoNothing() // already standing (double click / second tab): keep the existing session
  return loadOfficeSnapshot(now)
}

export async function extendStanding(lang?: string): Promise<OfficeSnapshot> {
  const employeeId = await currentEmployeeId(toLang(lang))
  const now = Date.now()
  const row = await openSession(employeeId)
  const plan = row ? planExtend(toSessionRow(row), now, currentMinuteMs(), currentGraceMs()) : null
  if (row && plan) {
    await db
      .update(standSessions)
      .set({ roundEndsAt: new Date(plan.roundEndsAt) })
      .where(and(eq(standSessions.id, row.id), isNull(standSessions.endedAt)))
  }
  return loadOfficeSnapshot(now)
}

export async function stopStanding(lang?: string): Promise<OfficeSnapshot> {
  const employeeId = await currentEmployeeId(toLang(lang))
  const now = Date.now()
  const row = await openSession(employeeId)
  const plan = row ? planStop(toSessionRow(row), now, currentGraceMs()) : null
  if (row && plan) {
    await db
      .update(standSessions)
      .set({ endedAt: new Date(plan.endedAt), endReason: plan.endReason })
      .where(and(eq(standSessions.id, row.id), isNull(standSessions.endedAt)))
  }
  return loadOfficeSnapshot(now)
}

export interface StartForResult {
  ok: boolean
  /** Shown to the sender when nothing was started (already standing, daily limit …). */
  message: string | null
  snapshot: OfficeSnapshot
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/**
 * «Start for en kollega»: a colleague is standing but forgot the timer, so the logged-in user starts a
 * short round for them, reaching back `backMinutes` for what they already stood. They get a DM on
 * Slack (when it is set up) and can undo it from the app with «Jeg satt egentlig».
 */
export async function startStandingFor(toId: string, backMinutes: number, lang?: string): Promise<StartForResult> {
  const language = toLang(lang)
  const me = await getCurrentEmployee()
  if (!me) throw new Error(t(language, 'error.notSignedIn'))
  const now = Date.now()
  const refuse = async (message: string): Promise<StartForResult> => ({ ok: false, message, snapshot: await loadOfficeSnapshot(now) })

  if (typeof toId !== 'string' || !UUID.test(toId)) return refuse(t(language, 'error.personNotFound'))
  if (toId === me.id) return refuse(t(language, 'proxy.self'))
  if (!isBackdate(backMinutes)) return refuse(t(language, 'error.badRound'))
  const [target] = await db.select({ name: employees.name, email: employees.email }).from(employees).where(eq(employees.id, toId))
  if (!target) return refuse(t(language, 'error.personNotFound'))

  const [{ started }] = await db
    .select({ started: count() })
    .from(standSessions)
    .where(and(eq(standSessions.startedBy, me.id), gte(standSessions.roundEndsAt, new Date(osloDayStart(now)))))
  if (started >= PROXY_DAILY_LIMIT) return refuse(t(language, 'proxy.limit', { limit: PROXY_DAILY_LIMIT }))

  await closeExpiredSessions(now, currentGraceMs())
  const [{ lastEnded }] = await db
    .select({ lastEnded: max(standSessions.endedAt) })
    .from(standSessions)
    .where(eq(standSessions.employeeId, toId))
  const minute = currentMinuteMs()
  const plan = planProxyStart(now, backMinutes, minute, lastEnded ? new Date(lastEnded).getTime() : null)
  const inserted = await db
    .insert(standSessions)
    .values({
      employeeId: toId,
      startedAt: new Date(plan.startedAt),
      roundMinutes: plan.roundMinutes,
      roundEndsAt: new Date(plan.roundEndsAt),
      startedBy: me.id,
    })
    .onConflictDoNothing()
    .returning({ id: standSessions.id })
  if (inserted.length === 0) return refuse(t(language, 'proxy.alreadyStanding', { name: target.name }))

  const stood = Math.round((now - plan.startedAt) / minute)
  after(() =>
    dmByEmail(
      target.email,
      t('nb', stood > 0 ? 'proxy.slackBack' : 'proxy.slack', { name: me.name, minutes: PROXY_ROUND_MINUTES, back: stood, url: APP_URL }),
    ),
  )
  return { ok: true, message: null, snapshot: await loadOfficeSnapshot(now) }
}

/** «Jeg satt egentlig»: undo a round a colleague started for you. Gone entirely — it never counted. */
export async function rejectStartedForMe(lang?: string): Promise<OfficeSnapshot> {
  const employeeId = await currentEmployeeId(toLang(lang))
  await db
    .delete(standSessions)
    .where(and(eq(standSessions.employeeId, employeeId), isNull(standSessions.endedAt), isNotNull(standSessions.startedBy)))
  return loadOfficeSnapshot()
}
