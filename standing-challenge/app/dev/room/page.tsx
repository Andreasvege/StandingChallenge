import { notFound } from 'next/navigation'
import { connection } from 'next/server'
import { LanguageToggle } from '@/components/LanguageToggle'
import { demoRoom } from '@/lib/demo-office'
import { weatherFromSymbol } from '@/lib/weather'
import { DevRoom } from './DevRoom'

// Dev-only preview of the room with demo data — no login or database.
// ?hour=8 previews the morning sky, ?cheer=1 shows a floating heiarop, ?month=10 the October art,
// ?actions=1 makes the colleague menu's buttons work (they only log), ?weather=heavyrainandthunder any MET symbol code (https://api.met.no/weatherapi/weathericon/2.0/documentation),
// ?wind=12 the wind in m/s (8 = frisk bris, 10.8 = liten kuling), which also speeds up the leaf gusts on its own,
// ?remote=0|1|2 how many colleagues hang on the wall as screens (for sweeping the podium's widths).
// Tapping Månedens ståere opens the month panel with demo months.
export default async function DevRoomPage({ searchParams }: { searchParams: Promise<{ hour?: string; cheer?: string; month?: string; weather?: string; wind?: string; actions?: string; remote?: string }> }) {
  if (process.env.NODE_ENV === 'production') notFound()
  await connection()
  const { hour, cheer, month, weather, wind, actions, remote } = await searchParams
  const room = demoRoom(hour === undefined ? undefined : Number(hour), cheer !== undefined)
  // Kasper is the demo's one wall screen; ?remote=0 brings him to his desk, ?remote=2 sends Ida to Trondheim too.
  const remoteCount = remote === undefined ? undefined : Number(remote)
  const employees =
    remoteCount === undefined
      ? room.employees
      : room.employees.map(e =>
          e.remoteFrom ? (remoteCount >= 1 ? e : { ...e, remoteFrom: null }) : remoteCount >= 2 && e.name === 'Ida' ? { ...e, remoteFrom: 'Trondheim' } : e,
        )
  return (
    <main style={{ padding: 16 }}>
      <p style={{ margin: '0 0 12px' }}>
        <LanguageToggle />
      </p>
      <DevRoom
        actions={actions !== undefined}
        employees={employees}
        leaderId={room.leaderId}
        now={room.now}
        cheers={room.cheers}
        trophy={room.trophy}
        month={month === undefined ? undefined : Number(month)}
        weather={weather === undefined && wind === undefined ? undefined : weatherFromSymbol(weather ?? 'clearsky_day', wind === undefined ? undefined : Number(wind))}
      />
    </main>
  )
}
