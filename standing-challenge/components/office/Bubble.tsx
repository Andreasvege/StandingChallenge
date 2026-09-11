import type { ReactNode } from 'react'
import styles from './OfficeRoom.module.css'

export type BubbleTone = 'standing' | 'sitting' | 'leader' | 'awaiting'

/** Speech bubble with a notched pixel border above each head. The text itself is a normal font. */
export function Bubble({ tone, children }: { tone: BubbleTone; children: ReactNode }) {
  return <span className={`${styles.bubble} ${styles[tone]}`}>{children}</span>
}
