import { AuthError } from 'next-auth'
import { redirect } from 'next/navigation'
import { signIn } from '@/auth'
import { OfficeRoom } from '@/components/office/OfficeRoom'
import { getSessionEmail } from '@/lib/current-employee'
import { demoRoom } from '@/lib/demo-office'
import { LoginCard } from './LoginCard'
import styles from './login.module.css'

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
        <OfficeRoom employees={room.employees} leaderId={room.leaderId} now={room.now} trophy={room.trophy} />
      </div>
      <LoginCard error={error} isDev={isDev} loginWithGoogle={loginWithGoogle} devLogin={devLogin} />
    </main>
  )
}
