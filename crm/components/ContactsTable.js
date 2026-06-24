'use client';
import { useMemo, useState, useEffect } from 'react';

const RESPONSES = ['No reply', 'Replied', 'Interested', 'Quote sent', 'Sample/trial', 'Not interested', 'Won'];

const I18N = {
  en: {
    title: 'Austral Timber — Outreach CRM', sub: 'Radiata pine and wood pellet outreach',
    logout: 'Log out', search: 'Search company, city, segment, reply',
    allCountries: 'All countries', country: 'Country', status: 'Status', channel: 'Channel',
    shown: 'shown', total: 'Total leads', withEmail: 'With email', waMobiles: 'WhatsApp mobiles',
    emailed: 'Emailed', waSent: 'WhatsApp sent', responses: 'Responses',
    all: 'All', emailedF: 'Emailed', waSentF: 'WhatsApp sent', notContacted: 'Not contacted', hasReply: 'Has reply',
    company: 'Company', location: 'Location', segment: 'Segment', channels: 'Channels', nextStep: 'Next step', latestReply: 'Latest reply',
    nw: 'New', contacted: 'Contacted', nextPh: 'add note / next step',
    conversation: 'Conversation', noMessages: 'No messages logged yet.', sent: 'Sent', reply: 'Reply',
    touches: 'touches', email: 'Email', whatsapp: 'WhatsApp', original: 'Original',
    sl: { 'No reply': 'No reply', 'Replied': 'Replied', 'Interested': 'Interested', 'Quote sent': 'Quote sent', 'Sample/trial': 'Sample/trial', 'Not interested': 'Not interested', 'Won': 'Won' }
  },
  es: {
    title: 'Austral Timber — CRM de Contacto', sub: 'Pino radiata y pellets de madera',
    logout: 'Cerrar sesion', search: 'Buscar empresa, ciudad, segmento, respuesta',
    allCountries: 'Todos los paises', country: 'Pais', status: 'Estado', channel: 'Canal',
    shown: 'mostrados', total: 'Total contactos', withEmail: 'Con email', waMobiles: 'Moviles WhatsApp',
    emailed: 'Emails enviados', waSent: 'WhatsApp enviados', responses: 'Respuestas',
    all: 'Todos', emailedF: 'Con email', waSentF: 'WhatsApp', notContacted: 'Sin contactar', hasReply: 'Con respuesta',
    company: 'Empresa', location: 'Ubicacion', segment: 'Segmento', channels: 'Canales', nextStep: 'Siguiente paso', latestReply: 'Ultima respuesta',
    nw: 'Nuevo', contacted: 'Contactado', nextPh: 'anadir nota / siguiente paso',
    conversation: 'Conversacion', noMessages: 'Aun no hay mensajes.', sent: 'Enviado', reply: 'Respuesta',
    touches: 'contactos', email: 'Email', whatsapp: 'WhatsApp', original: 'Original',
    sl: { 'No reply': 'Sin respuesta', 'Replied': 'Respondio', 'Interested': 'Interesado', 'Quote sent': 'Cotizacion enviada', 'Sample/trial': 'Muestra/prueba', 'Not interested': 'No interesado', 'Won': 'Ganado' }
  }
};

