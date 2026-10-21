// Fredagsrapporten: the week so far, posted to a Slack channel every Friday afternoon so the office
// is reminded the room exists without anybody being singled out. Pure; app/api/cron/weekly sends it.
// Norwegian only — it goes to a shared channel, not to one person's browser.

import { formatDuration, monthName } from './format'
import { WEEKLY_GOAL_HOURS } from './plant'

export interface SummaryPerson {
  name: string
  seconds: number
}

export interface SummaryInput {
  /** Everyone at the office with this week's total, in any order. */
  week: SummaryPerson[]
  /** The month so far, most seconds first (only people who stood). */
  month: SummaryPerson[]
  /** 1–12, for «Kampen om oktober-pokalen». */
  monthNumber: number
  url: string
}

const MEDALS = ['🥇', '🥈', '🥉']

export function weeklySummary({ week, month, monthNumber, url }: SummaryInput): string {
  const total = week.reduce((sum, p) => sum + p.seconds, 0)
  const stood = week.filter(p => p.seconds > 0).sort((a, b) => b.seconds - a.seconds)
  const goal = WEEKLY_GOAL_HOURS * 3600
  const lines = ['*🧍 Fredagsrapport fra Stå på!*', '']

  if (stood.length === 0) {
    lines.push('Ingen har stått denne uka ennå. Kontorplanten tørster 🥀 Det er ikke for sent å reise seg i dag!')
  } else {
    const plant = total >= goal ? 'Kontorplanten blomstrer 🌸' : `Kontorplanten mangler ${formatDuration(goal - total)} for å blomstre 🌱`
    lines.push(`Denne uka har kontoret stått *${formatDuration(total)}* til sammen. ${plant}`, '')
    stood.slice(0, 3).forEach((p, i) => lines.push(`${MEDALS[i]} ${p.name} – ${formatDuration(p.seconds)}`))
    const idle = week.length - stood.length
    if (idle > 0) lines.push('', `${idle} ${idle === 1 ? 'kollega har' : 'kolleger har'} ikke stått denne uka – fredag er en fin dag å starte 😄`)
  }

  const [leader, runnerUp] = month
  if (leader) {
    const race = runnerUp ? `, med ${runnerUp.name} på ${formatDuration(runnerUp.seconds)} bak` : ''
    lines.push('', `🏆 Kampen om ${monthName(monthNumber)}-pokalen: ${leader.name} leder med ${formatDuration(leader.seconds)}${race}.`)
  }

  lines.push('', `<${url}|Åpne kontoret →>`)
  return lines.join('\n')
}
