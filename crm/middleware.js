import { NextResponse } from 'next/server';

export const config = { matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'] };

export function middleware(req) {
        const { pathname } = req.nextUrl;

  // Bots: API access with token (query ?token= or x-api-token header)
  if (pathname.startsWith('/api/')) {
            const token = process.env.API_TOKEN;
            const t = req.nextUrl.searchParams.get('token') || req.headers.get('x-api-token') || '';
            if (token && t === token) return NextResponse.next();
            if (pathname === '/api/login') return NextResponse.next();
  }

  // Login page is always reachable
  if (pathname === '/login') return NextResponse.next();

  // Everyone else needs a valid session cookie
  const secret = process.env.SESSION_SECRET;
        const cookie = req.cookies.get('crm_session');
        if (secret && cookie && cookie.value === secret) return NextResponse.next();

  if (pathname.startsWith('/api/')) {
            return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }
        const url = req.nextUrl.clone();
        url.pathname = '/login';
        return NextResponse.redirect(url);
}
