import { NextResponse } from 'next/server';

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);

        const tenantId = request.cookies.get('tenant_id')?.value ||
            request.headers.get('x-tenant-id') ||
            process.env.NEXT_PUBLIC_TENANT_ID;

        if (!tenantId) {
            return NextResponse.json({ error: 'Tenant not configured' }, { status: 400 });
        }

        const queryString = searchParams.toString();
        const backendUrl = `${process.env.NEXT_PUBLIC_API_URL}/products/storefront/vendor-categories${queryString ? `?${queryString}` : ''}`;

        console.log('[API Route] Vendor categories:', backendUrl);

        const response = await fetch(backendUrl, {
            headers: {
                'X-Tenant-ID': tenantId,
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            const text = await response.text();
            console.error(`[API Route] Backend Error (${response.status}):`, text.substring(0, 500));
            return NextResponse.json(
                { error: `Backend error: ${response.status}`, details: text.substring(0, 200) },
                { status: response.status }
            );
        }

        const data = await response.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error('[API Route] Vendor categories error:', error);
        return NextResponse.json({ error: 'Failed to fetch vendor categories' }, { status: 500 });
    }
}
