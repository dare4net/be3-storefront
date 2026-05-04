import { NextResponse } from 'next/server';
import { getTenantAndTheme } from '@/lib/context';

export const dynamic = 'force-dynamic'; // Prevent Next.js from caching this route on disk

export async function GET(request) {
  try {
    // Determine the base URL of the storefront to pass to the backend
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || new URL(request.url).origin;

    // Fetch tenant using existing context logic
    const { tenant } = await getTenantAndTheme();
    if (!tenant) {
      return new NextResponse('Tenant not found', { status: 404 });
    }

    // Call the backend module for sitemap generation
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
    
    const response = await fetch(`${backendUrl}/seo/sitemap.xml`, {
      method: 'GET',
      headers: {
        'x-storefront-url': baseUrl,
        'x-tenant-id': tenant.id
      }
    });

    if (!response.ok) {
      throw new Error(`Backend responded with status: ${response.status}`);
    }

    const xml = await response.text();

    return new NextResponse(xml, {
      headers: {
        'Content-Type': 'application/xml',
      },
    });
  } catch (error) {
    console.error('Error fetching sitemap:', error);
    return new NextResponse('Error generating sitemap', { status: 500 });
  }
}
