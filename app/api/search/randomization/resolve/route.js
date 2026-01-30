
import { NextResponse } from 'next/server';
import axios from 'axios';

// Force dynamic to prevent static optimization, which might break if we rely on runtime headers/env
export const dynamic = 'force-dynamic';

export async function POST(request) {
    try {
        const body = await request.json();

        // Log the incoming request for debugging
        console.log('[API Proxy] Resolving Master Plan. Widgets:', body.widgets?.length);

        const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
        const targetUrl = `${backendUrl}/search/randomization/resolve`;

        // Forward usage of headers (Tenant ID is crucial)
        const tenantId = request.headers.get('x-tenant-id') || request.headers.get('X-Tenant-ID') || 'default';

        console.log(`[API Proxy] Forwarding to: ${targetUrl} (Tenant: ${tenantId})`);

        // Perform the backend request
        // explicitly awaiting JSON to avoid "streaming" issues/ambiguity
        const backendResponse = await axios.post(targetUrl, body, {
            headers: {
                'Content-Type': 'application/json',
                'X-Tenant-ID': tenantId
            },
            timeout: 5000 // 5s timeout to prevent hanging
        });

        // Debug response success
        // console.log('[API Proxy] Backend response status:', backendResponse.status);

        // Return the clean JSON
        return NextResponse.json(backendResponse.data);

    } catch (error) {
        console.error('[API Proxy] Error resolving master plan:', error.message);

        if (error.response) {
            // Backend returned an error response
            console.error('[API Proxy] Backend error data:', error.response.data);
            return NextResponse.json(error.response.data, { status: error.response.status });
        } else if (error.request) {
            // No response received
            return NextResponse.json({ success: false, message: 'No response from backend service' }, { status: 502 });
        }

        return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
    }
}
