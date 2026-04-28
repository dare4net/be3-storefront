import { getTenantAndTheme } from "@/lib/context";
import { mapToNextMetadata } from "@/lib/seoMapper";

export async function generateMetadata({ params }) {
    const { slug } = await params;
    const { tenant } = await getTenantAndTheme();
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
            if (collection && collection.seo) {
                return mapToNextMetadata(collection.seo, tenant);
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
