"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { ChevronLeft, ChevronRight, Search, TrendingUp, Sparkles, Tag, Calendar, Package } from "lucide-react";
import { useSearch } from "@/components/providers/SearchContext";
import api from "@/lib/axios";
import { useTenant } from "@/components/providers/TenantContext";
import { useAnalytics } from "@/lib/hooks/useAnalytics";

function formatPrice(value) {
  const num = typeof value === "string" ? parseFloat(value) : value;
  if (Number.isNaN(num) || num === null || num === undefined) return null;
  return new Intl.NumberFormat(undefined, { style: "currency", currency: "USD" }).format(num);
}

function getResultHref(item) {
  const meta = item.metadata || {};
  if (item.content_type === "product") return `/products/${meta.handle || item.content_id}`;
  if (item.content_type === "category") return `/categories/${meta.slug || item.content_id}`;
  if (item.content_type === "page") return `/${meta.slug || item.content_id}`;
  return `/${item.content_type}/${item.content_id}`;
}

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

function LoadingSkeleton({ columns }) {
  return (
    <div className={`grid gap-6 ${colsClass(columns.mobile || 1)} md:${colsClass(columns.tablet || 2)} lg:${colsClass(columns.desktop || 4)}`}>
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
    <div className="py-20 px-4 text-center">
      <div className="max-w-2xl mx-auto">
        {/* Icon */}
        <div className="mb-6 flex justify-center">
          <div className="w-20 h-20 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-full flex items-center justify-center">
            <Search className="w-10 h-10 text-indigo-400" />
          </div>
        </div>

        {/* Title and Description */}
        <h3 className="text-2xl font-bold text-gray-900 mb-2">
          No results found {query ? `for "${query}"` : ""}
        </h3>
        <p className="text-gray-600 mb-8">
          We couldn't find any products matching your search. Try different keywords or browse our popular searches below.
        </p>

        {/* Suggestions */}
        <div className="bg-gradient-to-br from-gray-50 to-white border border-gray-200 rounded-2xl p-6 mb-6">
          <div className="flex items-center gap-2 mb-4 justify-center">
            <Sparkles className="w-5 h-5 text-indigo-500" />
            <h4 className="font-semibold text-gray-900">Search Tips</h4>
          </div>
          <ul className="text-sm text-gray-600 space-y-2 text-left max-w-md mx-auto">
            <li className="flex items-start gap-2">
              <span className="text-indigo-500 mt-0.5">•</span>
              <span>Check your spelling and try again</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-indigo-500 mt-0.5">•</span>
              <span>Try more general keywords or fewer filters</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-indigo-500 mt-0.5">•</span>
              <span>Browse categories or use the suggestions below</span>
            </li>
          </ul>
        </div>

        {/* Popular Searches */}
        {popularSearches.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-4 justify-center">
              <TrendingUp className="w-5 h-5 text-pink-500" />
              <h4 className="font-semibold text-gray-900">Popular Searches</h4>
            </div>
            <div className="flex flex-wrap gap-2 justify-center">
              {popularSearches.map((search, idx) => (
                <Link
                  key={idx}
                  href={`/search?q=${encodeURIComponent(search.query)}`}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-full text-sm font-medium text-gray-700 hover:border-indigo-300 hover:bg-indigo-50 hover:text-indigo-700 transition-all"
                >
                  <Search className="w-3.5 h-3.5" />
                  {search.query}
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ProductCard({ item, trackClick }) {
  const meta = item.metadata || {};
  const price = meta.price != null ? formatPrice(meta.price) : null;
  const comparePrice = meta.compare_at_price != null ? formatPrice(meta.compare_at_price) : null;
  const hasDiscount = comparePrice && meta.compare_at_price > meta.price;
  const imageUrl = meta.image_url;
  const categoryNames = meta.category_names || [];
  const isFeatured = meta.is_featured;
  const [imageError, setImageError] = useState(false);

  // Truncate description
  const description = item.content || "";
  const truncatedDesc = description.length > 120 ? description.substring(0, 120) + "..." : description;

  return (
    <Link
      href={getResultHref(item)}
      onClick={() => trackClick && trackClick(item)}
      className="group bg-white border border-gray-200 rounded-2xl overflow-hidden hover:shadow-xl hover:border-indigo-200 transition-all duration-300"
    >
      {/* Image or Placeholder */}
      <div className="relative aspect-square bg-gradient-to-br from-gray-100 to-gray-200 overflow-hidden">
        {imageUrl && !imageError ? (
          <Image
            src={imageUrl}
            alt={item.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 25vw"
            onError={() => setImageError(true)}
            unoptimized
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Package className="w-20 h-20 text-gray-400" strokeWidth={1.5} />
          </div>
        )}

        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-2">
          {isFeatured && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-semibold rounded-full shadow-lg">
              <Sparkles className="w-3 h-3" />
              Featured
            </span>
          )}
          {hasDiscount && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs font-semibold rounded-full shadow-lg">
              <Tag className="w-3 h-3" />
              Sale
            </span>
          )}
        </div>

        {/* Content Type Badge */}
        <div className="absolute top-3 right-3">
          <span className="px-2.5 py-1 bg-white/90 backdrop-blur-sm text-gray-700 text-xs font-medium rounded-full border border-gray-200">
            {item.content_type}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Categories */}
        {categoryNames.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-2">
            {categoryNames.slice(0, 2).map((cat, idx) => (
              <span key={idx} className="text-xs text-indigo-600 font-medium">
                {cat}{idx < categoryNames.slice(0, 2).length - 1 ? " •" : ""}
              </span>
            ))}
          </div>
        )}

        {/* Title */}
        <h3 className="font-semibold text-gray-900 group-hover:text-indigo-600 line-clamp-2 mb-2 transition-colors">
          {item.title}
        </h3>

        {/* Description */}
        {truncatedDesc && (
          <p className="text-sm text-gray-600 line-clamp-2 mb-3">
            {truncatedDesc}
          </p>
        )}

        {/* Price */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {hasDiscount && (
              <span className="text-sm text-gray-400 line-through">
                {comparePrice}
              </span>
            )}
            {price && (
              <span className={`font-bold ${hasDiscount ? "text-red-600 text-lg" : "text-gray-900"}`}>
                {price}
              </span>
            )}
          </div>

          {/* Rank indicator (if available) */}
          {item.rank && (
            <div className="text-xs text-gray-400">
              Match: {Math.round(item.rank * 100)}%
            </div>
          )}
        </div>

        {/* Keywords/Tags */}
        {item.keywords && item.keywords.length > 0 && (
          <div className="mt-3 pt-3 border-t border-gray-100">
            <div className="flex flex-wrap gap-1">
              {item.keywords.slice(0, 3).map((keyword, idx) => (
                <span key={idx} className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full">
                  {keyword}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </Link>
  );
}

export default function SearchResultsWidget({ config = {} }) {
  const { results, pagination, loading, error, sort, setSort, setPage, schema, q } = useSearch();
  const { trackImpression, trackClick } = useAnalytics();
  const impressionTrackedRef = useRef(new Set());

  const supportedSorts = schema?.supportedSorts || ["relevance", "price_asc", "price_desc", "date_desc", "date_asc"];
  const showHeader = config.showHeader !== false;
  const gridCols = config.columns || { desktop: 5, tablet: 3, mobile: 2 };

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
            metadata: {
              search_query: q,
              rank: item.rank
            }
          });
          impressionTrackedRef.current.add(item.id || item.content_id);
        }
      });
    }
  }, [results, loading, trackImpression, q]);

  // Reset impression cache when query changes or page changes
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
      metadata: {
        search_query: q,
        rank: item.rank
      }
    });
  };

  return (
    <section className={config.container === false ? "" : "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12"}>
      {showHeader && (
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-1">
              {q ? `Search Results` : "Browse Products"}
            </h2>
            <p className="text-sm text-gray-600 flex items-center gap-2">
              <span className="font-semibold text-indigo-600">{pagination?.total ?? 0}</span>
              {pagination?.total === 1 ? "item found" : "items found"}
              {q && (
                <>
                  <span className="text-gray-400">•</span>
                  <span>for <span className="font-medium text-gray-900">"{q}"</span></span>
                </>
              )}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <label htmlFor="sort-select" className="text-sm font-medium text-gray-700">
              Sort by:
            </label>
            <select
              id="sort-select"
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="border border-gray-300 rounded-lg px-4 py-2.5 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
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
          </div>
        </div>
      )}

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
          <p className="text-sm text-red-700 font-medium">{error}</p>
        </div>
      )}

      {loading ? (
        <LoadingSkeleton columns={gridCols} />
      ) : results.length === 0 ? (
        <NoResultsState query={q} />
      ) : (
        <>
          {/* Results Grid */}
          <div className={`grid gap-6 ${colsClass(gridCols.mobile || 1)} md:${colsClass(gridCols.tablet || 2)} lg:${colsClass(gridCols.desktop || 4)}`}>
            {results.map((item) => (
              <ProductCard key={item.id} item={item} trackClick={handleResultClick} />
            ))}
          </div>

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="flex items-center justify-between mt-10 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={() => setPage(Math.max(1, pagination.page - 1))}
                disabled={pagination.page <= 1}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg border-2 border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-400 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                <ChevronLeft className="w-4 h-4" />
                Previous
              </button>

              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-600">
                  Page <span className="font-semibold text-gray-900">{pagination.page}</span> of{" "}
                  <span className="font-semibold text-gray-900">{pagination.totalPages}</span>
                </span>
              </div>

              <button
                type="button"
                onClick={() => setPage(Math.min(pagination.totalPages, pagination.page + 1))}
                disabled={pagination.page >= pagination.totalPages}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg border-2 border-gray-300 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-400 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
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
