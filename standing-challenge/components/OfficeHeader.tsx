import Link from 'next/link'
import type { ReactNode } from 'react'
import { logout } from '@/app/actions/auth'
import { formatDuration } from '@/lib/format'
import type { LiveEmployee } from '@/lib/snapshot'
import { LanguageToggle } from './LanguageToggle'
import { PixelHead } from './PixelPerson'
import { useTranslation } from './useLang'
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
  const { lang, t } = useTranslation()
  return (
    <header className={styles.header}>
      <div className={styles.brand}>
        {me && <PixelHead figure={me.figure} size={44} className={styles.avatar} />}
        <div>
          <h1 className={styles.logo}>
            Stå på<span>!</span>
          </h1>
          <p className={styles.sub}>
            <b>{t('header.count', { standing, total })}</b> {t('header.standingNow')} · {t('header.togetherPrefix')}{' '}
            <b>{formatDuration(todayTotalSeconds, lang)}</b> {t('header.togetherSuffix')}
            {offline && <span className={styles.offline}> · {t('header.offline')}</span>}
          </p>
          <nav className={styles.nav}>
            <button type="button" className={styles.navButton} onClick={onToggleSound}>
              {soundOn ? t('header.soundOn') : t('header.soundOff')}
            </button>
            <LanguageToggle className={styles.navButton} />
            {isAdmin && <Link href="/admin">{t('header.admin')}</Link>}
            <form action={logout}>
              <button type="submit" className={styles.navButton}>
                {t('header.logout')}
              </button>
            </form>
          </nav>
        </div>
      </div>
      {children}
    </header>
  )
}
