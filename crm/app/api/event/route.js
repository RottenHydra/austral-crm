import { sql } from '@vercel/postgres';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Bots call this AFTER sending so the CRM stays the single source of truth.
// body: { company, channel: 'email'|'whatsapp', type: 'sent'|'reply', status?, detail? }
// For type 'reply': status is the short label, detail is the FULL message text.
export async function POST(request) {
    const b = await request.json().catch(() => ({}));
    const { company, channel, type, status, detail } = b;
    if (!company || !channel || !type) {
          return Response.json({ error: 'company, channel, type required' }, { status: 400 });
    }
    if (type === 'sent') {
          if (channel === 'email') {
                  await sql`UPDATE contacts SET email_sent=current_date, touches=touches+1, updated_at=now() WHERE company=${company}`;
          } else {
                  await sql`UPDATE contacts SET whatsapp_sent=current_date, touches=touches+1, updated_at=now() WHERE company=${company}`;
          }
    } else if (type === 'reply') {
          await sql`UPDATE contacts SET response=${status || 'Replied'}, touches=touches+1, updated_at=now() WHERE company=${company}`;
    }
    await sql`INSERT INTO events (company,channel,type,detail) VALUES (${company},${channel},${type},${detail || ''})`;
    return Response.json({ ok: true });
}
