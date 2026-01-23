"use client";

import { useEffect, useState, use, useMemo } from "react";
import Link from 'next/link';
import { ChevronRight, Filter, SlidersHorizontal, Package } from 'lucide-react';
import { useTenant } from "@/components/providers/TenantContext";
import { SearchProvider, useSearch } from "@/components/providers/SearchContext";
import SearchPageLayout from "@/components/widgets/SearchPageLayout";
import DynamicMetaTags from "@/components/DynamicMetaTags";
import SuggestionsCarousel from "@/components/products/SuggestionsCarousel";
import api from "@/lib/axios";

// Client-side Category Page
export default function CategoryPage({ params }) {
    const resolvedParams = use(params);
    const { slug } = resolvedParams;
    const tenant = useTenant();

    const [category, setCategory] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

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

        fetchCategory();
    }, [slug, tenant?.id]);

    if (loading) {
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
            <div className="min-h-screen bg-white">
                <DynamicMetaTags meta={{ ...category.seo, title: category.name }} tenant={tenant} />

                {/* Hero Section */}
                <div className="relative bg-gray-900 text-white overflow-hidden">
                    {category.image_url && (
                        <div className="absolute inset-0">
                            <img
                                src={category.image_url}
                                alt={category.name}
                                className="w-full h-full object-cover opacity-40"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-transparent to-transparent" />
                        </div>
                    )}
                    <div className="relative container mx-auto px-4 py-16 lg:py-24 max-w-7xl">
                        <nav className="flex items-center text-sm text-gray-300 mb-6">
                            <Link href="/" className="hover:text-white transition-colors">Home</Link>
                            <ChevronRight className="w-4 h-4 mx-2" />
                            <Link href="/products" className="hover:text-white transition-colors">Products</Link>
                            <ChevronRight className="w-4 h-4 mx-2" />
                            <span className="text-white font-medium">{category.name}</span>
                        </nav>
                        <h1 className="text-4xl lg:text-6xl font-extrabold tracking-tight mb-6">
                            {category.name}
                        </h1>
                        {category.description && (
                            <p className="text-lg text-gray-200 max-w-2xl leading-relaxed">
                                {category.description}
                            </p>
                        )}
                    </div>
                </div>

                {/* Subcategories Breadcrumbs */}
                {category.children && category.children.length > 0 && (
                    <div className="bg-gray-50 border-b border-gray-200 py-6">
                        <div className="container mx-auto px-4 max-w-7xl">
                            <div className="flex items-center gap-4 overflow-x-auto pb-2 scrollbar-hide">
                                <span className="text-xs font-bold text-gray-400 uppercase tracking-widest whitespace-nowrap">Subcategories</span>
                                {category.children.map(child => (
                                    <Link
                                        key={child.id}
                                        href={`/categories/${child.slug}`}
                                        className="flex items-center px-5 py-2 bg-white hover:bg-indigo-50 border border-gray-200 hover:border-indigo-200 rounded-full transition-all whitespace-nowrap text-sm text-gray-700 font-medium hover:text-indigo-700 shadow-sm"
                                    >
                                        {child.name}
                                    </Link>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {/* Advanced Search Layout */}
                <SearchPageLayout config={{
                    columns: { desktop: 4, tablet: 2, mobile: 1 },
                    showFilters: true,
                    sidebarEnabled: true,
                    showCategoryFilter: false // Don't show category filter on a category page
                }} />

                {/* Suggestions Section */}
                <SuggestionsCarousel
                    title={`More from ${category.name}`}
                    subtitle="Discover more great products you might love"
                    categoryId={category.id}
                    sort="random"
                />
            </div>
        </SearchProvider>
    );
}
