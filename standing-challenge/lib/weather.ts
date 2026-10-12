// Real weather in the windows, from MET Norway (the data behind Yr). The fetch lives in lib/yr.ts;
// this file only turns MET's symbol codes into what the room draws, so it can be tested.
// Symbol codes: https://api.met.no/weatherapi/weathericon/2.0/documentation

export type Precip = 'none' | 'rain' | 'sleet' | 'snow'

export interface Weather {
  precip: Precip
  /** 1 = light, 2 = normal, 3 = heavy. Only meaningful with precipitation. */
  intensity: 1 | 2 | 3
  thunder: boolean
  /** A grey sky with no sun or moon: cloudy, foggy or anything falling. */
  overcast: boolean
  fog: boolean
}

export const CLEAR: Weather = { precip: 'none', intensity: 2, thunder: false, overcast: false, fog: false }

/** Aker Tech House, Fornebu (OpenStreetMap). MET wants at most 4 decimals. */
export const OFFICE_LOCATION = { lat: 59.9041, lon: 10.6248 } as const

/** 'heavyrainshowersandthunder_day' → heavy rain with thunder. Unknown codes read as clear. */
export function weatherFromSymbol(symbol: string): Weather {
  const code = symbol.replace(/_(day|night|polartwilight)$/, '')
  const thunder = code.includes('thunder')
  const precip: Precip = code.includes('sleet') ? 'sleet' : code.includes('snow') ? 'snow' : code.includes('rain') ? 'rain' : 'none'
  const intensity = code.startsWith('light') ? 1 : code.startsWith('heavy') ? 3 : 2
  const fog = code === 'fog'
  return { precip, intensity, thunder, fog, overcast: precip !== 'none' || thunder || fog || code === 'cloudy' }
}

interface ForecastStep {
  time: string
  data: { next_1_hours?: { summary?: { symbol_code?: string } } }
}

/** The symbol for the hour that `now` falls in, from a locationforecast/2.0 response. */
export function currentSymbol(forecast: unknown, now: number): string | null {
  const steps = (forecast as { properties?: { timeseries?: ForecastStep[] } })?.properties?.timeseries
  if (!Array.isArray(steps)) return null
  const HOUR = 3_600_000
  const step =
    steps.find(s => {
      const t = Date.parse(s.time)
      return t <= now && now < t + HOUR
    }) ?? steps.find(s => Date.parse(s.time) > now)
  return step?.data.next_1_hours?.summary?.symbol_code ?? null
}

export interface Particle {
  kind: 'drop' | 'flake'
  /** Column on the 64×36 window grid, inside the glass. */
  x: number
  /** Where it sits when nothing moves (reduced motion); the fall passes through it. */
  y: number
  /** Seconds for one fall from top to bottom of the glass. */
  duration: number
  /** Seconds into its fall at page load, so the window is never empty while the first ones arrive. */
  offset: number
}

const COUNT: Record<Weather['intensity'], number> = { 1: 8, 2: 16, 3: 28 }

/**
 * The drops and flakes for one window, the same on every render: a fixed pseudo-random sequence,
 * so a poll every 5 s never reshuffles the rain. Sleet is every other particle a flake.
 */
export function precipitation(weather: Weather | undefined): Particle[] {
  if (!weather || weather.precip === 'none') return []
  let seed = 7
  const rand = () => {
    seed = (seed * 16807) % 2147483647
    return (seed - 1) / 2147483646
  }
  return Array.from({ length: COUNT[weather.intensity] }, (_, i) => {
    const kind = weather.precip === 'snow' || (weather.precip === 'sleet' && i % 2 === 1) ? 'flake' : 'drop'
    const duration = kind === 'drop' ? 0.5 + rand() * 0.3 : 3.5 + rand() * 2
    return { kind, x: 2 + Math.floor(rand() * 60), y: 2 + Math.floor(rand() * 30), duration: round(duration), offset: round(rand() * duration) }
  })
}

const round = (n: number) => Math.round(n * 100) / 100
