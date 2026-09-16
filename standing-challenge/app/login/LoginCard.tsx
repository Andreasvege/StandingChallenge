'use client'

import { LanguageToggle } from '@/components/LanguageToggle'
import { useTranslation } from '@/components/useLang'
import type { MessageKey } from '@/lib/i18n'
import styles from './login.module.css'

const ERROR_KEYS: Record<string, MessageKey> = { AccessDenied: 'login.error.accessDenied' }

interface LoginCardProps {
  error?: string
  isDev: boolean
  loginWithGoogle: () => Promise<void>
  devLogin: (formData: FormData) => Promise<void>
}

/** The login card. A client component so the language toggle can swap the copy on this device. */
export function LoginCard({ error, isDev, loginWithGoogle, devLogin }: LoginCardProps) {
  const { t } = useTranslation()
  return (
    <div className={styles.card}>
      <LanguageToggle className={styles.lang} />
      <h1 className={styles.logo}>
        Stå på<span>!</span>
      </h1>
      <p className={styles.lead}>{t('login.lead')}</p>
      {error && <p className={styles.error}>{t(ERROR_KEYS[error] ?? 'login.error.generic')}</p>}
      <form action={loginWithGoogle}>
        <button type="submit" className={styles.google}>
          {t('login.google')}
        </button>
      </form>
      {isDev && (
        <form action={devLogin} className={styles.dev}>
          <input name="email" type="email" defaultValue="av@thebrave.no" aria-label={t('login.email')} />
          <button type="submit">{t('login.dev')}</button>
        </form>
      )}
    </div>
  )
}
