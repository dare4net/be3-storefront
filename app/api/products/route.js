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

        // Use /search if it's a collection request, otherwise use standard /products/storefront
        const isCollection = searchParams.has('collection_id') || searchParams.has('collection_slug');
        const endpoint = isCollection ? '/search' : '/products/storefront';

        const backendUrl = `${process.env.NEXT_PUBLIC_API_URL}${endpoint}${queryString ? `?${queryString}` : ''}`;

        console.log('[API Route] Fetching Backend:', backendUrl);

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

        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
            const text = await response.text();
            console.error('[API Route] Backend returned non-JSON:', text.substring(0, 500));
            return NextResponse.json(
                { error: 'Backend returned invalid format', details: text.substring(0, 200) },
                { status: 502 }
            );
        }

        const data = await response.json();

        // Normalize search results if they came from /search
        if (isCollection && data.results && !data.data) {
            return NextResponse.json({
                ...data,
                data: data.results,
                success: true,
                // Explicitly preserve metadata fields for dynamic titles and "See All" links
                category: data.category || null,
                collection: data.collection || null,
                attribute: data.attribute || null,
                clause: data.clause || null
            });
        }

        return NextResponse.json(data);
    } catch (error) {
        console.error('Products API error:', error);
        return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
    }
}
