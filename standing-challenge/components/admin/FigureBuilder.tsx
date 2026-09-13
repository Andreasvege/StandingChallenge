import { useState, useTransition, type ReactNode } from 'react'
import { deleteEmployee, placeEmployee, saveEmployee } from '@/app/actions/admin'
import { PixelHead, PixelPerson } from '@/components/PixelPerson'
import { BEARDS, DESK_ITEMS, EYEWEAR, HAIR_COLORS, HAIR_STYLES, HEADWEAR, SHIRT_COLORS, SKIN_COLORS, randomFigure, type Figure } from '@/lib/figure'
import { SEAT_COUNT } from '@/lib/room-layout'
import { DESK_ART, HEAD_ART } from '@/lib/sprite-art.generated'
import type { AdminEmployee } from './AdminPanel'
import styles from './Admin.module.css'

const STYLE_LABELS: Record<Figure['hairStyle'], string> = { short: 'Kort', buzz: 'Buzz', long: 'Langt', bun: 'Knute', curly: 'Krøller' }
const EYEWEAR_LABELS: Record<Figure['eyewear'], string> = { none: 'Ingen', glasses: 'Briller', sunglasses: 'Solbriller' }
const BEARD_LABELS: Record<Figure['beard'], string> = { none: 'Ingen', stubble: 'Stubber', full: 'Fullskjegg' }
const BUILTIN_ITEM_LABELS: Record<string, string> = { mug: '☕ Kopp', plant: '🪴 Plante' }

/** Hand-drawn options (sprites/) get a pencil so it's clear they came from the drawing folder. */
const itemLabel = (id: string) => BUILTIN_ITEM_LABELS[id] ?? `✏️ ${DESK_ART.find(a => a.id === id)?.label ?? id}`
const headwearLabel = (id: string) => (id === 'none' ? 'Ingen' : (HEAD_ART.find(a => a.id === id)?.label ?? id))

export function seatLabel(seat: number | null): string {
  if (seat === null) return 'Uten plass'
  return `Plass ${seat + 1} · ${seat < 8 ? 'fremste rad' : 'bakerste rad'}`
}

interface FigureBuilderProps {
  employee: AdminEmployee
  employees: AdminEmployee[]
  isMe: boolean
  onRemoved: () => void
}

