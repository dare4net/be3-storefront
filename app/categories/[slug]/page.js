"use client";

import { useEffect, useState, use, useMemo } from "react";
import Link from 'next/link';
import { ChevronRight, Filter, SlidersHorizontal, Package } from 'lucide-react';
import { useTenant } from "@/components/providers/TenantContext";
import { SearchProvider, useSearch } from "@/components/providers/SearchContext";
import SearchPageLayout from "@/components/widgets/SearchPageLayout";
import DynamicMetaTags from "@/components/DynamicMetaTags";
import SuggestionsCarousel from "@/components/products/SuggestionsCarousel";
import EntityAnalytics from "@/components/analytics/EntityAnalytics";
import api from "@/lib/axios";
import { LegacyPageProvider } from "@/components/providers/LegacyPageContext";
import WidgetRenderer from "@/components/widgets/WidgetRenderer";

// Client-side Category Page
export default function CategoryPage({ params }) {
    const resolvedParams = use(params);
    const { slug } = resolvedParams;
    const tenant = useTenant();

    const [category, setCategory] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [widgets, setWidgets] = useState([]);
    const [widgetsLoading, setWidgetsLoading] = useState(true);

    const initialFilters = useMemo(() => {
        if (!category?.id) return {};
        return { category_id: category.id };
    }, [category?.id]);

    useEffect(() => {
        if (!tenant?.id) return;

        const fetchCategory = async () => {
            try {
                const res = await api.get(`/products/storefront/categories/${slug}`, {
                    headers: { 'x-tenant-id': tenant.id }
                });
                if (res.data?.success) {
                    setCategory(res.data.category);
                } else {
                    setError("Category not found");
                }
            } catch (e) {
                console.error("Failed to fetch category", e);
                setError("Failed to load category");
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
                    const templateRes = await api.get(`/page-builder/widgets?page=category_detail`, {
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

        fetchCategory();
        fetchWidgets();
    }, [slug, tenant?.id]);

    if (loading || widgetsLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                    <p className="text-gray-500 font-medium">Loading category...</p>
                </div>
            </div>
        );
    }

    if (error || !category) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4 text-center">
                <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mb-6">
                    <Package className="w-10 h-10 text-red-400" />
                </div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">{error || "Category Not Found"}</h1>
                <p className="text-gray-600 mb-8 max-w-md">We couldn't find the category you're looking for. It might have been moved or deleted.</p>
                <Link href="/products" className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition-all shadow-lg">
                    Browse All Products
                </Link>
            </div>
        );
    }


    return (
        <SearchProvider initialFilters={initialFilters}>
            <LegacyPageProvider data={category} type="category">
                <div className="min-h-screen bg-white">
                    <DynamicMetaTags meta={{ ...category.seo, title: category.name }} tenant={tenant} />
                    <EntityAnalytics type="category" entity={category} />

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