export default function ContactsTable({ rows, stats }) {
  const [lang, setLang] = useState('en');
  const [q, setQ] = useState('');
  const [country, setCountry] = useState('');
  const [status, setStatus] = useState('all');
  const [channel, setChannel] = useState('all');
  const [data, setData] = useState(rows);
  const [sel, setSel] = useState(null);
  const [thread, setThread] = useState(null);
  const [tcache, setTcache] = useState({});

  useEffect(() => { try { const l = localStorage.getItem('crm_lang'); if (l) setLang(l); } catch (e) {} }, []);
  useEffect(() => { try { localStorage.setItem('crm_lang', lang); } catch (e) {} }, [lang]);

  const t = I18N[lang];
  const countries = useMemo(() => [...new Set(rows.map(r => r.country))].sort(), [rows]);

  async function translate(texts) {
    const uniq = [...new Set(texts.filter(x => x && !(x in tcache)))];
    if (!uniq.length) return;
    try {
      const r = await fetch('/api/translate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ texts: uniq, to: 'es' }) });
      const j = await r.json();
      const add = {};
      uniq.forEach((x, i) => { add[x] = (j.translations && j.translations[i]) || x; });
      setTcache(c => ({ ...c, ...add }));
    } catch (e) {}
  }

  useEffect(() => {
    if (lang === 'es') {
      translate(rows.map(r => r.last_message).filter(Boolean));
      if (thread) translate(thread.map(e => e.detail).filter(Boolean));
    }
  }, [lang]);

  function tr(text) { if (!text || lang !== 'es') return text; return tcache[text] || text; }

  const filtered = data.filter(r => {
    if (country && r.country !== country) return false;
    if (status === 'new' && (r.email_sent || r.whatsapp_sent || r.response !== 'No reply')) return false;
    if (RESPONSES.includes(status) && r.response !== status) return false;
    if (channel === 'emailed' && !r.email_sent) return false;
    if (channel === 'whatsapp' && !r.whatsapp_sent) return false;
    if (channel === 'none' && (r.email_sent || r.whatsapp_sent)) return false;
    if (channel === 'reply' && r.response === 'No reply') return false;
    if (q) {
      const s = (r.company + ' ' + (r.city || '') + ' ' + (r.segment || '') + ' ' + (r.email || '') + ' ' + (r.last_message || '')).toLowerCase();
      if (!s.includes(q.toLowerCase())) return false;
    }
    return true;
  });

  async function save(company, field, value) {
    setData(d => d.map(r => r.company === company ? { ...r, [field]: value } : r));
    setSel(s => (s && s.company === company ? { ...s, [field]: value } : s));
    await fetch('/api/response', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ company, [field]: value }) });
  }

  async function openLead(r) {
    setSel(r); setThread(null);
    try {
      const res = await fetch('/api/thread?company=' + encodeURIComponent(r.company));
      const j = await res.json();
      setThread(j.events || []);
      if (lang === 'es') translate((j.events || []).map(e => e.detail).filter(Boolean));
    } catch (e) { setThread([]); }
  }

  function pill(r) {
    const resp = r.response;
    if (resp === 'Interested' || resp === 'Won') return <span className="pill p-int">{t.sl[resp]}</span>;
    if (resp !== 'No reply') return <span className="pill p-rep">{t.sl[resp]}</span>;
    if (r.email_sent || r.whatsapp_sent) return <span className="pill p-sent">{t.contacted}</span>;
    return <span className="pill p-none">{t.nw}</span>;
  }

  const statusChips = [['all', t.all], ['new', t.nw], ['Interested', t.sl['Interested']], ['Replied', t.sl['Replied']], ['Quote sent', t.sl['Quote sent']], ['Won', t.sl['Won']], ['Not interested', t.sl['Not interested']]];
  const channelChips = [['all', t.all], ['emailed', t.emailedF], ['whatsapp', t.waSentF], ['none', t.notContacted], ['reply', t.hasReply]];

  return (
    <>
      <header>
        <div>
          <h1>{t.title}</h1>
          <div className="sub">{t.sub}</div>
        </div>
        <div className="hdr-actions">
          <div className="lang">
            <button className={lang === 'en' ? 'on' : ''} onClick={() => setLang('en')}>EN</button>
            <button className={lang === 'es' ? 'on' : ''} onClick={() => setLang('es')}>ES</button>
          </div>
          <a href="/api/login" className="logout">{t.logout}</a>
        </div>
      </header>
      <div className="wrap">
        <div className="cards">
          <Card n={stats.total} l={t.total} />
          <Card n={stats.with_email} l={t.withEmail} />
          <Card n={stats.wa_mobiles} l={t.waMobiles} />
          <Card n={stats.emailed} l={t.emailed} />
          <Card n={stats.whatsapped} l={t.waSent} />
          <Card n={stats.responded} l={t.responses} />
        </div>
        <div className="filters">
          <input className="search" placeholder={t.search} value={q} onChange={e => setQ(e.target.value)} />
          <select value={country} onChange={e => setCountry(e.target.value)}>
            <option value="">{t.allCountries}</option>
            {countries.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div className="chips">
          <span className="chips-label">{t.status}:</span>
          {statusChips.map(([v, lab]) => <button key={v} className={'chip' + (status === v ? ' on' : '')} onClick={() => setStatus(v)}>{lab}</button>)}
        </div>
        <div className="chips">
          <span className="chips-label">{t.channel}:</span>
          {channelChips.map(([v, lab]) => <button key={v} className={'chip' + (channel === v ? ' on' : '')} onClick={() => setChannel(v)}>{lab}</button>)}
          <span className="count">{filtered.length} {t.shown}</span>
        </div>
        <div className="tablewrap">
          <table>
            <thead><tr>
              <th>{t.company}</th><th>{t.location}</th><th>{t.segment}</th><th>{t.channels}</th>
              <th>{t.status}</th><th>{t.nextStep}</th><th>{t.latestReply}</th>
            </tr></thead>
            <tbody>
              {filtered.map(r => (
                <tr key={r.company} className="row" onClick={() => openLead(r)}>
                  <td><b>{r.company}</b><div className="chan">{[r.email, r.phone].filter(Boolean).join('   ')}</div></td>
                  <td>{r.city ? r.city + ', ' : ''}{r.country}</td>
                  <td>{r.segment}</td>
                  <td className="chan">
                    {r.email_sent ? <div>{t.email} {String(r.email_sent).slice(0, 10)}</div> : null}
                    {r.whatsapp_sent ? <div>{t.whatsapp} {String(r.whatsapp_sent).slice(0, 10)}</div> : null}
                    {!r.email_sent && !r.whatsapp_sent ? <span>-</span> : null}
                    {r.touches ? <div>{r.touches} {t.touches}</div> : null}
                  </td>
                  <td>{pill(r)}</td>
                  <td onClick={e => e.stopPropagation()}>
                    <input className="inline" defaultValue={r.next_step || ''} onBlur={e => save(r.company, 'next_step', e.target.value)} placeholder={t.nextPh} />
                  </td>
                  <td className="reply">{tr(r.last_message) || ''}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      {sel ? (
        <div className="drawer-bg" onClick={() => setSel(null)}>
          <div className="drawer" onClick={e => e.stopPropagation()}>
            <div className="drawer-hd">
              <div><h2>{sel.company}</h2><div className="sub2">{sel.city ? sel.city + ', ' : ''}{sel.country} / {sel.segment}</div></div>
              <button className="x" onClick={() => setSel(null)}>&times;</button>
            </div>
            <div className="drawer-meta">
              {sel.email ? <div>{t.email}: {sel.email}</div> : null}
              {sel.phone ? <div>{t.whatsapp}: {sel.phone}</div> : null}
              <div className="statusrow">
                <span>{t.status}:</span>
                <select value={sel.response} onChange={e => save(sel.company, 'response', e.target.value)}>
                  {RESPONSES.map(x => <option key={x} value={x}>{t.sl[x]}</option>)}
                </select>
              </div>
              <input className="inline2" defaultValue={sel.next_step || ''} onBlur={e => save(sel.company, 'next_step', e.target.value)} placeholder={t.nextPh} />
            </div>
            <div className="thread">
              <div className="thread-title">{t.conversation}</div>
              {thread === null ? <div className="muted">...</div> : (thread.length ? thread.map((ev, i) => (
                <div key={i} className={'msg ' + (ev.type === 'reply' ? 'in' : 'out')}>
                  <div className="msg-meta">{ev.type === 'reply' ? t.reply : t.sent} / {ev.channel === 'whatsapp' ? t.whatsapp : t.email} / {String(ev.created_at).slice(0, 10)}</div>
                  <div className="msg-body">{tr(ev.detail)}</div>
                  {lang === 'es' && ev.detail && tcache[ev.detail] && tcache[ev.detail] !== ev.detail ? <div className="msg-orig">{t.original}: {ev.detail}</div> : null}
                </div>
              )) : <div className="muted">{t.noMessages}</div>)}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

function Card({ n, l }) { return <div className="card"><div className="n">{n}</div><div className="l">{l}</div></div>; }

