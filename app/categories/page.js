"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronRight, LayoutGrid } from "lucide-react";
import { useTenant } from "@/components/providers/TenantContext";
import CategoryGridWidget from "@/components/widgets/CategoryGridWidget";
import DynamicMetaTags from "@/components/DynamicMetaTags";

export default function CategoriesPage() {
    const tenant = useTenant();

    const seo = {
        title: "All Categories",
        meta_description: "Browse all our product categories to find what you're looking for.",
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <DynamicMetaTags page={seo} tenant={tenant} />

            {/* Header Section */}
            <div className="bg-white border-b border-gray-200 pt-12 pb-16">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    {/* Breadcrumbs */}
                    <nav className="flex items-center text-sm text-gray-400 mb-8">
                        <Link href="/" className="hover:text-indigo-600 transition-colors">Home</Link>
                        <ChevronRight className="w-4 h-4 mx-2" />
                        <span className="text-gray-900 font-semibold">Categories</span>
                    </nav>

                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div>
                            <h1 className="text-4xl font-extrabold text-gray-900 mb-2 flex items-center gap-3">
                                <LayoutGrid className="w-10 h-10 text-indigo-600" />
                                Browse Categories
                            </h1>
                            <p className="text-xl text-gray-500 max-w-2xl">
                                Explore our wide range of collections. Find exactly what you need.
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-7xl mx-auto py-12">
                <CategoryGridWidget config={{
                    title: "Explore All Departments",
                    sourceType: 'all',
                    sortOrder: 'random',
                    maxCategories: 50,
                    columns: { desktop: 4, tablet: 3, mobile: 2 },
                    layoutMode: 'grid',
                    showTitle: false,
                    container: false,
                    enableEntryAnimation: true
                }} />
            </div>
        </div>
    );
}
