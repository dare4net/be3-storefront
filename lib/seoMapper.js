export function mapToNextMetadata(seo, tenant, theme = null) {
    if (!seo) return {};

    const title = seo.title;
    const fallbackLogo = theme?.variables?.logo || tenant?.settings?.logo_url || null;
    const ogImage = seo.og_image || seo.image_url || fallbackLogo;
    const twitterImage = seo.twitter_image || ogImage;
    const storeName = tenant?.name || "Store";

    return {
        title: title,
        description: seo.meta_description,
        alternates: {
            canonical: seo.canonical_url,
        },
        openGraph: {
            title: seo.og_title || seo.title,
            description: seo.og_description || seo.meta_description,
            siteName: storeName,
            type: ['website', 'article', 'book', 'profile'].includes(seo.og_type) ? seo.og_type : 'website',
            images: ogImage ? [{ url: ogImage, width: 1200, height: 630, alt: seo.og_title || seo.title }] : [],
        },
        twitter: {
            card: seo.twitter_card || 'summary_large_image',
            title: seo.twitter_title || seo.og_title || seo.title,
            description: seo.twitter_description || seo.og_description || seo.meta_description,
            images: twitterImage ? [twitterImage] : [],
        },
        robots: seo.robots || 'index,follow',
    };
}

