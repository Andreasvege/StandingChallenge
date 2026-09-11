import Link from 'next/link'
import type { ReactNode } from 'react'
import { logout } from '@/app/actions/auth'
import { formatDuration } from '@/lib/format'
import type { LiveEmployee } from '@/lib/snapshot'
import { PixelHead } from './PixelPerson'
import styles from './OfficeApp.module.css'

interface OfficeHeaderProps {
  me: LiveEmployee | null
  standing: number
  total: number
  todayTotalSeconds: number
  isAdmin: boolean
  offline: boolean
  soundOn: boolean
  onToggleSound: () => void
  children: ReactNode
}

export function OfficeHeader({ me, standing, total, todayTotalSeconds, isAdmin, offline, soundOn, onToggleSound, children }: OfficeHeaderProps) {
  return (
    <header className={styles.header}>
      <div className={styles.brand}>
        {me && <PixelHead figure={me.figure} size={44} className={styles.avatar} />}
        <div>
          <h1 className={styles.logo}>
            Stå på<span>!</span>
          </h1>
          <p className={styles.sub}>
            <b>
              {standing} av {total}
            </b>{' '}
            står akkurat nå · Sammen har vi stått <b>{formatDuration(todayTotalSeconds)}</b> i dag
            {offline && <span className={styles.offline}> · Mistet forbindelsen, prøver igjen …</span>}
          </p>
          <nav className={styles.nav}>
            <button type="button" className={styles.navButton} onClick={onToggleSound}>
              {soundOn ? '🔔 Lyd på' : '🔕 Lyd av'}
            </button>
            {isAdmin && <Link href="/admin">Admin</Link>}
            <form action={logout}>
              <button type="submit" className={styles.navButton}>
                Logg ut
              </button>
            </form>
          </nav>
        </div>
      </div>
      {children}
    </header>
  )
}
