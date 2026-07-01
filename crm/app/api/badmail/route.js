import { sql } from '@vercel/postgres';
import { unstable_noStore as noStore } from 'next/cache';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

// List hygiene: mark an email address as failed verification.
// Clears the email so the email outreach bot never sends to it (protects sender reputation),
// keeps the company so WhatsApp can still reach it. Body: { company }
export async function POST(request) {
  noStore();
  const b = await request.json().catch(() => ({}));
  const company = b.company || '';
  if (!company) return Response.json({ error: 'company required' }, { status: 400 });
  const r = await sql`UPDATE contacts SET email='', next_step='email failed verification', updated_at=now() WHERE company=${company}`;
  return Response.json({ ok: true, company, updated: r.rowCount });
}
