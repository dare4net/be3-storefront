// Server Component — exports generateMetadata for CMS pages and branded slug pages
import { getTenantAndTheme } from "@/lib/context";
import DynamicPageClient from "@/components/DynamicPageClient";

export async function generateMetadata({ params }) {
    const { slug } = await params;
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:3000";
    const { tenant } = await getTenantAndTheme();
    if (!tenant) return {};

    try {
        // 1. Try CMS page
        const pageRes = await fetch(`${apiUrl}/page-builder/pages/by-slug/${slug}`, {
            headers: { "X-Tenant-ID": tenant.id },
            cache: "no-store",
        });
        if (pageRes.ok) {
            const data = await pageRes.json();
            if (data.success && data.page) {
                const page = data.page;
                const title = page.seo_title || page.title;
                const description = page.meta_description || page.seo_description || "";
                return {
                    title,
                    description,
                    openGraph: { title, description, type: "website" },
                };
            }
        }
    } catch (_) {}

    try {
        // 2. Try branded slug (pretty URL / clause page)
        const resolveRes = await fetch(`${apiUrl}/search/resolve-slug/${slug}`, {
            headers: { "X-Tenant-ID": tenant.id },
            cache: "no-store",
        });
        if (resolveRes.ok) {
            const data = await resolveRes.json();
            if (data.success && data.seo) {
                const title = data.seo.title;
                const description = data.seo.description || "";
                return {
                    title,
                    description,
                    openGraph: {
                        title,
                        description,
                        images: data.seo.image ? [data.seo.image] : [],
                        type: "website",
                    },
                };
            }
        }
    } catch (_) {}

    return {};
}

export default async function DynamicPage({ params }) {
    const { slug } = await params;
    return <DynamicPageClient slug={slug} />;
}