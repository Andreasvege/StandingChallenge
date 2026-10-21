'use client'

import type { ComponentProps } from 'react'
import { OfficeRoom } from '@/components/office/OfficeRoom'

/** The room with menu actions that only log, so every button in the colleague menu can be previewed. */
export function DevRoom(props: ComponentProps<typeof OfficeRoom>) {
  return (
    <OfficeRoom
      {...props}
      onCheer={(to, emoji) => console.log('[dev] cheer', to, emoji)}
      onSitDown={to => console.log('[dev] sit down', to)}
      onStartFor={(to, back) => console.log('[dev] start for', to, back)}
    />
  )
}
