import { headers } from 'next/headers';

export default async function robots() {
    const headersList = await headers();
    const host = headersList.get('host');
    const protocol = headersList.get('x-forwarded-proto') || 'https';
    const baseUrl = host ? `${protocol}://${host}` : (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000');

    return {
        rules: [
            // Default: allow all crawlers
            {
                userAgent: '*',
                allow: '/',
                disallow: ['/checkout/', '/cart/', '/account/', '/api/', '/admin/'],
            },
            // OpenAI GPTBot — allow full crawl
            {
                userAgent: 'GPTBot',
                allow: '/',
                disallow: ['/checkout/', '/cart/', '/account/', '/api/'],
            },
            // Anthropic ClaudeBot — allow full crawl
            {
                userAgent: 'ClaudeBot',
                allow: '/',
                disallow: ['/checkout/', '/cart/', '/account/', '/api/'],
            },
            // Perplexity AI — allow full crawl
            {
                userAgent: 'PerplexityBot',
                allow: '/',
                disallow: ['/checkout/', '/cart/', '/account/', '/api/'],
            },
            // Apple Applebot — allow full crawl
            {
                userAgent: 'Applebot',
                allow: '/',
                disallow: ['/checkout/', '/cart/', '/account/', '/api/'],
            },
            // Google AdsBot — restrict to public pages
            {
                userAgent: 'AdsBot-Google',
                allow: '/',
                disallow: ['/checkout/', '/cart/', '/account/', '/api/'],
            },
        ],
        sitemap: `${baseUrl}/sitemap.xml`,
        // llms.txt for AI-native discovery
        host: baseUrl,
    };
}

