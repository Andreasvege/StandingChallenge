'use client'

import Link from 'next/link'
import { useState, useTransition } from 'react'
import { createEmployee } from '@/app/actions/admin'
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

  function add(formData: FormData) {
    setError(null)
    startTransition(async () => {
      try {
        await createEmployee({ email: String(formData.get('email') ?? ''), name: String(formData.get('name') ?? '') })
      } catch {
        setError('Kunne ikke legge til. Sjekk at e-posten slutter på @thebrave.no og at navnet er 1–30 tegn.')
      }
    })
  }

  return (
    <main className={styles.page}>
      <div className={styles.top}>
        <h1 className={styles.title}>
          Figurbygger<span>.</span>
        </h1>
        <Link href="/" className={styles.back}>
          ← Tilbake til kontoret
        </Link>
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
        <p>Ingen ansatte ennå. Legg til den første under.</p>
      )}

      <section className={styles.card}>
        <SeatGrid employees={employees} selectedId={selected?.id ?? null} onSelect={setSelectedId} />
      </section>

      <section className={styles.card}>
        <form action={add} className={styles.addForm}>
          <input name="email" type="email" placeholder="navn@thebrave.no" required aria-label="E-post" />
          <input name="name" placeholder="Navn" required maxLength={30} aria-label="Navn" />
          <button type="submit" className={`${styles.btn} ${styles.btnGo}`} disabled={pending}>
            Legg til kollega
          </button>
          {error && <p className={styles.error}>{error}</p>}
        </form>
      </section>
    </main>
  )
}
