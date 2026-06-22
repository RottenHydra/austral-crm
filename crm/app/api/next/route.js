import { sql } from '@vercel/postgres';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Channel orchestration: ONE source of truth both bots query.
// email   -> companies with an email, not yet emailed
// whatsapp (first)    -> WhatsApp-reachable mobiles, NOT emailed and NOT yet whatsapped
// whatsapp (followup) -> already emailed, no reply after 2+ days, not yet whatsapped
const PRIO = `CASE WHEN segment ~* 'timber|wood|pallet|lumber|veneer|plywood|manufact|joinery|furniture|door|sawmill|packaging|crate' THEN 0 ELSE 1 END`;

export async function GET(request) {
  const p = new URL(request.url).searchParams;
  const channel = p.get('channel') || 'email';
  const mode = p.get('mode') || 'first';
  const limit = Math.min(parseInt(p.get('limit') || '10', 10), 50);
  let rows;
  if (channel === 'email') {
    rows = (await sql.query(
      `SELECT company,email,segment,city,country FROM contacts
       WHERE email <> '' AND email_sent IS NULL
       ORDER BY ${PRIO}, company LIMIT $1`, [limit])).rows;
  } else if (channel === 'whatsapp' && mode === 'followup') {
    rows = (await sql.query(
      `SELECT company,phone_e164,segment,city,country FROM contacts
       WHERE whatsapp_ok AND whatsapp_sent IS NULL AND email_sent IS NOT NULL
         AND response='No reply' AND email_sent <= current_date - 2
       ORDER BY ${PRIO}, company LIMIT $1`, [limit])).rows;
  } else {
    rows = (await sql.query(
      `SELECT company,phone_e164,segment,city,country FROM contacts
       WHERE whatsapp_ok AND whatsapp_sent IS NULL AND email_sent IS NULL
       ORDER BY ${PRIO}, company LIMIT $1`, [limit])).rows;
  }
  return Response.json({ channel, mode, count: rows.length, leads: rows });
}
