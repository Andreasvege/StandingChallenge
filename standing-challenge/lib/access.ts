// Who may log in, and who is admin. Pure so it can be unit-tested.

export const ALLOWED_DOMAIN = 'thebrave.no'

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase()
}

/** Exactly @thebrave.no — no subdomains, no look-alikes. */
export function isAllowedEmail(email: string | null | undefined): boolean {
  if (!email) return false
  return /^[^@\s]+@thebrave\.no$/.test(normalizeEmail(email))
}

export function parseAdminEmails(raw: string | undefined): string[] {
  return (raw ?? '').split(',').map(normalizeEmail).filter(Boolean)
}

export function isAdminEmail(email: string, raw: string | undefined = process.env.ADMIN_EMAILS): boolean {
  return parseAdminEmails(raw).includes(normalizeEmail(email))
}

/** Display name from the Google profile: first name, or the capitalised e-mail prefix. */
export function firstName(name: string | null | undefined, email: string): string {
  const first = (name ?? '').trim().split(/\s+/)[0]
  if (first) return first
  const local = email.split('@')[0]
  return local.charAt(0).toUpperCase() + local.slice(1)
}
