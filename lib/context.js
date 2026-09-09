import { headers } from "next/headers";

export async function getTenantAndTheme() {
    const headersList = await headers();
    const xSubdomain = headersList.get("x-subdomain");
    const xDomain = headersList.get("x-domain");
    const host = headersList.get("host") || "";
    const hostname = host.split(":")[0].toLowerCase();
    const parts = hostname.split(".");

    let subdomain = xSubdomain;
    let domain = xDomain;

    if (!subdomain && !domain) {
        if (parts.length >= 3 && !['www', 'api', 'localhost'].includes(parts[0])) {
            subdomain = parts[0];
        } else if (parts.length === 2 && !['localhost', '127.0.0.1'].includes(hostname) && hostname !== 'be3.shop') {
            domain = hostname;
        } else {
            subdomain = process.env.NEXT_PUBLIC_SUBDOMAIN || 'demo';
        }
    }

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:3000';

    // RENDER COLD-START FIX: Increase timeout to 60s
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000);

    let lookupUrl = `${apiUrl}/tenants/lookup?`;
    if (domain) {
        lookupUrl += `domain=${encodeURIComponent(domain)}`;
    } else {
        lookupUrl += `subdomain=${encodeURIComponent(subdomain || 'demo')}`;
    }
    console.log(`[Context] Resolving tenant from host ${host}: ${lookupUrl}`);

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
