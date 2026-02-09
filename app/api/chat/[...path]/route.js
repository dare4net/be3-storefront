import { NextResponse } from 'next/server';

export async function POST(request, { params }) {
    return handleRequest(request, params);
}

export async function GET(request, { params }) {
    return handleRequest(request, params);
}

async function handleRequest(request, params) {
    try {
        const { path: pathArray } = await params;
        const path = pathArray.join('/');
        const { searchParams } = new URL(request.url);
        const queryString = searchParams.toString();

        // Get tenant from header
        const tenantId = request.headers.get('x-tenant-id') || process.env.NEXT_PUBLIC_TENANT_ID;

        if (!tenantId) {
            return NextResponse.json({ error: 'Tenant context missing' }, { status: 400 });
        }

        // Construct Backend URL
        // Frontend: /api/chat/initialize -> Backend: /chat/initialize
        const backendUrl = `${process.env.NEXT_PUBLIC_API_URL}/chat/${path}${queryString ? `?${queryString}` : ''}`;

        console.log(`[Chat Proxy] Forwarding ${request.method} /api/chat/${path} -> ${backendUrl}`);

        const headers = {
            'Content-Type': 'application/json',
            'X-Tenant-ID': tenantId
        };

        // Forward Auth Token if present
        const authHeader = request.headers.get('authorization');
        if (authHeader) {
            headers['Authorization'] = authHeader;
        }

        const body = request.method !== 'GET' ? await request.text() : undefined;

        const response = await fetch(backendUrl, {
            method: request.method,
            headers,
            body
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`[Chat Proxy] Backend Error (${response.status}):`, errorText.substring(0, 200));
            return NextResponse.json(
                { error: `Chat Service Error: ${response.status}`, details: errorText },
                { status: response.status }
            );
        }

        const data = await response.json();
        return NextResponse.json(data);

    } catch (error) {
        console.error('[Chat Proxy] Internal Error:', error);
        return NextResponse.json({ error: 'Failed to connect to chat service' }, { status: 500 });
    }
}
