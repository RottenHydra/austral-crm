import { sql } from '@vercel/postgres';
import seed from '../../../db/seed.json';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request) {
  const token = new URL(request.url).searchParams.get('token');
  if (!process.env.SEED_TOKEN || token !== process.env.SEED_TOKEN) {
    return Response.json({ error: 'unauthorized' }, { status: 401 });
  }
  await sql`CREATE TABLE IF NOT EXISTS contacts (
    id serial PRIMARY KEY,
    company text UNIQUE NOT NULL,
    country text, city text, segment text, website text,
    phone text, phone_e164 text, email text DEFAULT '',
    whatsapp_ok boolean DEFAULT false,
    email_sent date, whatsapp_sent date,
    touches int DEFAULT 0,
    response text DEFAULT 'No reply',
    next_step text DEFAULT '',
    updated_at timestamptz DEFAULT now()
  )`;
  await sql`CREATE TABLE IF NOT EXISTS events (
    id serial PRIMARY KEY, company text, channel text, type text, detail text,
    created_at timestamptz DEFAULT now()
  )`;
  let n = 0;
  for (const c of seed) {
    await sql`INSERT INTO contacts
      (company,country,city,segment,website,phone,phone_e164,email,whatsapp_ok,email_sent,whatsapp_sent,touches,response,next_step)
      VALUES (${c.company},${c.country},${c.city},${c.segment},${c.website},${c.phone},${c.phone_e164},
              ${c.email},${c.whatsapp_ok},${c.email_sent},${c.whatsapp_sent},${c.touches},${c.response},${c.next_step})
      ON CONFLICT (company) DO UPDATE SET
        email=EXCLUDED.email, whatsapp_ok=EXCLUDED.whatsapp_ok,
        phone=EXCLUDED.phone, phone_e164=EXCLUDED.phone_e164,
        website=EXCLUDED.website, segment=EXCLUDED.segment`;
    n++;
  }
  return Response.json({ ok: true, seeded: n });
}
