import { sql } from '@vercel/postgres';
import { unstable_noStore as noStore } from 'next/cache';
import ContactsTable from '../components/ContactsTable';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';
export const revalidate = 0;

async function getData() {
  noStore();
  try {
    const c = await sql`SELECT c.company,c.country,c.city,c.segment,c.email,c.phone,c.phone_e164,c.whatsapp_ok,
      c.email_sent,c.whatsapp_sent,c.touches,c.response,c.next_step,
      (SELECT e.detail FROM events e WHERE e.company=c.company AND e.type='reply' ORDER BY e.created_at DESC LIMIT 1) AS last_message
      FROM contacts c ORDER BY (c.response <> 'No reply') DESC, (c.email_sent IS NOT NULL) DESC, c.company`;
    const s = await sql`SELECT count(*)::int total,
      count(*) FILTER (WHERE email <> '')::int with_email,
      count(*) FILTER (WHERE whatsapp_ok)::int wa_mobiles,
      count(email_sent)::int emailed,
      count(whatsapp_sent)::int whatsapped,
      count(*) FILTER (WHERE response <> 'No reply')::int responded
      FROM contacts`;
    return { ok: true, rows: c.rows, stats: s.rows[0] };
  } catch (e) {
    return { ok: false, error: e.message };
  }
}

export default async function Page() {
  const d = await getData();
  if (!d.ok) {
    return (<div className="wrap"><div className="note"><b>Database not initialised.</b> Error: {d.error}</div></div>);
  }
  return <ContactsTable rows={d.rows} stats={d.stats} />;
}
