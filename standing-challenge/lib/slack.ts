// Slack glue: DMs to colleagues and posts to a channel, through a bot token. Server-only.
// Everything here is best effort — Slack being down, the token missing (local dev, or before the app
// is installed) or a colleague not being found must never break the room — so failures are logged and
// swallowed, and every function quietly does nothing when SLACK_BOT_TOKEN is not set.
//
// The Slack app needs the bot scopes `chat:write` (post) and `users:read.email` (find people by
// their work e-mail). A DM is a chat.postMessage to the user's id: it lands in the app's Messages tab.

/** Where links in Slack messages point. */
export const APP_URL = process.env.APP_URL ?? 'https://standing-challenge.vercel.app'

export function slackEnabled(): boolean {
  return Boolean(process.env.SLACK_BOT_TOKEN)
}

async function slackApi(method: string, init: { query?: Record<string, string>; body?: unknown }): Promise<Record<string, unknown> | null> {
  const token = process.env.SLACK_BOT_TOKEN
  if (!token) return null
  const url = new URL(`https://slack.com/api/${method}`)
  for (const [k, v] of Object.entries(init.query ?? {})) url.searchParams.set(k, v)
  try {
    const res = await fetch(url, {
      method: init.body ? 'POST' : 'GET',
      headers: { Authorization: `Bearer ${token}`, ...(init.body ? { 'Content-Type': 'application/json; charset=utf-8' } : {}) },
      body: init.body ? JSON.stringify(init.body) : undefined,
      signal: AbortSignal.timeout(5000),
      cache: 'no-store',
    })
    const json = (await res.json()) as Record<string, unknown>
    if (!json.ok) console.warn(`Slack ${method} failed:`, json.error)
    return json.ok ? json : null
  } catch (err) {
    console.warn(`Slack ${method} failed:`, err)
    return null
  }
}

/** Posts to a channel id (or a user id, which makes it a DM). True when Slack accepted it. */
export async function postSlackMessage(channel: string, text: string): Promise<boolean> {
  return (await slackApi('chat.postMessage', { body: { channel, text, unfurl_links: false } })) !== null
}

/** Sends a DM to the colleague with this work e-mail. */
export async function dmByEmail(email: string, text: string): Promise<boolean> {
  const found = await slackApi('users.lookupByEmail', { query: { email } })
  const id = (found?.user as { id?: string } | undefined)?.id
  return id ? postSlackMessage(id, text) : false
}
