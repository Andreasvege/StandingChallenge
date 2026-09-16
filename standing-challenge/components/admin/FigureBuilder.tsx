import { useState, useTransition, type ReactNode } from 'react'
import { deleteEmployee, placeEmployee, saveEmployee } from '@/app/actions/admin'
import { PixelHead, PixelPerson } from '@/components/PixelPerson'
import { useTranslation } from '@/components/useLang'
import { BEARDS, DESK_ITEMS, EYEWEAR, HAIR_COLORS, HAIR_STYLES, HEADWEAR, SHIRT_COLORS, SKIN_COLORS, randomFigure, type Figure } from '@/lib/figure'
import { DEFAULT_LANG, t as translate, type Lang, type MessageKey, type MessageParams } from '@/lib/i18n'
import { DESKTOP_MAX_PER_ROW, MAX_SEATS, balancedRows, seatRowName } from '@/lib/room-layout'
import { DESK_ART, HEAD_ART } from '@/lib/sprite-art.generated'
import type { AdminEmployee } from './AdminPanel'
import styles from './Admin.module.css'

type Translate = (key: MessageKey, params?: MessageParams) => string

const STYLE_KEYS: Record<Figure['hairStyle'], MessageKey> = {
  short: 'figure.hair.short',
  buzz: 'figure.hair.buzz',
  long: 'figure.hair.long',
  bun: 'figure.hair.bun',
  curly: 'figure.hair.curly',
}
const EYEWEAR_KEYS: Record<Figure['eyewear'], MessageKey> = {
  none: 'figure.eyewear.none',
  glasses: 'figure.eyewear.glasses',
  sunglasses: 'figure.eyewear.sunglasses',
}
const BEARD_KEYS: Record<Figure['beard'], MessageKey> = {
  none: 'figure.beard.none',
  stubble: 'figure.beard.stubble',
  full: 'figure.beard.full',
}
const BUILTIN_ITEM_KEYS: Record<string, MessageKey> = { mug: 'figure.item.mug', plant: 'figure.item.plant' }

/**
 * Hand-drawn options (sprites/) get a pencil so it's clear they came from the drawing folder. Their
 * labels are the file names the user gave them, so they stay as-is in both languages.
 */
const itemLabel = (id: string, t: Translate) => {
  const key = BUILTIN_ITEM_KEYS[id]
  return key ? t(key) : `✏️ ${DESK_ART.find(a => a.id === id)?.label ?? id}`
}
const headwearLabel = (id: string, t: Translate) => (id === 'none' ? t('figure.headwear.none') : (HEAD_ART.find(a => a.id === id)?.label ?? id))

