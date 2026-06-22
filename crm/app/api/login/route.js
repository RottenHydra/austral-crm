import { NextResponse } from 'next/server';
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(request) {
    const { password } = await request.json().catch(() => ({}));
    if (!password || password !== process.env.CRM_PASSWORD) {
          return NextResponse.json({ ok: false }, { status: 401 });
        }
    const res = NextResponse.json({ ok: true });
    res.cookies.set('crm_session', process.env.SESSION_SECRET, { httpOnly: true, secure: true, sameSite: 'lax', path: '/' });
    return res;
  }

export async function GET(request) {
    const res = NextResponse.redirect(new URL('/login', request.url));
    res.cookies.set('crm_session', '', { httpOnly: true, secure: true, sameSite: 'lax', path: '/', maxAge: 0 });
    return res;
  }
