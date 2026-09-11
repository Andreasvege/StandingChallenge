import { asc } from 'drizzle-orm'
import { AdminPanel } from '@/components/admin/AdminPanel'
import { db } from '@/db/client'
import { employees } from '@/db/schema'
import { requireAdmin } from '@/lib/current-employee'

export default async function AdminPage() {
  const me = await requireAdmin()
  const rows = await db.select().from(employees).orderBy(asc(employees.name))
  return (
    <AdminPanel
      meId={me.id}
      employees={rows.map(r => ({ id: r.id, name: r.name, email: r.email, seat: r.seat, figure: r.figure }))}
    />
  )
}
