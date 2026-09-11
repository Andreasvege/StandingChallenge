import { notFound } from 'next/navigation'
import { connection } from 'next/server'
import { OfficeRoom } from '@/components/office/OfficeRoom'
import { demoRoom } from '@/lib/demo-office'

// Dev-only preview of the room with demo data — no login or database. ?hour=8 previews the morning sky.
export default async function DevRoomPage({ searchParams }: { searchParams: Promise<{ hour?: string }> }) {
  if (process.env.NODE_ENV === 'production') notFound()
  await connection()
  const { hour } = await searchParams
  const room = demoRoom(hour === undefined ? undefined : Number(hour))
  return (
    <main style={{ padding: 16 }}>
      <OfficeRoom employees={room.employees} leaderId={room.leaderId} now={room.now} />
    </main>
  )
}
