'use client';
import { useMemo, useState } from 'react';

const RESPONSES = ['No reply', 'Replied', 'Interested', 'Quote sent', 'Sample/trial', 'Not interested', 'Won'];

function pill(resp, emailed, whatsapped) {
    if (resp === 'Interested' || resp === 'Won') return <span className="pill p-int">{resp}</span>;
    if (resp !== 'No reply') return <span className="pill p-rep">{resp}</span>;
    if (emailed || whatsapped) return <span className="pill p-sent">Contacted</span>;
    return <span className="pill p-none">New</span>;
}

export default function ContactsTable({ rows }) {
    const [q, setQ] = useState('');
    const [country, setCountry] = useState('');
    const [view, setView] = useState('all');
    const [data, setData] = useState(rows);

  const countries = useMemo(() => [...new Set(rows.map(r => r.country))].sort(), [rows]);

  const filtered = data.filter(r => {
        if (country && r.country !== country) return false;
        if (view === 'responses' && r.response === 'No reply') return false;
        if (view === 'emailed' && !r.email_sent) return false;
        if (view === 'whatsapp' && !r.whatsapp_sent) return false;
        if (view === 'uncontacted' && (r.email_sent || r.whatsapp_sent)) return false;
        if (q) {
                const s = (r.company + ' ' + (r.city || '') + ' ' + (r.segment || '') + ' ' + (r.last_message || '')).toLowerCase();
                if (!s.includes(q.toLowerCase())) return false;
        }
        return true;
  });

  async function save(company, field, value) {
        setData(d => d.map(r => r.company === company ? { ...r, [field]: value } : r));
        await fetch('/api/response', {
                method: 'POST', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ company, [field]: value }),
        });
  }

  return (
        <>
          <div className="toolbar">
            <input placeholder="Search company / city / segment / reply" value={q} onChange={e => setQ(e.target.value)} style={{ minWidth: 260 }} />
        <select value={country} onChange={e => setCountry(e.target.value)}>
            <option value="">All countries</option>
{countries.map(c => <option key={c} value={c}>{c}</option>)}
               </select>
                       <select value={view} onChange={e => setView(e.target.value)}>
            <option value="all">All</option>
           <option value="responses">Responses only</option>
           <option value="emailed">Emailed</option>
           <option value="whatsapp">WhatsApp sent</option>
           <option value="uncontacted">Not contacted</option>
  </select>
         <span style={{ color: '#6b7a73', fontSize: 13 }}>{filtered.length} shown</span>
  </div>
      <div style={{ overflowX: 'auto' }}>
        <table>
            <thead>
              <tr>
                <th>Company</th><th>Location</th><th>Segment</th><th>Channels</th>
                <th>Status</th><th>Response</th><th>Next step</th><th>Latest reply</th>
  </tr>
  </thead>
          <tbody>
{filtered.map(r => (
                <tr key={r.company}>
                  <td>
                    <b>{r.company}</b>
                                <div className="chan">
  {r.email ? <span>{r.email}</span> : null}
              {r.whatsapp_ok ? <span> / {r.phone}</span> : (r.phone ? <span> / {r.phone}</span> : null)}
</div>
  </td>
                <td>{r.city ? r.city + ', ' : ''}{r.country}</td>
                <td>{r.segment}</td>
                <td className="chan">
{r.email_sent ? <div>Email {String(r.email_sent).slice(0, 10)}</div> : null}
{r.whatsapp_sent ? <div>WhatsApp {String(r.whatsapp_sent).slice(0, 10)}</div> : null}
 {!r.email_sent && !r.whatsapp_sent ? <span>-</span> : null}
  {r.touches ? <div>{r.touches} touches</div> : null}
    </td>
                  <td>{pill(r.response, r.email_sent, r.whatsapp_sent)}</td>
                 <td>
                     <select value={r.response} onChange={e => save(r.company, 'response', e.target.value)}>
{RESPONSES.map(x => <option key={x} value={x}>{x}</option>)}
               </select>
               </td>
                               <td>
                                 <input className="inline" defaultValue={r.next_step || ''}
                    onBlur={e => save(r.company, 'next_step', e.target.value)} placeholder="add note / next step" />
                      </td>
                <td className="chan" style={{ maxWidth: 320, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }} title={r.last_message || ''}>{r.last_message || ''}</td>
                      </tr>
            ))}
              </tbody>
              </table>
              </div>
              </>
  );
}
