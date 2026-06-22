import { NextResponse } from 'next/server';

export const config = { matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'] };

export function middleware(req) {
      const url = new URL(req.url);
      const isApi = url.pathname.startsWith('/api/');
      const token = process.env.API_TOKEN;
      if (isApi && token) {
              const t = url.searchParams.get('token') || req.headers.get('x-api-token') || '';
              if (t === token) return NextResponse.next();
      }
      const pass = process.env.CRM_PASSWORD;
      if (!pass) return NextResponse.next();
      const expected = 'Basic ' + btoa((process.env.CRM_USER || 'austral') + ':' + pass);
      const got = req.headers.get('authorization') || '';
      if (got === expected) return NextResponse.next();
      return new NextResponse('Authentication required.', { status: 401, headers: { 'WWW-Authenticate': 'Basic realm=Austral-CRM' } });
}
