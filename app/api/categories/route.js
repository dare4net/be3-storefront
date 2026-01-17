import { NextResponse } from 'next/server';

export async function GET(request) {
    try {
        // Get tenant from cookie or header
        const tenantId = request.cookies.get('tenant_id')?.value ||
            request.headers.get('x-tenant-id') ||
            process.env.NEXT_PUBLIC_TENANT_ID;

        if (!tenantId) {
            return NextResponse.json({ error: 'Tenant not configured' }, { status: 400 });
        }

        const backendUrl = `${process.env.NEXT_PUBLIC_API_URL}/products/categories`;

        console.log('[API Route] Fetching Backend:', backendUrl);

        const response = await fetch(backendUrl, {
            headers: {
                'X-Tenant-ID': tenantId,
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            const text = await response.text();
            console.error(`[API Route] Backend Categories Error (${response.status}):`, text.substring(0, 500));
            return NextResponse.json(
                { error: `Backend error: ${response.status}`, details: text.substring(0, 200) },
                { status: response.status }
            );
        }

        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
            const text = await response.text();
            console.error('[API Route] Backend Categories returned non-JSON:', text.substring(0, 500));
            return NextResponse.json(
                { error: 'Backend returned invalid format', details: text.substring(0, 200) },
                { status: 502 }
            );
        }

        const data = await response.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error('Categories API error:', error);
        return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 });
    }
}
