// The window sky follows the time of day in Oslo.

export type SkyPhase = 'morning' | 'day' | 'sunset' | 'evening'

export function skyPhase(osloHour: number): SkyPhase {
  if (osloHour >= 6 && osloHour < 10) return 'morning'
  if (osloHour >= 10 && osloHour < 16) return 'day'
  if (osloHour >= 16 && osloHour < 19) return 'sunset'
  return 'evening'
}

export interface Sky {
  /** Five horizontal colour bands, top to bottom (the window viewBox is 64×36). */
  bands: [string, string, string, string, string]
  /** Top-left corner of the 8×8 sun or moon inside the window. */
  body: { kind: 'sun' | 'moon'; x: number; y: number; color: string }
  stars: boolean
  /** Lit windows in the city silhouette. */
  litWindows: boolean
  cloud: string
  city: string
}

export const SKIES: Record<SkyPhase, Sky> = {
  morning: {
    bands: ['#9fc6ff', '#b9d6ff', '#ffd6e8', '#ffe3c2', '#fff1d6'],
    body: { kind: 'sun', x: 10, y: 20, color: '#fff4c2' },
    stars: false,
    litWindows: false,
    cloud: '#ffffff',
    city: '#8a9ad6',
  },
  day: {
    bands: ['#6fb6ff', '#83c2ff', '#9dcfff', '#b8dcff', '#d4ebff'],
    body: { kind: 'sun', x: 44, y: 5, color: '#fff9d6' },
    stars: false,
    litWindows: false,
    cloud: '#ffffff',
    city: '#6f86c9',
  },
  sunset: {
    bands: ['#6b5bb5', '#9a6cc2', '#e889b6', '#ffab8a', '#ffd39c'],
    body: { kind: 'sun', x: 42, y: 18, color: '#fff1b8' },
    stars: false,
    litWindows: true,
    cloud: '#f6d2ec',
    city: '#4b3f7a',
  },
  evening: {
    bands: ['#1c1640', '#261d52', '#322664', '#3d2f72', '#4b3a80'],
    body: { kind: 'moon', x: 46, y: 5, color: '#f4f1ff' },
    stars: true,
    litWindows: true,
    cloud: '#4b3f7a',
    city: '#241c4a',
  },
}
