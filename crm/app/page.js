import { sql } from '@vercel/postgres';
import ContactsTable from '../components/ContactsTable';

export const dynamic = 'force-dynamic';

async function getData() {
  try {
    const c = await sql`SELECT company,country,city,segment,email,phone,phone_e164,whatsapp_ok,
      email_sent,whatsapp_sent,touches,response,next_step,
      (SELECT detail FROM events e WHERE e.company=contacts.company AND e.type='reply' ORDER BY e.created_at DESC LIMIT 1) AS last_message
      FROM contacts ORDER BY (response <> 'No reply') DESC, (email_sent IS NOT NULL) DESC, company`;
    const s = await sql`SELECT
      count(*)::int total,
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

function Card({ n, l }) {
  return <div className="card"><div className="n">{n}</div><div className="l">{l}</div></div>;
}

export default async function Page() {
  const d = await getData();
  return (
    <>
      <header>
    <a href="/api/login" style={{ float: 'right', color: '#bcd3c6', fontSize: 13, textDecoration: 'underline' }}>Log out</a>
        <h1>Austral Timber — Outreach CRM</h1>
        <div className="sub">Gulf radiata pine outreach · email + WhatsApp · single source of truth</div>
      </header>
      <div className="wrap">
        {!d.ok ? (
          <div className="note">
            <b>Database not initialised yet.</b> Add a Postgres store in Vercel, then seed it:
            <pre>curl -X POST &quot;https://YOUR-APP.vercel.app/api/seed?token=YOUR_SEED_TOKEN&quot;</pre>
            (set <code>SEED_TOKEN</code> in your Vercel env vars first). Error: {d.error}
          </div>
        ) : (
          <>
            <div className="cards">
              <Card n={d.stats.total} l="Total leads" />
              <Card n={d.stats.with_email} l="With email" />
              <Card n={d.stats.wa_mobiles} l="WhatsApp mobiles" />
              <Card n={d.stats.emailed} l="Emailed" />
              <Card n={d.stats.whatsapped} l="WhatsApp sent" />
              <Card n={d.stats.responded} l="Responses" />
            </div>
            <ContactsTable rows={d.rows} />
          </>
        )}
      </div>
    </>
  );
}
