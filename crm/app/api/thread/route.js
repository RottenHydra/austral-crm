import { sql } from '@vercel/postgres';
import { unstable_noStore as noStore } from 'next/cache';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';
export const revalidate = 0;

// Full event timeline (sends + replies) for one company.
export async function GET(request) {
    noStore();
    const company = new URL(request.url).searchParams.get('company') || '';
    if (!company) return Response.json({ events: [] });
    const r = await sql`SELECT channel, type, detail, created_at FROM events WHERE company=${company} ORDER BY created_at ASC`;
    return Response.json({ company, events: r.rows });
  }
