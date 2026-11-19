import { asc, isNotNull, isNull } from 'drizzle-orm'
import { AdminPanel } from '@/components/admin/AdminPanel'
import { db } from '@/db/client'
import { employees } from '@/db/schema'
import { requireAdmin } from '@/lib/current-employee'

export default async function AdminPage() {
  const me = await requireAdmin()
  const rows = await db.select().from(employees).where(isNull(employees.archivedAt)).orderBy(asc(employees.name))
  const archived = await db.select().from(employees).where(isNotNull(employees.archivedAt)).orderBy(asc(employees.name))
  return (
    <AdminPanel
      meId={me.id}
      employees={rows.map(r => ({ id: r.id, name: r.name, email: r.email, seat: r.seat, figure: r.figure, remoteFrom: r.remoteFrom }))}
      archived={archived.map(r => ({ id: r.id, name: r.name, figure: r.figure }))}
    />
  )
}
