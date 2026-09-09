import { NextResponse } from 'next/server';

export function middleware(request) {
    const host = request.headers.get('host') || '';
    const hostname = host.split(':')[0].toLowerCase();
    const parts = hostname.split('.');

    const requestHeaders = new Headers(request.headers);

    // If it's a subdomain on main domain (e.g. tenant.domain.com)
    if (parts.length >= 3 && !['www', 'api', 'localhost'].includes(parts[0])) {
        requestHeaders.set('x-subdomain', parts[0]);
    } else if (parts.length === 2 && !['localhost', '127.0.0.1'].includes(hostname) && hostname !== 'be3.shop') {
        // Custom domain (e.g. mybrand.com)
        requestHeaders.set('x-domain', hostname);
    }

    return NextResponse.next({
        request: {
            headers: requestHeaders,
        },
    });
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - api (API routes)
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         */
        '/((?!api|_next/static|_next/image|favicon.ico).*)',
    ],
};
