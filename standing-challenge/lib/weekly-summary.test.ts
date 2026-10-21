import { describe, expect, it } from 'vitest'
import { weeklySummary } from './weekly-summary'

const H = 3600
const url = 'https://example.test'

describe('weeklySummary', () => {
  it('names the top three, the plant and the race for the month', () => {
    const text = weeklySummary({
      week: [
        { name: 'Mina', seconds: 2 * H },
        { name: 'Even', seconds: 9 * H },
        { name: 'Joar', seconds: H },
        { name: 'Aslak', seconds: 1800 },
        { name: 'Vilde', seconds: 0 },
        { name: 'Raza', seconds: 0 },
      ],
      month: [
        { name: 'Even', seconds: 20 * H },
        { name: 'Andreas', seconds: 5 * H },
      ],
      monthNumber: 10,
      url,
    })
    expect(text).toContain('*12 t 30 min*')
    expect(text).toContain('🥇 Even – 9 t')
    expect(text).toContain('🥉 Joar – 1 t')
    expect(text).not.toContain('Aslak')
    expect(text).toContain('mangler 17 t 30 min')
    expect(text).toContain('2 kolleger har ikke stått')
    expect(text).not.toContain('Vilde') // nobody is named for not standing
    expect(text).toContain('oktober-pokalen: Even leder med 20 t, med Andreas på 5 t bak')
    expect(text).toContain(`<${url}|`)
  })

  it('celebrates a blooming plant and keeps a quiet week friendly', () => {
    expect(weeklySummary({ week: [{ name: 'Even', seconds: 31 * H }], month: [], monthNumber: 10, url })).toContain('blomstrer 🌸')
    const quiet = weeklySummary({ week: [{ name: 'Even', seconds: 0 }], month: [], monthNumber: 10, url })
    expect(quiet).toContain('Ingen har stått denne uka ennå')
    expect(quiet).not.toContain('pokalen')
  })
})
