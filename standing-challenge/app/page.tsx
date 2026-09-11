import { OfficeApp } from '@/components/OfficeApp'
import { isAdminEmail } from '@/lib/access'
import { requireEmployee } from '@/lib/current-employee'
import { loadOfficeSnapshot } from '@/lib/office'

// Dynamic: requireEmployee() reads the session cookie.
export default async function Home() {
  const me = await requireEmployee()
  const snapshot = await loadOfficeSnapshot()
  return <OfficeApp initial={snapshot} meId={me.id} isAdmin={isAdminEmail(me.email)} />
}
