
import { NextResponse } from 'next/server';
import axios from 'axios';

export const dynamic = 'force-dynamic';

export async function POST(request) {
    try {
        const body = await request.json();

        console.log('[API Proxy] Resolving Batch Products. Widgets:', body.widgets?.length);

        const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
        const targetUrl = `${backendUrl}/search/randomization/batch-products`;

        const tenantId = request.headers.get('x-tenant-id') || request.headers.get('X-Tenant-ID') || 'default';

        console.log(`[API Proxy] Forwarding to: ${targetUrl} (Tenant: ${tenantId})`);

        const backendResponse = await axios.post(targetUrl, body, {
            headers: {
                'Content-Type': 'application/json',
                'X-Tenant-ID': tenantId
            },
            timeout: 30000 // 30s timeout for batch requests
        });

        return NextResponse.json(backendResponse.data);

    } catch (error) {
        console.error('[API Proxy] Error resolving batch products:', error.message);

        if (error.response) {
            console.error('[API Proxy] Backend error data:', error.response.data);
            return NextResponse.json(error.response.data, { status: error.response.status });
        } else if (error.request) {
            return NextResponse.json({ success: false, message: 'No response from backend service' }, { status: 502 });
        }

        return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
    }
}
