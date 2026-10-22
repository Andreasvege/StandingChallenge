// Real weather in the windows, from MET Norway (the data behind Yr). The fetch lives in lib/yr.ts;
// this file only turns MET's symbol codes into what the room draws, so it can be tested.
// Symbol codes: https://api.met.no/weatherapi/weathericon/2.0/documentation

export type Precip = 'none' | 'rain' | 'sleet' | 'snow'

/** 0 = calm (under 8 m/s), 1 = frisk bris (8–10,7), 2 = liten kuling and up (10,8+): Beaufort 5 and 6. */
export type WindLevel = 0 | 1 | 2

export interface Weather {
  precip: Precip
  /** 1 = light, 2 = normal, 3 = heavy. Only meaningful with precipitation. */
  intensity: 1 | 2 | 3
  thunder: boolean
  /** A grey sky with no sun or moon: cloudy, foggy or anything falling. */
  overcast: boolean
  fog: boolean
  /** Turns the rain up (slant, count, pane, splash) and the leaf gusts up; see `windLevel`. */
  wind: WindLevel
}

export const CLEAR: Weather = { precip: 'none', intensity: 2, thunder: false, overcast: false, fog: false, wind: 0 }

/** MET's wind_speed (m/s) as a level. Missing or unreadable wind is calm. */
export function windLevel(metersPerSecond: number | undefined): WindLevel {
  if (metersPerSecond === undefined || !(metersPerSecond >= 8)) return 0
  return metersPerSecond >= 10.8 ? 2 : 1
}

/** Aker Tech House, Fornebu (OpenStreetMap). MET wants at most 4 decimals. */
export const OFFICE_LOCATION = { lat: 59.9041, lon: 10.6248 } as const

/** 'heavyrainshowersandthunder_day' → heavy rain with thunder. Unknown codes read as clear. */
export function weatherFromSymbol(symbol: string, windSpeed?: number): Weather {
  const code = symbol.replace(/_(day|night|polartwilight)$/, '')
  const thunder = code.includes('thunder')
  const precip: Precip = code.includes('sleet') ? 'sleet' : code.includes('snow') ? 'snow' : code.includes('rain') ? 'rain' : 'none'
  const intensity = code.startsWith('light') ? 1 : code.startsWith('heavy') ? 3 : 2
  const fog = code === 'fog'
  return { precip, intensity, thunder, fog, overcast: precip !== 'none' || thunder || fog || code === 'cloudy', wind: windLevel(windSpeed) }
}

interface ForecastStep {
  time: string
  data: { instant?: { details?: { wind_speed?: number } }; next_1_hours?: { summary?: { symbol_code?: string } } }
}

export interface Conditions {
  symbol: string
  /** m/s, as MET gives it; missing when the hour has no wind reading. */
  windSpeed: number | undefined
}

/** The symbol and wind for the hour that `now` falls in, from a locationforecast/2.0 response. */
export function currentConditions(forecast: unknown, now: number): Conditions | null {
  const steps = (forecast as { properties?: { timeseries?: ForecastStep[] } })?.properties?.timeseries
  if (!Array.isArray(steps)) return null
  const HOUR = 3_600_000
  const step =
    steps.find(s => {
      const t = Date.parse(s.time)
      return t <= now && now < t + HOUR
    }) ?? steps.find(s => Date.parse(s.time) > now)
  const symbol = step?.data.next_1_hours?.summary?.symbol_code
  if (!symbol) return null
  const wind = step?.data.instant?.details?.wind_speed
  return { symbol, windSpeed: typeof wind === 'number' ? wind : undefined }
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
  /** Gale only: a drop close to the glass, drawn as a longer diagonal and falling faster. */
  near?: boolean
}

