export function mapToNextMetadata(seo, tenant) {
    if (!seo) return {};

    const title = `${seo.title}${tenant ? ` | ${tenant.name}` : ''}`;

    return {
        title: title,
        description: seo.meta_description,
        alternates: {
            canonical: seo.canonical_url,
        },
        openGraph: {
            title: seo.og_title || seo.title,
            description: seo.og_description || seo.meta_description,
            type: ['website', 'article', 'book', 'profile'].includes(seo.og_type) ? seo.og_type : 'website',
            images: seo.og_image ? [{ url: seo.og_image, width: 1200, height: 630 }] : [],
        },
        twitter: {
            card: seo.twitter_card || 'summary_large_image',
            title: seo.twitter_title || seo.og_title || seo.title,
            description: seo.twitter_description || seo.og_description || seo.meta_description,
            images: seo.twitter_image || seo.og_image ? [seo.twitter_image || seo.og_image] : [],
        },
        robots: seo.robots || 'index,follow',
    };
}
