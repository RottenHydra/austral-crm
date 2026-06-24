import { sql } from '@vercel/postgres';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Bulk add / enrich contacts. Body: { contacts: [ {company, country, city, segment, phone, phone_e164, email, whatsapp_ok} ] }
// On conflict (existing company) it updates the email when a non-empty email is provided (used for enrichment).
export async function POST(request) {
    const b = await request.json().catch(() => ({}));
    const list = Array.isArray(b.contacts) ? b.contacts : [];
    let n = 0;
    for (const c of list) {
          if (!c.company) continue;
          await sql`INSERT INTO contacts (company,country,city,segment,phone,phone_e164,email,whatsapp_ok,response,next_step)
                VALUES (${c.company},${c.country || ''},${c.city || ''},${c.segment || ''},${c.phone || ''},${c.phone_e164 || ''},${c.email || ''},${c.whatsapp_ok || false},'No reply','')
                      ON CONFLICT (company) DO UPDATE SET email = CASE WHEN EXCLUDED.email <> '' THEN EXCLUDED.email ELSE contacts.email END`;
          n++;
    }
    return Response.json({ ok: true, ingested: n });
}
