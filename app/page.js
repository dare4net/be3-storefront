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

export default async function Home() {
    const { tenant } = await getTenantAndTheme();
    const initialWidgets = await prefetchWidgets(tenant);

    // Pass pre-fetched widgets to client — client hydrates immediately with real data
    return <HomeClient initialWidgets={initialWidgets} />;
}
