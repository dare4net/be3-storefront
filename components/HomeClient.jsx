"use client";

import { useEffect, useState } from "react";
import { useTenant } from "@/components/providers/TenantContext";
import api from "@/lib/axios";
import WidgetRenderer from "@/components/widgets/WidgetRenderer";
import { DEFAULT_WIDGETS } from "@/lib/default-content";
import { useRandomizationContext } from "@/lib/contexts/RandomizationContext";

export default function HomeClient({ initialWidgets }) {
    const tenant = useTenant();
    const { seedPlan } = useRandomizationContext();
    const [widgets, setWidgets] = useState(initialWidgets || []);
    const [loading, setLoading] = useState(!initialWidgets || initialWidgets.length === 0);

    useEffect(() => {
        // If we got server-prefetched widgets, no need to fetch again
        if (initialWidgets && initialWidgets.length > 0) return;

        if (tenant) {
            if (tenant.setup_status === "NEW" || !tenant.setup_status) {
                console.log("?? Tenant is New! Loading Default Store Protocol.");
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
                headers: { "X-Tenant-ID": tenant.id }
            });

            if (res.data.success) {
                if (res.data.randomizationPlan) {
                    seedPlan(res.data.randomizationPlan);
                }
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

    if (widgets.length === 0) {
        return (
            <div className="min-h-screen bg-gray-50">
                <div className="bg-white border-b">
                    <div className="max-w-7xl mx-auto px-4 py-16 sm:px-6 lg:px-8 text-center">
                        <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
                            Welcome to {tenant?.name}
                        </h2>
                        <p className="mt-4 text-xl text-gray-500">
                            Browse our collection of premium products.
                        </p>
                    </div>
                </div>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                    <div className="text-center py-20 bg-white rounded-lg border border-dashed">
                        <p className="text-gray-500 mb-4">No widgets configured for this page.</p>
                        <p className="text-sm text-gray-400">Admins can add widgets from the Page Builder.</p>
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