export function FigureBuilder({ employee, employees, isMe, onRemoved }: FigureBuilderProps) {
  const [name, setName] = useState(employee.name)
  const [figure, setFigure] = useState<Figure>(employee.figure)
  const [armedRemove, setArmedRemove] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()
  const seat = employee.seat

  function update(patch: Partial<Figure>) {
    setFigure(f => ({ ...f, ...patch }))
    setMessage(null)
  }

  function run(action: () => Promise<void>, done: string) {
    startTransition(async () => {
      try {
        await action()
        setMessage(done)
      } catch {
        setMessage('Noe gikk galt – prøv igjen')
      }
    })
  }

  const save = () => run(() => saveEmployee({ id: employee.id, name, figure }), `Lagret ${name.trim()} ✓`)
  const place = (to: number | null) =>
    run(() => placeEmployee({ employeeId: employee.id, seat: to }), to === null ? 'Tatt bort fra pulten' : `Flyttet til plass ${to + 1}`)

  function remove() {
    if (!armedRemove) {
      setArmedRemove(true)
      return
    }
    run(async () => {
      await deleteEmployee({ id: employee.id })
      onRemoved()
    }, 'Fjernet')
  }

  function headChip(key: string, label: string, patch: Partial<Figure>, on: boolean) {
    return (
      <button key={key} type="button" className={`${styles.chip} ${on ? styles.chipOn : ''}`} onClick={() => update(patch)}>
        <PixelHead figure={{ ...figure, ...patch }} size={32} />
        {label}
      </button>
    )
  }

  function swatches(key: 'hair' | 'skin' | 'shirt', colors: readonly string[]) {
    return colors.map(c => (
      <button
        key={c}
        type="button"
        aria-label={c}
        className={`${styles.swatch} ${figure[key] === c ? styles.swatchOn : ''}`}
        style={{ background: c }}
        onClick={() => update({ [key]: c })}
      />
    ))
  }

  const occupantName = (s: number) => employees.find(e => e.seat === s && e.id !== employee.id)?.name
  const headwear = figure.headwear ?? 'none'

  return (
    <div className={styles.builder}>
      <div className={styles.stage}>
        <div className={styles.nameField}>
          <input
            value={name}
            maxLength={30}
            aria-label="Navn"
            onChange={e => {
              setName(e.target.value)
              setMessage(null)
            }}
          />
          <span className={styles.email}>
            {employee.email} · {seatLabel(seat)}
          </span>
        </div>
        <div className={styles.poses}>
          <div className={`${styles.pose} ${styles.poseUp}`}>
            <span className={styles.lbl}>{name || '…'} · står</span>
            <PixelPerson figure={figure} pose="stand" scale={4} />
          </div>
          <div className={styles.pose}>
            <span className={`${styles.lbl} ${styles.lblSit}`}>{name || '…'} 💤</span>
            <PixelPerson figure={figure} pose="sit" scale={4} />
          </div>
        </div>
      </div>

      <div className={styles.controls}>
        <Group title="Frisyre">
          {HAIR_STYLES.map(s => headChip(s, STYLE_LABELS[s], { hairStyle: s }, figure.hairStyle === s))}
        </Group>
        {HEAD_ART.length > 0 && (
          <Group title="Hodeplagg">
            {HEADWEAR.map(h => headChip(`hw-${h}`, headwearLabel(h), { headwear: h }, headwear === h))}
          </Group>
        )}
        <Group title="Hårfarge">{swatches('hair', HAIR_COLORS)}</Group>
        <div className={styles.row2}>
          <Group title="Hudfarge">{swatches('skin', SKIN_COLORS)}</Group>
          <Group title="På pulten">
            {DESK_ITEMS.map(i => (
              <button
                key={i}
                type="button"
                className={`${styles.chip} ${styles.chipText} ${figure.deskItem === i ? styles.chipOn : ''}`}
                onClick={() => update({ deskItem: i })}
              >
                {itemLabel(i)}
              </button>
            ))}
          </Group>
        </div>
        <div className={styles.row2}>
          <Group title="Briller">
            {EYEWEAR.map(v => headChip(v, EYEWEAR_LABELS[v], { eyewear: v }, figure.eyewear === v))}
          </Group>
          <Group title="Skjegg">
            {BEARDS.map(v => headChip(v, BEARD_LABELS[v], { beard: v }, figure.beard === v))}
          </Group>
        </div>
        <div className={styles.row2}>
          <Group title="Bart">
            {headChip('no-mustache', 'Uten', { mustache: false }, !figure.mustache)}
            {headChip('mustache', 'Bart', { mustache: true }, figure.mustache)}
          </Group>
          <Group title="Pult">
            <select
              className={styles.select}
              aria-label="Pult"
              value={seat ?? ''}
              disabled={pending}
              onChange={e => place(e.target.value === '' ? null : Number(e.target.value))}
            >
              <option value="">Uten plass</option>
              {Array.from({ length: SEAT_COUNT }, (_, s) => (
                <option key={s} value={s}>
                  {seatLabel(s)}
                  {occupantName(s) ? ` (${occupantName(s)})` : ''}
                </option>
              ))}
            </select>
          </Group>
        </div>
        <Group title="Genser">{swatches('shirt', SHIRT_COLORS)}</Group>

        <div className={styles.actions}>
          <button type="button" className={styles.btn} onClick={() => update(randomFigure())}>
            🎲 Tilfeldig
          </button>
          <button type="button" className={styles.btn} disabled={pending || seat === null || seat === 0} onClick={() => seat !== null && place(seat - 1)}>
            ◀ Flytt
          </button>
          <button
            type="button"
            className={styles.btn}
            disabled={pending || seat === null || seat === SEAT_COUNT - 1}
            onClick={() => seat !== null && place(seat + 1)}
          >
            Flytt ▶
          </button>
          {!isMe && (
            <button
              type="button"
              className={`${styles.btn} ${styles.danger} ${armedRemove ? styles.armed : ''}`}
              disabled={pending}
              onClick={remove}
              onBlur={() => setArmedRemove(false)}
            >
              {armedRemove ? 'Klikk igjen for å fjerne' : '🗑 Fjern'}
            </button>
          )}
          <button type="button" className={`${styles.btn} ${styles.btnGo}`} disabled={pending} onClick={save}>
            Lagre {name.trim() || '…'}
          </button>
        </div>
        {message && (
          <p className={styles.message} role="status">
            {message}
          </p>
        )}
      </div>
    </div>
  )
}

function Group({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className={styles.group}>
      <h4>{title}</h4>
      <div className={styles.opts}>{children}</div>
    </div>
  )
}
