"use client";

import { useMemo } from "react";
import { SlidersHorizontal, X, ChevronRight, Tag, Layers, Check, DollarSign, ArrowLeft, Truck } from "lucide-react";
import { useSearch } from "@/components/providers/SearchContext";

export default function SearchFiltersWidget({ config = {} }) {
  const { filters, setFilter, clearFilters, schema, facets, loading, category: contextCategory } = useSearch();

  // Use facets if available, otherwise fallback to schema
  const categories = facets?.categories || schema?.categories || [];
  const parentCategory = facets?.parent_category;
  const attributes = facets?.attributes || schema?.attributes || [];
  const activeTags = facets?.tags || [];

  const showTitle = config.showTitle !== false && config.showHeader !== false;

  return (
    <section className={config.container === false ? "w-full" : "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-10"}>
      <div className={config.container === false ? "" : "bg-white border border-gray-200 rounded-3xl shadow-sm p-6"}>

        {/* Header */}
        {(showTitle || (config.container !== false)) && (
          <div className="flex items-center justify-between gap-4 mb-8">
            {showTitle && (
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-50 rounded-xl">
                  <SlidersHorizontal className="w-5 h-5 text-indigo-600" />
                </div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-gray-900 leading-none">Filters</h3>
                  <span className="px-1.5 py-0.5 bg-indigo-100 text-indigo-700 text-[8px] font-extrabold uppercase rounded tracking-wider">Smart</span>
                </div>
              </div>
            )}
            <button
              type="button"
              onClick={clearFilters}
              className="inline-flex items-center gap-1.5 text-xs text-gray-400 hover:text-indigo-600 font-bold transition-colors uppercase tracking-wider"
            >
              Clear All
            </button>
          </div>
        )}

        <div className="flex flex-col gap-8">

          {/* 1. Context-Aware Categories (Pills with Sideways/Back support) */}
          {config.showCategoryFilter !== false && (categories.length > 0 || parentCategory) && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm font-bold text-gray-900">
                  <Layers className="w-4 h-4 text-indigo-500" />
                  <span>{filters.category_id ? "Category Selected" : "Categories"}</span>
                </div>
                {parentCategory && (
                  <button
                    onClick={() => setFilter("category_id", parentCategory.id)}
                    className="inline-flex items-center gap-1 text-[10px] font-black text-indigo-500 uppercase tracking-tighter hover:underline"
                  >
                    <ArrowLeft className="w-2.5 h-2.5" />
                    All {parentCategory.name}
                  </button>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {categories.map((c) => {
                  const isActive = filters.category_id === c.id;
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setFilter("category_id", isActive ? (parentCategory?.id || "") : c.id)}
                      className={`group flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 border ${isActive
                        ? "bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-100 ring-2 ring-indigo-600 ring-offset-2"
                        : "bg-gray-50 border-gray-100 text-gray-600 hover:border-indigo-200 hover:bg-white hover:shadow-md"
                        }`}
                    >
                      {c.name}
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-lg transition-colors ${isActive ? "bg-indigo-500 text-white" : "bg-gray-200 text-gray-500 group-hover:bg-indigo-100 group-hover:text-indigo-600"
                        }`}>
                        {c.count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* 2. Price Range */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 text-sm font-bold text-gray-900">
              <DollarSign className="w-4 h-4 text-emerald-500" />
              <span>Price Range</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="relative group">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs font-bold leading-none">$</span>
                <input
                  type="number"
                  value={filters.price_min ?? ""}
                  onChange={(e) => setFilter("price_min", e.target.value)}
                  className="w-full pl-7 pr-3 py-2.5 bg-gray-50 border-transparent rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500 transition-all outline-none"
                  placeholder="Min"
                />
              </div>
              <div className="relative group">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs font-bold leading-none">$</span>
                <input
                  type="number"
                  value={filters.price_max ?? ""}
                  onChange={(e) => setFilter("price_max", e.target.value)}
                  className="w-full pl-7 pr-3 py-2.5 bg-gray-50 border-transparent rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500 transition-all outline-none"
                  placeholder="Max"
                />
              </div>
            </div>
          </div>

          {/* 3. Attribute-Aware Filters */}
          {attributes.map((attr) => {
            const key = `attribute.${attr.code}`;
            const opts = attr.options || [];
            const clauses = attr.clauses || [];

            return (
              <div key={attr.code} className="space-y-4 pt-4 border-t border-gray-100">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-bold text-gray-900">{attr.label || attr.code}</label>
                  {filters[key] && (
                    <button
                      onClick={() => setFilter(key, "")}
                      className="text-[10px] text-indigo-500 font-bold hover:underline"
                    >
                      Reset
                    </button>
                  )}
                </div>

                {clauses.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {clauses.map((clause) => {
                      const clauseKey = `attribute.${attr.code}:${clause.name}`;
                      const isActive = filters[clauseKey] !== undefined;

                      return (
                        <button
                          key={clause.name}
                          type="button"
                          onClick={() => setFilter(clauseKey, isActive ? undefined : (clause.value || 1))}
                          className={`group relative flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${isActive
                            ? "bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-100"
                            : "bg-white border-gray-200 text-gray-600 hover:border-indigo-400 hover:text-indigo-600"
                            }`}
                        >
                          {clause.label}
                          {clause.count !== undefined && (
                            <span className={`text-[9px] px-1 rounded-md ${isActive ? "bg-indigo-500 text-white" : "bg-gray-100 text-gray-400 group-hover:bg-indigo-50 group-hover:text-indigo-600"}`}>
                              {clause.count}
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}

                {opts.length > 0 && (
                  <div className="relative">
                    <select
                      value={filters[key] || ""}
                      onChange={(e) => setFilter(key, e.target.value)}
                      className="w-full appearance-none bg-gray-50 border-none rounded-xl px-4 py-2.5 text-xs font-medium text-gray-700 outline-none focus:ring-2 focus:ring-indigo-500 transition-all cursor-pointer"
                    >
                      <option value="">Any {attr.label}</option>
                      {opts.map((o) => (
                        <option key={o.value} value={o.value}>
                          {o.label || o.value} ({o.count})
                        </option>
                      ))}
                    </select>
                    <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400 rotate-90 pointer-events-none" />
                  </div>
                )}
              </div>
            );
          })}

          {/* 4. Tags */}
          {activeTags.length > 0 && (
            <div className="space-y-4 pt-4 border-t border-gray-100">
              <div className="flex items-center gap-2 text-sm font-bold text-gray-900">
                <Tag className="w-4 h-4 text-orange-400" />
                <span>Tags</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {activeTags.map(({ name, count }) => {
                  const isActive = filters.tag === name;
                  return (
                    <button
                      key={name}
                      type="button"
                      onClick={() => setFilter("tag", isActive ? "" : name)}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-bold tracking-tight uppercase transition-all border ${isActive
                        ? "bg-gray-900 border-gray-900 text-white shadow-lg"
                        : "bg-white border-gray-200 text-gray-500 hover:border-gray-400"
                        }`}
                    >
                      {name}
                      <span className={`px-1.5 py-0.5 rounded-md ${isActive ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 text-gray-400'}`}>
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* 5. Delivery Class */}
          <div className="space-y-4 pt-4 border-t border-gray-100">
            <div className="flex items-center gap-2 text-sm font-bold text-gray-900">
              <Truck className="w-4 h-4 text-blue-500" />
              <span>Delivery Class</span>
            </div>
            <div className="flex flex-col gap-2">
              {[
                { value: 'normal', label: 'Standard Delivery' },
                { value: 'express', label: 'Express Delivery (⚡)' },
                { value: 'shipped_from_abroad', label: 'Shipped from Abroad (✈️)' }
              ].map(opt => {
                const isActive = filters.delivery_type === opt.value;
                return (
                  <label key={opt.value} className="flex items-center gap-3 cursor-pointer group">
                    <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${isActive ? 'bg-indigo-600 border-indigo-600' : 'bg-white border-gray-300 group-hover:border-indigo-400'}`}>
                      {isActive && <Check className="w-3 h-3 text-white" />}
                    </div>
                    <input
                      type="checkbox"
                      className="hidden"
                      checked={isActive}
                      onChange={() => setFilter("delivery_type", isActive ? "" : opt.value)}
                    />
                    <span className="text-xs font-medium text-gray-700 group-hover:text-indigo-600 transition-colors">{opt.label}</span>
                  </label>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
