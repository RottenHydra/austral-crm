'use client';
import { useState } from 'react';

export default function Login() {
  const [pw, setPw] = useState('');
    const [err, setErr] = useState('');
      const [busy, setBusy] = useState(false);

        async function submit(e) {
            e.preventDefault();
                setBusy(true);
                    setErr('');
                        const r = await fetch('/api/login', {
                              method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                          body: JSON.stringify({ password: pw }),
                                              });
                                                  if (r.ok) {
                                                        window.location.href = '/';
                                                            } else {
                                                                  setErr('Wrong password');
                                                                        setBusy(false);
                                                                            }
                                                                              }

                                                                                return (
                                                                                    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#1f3a2e', fontFamily: 'system-ui, sans-serif' }}>
                                                                                          <form onSubmit={submit} style={{ background: '#fff', padding: 28, borderRadius: 12, width: 320, boxShadow: '0 10px 40px rgba(0,0,0,.35)' }}>
                                                                                                  <h2 style={{ margin: '0 0 4px', color: '#1f3a2e' }}>Austral Timber CRM</h2>
                                                                                                          <div style={{ color: '#6b7a73', fontSize: 13, marginBottom: 18 }}>Sign in to continue</div>
                                                                                                                  <input type="password" value={pw} onChange={e => setPw(e.target.value)} placeholder="Password" autoFocus style={{ width: '100%', padding: '10px 12px', border: '1px solid #e2e8e4', borderRadius: 8, fontSize: 14, marginBottom: 12, boxSizing: 'border-box' }} />
                                                                                                                          {err ? <div style={{ color: '#b3261e', fontSize: 13, marginBottom: 12 }}>{err}</div> : null}
                                                                                                                                  <button type="submit" disabled={busy} style={{ width: '100%', padding: '10px 12px', background: '#2e6b4f', color: '#fff', border: 0, borderRadius: 8, fontSize: 14, cursor: 'pointer' }}>{busy ? 'Signing in...' : 'Sign in'}</button>
                                                                                                                                        </form>
                                                                                                                                            </div>
                                                                                                                                              );
                                                                                                                                              }
                                                                                                                                              
