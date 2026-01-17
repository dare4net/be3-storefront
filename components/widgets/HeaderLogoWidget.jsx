"use client";

import Link from "next/link";
import { useStorefront } from "@/components/providers/StorefrontProvider";
import { useTenant } from "@/components/providers/TenantContext";

export default function HeaderLogoWidget({ config }) {
    const { theme } = useStorefront();
    const tenant = useTenant();
    const height = config.height || '32';

    return (
        <Link href="/" className="flex items-center">
            {theme?.variables?.logo ? (
                <img
                    src={theme.variables.logo}
                    alt={config.altText || tenant?.name || 'Store'}
                    style={{ height: `${height}px` }}
                    className="w-auto object-contain"
                />
            ) : (
                <span className="text-xl font-bold text-gray-900 hover:text-gray-700">
                    {tenant?.name || 'Store'}
                </span>
            )}
        </Link>
    );
}
