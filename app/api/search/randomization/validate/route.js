
import { NextResponse } from 'next/server';
import axios from 'axios';

export const dynamic = 'force-dynamic';

export async function POST(request) {
    try {
        const body = await request.json();
        const { cacheId, pageHandle = 'home' } = body;

        if (!cacheId) {
            return NextResponse.json({ success: false, error: 'cacheId is required' }, { status: 400 });
        }

        const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
        const targetUrl = `${backendUrl}/search/randomization/validate`;

        const tenantId = request.headers.get('x-tenant-id') || request.headers.get('X-Tenant-ID') || 'default';

        console.log(`[API Proxy] Validating Cache: ${cacheId} (Tenant: ${tenantId})`);

        const backendResponse = await axios.post(targetUrl, { cacheId, pageHandle }, {
            headers: {
                'Content-Type': 'application/json',
                'X-Tenant-ID': tenantId
            },
            timeout: 5000
        });

        return NextResponse.json(backendResponse.data);

    } catch (error) {
        console.error('[API Proxy] Error validating cache:', error.message);
        return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
    }
}
