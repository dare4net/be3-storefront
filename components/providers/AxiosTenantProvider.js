"use client";

import { useEffect } from "react";
import api, { proxyApi } from "@/lib/axios";
import { useTenant } from "./TenantContext";

export function AxiosTenantProvider({ children }) {
    const tenant = useTenant();

    // Synchronously set the header during render if tenant is available
    if (tenant && tenant.id) {
        api.defaults.headers.common['X-Tenant-ID'] = tenant.id;
        proxyApi.defaults.headers.common['X-Tenant-ID'] = tenant.id;
    }

    // Keep useEffect for updates or side-effect consistency if needed, 
    // but the render-phase set ensures it's there before children mount.
    useEffect(() => {
        if (tenant && tenant.id) {
            console.log(`[AxiosTenantProvider] Confirmed global header X-Tenant-ID: ${tenant.id}`);
        }
    }, [tenant]);

    return children;
}
