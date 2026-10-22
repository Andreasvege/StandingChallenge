// Fetches the weather at the office from MET Norway's locationforecast (the API behind Yr).
// Terms: https://api.met.no/doc/TermsOfService – identify the app in User-Agent, cache, and keep
// coordinates to 4 decimals. Every tab polls /api/office every 5 s, so the response goes through
// Next's data cache and MET sees one request per REVALIDATE_S, not one per poll.

import { OFFICE_LOCATION, currentConditions, weatherFromSymbol, type Weather } from './weather'

const REVALIDATE_S = 15 * 60
const USER_AGENT = 'sta-pa/1.0 github.com/Andreasvege/StandingChallenge'

/** Today's weather at the office, or undefined when MET can't be reached – the room then shows a clear sky. */
export async function loadWeather(now = Date.now()): Promise<Weather | undefined> {
  const { lat, lon } = OFFICE_LOCATION
  try {
    const res = await fetch(`https://api.met.no/weatherapi/locationforecast/2.0/compact?lat=${lat}&lon=${lon}`, {
      headers: { 'User-Agent': USER_AGENT },
      next: { revalidate: REVALIDATE_S },
      signal: AbortSignal.timeout(3000),
    })
    if (!res.ok) return undefined
    const now_ = currentConditions(await res.json(), now)
    return now_ ? weatherFromSymbol(now_.symbol, now_.windSpeed) : undefined
  } catch {
    return undefined
  }
}
