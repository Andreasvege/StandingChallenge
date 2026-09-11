import { AuthError } from 'next-auth'
import { redirect } from 'next/navigation'
import { signIn } from '@/auth'
import { OfficeRoom } from '@/components/office/OfficeRoom'
import { getSessionEmail } from '@/lib/current-employee'
import { demoRoom } from '@/lib/demo-office'
import styles from './login.module.css'

const ERRORS: Record<string, string> = {
  AccessDenied: 'Bare for @thebrave.no-kontoer.',
}

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  if (await getSessionEmail()) redirect('/')
  const { error } = await searchParams
  const isDev = process.env.NODE_ENV === 'development'
  const room = demoRoom()

  async function loginWithGoogle() {
    'use server'
    await signIn('google', { redirectTo: '/' })
  }

  async function devLogin(formData: FormData) {
    'use server'
    try {
      await signIn('dev', { email: String(formData.get('email') ?? ''), redirectTo: '/' })
    } catch (err) {
      if (err instanceof AuthError) redirect('/login?error=AccessDenied')
      throw err // NEXT_REDIRECT on success
    }
  }

  return (
    <main className={styles.page}>
      <div className={styles.backdrop} aria-hidden="true">
        <OfficeRoom employees={room.employees} leaderId={room.leaderId} now={room.now} />
      </div>
      <div className={styles.card}>
        <h1 className={styles.logo}>
          Stå på<span>!</span>
        </h1>
        <p className={styles.lead}>Hvem står mest ved ståpulten på kontoret? 🧍</p>
        {error && <p className={styles.error}>{ERRORS[error] ?? 'Innloggingen feilet. Prøv igjen.'}</p>}
        <form action={loginWithGoogle}>
          <button type="submit" className={styles.google}>
            Logg inn med Google
          </button>
        </form>
        {isDev && (
          <form action={devLogin} className={styles.dev}>
            <input name="email" type="email" defaultValue="av@thebrave.no" aria-label="E-post" />
            <button type="submit">Dev-innlogging</button>
          </form>
        )}
      </div>
    </main>
  )
}
