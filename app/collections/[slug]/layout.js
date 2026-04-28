import { getTenantAndTheme } from "@/lib/context";
import { mapToNextMetadata } from "@/lib/seoMapper";

export async function generateMetadata({ params }) {
    const { slug } = await params;
    const { tenant, theme } = await getTenantAndTheme();
    if (!tenant) return {};

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:3000';
    try {
        const res = await fetch(`${apiUrl}/products/storefront/collections/${slug}`, {
            headers: { 'x-tenant-id': tenant.id },
            cache: 'no-store'
        });
        if (res.ok) {
            const data = await res.json();
            const collection = data.collection;
            if (collection) {
                const seoData = {
                    ...(collection.seo || {}),
                    title: collection.seo?.title || collection.name,
                    meta_description: collection.seo?.meta_description || collection.description,
                    image_url: collection.seo?.og_image || collection.thumbnail_url || collection.image_url
                };
                return mapToNextMetadata(seoData, tenant, theme);
            }
        }
    } catch (e) {
        console.error("Failed to fetch collection for SEO", e);
    }
    return {};
}

export default async function CollectionLayout({ children, params }) {
    const { slug } = await params;
    const { tenant } = await getTenantAndTheme();
    let structuredData = null;

    if (tenant) {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:3000';
        try {
            const res = await fetch(`${apiUrl}/products/storefront/collections/${slug}`, {
                headers: { 'x-tenant-id': tenant.id },
                cache: 'no-store'
            });
            if (res.ok) {
                const data = await res.json();
                structuredData = data.collection?.seo?.structured_data;
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
