"use client";

import { useEffect, useState, use, useMemo } from "react";
import Link from 'next/link';
import { ChevronRight, Package } from 'lucide-react';
import { useTenant } from "@/components/providers/TenantContext";
import { SearchProvider } from "@/components/providers/SearchContext";
import SearchPageLayout from "@/components/widgets/SearchPageLayout";
import DynamicMetaTags from "@/components/DynamicMetaTags";
import api from "@/lib/axios";
import EntityAnalytics from "@/components/analytics/EntityAnalytics";
import { LegacyPageProvider } from "@/components/providers/LegacyPageContext";
import WidgetRenderer from "@/components/widgets/WidgetRenderer";
import CollectionHeader from "@/components/collections/CollectionHeader";

export default function CollectionPage({ params }) {
    const resolvedParams = use(params);
    const { slug } = resolvedParams;
    const tenant = useTenant();

    const [collection, setCollection] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [widgets, setWidgets] = useState([]);
    const [widgetsLoading, setWidgetsLoading] = useState(true);

    const initialFilters = useMemo(() => {
        return { collection_slug: slug };
    }, [slug]);

    useEffect(() => {
        if (!tenant?.id) return;

        const fetchCollection = async () => {
            try {
                const res = await api.get(`/products/storefront/collections/${slug}`, {
                    headers: { 'x-tenant-id': tenant.id }
                });
                if (res.data?.success) {
                    setCollection(res.data.collection);
                } else {
                    setError("Collection not found");
                }
            } catch (e) {
                console.error("Failed to fetch collection", e);
                setError("Failed to load collection");
            } finally {
                setLoading(false);
            }
        };

        const fetchWidgets = async () => {
            try {
                // Try specific slug first, then fallback to template
                const res = await api.get(`/page-builder/widgets?page=${slug}`, {
                    headers: { 'x-tenant-id': tenant.id }
                });
                
                let foundWidgets = res.data?.widgets || [];
                if (foundWidgets.length === 0) {
                    const templateRes = await api.get(`/page-builder/widgets?page=collection_detail`, {
                        headers: { 'x-tenant-id': tenant.id }
                    });
                    foundWidgets = templateRes.data?.widgets || [];
                }
                
                setWidgets(foundWidgets);
            } catch (e) {
                console.error("Failed to fetch widgets", e);
            } finally {
                setWidgetsLoading(false);
            }
        };

        fetchCollection();
        fetchWidgets();
    }, [slug, tenant?.id]);

    if (loading || widgetsLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                    <p className="text-gray-500 font-medium">Loading collection...</p>
                </div>
            </div>
        );
    }

    if (error || !collection) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4 text-center">
                <div className="w-20 h-20 bg-amber-50 rounded-full flex items-center justify-center mb-6">
                    <Package className="w-10 h-10 text-amber-400" />
                </div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">{error || "Collection Not Found"}</h1>
                <p className="text-gray-600 mb-8 max-w-md">We couldn't find the collection you're looking for. It might have been moved or is currently unavailable.</p>
                <Link href="/products" className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition-all shadow-lg">
                    Browse All Products
                </Link>
            </div>
        );
    }

    return (
        <SearchProvider key={slug} initialFilters={initialFilters}>
            <LegacyPageProvider data={collection} type="collection">
                <div className="min-h-screen bg-white">
                    <DynamicMetaTags
                        meta={{
                            ...(collection.seo || {}),
                            title: collection.seo?.title || collection.name
                        }}
                        tenant={tenant}
                    />
                    <EntityAnalytics type="collection" entity={collection} />

                    {/* Show a curated collection hero header for manual (non-vendor) collections */}
                    {collection.collection_type !== 'vendor' && (
                        <CollectionHeader collection={collection} />
                    )}

                    {widgets.length > 0 ? (
                        widgets.filter(w => !w.parent_id).map(widget => (
                            <WidgetRenderer key={widget.id} widget={widget} widgets={widgets} />
                        ))
                    ) : (
                        <div className="container mx-auto px-4 py-20 text-center">
                            <p className="text-gray-500">No widgets registered for this page.</p>
                        </div>
                    )}
                </div>
            </LegacyPageProvider>
        </SearchProvider>
    );
}
