import { headers } from 'next/headers';

export default async function robots() {
  const headersList = await headers();
  const host = headersList.get('host');
  const protocol = headersList.get('x-forwarded-proto') || 'https';
  const baseUrl = host ? `${protocol}://${host}` : (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000');

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/checkout/'],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
