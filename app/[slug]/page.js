"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useTenant } from "@/components/providers/TenantContext";
import api from "@/lib/axios";
import WidgetRenderer from "@/components/widgets/WidgetRenderer";
import DynamicMetaTags from "@/components/DynamicMetaTags";

import { useStorefront } from "@/components/providers/StorefrontProvider";
import { useSearch } from "@/components/providers/SearchContext";
import { DEFAULT_PAGES, DEFAULT_SEARCH_WIDGETS } from "@/lib/default-content";
import SuggestionsCarousel from "@/components/products/SuggestionsCarousel";

export default function DynamicPage() {
    const params = useParams();
    const tenant = useTenant();
    const { setConfig } = useStorefront();
    const { setFilters, setQ, setSeo, setIsSearchActive } = useSearch();

    const [page, setPage] = useState(null);
    const [widgets, setWidgets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [notFound, setNotFound] = useState(false);
    const [resolution, setResolution] = useState(null);

    useEffect(() => {
        if (tenant && params.slug) {
            fetchPage();
        }
        return () => setIsSearchActive(false);
    }, [tenant, params.slug]);

    const fetchPage = async () => {
        // ... (existing default pages logic remains the same)
        if (tenant.setup_status === 'NEW' && DEFAULT_PAGES[params.slug]) {
            // ... (keep lines 30-52 as they are, but for brevity I'll wrap them in the replacement)
            const defaultPage = DEFAULT_PAGES[params.slug];
            setPage({
                title: defaultPage.title,
                meta_description: `Default ${defaultPage.title} page`,
                show_header: true,
                show_footer: true
            });
            setWidgets([{
                id: `def-${params.slug}-content`,
                widget_type: 'custom_html',
                config: { html: defaultPage.content, container: true }
            }]);
            setLoading(false);
            return;
        }

        try {
            // 1. Try to fetch standard CMS page
            const pageRes = await api.get(`/page-builder/pages/by-slug/${params.slug}`, {
                headers: { "X-Tenant-ID": tenant.id }
            });

            if (pageRes.data.success) {
                const fetchedPage = pageRes.data.page;
                setPage(fetchedPage);
                setConfig({
                    showHeader: fetchedPage.show_header !== false,
                    showFooter: fetchedPage.show_footer !== false
                });

                const widgetsRes = await api.get(`/page-builder/widgets?page=${params.slug}`, {
                    headers: { "X-Tenant-ID": tenant.id }
                });

                if (widgetsRes.data.success) {
                    setWidgets(widgetsRes.data.widgets);
                }
                setLoading(false);
                return;
            }
        } catch (error) {
            // If 404, we continue to check for branded slugs
            if (error.response?.status !== 404) {
                console.error('Failed to fetch page', error);
            }
        }

        // 2. Try to resolve as a Branded Slug (Pretty URL)
        try {
            const resolveRes = await api.get(`/search/resolve-slug/${params.slug}`, {
                headers: { "X-Tenant-ID": tenant.id }
            });

            if (resolveRes.data.success) {
                const resData = resolveRes.data;
                setResolution(resData);

                // Enable search functionality for this dynamic route
                setIsSearchActive(true);

                // Parse the filter string into individual filter parameters
                const filterParams = {};
                const filterPairs = resData.filter.split('&');
                filterPairs.forEach(pair => {
                    const [key, value] = pair.split('=');
                    if (key && value) {
                        filterParams[key] = decodeURIComponent(value);
                    }
                });

                setFilters(filterParams);
                setQ(""); // We don't want a residual query string usually

                // Fetch search widgets to render the results
                const widgetsRes = await api.get(`/page-builder/widgets?page=search`, {
                    headers: { "X-Tenant-ID": tenant.id }
                });

                if (widgetsRes.data?.success && widgetsRes.data.widgets.length > 0) {
                    setWidgets(widgetsRes.data.widgets);
                } else {
                    setWidgets(DEFAULT_SEARCH_WIDGETS);
                }

                // Use Backend-generated SEO metadata
                const seoData = {
                    ...resData.seo,
                    is_branded: true, // Prevent SearchContext from overriding this
                    show_header: true,
                    show_footer: true
                };
                setPage(seoData);
                setSeo({ ...resData.seo, is_branded: true });

                setConfig({ showHeader: true, showFooter: true });
                setLoading(false);
                return;
            }
        } catch (error) {
            if (error.response?.status === 404) {
                setNotFound(true);
            } else {
                console.error('Failed to resolve branded slug', error);
            }
        }

        setLoading(false);
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-gray-600 font-medium">Loading destination...</div>
            </div>
        );
    }

    if (notFound || !page) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <h1 className="text-6xl font-bold text-gray-300 mb-4">404</h1>
                    <p className="text-xl text-gray-600 mb-8">Page not found</p>
                    <a href="/" className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-bold transition-all shadow-lg active:scale-95">
                        Go Home
                    </a>
                </div>
            </div>
        );
    }

    return (
        <>
            <DynamicMetaTags meta={page} tenant={tenant} />

            <div className="min-h-screen">
                {widgets.length > 0 ? (
                    widgets.filter(w => !w.parent_id).map((widget) => (
                        <WidgetRenderer key={widget.id} widget={widget} widgets={widgets} />
                    ))
                ) : (
                    <div className="container mx-auto px-4 py-16">
                        <h1 className="text-4xl font-bold mb-4">{page.title}</h1>
                        <p className="text-gray-600">This page doesn't have any content yet.</p>
                    </div>
                )}

                {resolution && (
                    <div className="bg-gray-50/50 py-16">
                        <div className="max-w-7xl mx-auto space-y-16">
                            <SuggestionsCarousel
                                title={`Premium ${resolution.category.name} for You`}
                                subtitle={`Handpicked ${resolution.clause.label} options matching your style`}
                                categoryId={resolution.category.id}
                                limit={8}
                            />

                            <SuggestionsCarousel
                                title="Trending Selections"
                                subtitle="What other shoppers are loving right now"
                                isFeatured={true}
                                sort="random"
                                limit={8}
                            />
                        </div>
                    </div>
                )}
            </div>
        </>
    );
}
