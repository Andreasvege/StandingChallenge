import { notFound } from 'next/navigation'
import { connection } from 'next/server'
import { LanguageToggle } from '@/components/LanguageToggle'
import { OfficeRoom } from '@/components/office/OfficeRoom'
import { demoRoom } from '@/lib/demo-office'
import { weatherFromSymbol } from '@/lib/weather'
import { DevRoom } from './DevRoom'

// Dev-only preview of the room with demo data — no login or database.
// ?hour=8 previews the morning sky, ?cheer=1 shows a floating heiarop, ?month=10 the October art,
// ?actions=1 makes the colleague menu's buttons work (they only log), ?weather=heavyrainandthunder any MET symbol code (https://api.met.no/weatherapi/weathericon/2.0/documentation).
export default async function DevRoomPage({ searchParams }: { searchParams: Promise<{ hour?: string; cheer?: string; month?: string; weather?: string; actions?: string }> }) {
  if (process.env.NODE_ENV === 'production') notFound()
  await connection()
  const { hour, cheer, month, weather, actions } = await searchParams
  const Room = actions === undefined ? OfficeRoom : DevRoom
  const room = demoRoom(hour === undefined ? undefined : Number(hour), cheer !== undefined)
  return (
    <main style={{ padding: 16 }}>
      <p style={{ margin: '0 0 12px' }}>
        <LanguageToggle />
      </p>
      <Room
        employees={room.employees}
        leaderId={room.leaderId}
        now={room.now}
        cheers={room.cheers}
        month={month === undefined ? undefined : Number(month)}
        weather={weather === undefined ? undefined : weatherFromSymbol(weather)}
      />
    </main>
  )
}
