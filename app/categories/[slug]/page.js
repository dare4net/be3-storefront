// Server Component — exports generateMetadata + injects JSON-LD for Google
import { getTenantAndTheme } from "@/lib/context";
import CategoryPageClient from "@/components/CategoryPageClient";

async function fetchCategoryMeta(slug, tenantId) {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:3000";
    try {
        const res = await fetch(`${apiUrl}/products/storefront/categories/${slug}`, {
            headers: { "x-tenant-id": tenantId },
            cache: "no-store",
        });
        if (!res.ok) return null;
        const data = await res.json();
        return data.success ? data.category : null;
    } catch (_) {
        return null;
    }
}

export async function generateMetadata({ params }) {
    const { slug } = await params;
    const { tenant, theme } = await getTenantAndTheme();
    if (!tenant) return {};

    const category = await fetchCategoryMeta(slug, tenant.id);
    if (!category) return {};

    const title = category.seo_title || category.name;
    const description = category.seo_description || category.description || `Browse ${category.name} products.`;
    const storeName = tenant?.name || "Store";
    const ogImage = category.image_url || theme?.variables?.logo || tenant?.settings?.logo_url;

    return {
        title,
        description,
        openGraph: {
            title,
            description,
            type: "website",
            siteName: storeName,
            ...(ogImage && { images: [{ url: ogImage, alt: title }] })
        },
        twitter: {
            card: 'summary_large_image',
            title,
            description,
            ...(ogImage && { images: [ogImage] })
        },
        alternates: { canonical: `/categories/${slug}` },
    };
}

export default async function CategoryPage({ params }) {
    const { slug } = await params;
    const { tenant } = await getTenantAndTheme();

    const category = tenant ? await fetchCategoryMeta(slug, tenant.id) : null;

    const collectionJsonLd = category ? [
        {
            "@context": "https://schema.org",
            "@type": "CollectionPage",
            "name": category.name,
            "description": category.description || `Browse ${category.name} products`,
            "url": `/categories/${category.slug}`,
        },
        {
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            "itemListElement": [
                { "@type": "ListItem", "position": 1, "name": "Home", "item": "/" },
                { "@type": "ListItem", "position": 2, "name": "Categories", "item": "/categories" },
                { "@type": "ListItem", "position": 3, "name": category.name, "item": `/categories/${category.slug}` },
            ]
        }
    ] : null;

    return (
        <>
            {collectionJsonLd && (
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionJsonLd) }}
                />
            )}
            <CategoryPageClient slug={slug} />
        </>
    );
}