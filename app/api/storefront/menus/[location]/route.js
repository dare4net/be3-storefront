import { NextResponse } from 'next/server';

export async function GET(request, { params }) {
    try {
        const { location } = await params;
        const { searchParams } = new URL(request.url);

        // Get tenant from header (injected by AxiosTenantProvider)
        const tenantId = request.headers.get('x-tenant-id') || process.env.NEXT_PUBLIC_TENANT_ID;

        if (!tenantId) {
            return NextResponse.json({ error: 'Tenant context missing' }, { status: 400 });
        }

        const queryString = searchParams.toString();
        // Forwarding to Backend API
        // NOTE: Backend path is assumed to be /api/storefront/menus/:location based on widget code
        const backendUrl = `${process.env.NEXT_PUBLIC_API_URL}/api/storefront/menus/${location}${queryString ? `?${queryString}` : ''}`;

        console.log(`[Proxy] Fetching Menu: ${backendUrl} (Tenant: ${tenantId})`);

        const response = await fetch(backendUrl, {
            headers: {
                'X-Tenant-ID': tenantId,
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            return NextResponse.json(
                { error: `Backend error: ${response.status}`, details: await response.text() },
                { status: response.status }
            );
        }

        const data = await response.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error('[Proxy] Menu Fetch Error:', error);
        return NextResponse.json({ error: 'Failed to proxy menu request' }, { status: 500 });
    }
}
