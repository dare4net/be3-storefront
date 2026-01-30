import { NextResponse } from 'next/server';

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);

        // Get tenant from cookie or header
        const tenantId = request.cookies.get('tenant_id')?.value ||
            request.headers.get('x-tenant-id') ||
            process.env.NEXT_PUBLIC_TENANT_ID;

        if (!tenantId) {
            return NextResponse.json({ error: 'Tenant not configured' }, { status: 400 });
        }

        // Build query string
        const queryString = searchParams.toString();

        const backendUrl = `${process.env.NEXT_PUBLIC_API_URL}/search${queryString ? `?${queryString}` : ''}`;

        console.log('[API Route /search] Fetching Backend:', backendUrl);

        const response = await fetch(backendUrl, {
            headers: {
                'X-Tenant-ID': tenantId,
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            const text = await response.text();
            console.error(`[API Route /search] Backend Error (${response.status}):`, text.substring(0, 500));
            return NextResponse.json(
                { error: `Backend error: ${response.status}`, details: text.substring(0, 200) },
                { status: response.status }
            );
        }

        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
            const text = await response.text();
            console.error('[API Route /search] Backend returned non-JSON:', text.substring(0, 500));
            return NextResponse.json(
                { error: 'Backend returned invalid format', details: text.substring(0, 200) },
                { status: 502 }
            );
        }

        const data = await response.json();

        // Normalize response format
        return NextResponse.json({
            ...data,
            data: data.results || data.data || [],
            success: true
        });
    } catch (error) {
        console.error('Search API error:', error);
        return NextResponse.json({ error: 'Failed to fetch search results' }, { status: 500 });
    }
}
