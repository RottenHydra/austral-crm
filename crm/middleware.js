import { NextResponse } from 'next/server';

export const config = { matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'] };

export function middleware(req) {
    const pass = process.env.CRM_PASSWORD;
    if (!pass) return NextResponse.next();
    const user = process.env.CRM_USER || 'austral';
    const expected = 'Basic ' + btoa(user + ':' + pass);
    const got = req.headers.get('authorization') || '';
    if (got === expected) return NextResponse.next();
    return new NextResponse('Authentication required.', { status: 401, headers: { 'WWW-Authenticate': 'Basic realm=Austral-CRM' } });
}
