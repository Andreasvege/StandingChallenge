import { notFound } from 'next/navigation'
import { connection } from 'next/server'
import { LanguageToggle } from '@/components/LanguageToggle'
import { OfficeRoom } from '@/components/office/OfficeRoom'
import { demoRoom } from '@/lib/demo-office'

// Dev-only preview of the room with demo data — no login or database.
// ?hour=8 previews the morning sky, ?cheer=1 shows a floating heiarop.
export default async function DevRoomPage({ searchParams }: { searchParams: Promise<{ hour?: string; cheer?: string }> }) {
  if (process.env.NODE_ENV === 'production') notFound()
  await connection()
  const { hour, cheer } = await searchParams
  const room = demoRoom(hour === undefined ? undefined : Number(hour), cheer !== undefined)
  return (
    <main style={{ padding: 16 }}>
      <p style={{ margin: '0 0 12px' }}>
        <LanguageToggle />
      </p>
      <OfficeRoom employees={room.employees} leaderId={room.leaderId} now={room.now} cheers={room.cheers} />
    </main>
  )
}
