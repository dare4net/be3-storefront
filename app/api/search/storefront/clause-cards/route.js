import { NextResponse } from 'next/server';
import { getTenantAndTheme } from '@/lib/context';

export async function GET(request) {
    try {
        const { searchParams } = new URL(request.url);
        const { tenant } = await getTenantAndTheme();
        if (!tenant) return NextResponse.json({ error: 'No tenant' }, { status: 401 });

        const backendUrl = `${process.env.NEXT_PUBLIC_API_URL}/search/storefront/clause-cards?${searchParams.toString()}`;

        const response = await fetch(backendUrl, {
            headers: {
                'x-tenant-id': tenant.id,
                'Content-Type': 'application/json'
            },
            cache: 'no-store'
        });

        if (!response.ok) {
            const text = await response.text();
            console.error(`[API Route /search/storefront/clause-cards] Backend Error (${response.status}):`, text.substring(0, 500));
            return NextResponse.json({ error: 'Backend error' }, { status: response.status });
        }

        const data = await response.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error('[API Route /search/storefront/clause-cards] Error:', error);
        return NextResponse.json({ error: 'Failed to fetch clause cards' }, { status: 500 });
    }
}
