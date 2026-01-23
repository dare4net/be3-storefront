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

        const backendUrl = `${process.env.NEXT_PUBLIC_API_URL}/search/attribute-clause/random-category?${searchParams.toString()}`;

        const response = await fetch(backendUrl, {
            headers: {
                'X-Tenant-ID': tenantId,
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            const text = await response.text();
            return NextResponse.json(
                { error: `Backend error: ${response.status}`, details: text.substring(0, 500) },
                { status: response.status }
            );
        }

        const data = await response.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error('Attribute clause resolver API error:', error);
        return NextResponse.json({ error: 'Failed to resolve attribute clause category' }, { status: 500 });
    }
}

