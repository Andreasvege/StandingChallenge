'use client'

import Link from 'next/link'
import { useState, useTransition } from 'react'
import { createEmployee } from '@/app/actions/admin'
import { LanguageToggle } from '@/components/LanguageToggle'
import { useTranslation } from '@/components/useLang'
import type { Figure } from '@/lib/figure'
import { FigureBuilder } from './FigureBuilder'
import { SeatGrid } from './SeatGrid'
import styles from './Admin.module.css'

export interface AdminEmployee {
  id: string
  name: string
  email: string
  seat: number | null
  figure: Figure
  /** Set when they work somewhere else (e.g. «Bergen») and hang on the wall as a video screen. */
  remoteFrom: string | null
}

export function AdminPanel({ employees, meId }: { employees: AdminEmployee[]; meId: string }) {
  const [selectedId, setSelectedId] = useState<string | null>(employees[0]?.id ?? null)
  const selected = employees.find(e => e.id === selectedId) ?? employees[0] ?? null
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const { lang, t } = useTranslation()

  function add(formData: FormData) {
    setError(null)
    startTransition(async () => {
      try {
        await createEmployee({ email: String(formData.get('email') ?? ''), name: String(formData.get('name') ?? '') }, lang)
      } catch {
        setError(t('admin.addFailed'))
      }
    })
  }

  return (
    <main className={styles.page}>
      <div className={styles.top}>
        <h1 className={styles.title}>
          {t('admin.title')}
          <span>.</span>
        </h1>
        <div className={styles.topLinks}>
          <LanguageToggle className={styles.langBtn} />
          <Link href="/" className={styles.back}>
            {t('admin.back')}
          </Link>
        </div>
      </div>

      {selected ? (
        <section className={styles.card}>
          {/* key: a fresh builder (and draft) per person */}
          <FigureBuilder
            key={selected.id}
            employee={selected}
            employees={employees}
            isMe={selected.id === meId}
            onRemoved={() => setSelectedId(null)}
          />
        </section>
      ) : (
        <p>{t('admin.noEmployees')}</p>
      )}

      <section className={styles.card}>
        <SeatGrid employees={employees} selectedId={selected?.id ?? null} onSelect={setSelectedId} />
      </section>

      <section className={styles.card}>
        <form action={add} className={styles.addForm}>
          <input name="email" type="email" placeholder={t('admin.emailPlaceholder')} required aria-label={t('admin.email')} />
          <input name="name" placeholder={t('admin.name')} required maxLength={30} aria-label={t('admin.name')} />
          <button type="submit" className={`${styles.btn} ${styles.btnGo}`} disabled={pending}>
            {t('admin.addColleague')}
          </button>
          {error && <p className={styles.error}>{error}</p>}
        </form>
      </section>
    </main>
  )
}
