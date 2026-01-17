"use client";

import { useEffect, useState } from "react";
import { useTenant } from "@/components/providers/TenantContext";
import api from "@/lib/axios";
import WidgetRenderer from "@/components/widgets/WidgetRenderer";

import { DEFAULT_WIDGETS } from "@/lib/default-content";

export default function Home() {
    const tenant = useTenant();
    const [widgets, setWidgets] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (tenant) {
            // BACKEND GUARD RAIL:
            // If setup_status is 'NEW' (or missing for safety), we load the Default Protocol.
            // We treat 'null' as NEW to be safe for legacy/transition.
            if (tenant.setup_status === 'NEW' || !tenant.setup_status) {
                console.log("🆕 Tenant is New! Loading Default Store Protocol.");
                setWidgets(DEFAULT_WIDGETS);
                setLoading(false);
            } else {
                fetchWidgets();
            }
        }
    }, [tenant]);

    const fetchWidgets = async () => {
        try {
            const res = await api.get("/page-builder/widgets?page=home", {
                headers: {
                    "X-Tenant-ID": tenant.id
                }
            });

            if (res.data.success) {
                // If explicit 'COMPLETED' status but empty widgets, we show empty state (User deleted them)
                setWidgets(res.data.widgets);
            }
        } catch (err) {
            console.error("Failed to fetch widgets", err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-gray-600">Loading...</div>
            </div>
        );
    }

    // fallback for truly empty COMPLETED stores
    if (widgets.length === 0) {
        return (
            <div className="min-h-screen bg-gray-50">
                <div className="bg-white border-b">
                    <div className="max-w-7xl mx-auto px-4 py-16 sm:px-6 lg:px-8 text-center">
                        <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
                            Welcome to {tenant.name}
                        </h2>
                        <p className="mt-4 text-xl text-gray-500">
                            Browse our collection of premium products.
                        </p>
                    </div>
                </div>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                    <div className="text-center py-20 bg-white rounded-lg border border-dashed">
                        <p className="text-gray-500 mb-4">
                            No widgets configured for this page.
                        </p>
                        <p className="text-sm text-gray-400">
                            Admins can add widgets from the Page Builder.
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen">
            {widgets.filter(w => !w.parent_id).map((widget) => (
                <WidgetRenderer key={widget.id} widget={widget} widgets={widgets} />
            ))}
        </div>
    );
}
