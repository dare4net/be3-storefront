"use client";

import { useState } from "react";
import { Filter, X } from "lucide-react";
import SearchBarWidget from "./SearchBarWidget";
import SearchFiltersWidget from "./SearchFiltersWidget";
import SearchResultsWidget from "./SearchResultsWidget";
import ImageSearchWidget from "./ImageSearchWidget";

export default function SearchPageLayout({ config = {} }) {
    const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

    const {
        columns = { desktop: 5, tablet: 3, mobile: 2 },
        sidebarEnabled = true,
        showFilters = true,
        // Search UI toggles
        showSearchBar = true,
        showImageSearchBar = true,
        // Results header
        showActiveFiltersBar = true,
        // Product card props — forwarded to SearchResultsWidget
        showPrice = true,
        showAddToCart = true,
        showFeaturedBadge = true,
        showViewDetails = true,
        showTags = false,
        showDescription = true,
        showAttributes = false,
        showSocialProof = true,
        showRating = false,
        cardScale = 0.9,
    } = config;

    // Card props bundle forwarded into SearchResultsWidget
    const cardConfig = {
        showPrice,
        showAddToCart,
        showFeaturedBadge,
        showViewDetails,
        showTags,
        showDescription,
        showAttributes,
        showSocialProof,
        showRating,
        cardScale,
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Search Bar */}
            {showSearchBar && (
                <div className="bg-white border-b border-gray-200">
                    <SearchBarWidget config={{}} />
                </div>
            )}

            {/* Image Search */}
            {showImageSearchBar && (
                <div className="bg-white border-b border-gray-100 shadow-sm">
                    <ImageSearchWidget config={{}} />
                </div>
            )}

            {/* Main Content */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                <div className="lg:grid lg:grid-cols-12 lg:gap-8">
                    {/* Sidebar Filters - Desktop */}
                    {showFilters && sidebarEnabled && (
                        <aside className="hidden lg:block lg:col-span-3">
                            <div className="sticky top-6">
                                <div className="bg-white rounded-2xl border border-gray-200 p-6">
                                    <h3 className="font-semibold text-gray-900 mb-4 text-lg">Filters</h3>
                                    <SearchFiltersWidget config={{ showHeader: false, container: false }} />
                                </div>
                            </div>
                        </aside>
                    )}

                    {/* Mobile Filter Button */}
                    {showFilters && (
                        <div className="lg:hidden mb-4">
                            <button
                                onClick={() => setMobileFiltersOpen(!mobileFiltersOpen)}
                                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-white border-2 border-gray-200 rounded-xl font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                            >
                                <Filter className="w-5 h-5" />
                                {mobileFiltersOpen ? "Hide Filters" : "Show Filters"}
                            </button>
                        </div>
                    )}

                    {/* Mobile Filters - Collapsible */}
                    {showFilters && mobileFiltersOpen && (
                        <div className="lg:hidden mb-6">
                            <div className="bg-white rounded-2xl border border-gray-200 p-6 relative">
                                <button
                                    onClick={() => setMobileFiltersOpen(false)}
                                    className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                                    aria-label="Close filters"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                                <h3 className="font-semibold text-gray-900 mb-4 text-lg">Filters</h3>
                                <SearchFiltersWidget config={{ showHeader: false, container: false }} />
                            </div>
                        </div>
                    )}

                    {/* Search Results */}
                    <main className={showFilters && sidebarEnabled ? "lg:col-span-9" : "lg:col-span-12"}>
                        <SearchResultsWidget config={{
                            container: false,
                            columns,
                            showActiveFiltersBar,
                            ...cardConfig
                        }} />
                    </main>
                </div>
            </div>
        </div>
    );
}
