import { getTenantAndTheme } from "@/lib/context";
import { mapToNextMetadata } from "@/lib/seoMapper";

export async function generateMetadata({ params }) {
    const { slug } = await params;
    const { tenant, theme } = await getTenantAndTheme();
    if (!tenant) return {};

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:3000';

    // 1. Try CMS page
    try {
        const res = await fetch(`${apiUrl}/storefront/pages/${slug}`, {
            headers: { 'x-tenant-id': tenant.id },
            cache: 'no-store'
        });
        if (res.ok) {
            const data = await res.json();
            const page = data.page;
            if (page) {
                const seoData = page.seo || {
                    title: page.title,
                    meta_description: page.meta_description,
                    og_title: page.title,
                    og_description: page.meta_description,
                    twitter_title: page.title,
                    twitter_description: page.meta_description
                };
                return mapToNextMetadata(seoData, tenant, theme);
            }
        }
    } catch (e) {
        console.error("Failed to fetch custom page for SEO", e);
    }

    // 2. Try branded slug resolution (e.g., "apple-laptops", "budget-smartphones")
    try {
        const brandedRes = await fetch(`${apiUrl}/search/resolve-slug/${slug}`, {
            headers: { 'x-tenant-id': tenant.id },
            cache: 'no-store'
        });
        if (brandedRes.ok) {
            const data = await brandedRes.json();
            if (data.success && data.seo) {
                return mapToNextMetadata(data.seo, tenant, theme);
            }
        }
    } catch (e) {
        // Not a branded slug — that's fine
    }

    return {};
}

export default async function PageLayout({ children, params }) {
    const { slug } = await params;
    const { tenant } = await getTenantAndTheme();
    let structuredData = null;

    if (tenant) {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:3000';

        // Try CMS page first
        try {
            const res = await fetch(`${apiUrl}/storefront/pages/${slug}`, {
                headers: { 'x-tenant-id': tenant.id },
                cache: 'no-store'
            });
            if (res.ok) {
                const data = await res.json();
                structuredData = data.page?.seo?.structured_data || data.page?.structured_data;
            }
        } catch (e) { }

        // Fallback: try branded slug for structured data
        if (!structuredData) {
            try {
                const brandedRes = await fetch(`${apiUrl}/search/resolve-slug/${slug}`, {
                    headers: { 'x-tenant-id': tenant.id },
                    cache: 'no-store'
                });
                if (brandedRes.ok) {
                    const data = await brandedRes.json();
                    structuredData = data.seo?.structured_data;
                }
            } catch (e) { }
        }
    }

    return (
        <>
            {structuredData && (
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
                />
            )}
            {children}
        </>
    );
}