/** Rain and snow far behind the glass: fewer drops than before, because the drops on the pane carry the rain now. */
const COUNT: Record<Weather['intensity'], number> = { 1: 5, 2: 10, 3: 17 }
const PANE_COUNT: Record<Weather['intensity'], number> = { 1: 3, 2: 5, 3: 8 }
const SPLASH_COUNT: Record<Weather['intensity'], number> = { 1: 0, 2: 3, 3: 6 }
/** How far a drop on the pane slides before it is gone, per wind level (Weather.module.css moves it the same). */
export const PANE_SLIDE: Record<WindLevel, number> = { 0: 12, 1: 14, 2: 18 }
/** The row just above the bottom of the frame, where the splashes sit. */
const SILL_Y = 33

/**
 * The particles for one window, the same on every render: a fixed pseudo-random sequence, so a poll
 * every 5 s never reshuffles the rain. Rain is far drops + drops on the pane + splashes on the sill;
 * snow is flakes only; sleet is every other far particle a flake, with the pane and the sill wet too.
 * Wind turns it up: frisk bris slants the far rain 1:2 and adds a little; liten kuling makes it 45°,
 * denser and faster (every third drop `near`, drawn as a longer diagonal), with more on the pane and
 * double the splash — the haze and the sheets of rain in a gale are the room's, not particles.
 */
export function precipitation(weather: Weather | undefined): Particle[] {
  if (!weather || weather.precip === 'none') return []
  const { wind, intensity } = weather
  let seed = 7
  const rand = () => {
    seed = (seed * 16807) % 2147483647
    return (seed - 1) / 2147483646
  }
  const farCount = Math.round(COUNT[intensity] * [1, 0.8, 1.4][wind])
  const far = Array.from({ length: farCount }, (_, i): Particle => {
    const kind = weather.precip === 'snow' || (weather.precip === 'sleet' && i % 2 === 1) ? 'flake' : 'drop'
    if (kind === 'flake') {
      const duration = 3.5 + rand() * 2
      return { kind, x: 2 + Math.floor(rand() * 60), y: 2 + Math.floor(rand() * 30), duration: round(duration), offset: round(rand() * duration) }
    }
    const near = wind === 2 && i % 3 === 0
    // In a gale a drop crosses as far sideways as it falls, so it starts well left of the glass.
    const x = wind === 2 ? -8 + Math.floor(rand() * 80) : 2 + Math.floor(rand() * 60)
    const duration = wind === 2 ? (near ? 0.55 + rand() * 0.15 : 0.9 + rand() * 0.2) : wind === 1 ? 1.0 + rand() * 0.3 : 1.1 + rand() * 0.3
    return { kind, x, y: 2 + Math.floor(rand() * 30), duration: round(duration), offset: round(rand() * duration), ...(near ? { near } : {}) }
  })
  if (weather.precip === 'snow') return far
  const paneCount = wind === 2 ? Math.round(PANE_COUNT[intensity] * 1.6) : PANE_COUNT[intensity] + wind
  const pane = Array.from({ length: paneCount }, (): Particle => {
    const duration = wind === 2 ? 2.5 + rand() * 2 : wind === 1 ? 3.5 + rand() * 2.5 : 4 + rand() * 3
    // Room for the slide: it goes 6 px sideways in a gale and 2 in a breeze, and must end above the sill.
    const x = 3 + Math.floor(rand() * (58 - [0, 2, 6][wind]))
    const y = 3 + Math.floor(rand() * (SILL_Y - PANE_SLIDE[wind] - 3 + 1))
    return { kind: 'pane', x, y, duration: round(duration), offset: round(rand() * duration) }
  })
  const splashCount = wind === 2 ? Math.max(2, SPLASH_COUNT[intensity] * 2) : wind === 1 ? Math.round(SPLASH_COUNT[intensity] * 1.5) : SPLASH_COUNT[intensity]
  const splash = Array.from({ length: splashCount }, (): Particle => {
    const duration = wind === 2 ? 0.7 + rand() * 0.5 : wind === 1 ? 1.0 + rand() * 0.6 : 1.2 + rand() * 0.8
    return { kind: 'splash', x: 3 + Math.floor(rand() * 58), y: SILL_Y, duration: round(duration), offset: round(rand() * duration) }
  })
  return [...far, ...pane, ...splash]
}

const round = (n: number) => Math.round(n * 100) / 100
