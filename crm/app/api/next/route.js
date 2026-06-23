import { sql } from '@vercel/postgres';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Channel orchestration: ONE source of truth both bots query. Middle East excluded (no shipping via Hormuz).
const PRIO = `CASE WHEN segment ~* 'timber|wood|pallet|lumber|veneer|plywood|manufact|joinery|furniture|door|sawmill|packaging|crate|pellet' THEN 0 ELSE 1 END`;
const EX = `country NOT IN ('UAE','Saudi Arabia','Oman','Qatar','Kuwait','Bahrain','Iraq','Iran')`;

export async function GET(request) {
    const p = new URL(request.url).searchParams;
    const channel = p.get('channel') || 'email';
    const mode = p.get('mode') || 'first';
    const limit = Math.min(parseInt(p.get('limit') || '10', 10), 50);
    let rows;
    if (channel === 'email') {
          rows = (await sql.query(
                  `SELECT company,email,segment,city,country FROM contacts
                         WHERE email <> '' AND email_sent IS NULL AND ${EX}
                                ORDER BY ${PRIO}, company LIMIT $1`, [limit])).rows;
    } else if (channel === 'whatsapp' && mode === 'followup') {
          rows = (await sql.query(
                  `SELECT company,phone_e164,segment,city,country FROM contacts
                         WHERE whatsapp_ok AND whatsapp_sent IS NULL AND email_sent IS NOT NULL
                                  AND response='No reply' AND email_sent <= current_date - 2 AND ${EX}
                                         ORDER BY ${PRIO}, company LIMIT $1`, [limit])).rows;
    } else {
          rows = (await sql.query(
                  `SELECT company,phone_e164,segment,city,country FROM contacts
                         WHERE whatsapp_ok AND whatsapp_sent IS NULL AND email_sent IS NULL AND ${EX}
                                ORDER BY ${PRIO}, company LIMIT $1`, [limit])).rows;
    }
    return Response.json({ channel, mode, count: rows.length, leads: rows });
}
