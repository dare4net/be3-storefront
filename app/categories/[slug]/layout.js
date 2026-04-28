import { getTenantAndTheme } from "@/lib/context";
import { mapToNextMetadata } from "@/lib/seoMapper";

export async function generateMetadata({ params }) {
    const { slug } = await params;
    const { tenant } = await getTenantAndTheme();
    if (!tenant) return {};

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:3000';
    try {
        const res = await fetch(`${apiUrl}/products/storefront/categories/${slug}`, {
            headers: { 'x-tenant-id': tenant.id },
            cache: 'no-store'
        });
        if (res.ok) {
            const data = await res.json();
            const category = data.category;
            if (category && category.seo) {
                return mapToNextMetadata({ ...category.seo, title: category.name }, tenant);
            }
        }
    } catch (e) {
        console.error("Failed to fetch category for SEO", e);
    }
    return {};
}

export default async function CategoryLayout({ children, params }) {
    const { slug } = await params;
    const { tenant } = await getTenantAndTheme();
    let structuredData = null;

    if (tenant) {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:3000';
        try {
            const res = await fetch(`${apiUrl}/products/storefront/categories/${slug}`, {
                headers: { 'x-tenant-id': tenant.id },
                cache: 'no-store'
            });
            if (res.ok) {
                const data = await res.json();
                structuredData = data.category?.seo?.structured_data;
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
