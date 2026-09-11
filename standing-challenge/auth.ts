import NextAuth from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import Google from 'next-auth/providers/google'
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
    signIn({ account, profile, user }) {
      // `hd` only hints Google's account picker; this check is what actually enforces the domain.
      if (account?.provider === 'google') return profile?.email_verified === true && isAllowedEmail(profile.email)
      return isAllowedEmail(user.email)
    },
  },
})
