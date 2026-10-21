// Fredagsrapporten, run by Vercel Cron (vercel.json) every Friday at 12:00 UTC — 14:00 in summer
// time, 13:00 in winter. Vercel calls it with `Authorization: Bearer $CRON_SECRET`.
// GET ?preview=1 returns the text without posting it (also allowed without the secret in dev).

import { and, gte, isNull, lt, or } from 'drizzle-orm'
import { db } from '@/db/client'
import { standSessions } from '@/db/schema'
import { loadOfficeSnapshot, toSessionRow } from '@/lib/office'
import { APP_URL, postSlackMessage } from '@/lib/slack'
import { osloMonthStart, osloParts } from '@/lib/time'
import { rankBetween } from '@/lib/trophy'
import { weeklySummary } from '@/lib/weekly-summary'

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams
  const preview = params.has('preview')
  const secret = process.env.CRON_SECRET
  const authorized = Boolean(secret) && request.headers.get('authorization') === `Bearer ${secret}`
  const devPreview = preview && process.env.NODE_ENV === 'development'
  if (!authorized && !devPreview) return new Response('Unauthorized', { status: 401 })

  const now = Date.now()
  const monthStart = osloMonthStart(now)
  const [snapshot, monthRows] = await Promise.all([
    loadOfficeSnapshot(now),
    db
      .select()
      .from(standSessions)
      .where(and(lt(standSessions.startedAt, new Date(now)), or(isNull(standSessions.endedAt), gte(standSessions.endedAt, new Date(monthStart))))),
  ])
  const names = new Map(snapshot.employees.map(e => [e.id, e.name]))
  const text = weeklySummary({
    week: snapshot.employees.map(e => ({ name: e.name, seconds: e.weekSeconds })),
    month: rankBetween(monthRows.map(toSessionRow), now, monthStart, now).map(r => ({ name: names.get(r.employeeId) ?? '?', seconds: r.seconds })),
    monthNumber: osloParts(now).month,
    url: APP_URL,
  })
  if (preview) return Response.json({ text })

  const channel = process.env.SLACK_CHANNEL_ID
  const posted = channel ? await postSlackMessage(channel, text) : false
  return Response.json({ posted })
}
