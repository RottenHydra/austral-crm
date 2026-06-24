import { sql } from '@vercel/postgres';
import { unstable_noStore as noStore } from 'next/cache';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';
export const revalidate = 0;

export async function GET() {
  noStore();
  try {
    const r = await sql`SELECT company,country,city,segment,email,phone,phone_e164,whatsapp_ok,
      email_sent,whatsapp_sent,touches,response,next_step
      FROM contacts ORDER BY (response <> 'No reply') DESC, (email_sent IS NOT NULL) DESC, company`;
    return Response.json({ ok: true, contacts: r.rows });
  } catch (e) {
    return Response.json({ ok: false, error: e.message }, { status: 500 });
  }
}
