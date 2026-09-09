import { NextResponse } from 'next/server';

export function middleware(request) {
    const host = request.headers.get('host') || '';
    const hostname = host.split(':')[0].toLowerCase();
    const parts = hostname.split('.');

    const requestHeaders = new Headers(request.headers);

    const platformDomain = process.env.NEXT_PUBLIC_PLATFORM_DOMAIN || 'be3.shop';

    // If hostname ends with platform domain (e.g. tenant.be3.shop)
    if (hostname.endsWith(`.${platformDomain}`)) {
        const subdomain = hostname.replace(`.${platformDomain}`, '');
        if (subdomain && !['www', 'api', 'admin', 'superadmin'].includes(subdomain)) {
            requestHeaders.set('x-subdomain', subdomain);
        }
    } else if (!['localhost', '127.0.0.1'].includes(hostname) && hostname !== platformDomain && !hostname.endsWith('.vercel.app')) {
        // Any custom domain or custom subdomain (e.g. mybrand.com or drey.mydomain.com)
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
