import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import Google from 'next-auth/providers/google'
import { eq } from 'drizzle-orm'
import { db } from '@/db/client'
import { employees } from '@/db/schema'
import { isAllowedEmail, normalizeEmail } from '@/lib/access'

// Local development can log in as any @thebrave.no address without Google.
const devLogin = process.env.NODE_ENV === 'development'

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Google({ authorization: { params: { hd: 'thebrave.no', prompt: 'select_account' } } }),
    ...(devLogin
      ? [
          Credentials({
            id: 'dev',
            name: 'Dev-innlogging',
            credentials: { email: { label: 'E-post', type: 'email' } },
            authorize: async credentials => {
              const email = normalizeEmail(String(credentials?.email ?? ''))
              return isAllowedEmail(email) ? { id: email, email } : null
            },
          }),
        ]
      : []),
  ],
  pages: { signIn: '/login', error: '/login' },
  callbacks: {
    async signIn({ account, profile, user }) {
      // `hd` only hints Google's account picker; this check is what actually enforces the domain.
      const email = account?.provider === 'google' ? (profile?.email_verified === true ? profile.email : null) : user.email
      if (!email || !isAllowedEmail(email)) return false
      // Archived people have left: no new sessions. Returning a string makes Auth.js redirect there.
      const [row] = await db.select({ archivedAt: employees.archivedAt }).from(employees).where(eq(employees.email, normalizeEmail(email)))
      return row?.archivedAt ? '/login?error=Archived' : true
    },
  },
})
