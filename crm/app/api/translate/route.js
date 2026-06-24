export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Translates an array of texts to a target language (default Spanish) via Google's public endpoint.
export async function POST(request) {
  const b = await request.json().catch(() => ({}));
  const texts = Array.isArray(b.texts) ? b.texts : [];
  const to = b.to || 'es';
  const out = [];
  for (const t of texts) {
    if (!t || !String(t).trim()) { out.push(t || ''); continue; }
    try {
      const url = 'https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=' + to + '&dt=t&q=' + encodeURIComponent(t);
      const res = await fetch(url);
      const j = await res.json();
      const tr = (j[0] || []).map(s => s[0]).join('');
      out.push(tr || t);
    } catch (e) {
      out.push(t);
    }
  }
  return Response.json({ translations: out });
}
