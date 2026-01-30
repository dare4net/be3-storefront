import { headers } from "next/headers";

export async function getTenantAndTheme() {
    const headersList = await headers();
    const host = headersList.get("host") || "";
    // Default to 'demo' subdomain logic or extract from host if using real subdomains
    // For local dev, we might hardcode or parse localhost:3000
    let subdomain = process.env.NEXT_PUBLIC_SUBDOMAIN;

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:3000';

    // RENDER COLD-START FIX: Increase timeout to 60s
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000);

    const lookupUrl = `${apiUrl}/tenants/lookup?subdomain=${subdomain}`;
    console.log(`[Context] Resolving tenant: ${lookupUrl}`);

    try {
        // 1. Fetch Tenant
        const tenantRes = await fetch(lookupUrl, {
            cache: 'no-store',
            signal: controller.signal
        });
        clearTimeout(timeoutId);

        if (!tenantRes.ok) {
            const body = await tenantRes.text().catch(() => 'No body');
            console.error(`[Context] Tenant lookup failed: ${tenantRes.status} ${tenantRes.statusText}`);
            console.error(`[Context] Debug Info: subdomain=${subdomain} | Response=${body}`);
            return { tenant: null, theme: null };
        }

        const tenantData = await tenantRes.json();
        const tenant = tenantData.tenant;

        // Backend Migration Ensure:
        // If the migration just ran, old tenants might have setup_status=NULL if default didn't apply
        // But our SQL said DEFAULT 'NEW', so should be fine.
        console.log(`[Context] Found tenant: ${tenant?.id} | Status: ${tenant?.setup_status || 'Unknown'}`);

        // 2. Fetch Active Theme (Public Storefront API)
        const themeRes = await fetch(`${apiUrl}/page-builder/storefront/theme`, {
            cache: 'no-store',
            headers: {
                'x-tenant-id': tenant.id
            }
        });

        let theme = null;
        if (themeRes.ok) {
            const themeData = await themeRes.json();
            theme = themeData.theme;
            console.log(`[Context] Found theme: ${theme?.name}`);
        } else {
            console.warn(`[Context] Theme lookup failed (using default): ${themeRes.status}`);
        }

        return { tenant, theme };

    } catch (err) {
        console.error("[Context] Failed to fetch tenant/theme:", err);
        return { tenant: null, theme: null };
    }
}
