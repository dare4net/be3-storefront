import { getTenantAndTheme } from "@/lib/context";
import { mapToNextMetadata } from "@/lib/seoMapper";

export async function generateMetadata({ params }) {
    const { slug } = await params;
    const { tenant } = await getTenantAndTheme();
    if (!tenant) return {};

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:3000';
    try {
        const res = await fetch(`${apiUrl}/storefront/pages/${slug}`, {
            headers: { 'x-tenant-id': tenant.id },
            cache: 'no-store'
        });
        if (res.ok) {
            const data = await res.json();
            const page = data.page;
            if (page) {
                // Pages usually just use their direct properties for SEO if 'seo' object doesn't exist
                const seoData = page.seo || {
                    title: page.title,
                    meta_description: page.meta_description,
                    og_title: page.title,
                    og_description: page.meta_description,
                    twitter_title: page.title,
                    twitter_description: page.meta_description
                };
                return mapToNextMetadata(seoData, tenant);
            }
        }
    } catch (e) {
        console.error("Failed to fetch custom page for SEO", e);
    }
    return {};
}

export default async function PageLayout({ children, params }) {
    const { slug } = await params;
    const { tenant } = await getTenantAndTheme();
    let structuredData = null;

    if (tenant) {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:3000';
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