export function seatLabel(seat: number | null, seatRows: number[][] = [], lang: Lang = DEFAULT_LANG): string {
  if (seat === null) return translate(lang, 'seat.none')
  return translate(lang, 'seat.label', { seat: seat + 1, row: seatRowName(seat, seatRows, lang) })
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
  const [remoteFrom, setRemoteFrom] = useState(employee.remoteFrom ?? '')
  const [armedRemove, setArmedRemove] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()
  const { lang, t } = useTranslation()
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
        setMessage(t('figure.failed'))
      }
    })
  }

  const save = () =>
    run(() => saveEmployee({ id: employee.id, name, figure, remoteFrom }, lang), t('figure.saved', { name: name.trim() }))
  const place = (to: number | null) =>
    run(
      () => placeEmployee({ employeeId: employee.id, seat: to }, lang),
      to === null ? t('figure.takenOffDesk') : t('figure.movedToSeat', { seat: to + 1 }),
    )

  function remove() {
    if (!armedRemove) {
      setArmedRemove(true)
      return
    }
    run(async () => {
      await deleteEmployee({ id: employee.id }, lang)
      onRemoved()
    }, t('figure.removed'))
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
  // The desks in use, plus one free desk to move somebody into.
  const usedSeats = Math.max(0, ...employees.map(e => (e.seat ?? -1) + 1))
  const seatChoices = Math.min(MAX_SEATS, usedSeats + 1)
  const seatRows = balancedRows(seatChoices, DESKTOP_MAX_PER_ROW)
  const headwear = figure.headwear ?? 'none'

  return (
    <div className={styles.builder}>
      <div className={styles.stage}>
        <div className={styles.nameField}>
          <input
            value={name}
            maxLength={30}
            aria-label={t('figure.name')}
            onChange={e => {
              setName(e.target.value)
              setMessage(null)
            }}
          />
          <span className={styles.email}>
            {employee.email} · {seatLabel(seat, seatRows, lang)}
          </span>
        </div>
        <div className={styles.poses}>
          <div className={`${styles.pose} ${styles.poseUp}`}>
            <span className={styles.lbl}>{t('figure.poseStanding', { name: name || '…' })}</span>
            <PixelPerson figure={figure} pose="stand" scale={4} />
          </div>
          <div className={styles.pose}>
            <span className={`${styles.lbl} ${styles.lblSit}`}>{name || '…'} 💤</span>
            <PixelPerson figure={figure} pose="sit" scale={4} />
          </div>
        </div>
      </div>

      <div className={styles.controls}>
        <Group title={t('figure.group.hairStyle')}>
          {HAIR_STYLES.map(s => headChip(s, t(STYLE_KEYS[s]), { hairStyle: s }, figure.hairStyle === s))}
        </Group>
        {HEAD_ART.length > 0 && (
          <Group title={t('figure.group.headwear')}>
            {HEADWEAR.map(h => headChip(`hw-${h}`, headwearLabel(h, t), { headwear: h }, headwear === h))}
          </Group>
        )}
        <Group title={t('figure.group.hairColor')}>{swatches('hair', HAIR_COLORS)}</Group>
        <div className={styles.row2}>
          <Group title={t('figure.group.skinColor')}>{swatches('skin', SKIN_COLORS)}</Group>
          <Group title={t('figure.group.deskItem')}>
            {DESK_ITEMS.map(i => (
              <button
                key={i}
                type="button"
                className={`${styles.chip} ${styles.chipText} ${figure.deskItem === i ? styles.chipOn : ''}`}
                onClick={() => update({ deskItem: i })}
              >
                {itemLabel(i, t)}
              </button>
            ))}
          </Group>
        </div>
        <div className={styles.row2}>
          <Group title={t('figure.group.eyewear')}>
            {EYEWEAR.map(v => headChip(v, t(EYEWEAR_KEYS[v]), { eyewear: v }, figure.eyewear === v))}
          </Group>
          <Group title={t('figure.group.beard')}>
            {BEARDS.map(v => headChip(v, t(BEARD_KEYS[v]), { beard: v }, figure.beard === v))}
          </Group>
        </div>
        <div className={styles.row2}>
          <Group title={t('figure.group.mustache')}>
            {headChip('no-mustache', t('figure.mustache.without'), { mustache: false }, !figure.mustache)}
            {headChip('mustache', t('figure.mustache.with'), { mustache: true }, figure.mustache)}
          </Group>
          <Group title={t('figure.group.remoteFrom')}>
            <input
              className={styles.select}
              value={remoteFrom}
              maxLength={20}
              placeholder={t('figure.remotePlaceholder')}
              aria-label={t('figure.group.remoteFrom')}
              onChange={e => {
                setRemoteFrom(e.target.value)
                setMessage(null)
              }}
            />
          </Group>
        </div>
        <div className={styles.row2}>
          <Group title={t('figure.group.seat')}>
            <select
              className={styles.select}
              aria-label={t('figure.group.seat')}
              value={seat ?? ''}
              disabled={pending}
              onChange={e => place(e.target.value === '' ? null : Number(e.target.value))}
            >
              <option value="">{t('seat.none')}</option>
              {Array.from({ length: seatChoices }, (_, s) => (
                <option key={s} value={s}>
                  {seatLabel(s, seatRows, lang)}
                  {occupantName(s) ? ` (${occupantName(s)})` : ''}
                </option>
              ))}
            </select>
          </Group>
        </div>
        <Group title={t('figure.group.shirt')}>{swatches('shirt', SHIRT_COLORS)}</Group>

        <div className={styles.actions}>
          <button type="button" className={styles.btn} onClick={() => update(randomFigure())}>
            {t('figure.random')}
          </button>
          <button type="button" className={styles.btn} disabled={pending || seat === null || seat === 0} onClick={() => seat !== null && place(seat - 1)}>
            {t('figure.moveLeft')}
          </button>
          <button
            type="button"
            className={styles.btn}
            disabled={pending || seat === null || seat === seatChoices - 1}
            onClick={() => seat !== null && place(seat + 1)}
          >
            {t('figure.moveRight')}
          </button>
          {!isMe && (
            <button
              type="button"
              className={`${styles.btn} ${styles.danger} ${armedRemove ? styles.armed : ''}`}
              disabled={pending}
              onClick={remove}
              onBlur={() => setArmedRemove(false)}
            >
              {armedRemove ? t('figure.removeArmed') : t('figure.remove')}
            </button>
          )}
          <button type="button" className={`${styles.btn} ${styles.btnGo}`} disabled={pending} onClick={save}>
            {t('figure.save', { name: name.trim() || '…' })}
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
