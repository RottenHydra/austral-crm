import { sql } from '@vercel/postgres';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Manual edits from the dashboard: { company, response?, next_step? }
export async function POST(request) {
  const b = await request.json().catch(() => ({}));
  const { company, response, next_step } = b;
  if (!company) return Response.json({ error: 'company required' }, { status: 400 });
  if (response !== undefined) await sql`UPDATE contacts SET response=${response}, updated_at=now() WHERE company=${company}`;
  if (next_step !== undefined) await sql`UPDATE contacts SET next_step=${next_step}, updated_at=now() WHERE company=${company}`;
  return Response.json({ ok: true });
}
