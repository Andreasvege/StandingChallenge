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

export type ParticleKind = 'drop' | 'flake' | 'pane' | 'splash'

export interface Particle {
  /**
   * `drop`: rain far behind the glass, drifting with the wind. `flake`: snow. `pane`: a drop on the
   * glass itself, which waits, slides 12 px down and is gone. `splash`: a two-frame plask on the sill.
   */
  kind: ParticleKind
  /** Column on the 64×36 window grid, inside the glass. */
  x: number
  /** Where it sits when nothing moves (reduced motion); the fall passes through it. */
  y: number
  /** Seconds for one fall (or one land-slide-vanish cycle, or one splash). */
  duration: number
  /** Seconds into its cycle at page load, so the window is never empty while the first ones arrive. */
  offset: number
}

/** Rain and snow far behind the glass: fewer drops than before, because the drops on the pane carry the rain now. */
const COUNT: Record<Weather['intensity'], number> = { 1: 5, 2: 10, 3: 17 }
const PANE_COUNT: Record<Weather['intensity'], number> = { 1: 3, 2: 5, 3: 8 }
const SPLASH_COUNT: Record<Weather['intensity'], number> = { 1: 0, 2: 3, 3: 6 }
/** How far a drop on the pane slides before it is gone (Weather.module.css moves it the same 12 px). */
export const PANE_SLIDE = 12
/** The row just above the bottom of the frame, where the splashes sit. */
const SILL_Y = 33

/**
 * The particles for one window, the same on every render: a fixed pseudo-random sequence, so a poll
 * every 5 s never reshuffles the rain. Rain is far drops + drops on the pane + splashes on the sill;
 * snow is flakes only; sleet is every other far particle a flake, with the pane and the sill wet too.
 */
export function precipitation(weather: Weather | undefined): Particle[] {
  if (!weather || weather.precip === 'none') return []
  let seed = 7
  const rand = () => {
    seed = (seed * 16807) % 2147483647
    return (seed - 1) / 2147483646
  }
  const far = Array.from({ length: COUNT[weather.intensity] }, (_, i): Particle => {
    const kind = weather.precip === 'snow' || (weather.precip === 'sleet' && i % 2 === 1) ? 'flake' : 'drop'
    const duration = kind === 'drop' ? 1.1 + rand() * 0.3 : 3.5 + rand() * 2
    return { kind, x: 2 + Math.floor(rand() * 60), y: 2 + Math.floor(rand() * 30), duration: round(duration), offset: round(rand() * duration) }
  })
  if (weather.precip === 'snow') return far
  const pane = Array.from({ length: PANE_COUNT[weather.intensity] }, (): Particle => {
    const duration = 4 + rand() * 3
    return { kind: 'pane', x: 3 + Math.floor(rand() * 58), y: 3 + Math.floor(rand() * (SILL_Y - PANE_SLIDE - 3 + 1)), duration: round(duration), offset: round(rand() * duration) }
  })
  const splash = Array.from({ length: SPLASH_COUNT[weather.intensity] }, (): Particle => {
    const duration = 1.2 + rand() * 0.8
    return { kind: 'splash', x: 3 + Math.floor(rand() * 58), y: SILL_Y, duration: round(duration), offset: round(rand() * duration) }
  })
  return [...far, ...pane, ...splash]
}

const round = (n: number) => Math.round(n * 100) / 100
