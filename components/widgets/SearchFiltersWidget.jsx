"use client";

import { useMemo } from "react";
import { SlidersHorizontal, X } from "lucide-react";
import { useSearch } from "@/components/providers/SearchContext";

function coerceBoolean(v) {
  if (v === true || v === false) return v;
  if (v === "true") return true;
  if (v === "false") return false;
  return undefined;
}

export default function SearchFiltersWidget({ config = {} }) {
  const { filters, setFilter, clearFilters, schema, facets, loading } = useSearch();

  const categories = schema?.categories || [];
  const attributes = schema?.attributes || [];

  const attributeFacets = facets?.attributes || {};

  const attributeOptions = useMemo(() => {
    const map = {};
    attributes.forEach((a) => {
      const opt = a.options;
      if (Array.isArray(opt)) {
        // Supports ["S","M"] or [{label,value}]
        map[a.code] = opt.map((o) => {
          if (typeof o === "string") return { label: o, value: o };
          if (o && typeof o === "object") return { label: o.label ?? o.value ?? "", value: o.value ?? o.label ?? "" };
          return null;
        }).filter(Boolean);
      } else if (attributeFacets[a.code]) {
        map[a.code] = Object.keys(attributeFacets[a.code]).map((v) => ({ label: v, value: v }));
      } else {
        map[a.code] = [];
      }
    });
    return map;
  }, [attributes, attributeFacets]);

  const showTitle = config.showTitle !== false && config.showHeader !== false;

  return (
    <section className={config.container === false ? "" : "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-6"}>
      <div className={config.container === false ? "" : "bg-white border border-gray-200 rounded-2xl p-5"}>
        {(showTitle || (config.container !== false)) && (
          <div className="flex items-center justify-between gap-3 mb-6">
            {showTitle && (
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-5 h-5 text-gray-700" />
                <h3 className="font-semibold text-gray-900">Filters</h3>
                {loading && <span className="text-xs text-gray-500">(updating)</span>}
              </div>
            )}
            <button
              type="button"
              onClick={clearFilters}
              className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 font-medium"
            >
              <X className="w-4 h-4" />
              Clear All
            </button>
          </div>
        )}

        <div className="flex flex-col gap-6">
          {/* Category */}
          {config.showCategoryFilter !== false && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select
                value={filters.category_id || ""}
                onChange={(e) => setFilter("category_id", e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 bg-white"
              >
                <option value="">All categories</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Price min */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Min price</label>
            <input
              type="number"
              value={filters.price_min ?? ""}
              onChange={(e) => setFilter("price_min", e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2"
              placeholder="0"
              min="0"
            />
          </div>

          {/* Price max */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Max price</label>
            <input
              type="number"
              value={filters.price_max ?? ""}
              onChange={(e) => setFilter("price_max", e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2"
              placeholder="1000"
              min="0"
            />
          </div>

          {/* Featured */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Featured</label>
            <select
              value={filters.is_featured === undefined ? "" : String(coerceBoolean(filters.is_featured))}
              onChange={(e) => {
                if (!e.target.value) return setFilter("is_featured", "");
                setFilter("is_featured", e.target.value === "true");
              }}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 bg-white"
            >
              <option value="">Any</option>
              <option value="true">Featured</option>
              <option value="false">Not featured</option>
            </select>
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              value={filters.status || ""}
              onChange={(e) => setFilter("status", e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 bg-white"
            >
              <option value="">Any</option>
              <option value="active">Active</option>
              <option value="draft">Draft</option>
              <option value="archived">Archived</option>
            </select>
          </div>

          {/* Tags */}
          {facets?.tags && Object.keys(facets.tags).length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Tags</label>
              <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto pr-2 custom-scrollbar">
                {Object.entries(facets.tags).map(([tag, count]) => {
                  const isActive = filters.tag === tag || (Array.isArray(filters.tag) && filters.tag.includes(tag));
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => setFilter("tag", isActive ? undefined : tag)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border flex items-center gap-2 ${isActive
                        ? "bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-100"
                        : "bg-white border-gray-200 text-gray-600 hover:border-blue-400 hover:bg-blue-50"
                        }`}
                    >
                      {tag}
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${isActive ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-500'}`}>
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Attribute filters */}
          {attributes.map((a) => {
            const key = `attribute.${a.code}`;
            const opts = attributeOptions[a.code] || [];
            const clauses = a.clauses || [];

            // If no options AND no clauses, hide
            if (opts.length === 0 && clauses.length === 0) return null;

            return (
              <div key={a.code} className="space-y-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">{a.label || a.code}</label>

                {/* 1. Basic Options Filter */}
                {opts.length > 0 && (
                  <select
                    value={filters[key] || ""}
                    onChange={(e) => setFilter(key, e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 bg-white text-sm"
                  >
                    <option value="">Specific Value (Any)</option>
                    {opts.map((o) => (
                      <option key={`${a.code}-${o.value}`} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                )}

                {/* 2. Clauses Filter (Pills or List) */}
                {clauses.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {clauses.map((clause) => {
                      const clauseKey = `attribute.${a.code}:${clause.name}`;
                      const isActive = filters[clauseKey] !== undefined;

                      return (
                        <button
                          key={clause.name}
                          type="button"
                          onClick={() => {
                            if (isActive) {
                              // Clear the filter
                              const newFilters = { ...filters };
                              delete newFilters[clauseKey];
                              // We need a way to batch update or clear specifically
                              setFilter(clauseKey, undefined);
                            } else {
                              setFilter(clauseKey, clause.value || true);
                            }
                          }}
                          className={`px-3 py-1 rounded-full text-xs font-medium transition-all border ${isActive
                            ? "bg-blue-600 border-blue-600 text-white"
                            : "bg-gray-50 border-gray-200 text-gray-600 hover:border-blue-300"
                            }`}
                        >
                          {clause.label}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

