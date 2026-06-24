import { sql } from '@vercel/postgres';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Full event timeline (sends + replies) for one company.
export async function GET(request) {
    const company = new URL(request.url).searchParams.get('company') || '';
    if (!company) return Response.json({ events: [] });
    const r = await sql`SELECT channel, type, detail, created_at FROM events WHERE company=${company} ORDER BY created_at ASC`;
    return Response.json({ company, events: r.rows });
  }
