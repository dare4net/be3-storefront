"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Head from "next/head";
import { useTenant } from "@/components/providers/TenantContext";
import api from "@/lib/axios";
import WidgetRenderer from "@/components/widgets/WidgetRenderer";

import { useStorefront } from "@/components/providers/StorefrontProvider";
import { DEFAULT_PAGES } from "@/lib/default-content";

export default function DynamicPage() {
    const params = useParams();
    const tenant = useTenant();
    const { setConfig } = useStorefront();
    const [page, setPage] = useState(null);
    const [widgets, setWidgets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [notFound, setNotFound] = useState(false);

    useEffect(() => {
        if (tenant && params.slug) {
            fetchPage();
        }
    }, [tenant, params.slug]);

    const fetchPage = async () => {
        // BACKEND GUARD RAIL: Default Content for Pages
        if (tenant.setup_status === 'NEW' && DEFAULT_PAGES[params.slug]) {
            const defaultPage = DEFAULT_PAGES[params.slug];
            console.log(`🆕 Loading Default Page: ${params.slug}`);

            setPage({
                title: defaultPage.title,
                meta_description: `Default ${defaultPage.title} page`,
                show_header: true,
                show_footer: true
            });

            // Create a synthetic widget to display the content
            setWidgets([{
                id: `def-${params.slug}-content`,
                widget_type: 'custom_html',
                config: {
                    html: defaultPage.content,
                    container: true
                }
            }]);

            setLoading(false);
            return;
        }

        try {
            // Fetch page metadata
            const pageRes = await api.get(`/page-builder/pages/by-slug/${params.slug}`, {
                headers: {
                    "X-Tenant-ID": tenant.id
                }
            });

            if (pageRes.data.success) {
                const fetchedPage = pageRes.data.page;
                setPage(fetchedPage);

                // Update header/footer visibility
                setConfig({
                    showHeader: fetchedPage.show_header !== false,
                    showFooter: fetchedPage.show_footer !== false
                });

                // Fetch widgets for this page
                const widgetsRes = await api.get(`/page-builder/widgets?page=${params.slug}`, {
                    headers: {
                        "X-Tenant-ID": tenant.id
                    }
                });

                if (widgetsRes.data.success) {
                    setWidgets(widgetsRes.data.widgets);
                }
            }
        } catch (error) {
            if (error.response?.status === 404) {
                setNotFound(true);
            } else {
                console.error('Failed to fetch page', error);
            }
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

    if (notFound || !page) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <h1 className="text-6xl font-bold text-gray-300 mb-4">404</h1>
                    <p className="text-xl text-gray-600 mb-8">Page not found</p>
                    <a href="/" className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                        Go Home
                    </a>
                </div>
            </div>
        );
    }

    return (
        <>
            {/* SEO Meta Tags */}
            <Head>
                <title>{page.title} | {tenant.name}</title>
                {page.meta_description && (
                    <meta name="description" content={page.meta_description} />
                )}
            </Head>

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
            </div>
        </>
    );
}
