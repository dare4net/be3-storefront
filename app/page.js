// Server Component — pre-fetches widgets so Googlebot/crawlers get full HTML
import { getTenantAndTheme } from "@/lib/context";
import HomeClient from "@/components/HomeClient";
import { DEFAULT_WIDGETS } from "@/lib/default-content";

async function prefetchWidgets(tenant) {
    if (!tenant) return [];
    if (tenant.setup_status === "NEW" || !tenant.setup_status) return DEFAULT_WIDGETS;

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:3000";
    try {
        const res = await fetch(`${apiUrl}/page-builder/widgets?page=home`, {
            headers: { "X-Tenant-ID": tenant.id },
            cache: "no-store",
        });
        if (!res.ok) return [];
        const data = await res.json();
        return data.widgets || [];
    } catch (e) {
        console.error("[Home SSR] Failed to prefetch widgets:", e);
        return [];
    }
}

async function fetchFeaturedProducts(tenant) {
    if (!tenant?.id) return [];
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:3000";
    try {
        const res = await fetch(`${apiUrl}/products/storefront/featured?limit=8`, {
            headers: { "x-tenant-id": tenant.id },
            cache: "no-store",
        });
        if (!res.ok) return [];
        const data = await res.json();
        return data.products || [];
    } catch (_) {
        return [];
    }
}

export default async function Home() {
    const { tenant } = await getTenantAndTheme();
    const [initialWidgets, featuredProducts] = await Promise.all([
        prefetchWidgets(tenant),
        fetchFeaturedProducts(tenant)
    ]);

    const platformDomain = process.env.NEXT_PUBLIC_PLATFORM_DOMAIN || 'be3.shop';
    const baseUrl = tenant?.custom_domain
        ? `https://${tenant.custom_domain}`
        : tenant?.subdomain
            ? `https://${tenant.subdomain}.${platformDomain}`
            : process.env.NEXT_PUBLIC_APP_URL || `https://${platformDomain}`;

    const storeName = tenant?.name || "Store";
    const storeDescription = tenant?.description || `Discover quality products at ${storeName}.`;

    // ItemList schema for Google Rich Results Test (Carousel / ItemList)
    const homeJsonLd = [
        {
            "@context": "https://schema.org",
            "@type": "OnlineStore",
            "name": storeName,
            "url": baseUrl,
            "description": storeDescription,
            ...(tenant?.settings?.logo_url && {
                "image": tenant.settings.logo_url
            }),
            "currenciesAccepted": tenant?.currency || tenant?.settings?.currency || "USD",
            "paymentAccepted": "Credit Card, Debit Card, Online Payment",
        },
        ...(featuredProducts.length > 0 ? [{
            "@context": "https://schema.org",
            "@type": "ItemList",
            "name": `Featured Products - ${storeName}`,
            "itemListElement": featuredProducts.map((p, idx) => ({
                "@type": "ListItem",
                "position": idx + 1,
                "item": {
                    "@type": "Product",
                    "name": p.name,
                    "url": `${baseUrl}/products/${p.handle || p.slug || p.id}`,
                    ...(p.image_url && { "image": p.image_url }),
                    "offers": {
                        "@type": "Offer",
                        "price": parseFloat(p.price || 0).toFixed(2),
                        "priceCurrency": tenant?.currency || tenant?.settings?.currency || "USD",
                        "availability": "https://schema.org/InStock"
                    }
                }
            }))
        }] : [])
    ];

    // Pass pre-fetched widgets to client — client hydrates immediately with real data
    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(homeJsonLd) }}
            />
            <HomeClient initialWidgets={initialWidgets} />
        </>
    );
}

