"use client";

import { useEffect, useState, useRef, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ChevronLeft, ChevronRight, Search, TrendingUp, Sparkles, Tag, Calendar, Package, Filter, X, Eye
} from "lucide-react";
import { useSearch } from "@/components/providers/SearchContext";
import api from "@/lib/axios";
import { useTenant } from "@/components/providers/TenantContext";
import { useAnalytics } from "@/lib/hooks/useAnalytics";
import { cn } from "@/lib/utils";
import ProductCardPremium from "@/components/products/ProductCardPremium";

function colsClass(n) {
  const v = Number(n);
  switch (v) {
    case 1: return "grid-cols-1";
    case 2: return "grid-cols-2";
    case 3: return "grid-cols-3";
    case 4: return "grid-cols-4";
    case 5: return "grid-cols-5";
    case 6: return "grid-cols-6";
    default: return "grid-cols-1";
  }
}

function LoadingSkeleton({ columns = {} }) {
  return (
    <div className={`grid gap-6 ${colsClass(columns.mobile || 2)} md:${colsClass(columns.tablet || 3)} lg:${colsClass(columns.desktop || 5)}`}>
      {[...Array(8)].map((_, i) => (
        <div key={i} className="bg-white border border-gray-200 rounded-2xl overflow-hidden animate-pulse">
          <div className="aspect-square bg-gray-200" />
          <div className="p-4 space-y-3">
            <div className="h-4 bg-gray-200 rounded w-3/4" />
            <div className="h-3 bg-gray-200 rounded w-1/2" />
            <div className="flex items-center justify-between">
              <div className="h-5 bg-gray-200 rounded w-20" />
              <div className="h-6 bg-gray-200 rounded w-16" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function NoResultsState({ query }) {
  const tenant = useTenant();
  const { setQ } = useSearch();
  const [popularSearches, setPopularSearches] = useState([]);

  useEffect(() => {
    if (!tenant?.id) return;
    const fetchPopular = async () => {
      try {
        const res = await api.get("/search/suggestions?type=popular&limit=6", {
          headers: { "X-Tenant-ID": tenant.id },
        });
        if (res.data?.success) {
          setPopularSearches(res.data.suggestions || []);
        }
      } catch (e) {
        console.error("Failed to fetch popular searches", e);
      }
    };
    fetchPopular();
  }, [tenant?.id]);

  return (
    <div className="py-20 px-4 text-center bg-gray-50/50 rounded-[32px] border border-dashed border-gray-200">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6 flex justify-center">
          <div className="w-20 h-20 bg-white shadow-xl rounded-full flex items-center justify-center">
            <Search className="w-10 h-10 text-gray-300" />
          </div>
        </div>
        <h3 className="text-2xl font-bold text-gray-900 mb-2">No results found {query ? `for "${query}"` : ""}</h3>
        <p className="text-gray-600 mb-8">We couldn't find any products matching your search. Try different keywords or browse our popular searches below.</p>

        {popularSearches.length > 0 && (
          <div className="flex flex-wrap gap-2 justify-center">
            {popularSearches.map((search, idx) => (
              <button
                key={idx}
                onClick={() => setQ(search.query)}
                className="px-4 py-2 bg-white border border-gray-200 rounded-full text-sm font-medium text-gray-700 hover:border-blue-600 hover:text-blue-600 transition-all"
              >
                {search.query}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function SearchResultsWidget({ config = {} }) {
  const {
    results, pagination, loading, error, sort, setSort, setPage, schema, q, filters, setFilter, clearFilters, setIncludeStats,
    imageMode, imageSource, runImageSearch
  } = useSearch();
  const { trackImpression, trackClick } = useAnalytics();
  const impressionTrackedRef = useRef(new Set());

  const supportedSorts = schema?.supportedSorts || ["relevance", "price_asc", "price_desc", "date_desc", "date_asc"];
  const showHeader = config.showHeader !== false;
  const rawCols = config.columns;
  const gridCols = typeof rawCols === 'number'
    ? { desktop: rawCols, tablet: Math.max(2, rawCols - 2), mobile: 2 }
    : {
      desktop: rawCols?.desktop || 5,
      tablet: rawCols?.tablet || 3,
      mobile: rawCols?.mobile || 2
    };
  // Enable stats for this widget
  useEffect(() => {
    setIncludeStats(true);
    return () => setIncludeStats(false); // Cleanup when unmounting
  }, [setIncludeStats]);

  // Calculate active filters list
  const activeFilters = useMemo(() => {
    const list = [];
    if (!filters) return list;

    if (filters.category_id && filters.category_id !== "") {
      const cat = (schema?.categories || []).find(c => String(c.id) === String(filters.category_id));
      list.push({ key: "category_id", label: "Category", value: cat?.name || filters.category_id });
    }
    if (filters.price_min) list.push({ key: "price_min", label: "Min Price", value: `$${filters.price_min}` });
    if (filters.price_max) list.push({ key: "price_max", label: "Max Price", value: `$${filters.price_max}` });

    // Attributes
    Object.keys(filters).forEach(k => {
      if (k.startsWith("attribute.")) {
        const parts = k.split(".");
        const cleanKey = parts[1].split(":")[0];
        list.push({ key: k, label: cleanKey, value: filters[k] });
      }
    });

    if (filters.tag) list.push({ key: "tag", label: "Tag", value: filters.tag });

    return list;
  }, [filters, schema?.categories]);

  // Track impressions when results load
  useEffect(() => {
    if (!loading && results.length > 0) {
      results.forEach((item, index) => {
        if (!impressionTrackedRef.current.has(item.id || item.content_id)) {
          trackImpression({
            entity_type: item.content_type,
            entity_id: item.content_id,
            placement_id: 'search_results_grid',
            placement_type: 'search_result',
            position: index + 1,
            metadata: { search_query: q, rank: item.rank }
          });
          impressionTrackedRef.current.add(item.id || item.content_id);
        }
      });
    }
  }, [results, loading, trackImpression, q]);

  useEffect(() => {
    impressionTrackedRef.current.clear();
  }, [q, pagination?.page]);

  const handleResultClick = (item) => {
    trackClick({
      entity_type: item.content_type,
      entity_id: item.content_id,
      placement_id: 'search_results_grid',
      placement_type: 'search_result',
      position: results.findIndex(i => (i.id || i.content_id) === (item.id || item.content_id)) + 1,
      metadata: { search_query: q, rank: item.rank }
    });
  };

  // Map search result to product format
  const mapItemToProduct = (item) => {
    const meta = item.metadata || {};
    return {
      id: item.content_id || item.id,
      name: item.title || item.name,
      handle: meta.handle || item.handle || item.content_id || item.id,
      image_url: meta.image_url || meta.thumbnail_url || meta.image || item.image_url,
      price: meta.price || item.price,
      compare_at_price: meta.compare_at_price || item.compare_at_price,
      description: item.description || meta.description || item.snippet,
      stats: item.stats || meta.stats || { impressions: 0, wishlist_count: 0 },
      ...meta,
      // Re-apply core fields to ensure they weren't overwritten incorrectly by ...meta
      id: item.content_id || item.id,
      name: item.title || item.name,
    };
  };

  return (
    <section className={cn("pb-20", config.container === false ? "" : "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8")}>



      {showHeader && (
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-gray-100">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-1">
                {q ? `Search Results` : "Browse Products"}
              </h2>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <span className="font-semibold text-blue-600">{pagination?.total ?? 0}</span>
                <span>{pagination?.total === 1 ? "item found" : "items found"}</span>
                {q && <span className="mx-1">• for "{q}"</span>}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <label htmlFor="sort-select" className="text-sm font-medium text-gray-700 whitespace-nowrap">
                Sort by:
              </label>
              <div className="relative">
                <select
                  id="sort-select"
                  value={sort}
                  onChange={(e) => setSort(e.target.value)}
                  className="appearance-none bg-white border border-gray-200 rounded-xl px-4 py-2.5 pr-10 text-sm font-medium focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer hover:bg-gray-50 transition-all"
                >
                  {supportedSorts.map((s) => (
                    <option key={s} value={s}>
                      {s === "relevance" ? "Most Relevant" :
                        s === "price_asc" ? "Price: Low to High" :
                          s === "price_desc" ? "Price: High to Low" :
                            s === "date_desc" ? "Newest First" :
                              s === "date_asc" ? "Oldest First" : s}
                    </option>
                  ))}
                </select>
                <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 rotate-90 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Active Filters Bar */}
          {activeFilters.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 mt-4">
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mr-2">Filters:</span>
              {activeFilters.map((f) => (
                <button
                  key={f.key}
                  onClick={() => setFilter(f.key, f.key.includes(':') ? undefined : "")}
                  className="group flex items-center gap-2 pl-3 pr-2 py-1.5 bg-blue-50 text-blue-700 border border-blue-100 rounded-full text-xs font-semibold hover:bg-red-50 hover:text-red-700 hover:border-red-100 transition-all"
                >
                  <span>{f.label}: {f.value}</span>
                  <X className="w-3.5 h-3.5" />
                </button>
              ))}
              <button
                onClick={clearFilters}
                className="text-xs font-bold text-gray-400 hover:text-red-500 transition-colors ml-2"
              >
                Clear All
              </button>
            </div>
          )}
        </div>
      )}

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl flex items-center gap-3 text-red-700 font-medium">
          <X className="w-5 h-5" />
          <p>{error}</p>
        </div>
      )}

      {loading ? (
        <LoadingSkeleton columns={gridCols} />
      ) : results.length === 0 ? (
        <NoResultsState query={q} />
      ) : (
        <>
          <div className={cn(
            "grid gap-2",
            colsClass(gridCols.mobile),
            `md:${colsClass(gridCols.tablet)}`,
            `lg:${colsClass(gridCols.desktop)}`
          )}>
            {results.map((item) => (
              <ProductCardPremium
                key={item.id || item.content_id}
                product={mapItemToProduct(item)}
                trackClick={handleResultClick}
                showDescription={true}
                showSocialProof={true}
                scale={0.9}
                cardStyle={{
                  backgroundColor: '#ffffff',
                  borderRadius: '0.5rem'
                }}
              />
            ))}
          </div>

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-between mt-10 pt-8 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setPage(Math.max(1, pagination.page - 1))}
                disabled={pagination.page <= 1}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl border border-gray-200 text-sm font-bold text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                <ChevronLeft className="w-4 h-4" />
                Previous
              </button>

              <div className="hidden md:flex items-center gap-1">
                {[...Array(pagination.totalPages)].map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setPage(i + 1)}
                    className={cn(
                      "w-10 h-10 rounded-xl text-sm font-bold transition-all",
                      pagination.page === i + 1
                        ? "bg-blue-600 text-white shadow-lg shadow-blue-200"
                        : "text-gray-500 hover:bg-gray-100"
                    )}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={() => setPage(Math.min(pagination.totalPages, pagination.page + 1))}
                disabled={pagination.page >= pagination.totalPages}
                className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-gray-900 text-sm font-bold text-white hover:bg-black disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </>
      )}
    </section>
  );
}
