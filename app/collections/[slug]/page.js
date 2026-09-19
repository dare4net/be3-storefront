// Server Component — exports generateMetadata + injects JSON-LD for Google
import { getTenantAndTheme } from "@/lib/context";
import CollectionPageClient from "@/components/CollectionPageClient";

async function fetchCollectionMeta(slug, tenantId) {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:3000";
    try {
        const res = await fetch(`${apiUrl}/products/storefront/collections/${slug}`, {
            headers: { "x-tenant-id": tenantId },
            cache: "no-store",
        });
        if (!res.ok) return null;
        const data = await res.json();
        return data.success ? data.collection : null;
    } catch (_) {
        return null;
    }
}

export async function generateMetadata({ params }) {
    const { slug } = await params;
    const { tenant } = await getTenantAndTheme();
    if (!tenant) return {};

    const collection = await fetchCollectionMeta(slug, tenant.id);
    if (!collection) return {};

    const title = collection.seo_title || collection.name;
    const description = collection.seo_description || collection.description || `Browse the ${collection.name} collection.`;

    return {
        title,
        description,
        openGraph: { title, description, type: "website" },
        alternates: { canonical: `/collections/${slug}` },
    };
}

export default async function CollectionPage({ params }) {
    const { slug } = await params;
    const { tenant } = await getTenantAndTheme();

    const collection = tenant ? await fetchCollectionMeta(slug, tenant.id) : null;

    const collectionJsonLd = collection ? [
        {
            "@context": "https://schema.org",
            "@type": "CollectionPage",
            "name": collection.name,
            "description": collection.description || `Browse the ${collection.name} collection`,
            "url": `/collections/${collection.slug}`,
        },
        {
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            "itemListElement": [
                { "@type": "ListItem", "position": 1, "name": "Home", "item": "/" },
                { "@type": "ListItem", "position": 2, "name": "Collections", "item": "/collections" },
                { "@type": "ListItem", "position": 3, "name": collection.name, "item": `/collections/${collection.slug}` },
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
            <CollectionPageClient slug={slug} />
        </>
    );
}