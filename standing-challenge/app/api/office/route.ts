import { getSessionEmail } from '@/lib/current-employee'
import { loadOfficeSnapshot } from '@/lib/office'

// Polled by every open tab every 5 seconds. Route handlers are dynamic by default in Next 16.
export async function GET() {
  if (!(await getSessionEmail())) return Response.json({ error: 'Ikke innlogget' }, { status: 401 })
  return Response.json(await loadOfficeSnapshot())
}
