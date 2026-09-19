"use client";

import { useEffect, useState } from "react";
import { useTenant } from "@/components/providers/TenantContext";
import api from "@/lib/axios";
import WidgetRenderer from "@/components/widgets/WidgetRenderer";
import { useStorefront } from "@/components/providers/StorefrontProvider";
import { useSearch } from "@/components/providers/SearchContext";
import { DEFAULT_PAGES, DEFAULT_SEARCH_WIDGETS } from "@/lib/default-content";
import SuggestionsCarousel from "@/components/products/SuggestionsCarousel";
import EntityAnalytics from "@/components/analytics/EntityAnalytics";
import { LegacyPageProvider } from "@/components/providers/LegacyPageContext";

export default function DynamicPageClient({ slug }) {
    const tenant = useTenant();
    const { setConfig } = useStorefront();
    const { setFilters, setQ, setSeo, setIsSearchActive } = useSearch();

    const [page, setPage] = useState(null);
    const [widgets, setWidgets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [notFound, setNotFound] = useState(false);
    const [resolution, setResolution] = useState(null);

    useEffect(() => {
        if (tenant && slug) {
            fetchPage();
        }
        return () => setIsSearchActive(false);
    }, [tenant, slug]);

    const analyticsEntity = resolution
        ? { ...resolution, id: `${resolution.attribute.id}:${resolution.clause.name}:${resolution.category.id}`, name: page?.title || resolution.seo?.title }
        : page;

    const analyticsType = resolution ? "branded_page" : "page";

    const fetchPage = async () => {
        if (tenant.setup_status === "NEW" && DEFAULT_PAGES[slug]) {
            const defaultPage = DEFAULT_PAGES[slug];
            setPage({
                title: defaultPage.title,
                meta_description: `Default ${defaultPage.title} page`,
                show_header: true,
                show_footer: true
            });
            setWidgets([{
                id: `def-${slug}-content`,
                widget_type: "custom_html",
                config: { html: defaultPage.content, container: true }
            }]);
            setLoading(false);
            return;
        }

        try {
            const pageRes = await api.get(`/page-builder/pages/by-slug/${slug}`, {
                headers: { "X-Tenant-ID": tenant.id }
            });

            if (pageRes.data.success) {
                const fetchedPage = pageRes.data.page;
                setPage(fetchedPage);
                setConfig({
                    showHeader: fetchedPage.show_header !== false,
                    showFooter: fetchedPage.show_footer !== false
                });

                const widgetsRes = await api.get(`/page-builder/widgets?page=${slug}`, {
                    headers: { "X-Tenant-ID": tenant.id }
                });

                if (widgetsRes.data.success) {
                    setWidgets(widgetsRes.data.widgets);
                }
                setLoading(false);
                return;
            }
        } catch (error) {
            if (error.response?.status !== 404) {
                console.error("Failed to fetch page", error);
            }
        }

        try {
            const resolveRes = await api.get(`/search/resolve-slug/${slug}`, {
                headers: { "X-Tenant-ID": tenant.id }
            });

            if (resolveRes.data.success) {
                const resData = resolveRes.data;
                setResolution(resData);
                setIsSearchActive(true);

                const filterParams = {};
                const filterPairs = resData.filter.split("&");
                filterPairs.forEach(pair => {
                    const [key, value] = pair.split("=");
                    if (key && value) {
                        filterParams[key] = decodeURIComponent(value);
                    }
                });

                setFilters(filterParams);
                setQ("");

                const widgetsRes = await api.get(`/page-builder/widgets?page=branded_search`, {
                    headers: { "X-Tenant-ID": tenant.id }
                });

                if (widgetsRes.data?.success && widgetsRes.data.widgets.length > 0) {
                    setWidgets(widgetsRes.data.widgets);
                } else {
                    setWidgets(DEFAULT_SEARCH_WIDGETS);
                }

                const seoData = {
                    ...resData.seo,
                    is_branded: true,
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
                console.error("Failed to resolve branded slug", error);
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
            {!loading && analyticsEntity && (
                <EntityAnalytics type={analyticsType} entity={analyticsEntity} />
            )}
            <div className="min-h-screen">
                <LegacyPageProvider data={resolution || page} type={resolution ? "branded_search" : "cms_page"}>
                    {widgets.length > 0 ? (
                        widgets.filter(w => !w.parent_id).map((widget) => (
                            <WidgetRenderer key={widget.id} widget={widget} widgets={widgets} />
                        ))
                    ) : (
                        <div className="container mx-auto px-4 py-16">
                            <h1 className="text-4xl font-bold mb-4">{page.title}</h1>
                            <p className="text-gray-600">This page does not have any content yet.</p>
                        </div>
                    )}
                </LegacyPageProvider>
            </div>
        </>
    );
}
