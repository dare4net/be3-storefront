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

export default function CollectionPage({ params }) {
    const resolvedParams = use(params);
    const { slug } = resolvedParams;
    const tenant = useTenant();

    const [collection, setCollection] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

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

        fetchCollection();
    }, [slug, tenant?.id]);

    if (loading) {
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
            <div className="min-h-screen bg-white">
                <DynamicMetaTags
                    meta={{
                        ...(collection.seo || {}),
                        title: collection.seo?.title || collection.name
                    }}
                    tenant={tenant}
                />
                <EntityAnalytics type="collection" entity={collection} />

                {/* Hero Section */}
                <div className="relative bg-gradient-to-br from-indigo-900 via-purple-900 to-black text-white overflow-hidden py-16 lg:py-24">
                    {collection.image_url && (
                        <div className="absolute inset-0">
                            <img
                                src={collection.image_url}
                                alt={collection.name}
                                className="w-full h-full object-cover opacity-30"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-transparent to-transparent" />
                        </div>
                    )}
                    <div className="relative container mx-auto px-4 max-w-7xl">
                        <nav className="flex items-center text-sm text-gray-300 mb-8">
                            <Link href="/" className="hover:text-white transition-colors">Home</Link>
                            <ChevronRight className="w-4 h-4 mx-2 text-gray-500" />
                            <Link href="/products" className="hover:text-white transition-colors">Products</Link>
                            <ChevronRight className="w-4 h-4 mx-2 text-gray-500" />
                            <span className="text-white font-medium">{collection.name}</span>
                        </nav>
                        <div className="max-w-3xl">
                            <span className="inline-block px-3 py-1 bg-indigo-500/20 border border-indigo-400/30 rounded-full text-xs font-bold uppercase tracking-widest text-indigo-300 mb-4">
                                Exclusive Collection
                            </span>
                            <div className="flex flex-col md:flex-row md:items-center gap-6 mb-6">
                                {collection.thumbnail_url && (
                                    <div className="w-20 h-20 lg:w-28 lg:h-28 rounded-2xl overflow-hidden border-2 border-white/20 shadow-2xl shrink-0 bg-white/10 backdrop-blur-sm">
                                        <img src={collection.thumbnail_url} alt="" className="w-full h-full object-cover" />
                                    </div>
                                )}
                                <h1 className="text-4xl lg:text-7xl font-extrabold tracking-tight">
                                    {collection.name}
                                </h1>
                            </div>
                            {collection.description && (
                                <p className="text-xl text-gray-300 leading-relaxed font-light">
                                    {collection.description}
                                </p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Product Grid Area */}
                <div className="container mx-auto px-4 py-8 max-w-7xl">
                    <SearchPageLayout />
                </div>
            </div>
        </SearchProvider>
    );
}
