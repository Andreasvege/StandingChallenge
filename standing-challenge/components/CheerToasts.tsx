import styles from './CheerToasts.module.css'

export interface CheerToast {
  id: string
  text: string
}

/** «Emma heiet på deg 🔥» for the receiver. A toast lives while its cheer is fresh; CSS fades it in and out. */
export function CheerToasts({ messages }: { messages: CheerToast[] }) {
  return (
    <div className={styles.toasts} role="status" aria-live="polite">
      {messages.map(m => (
        <div key={m.id} className={styles.toast}>
          {m.text}
        </div>
      ))}
    </div>
  )
}
