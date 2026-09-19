"use client";

import { useEffect, useMemo, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Search, X, TrendingUp, Package, FolderOpen, FileText } from "lucide-react";
import api from "@/lib/axios";
import { useTenant } from "@/components/providers/TenantContext";
import { useAnalytics } from "@/lib/hooks/useAnalytics";

function getContentIcon(type) {
  switch (type) {
    case "product": return Package;
    case "category": return FolderOpen;
    case "page": return FileText;
    default: return Search;
  }
}

export default function SearchBarWidget({ config = {} }) {
  const tenant = useTenant();
  const router = useRouter();

  const placeholder = config.placeholder || "Search products...";
  const showAutocomplete = config.autocomplete !== false;
  const limit = config.autocomplete_limit || 8;

  const [input, setInput] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);

  const { trackImpression, trackClick } = useAnalytics();
  const sessionImpressedRef = useRef(new Set());

  // Reset impression cache when search opens or input clears
  useEffect(() => {
    if (!open || !input) {
      sessionImpressedRef.current.clear();
    }
  }, [open, input]);

  // Track impressions when suggestions update
  useEffect(() => {
    if (open && suggestions.length > 0) {
      suggestions.forEach((s, index) => {
        const entityId = s.id || s.content_id || s.slug || s.text;
        if (!sessionImpressedRef.current.has(entityId)) {
          trackImpression({
            entity_type: s.type === 'content' ? s.content_type : 'search_suggestion',
            entity_id: String(entityId),
            placement_id: 'search_autocomplete',
            placement_type: 'search',
            position: index + 1,
            metadata: {
              term: input,
              suggestion_text: s.text,
              suggestion_type: s.type
            }
          });
          sessionImpressedRef.current.add(entityId);
        }
      });
    }
  }, [suggestions, open, input, trackImpression]);

  // Ghost Suggestion Logic
  const ghostSuggestion = useMemo(() => {
    if (!input || input.length < 2 || suggestions.length === 0) return "";
    // Find the first suggestion that actually starts with the current input
    const match = suggestions.find(s => s.text.toLowerCase().startsWith(input.toLowerCase()));
    if (match) {
      return input + match.text.slice(input.length);
    }
    return "";
  }, [input, suggestions]);

  const shouldFetch = useMemo(() => showAutocomplete && tenant?.id && input.trim().length >= 2, [showAutocomplete, tenant?.id, input]);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      if (!shouldFetch) {
        setSuggestions([]);
        return;
      }
      setLoading(true);
      try {
        const res = await api.get(`/search/autocomplete?q=${encodeURIComponent(input.trim())}&limit=${limit}`, {
          headers: { "X-Tenant-ID": tenant.id },
        });
        if (cancelled) return;
        setSuggestions(res.data?.suggestions || []);
        setOpen(true);
        setSelectedIndex(-1);
      } catch {
        if (cancelled) return;
        setSuggestions([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    const t = setTimeout(run, 200);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [shouldFetch, input, tenant?.id, limit]);

  const navigateToSearch = (searchTerm, filter) => {
    const term = (searchTerm ?? input).trim();
    if (!term && !filter) return;

    setOpen(false);
    setSuggestions([]);
    setInput("");

    let url = `/search?`;
    if (term) url += `q=${encodeURIComponent(term)}`;
    if (filter) url += `${term ? '&' : ''}${filter}`;

    router.push(url);
  };

  const handleSuggestionClick = (s, index) => {
    // 1. Track Click
    trackClick({
      entity_type: s.type === 'content' ? s.content_type : 'search_suggestion',
      entity_id: String(s.id || s.content_id || s.slug || s.text),
      placement_id: 'search_autocomplete',
      placement_type: 'search',
      position: index + 1,
      metadata: {
        term: input,
        suggestion_text: s.text,
        suggestion_type: s.type
      }
    });

    const refParams = '?ref_type=search_autocomplete&ref_id=search_bar';
    const isContent = s.type === "content";
    const type = isContent ? s.content_type : s.type;

    // 2. Determine Navigation Path
    if (type === 'product' && (s.handle || s.slug)) {
      router.push(`/products/${s.handle || s.slug}${refParams}`);
    } else if (type === 'category' && (s.slug || s.category_slug)) {
      router.push(`/categories/${s.slug || s.category_slug}${refParams}`);
    } else if (type === 'collection' && s.slug) {
      router.push(`/collections/${s.slug}${refParams}`);
    } else if (type === 'clause' && s.slug) {
      router.push(`/${s.slug}${refParams}`);
    } else {
      // Fallback to search query
      navigateToSearch(s.text, s.filter);
      return;
    }

    // 3. Close and Cleanup
    setOpen(false);
    setInput("");
  };

  const handleKeyDown = (e) => {
    // Ghost completion on ArrowRight or Space (if cursor at end)
    if ((e.key === "ArrowRight" || e.key === " ") && ghostSuggestion && input.length < ghostSuggestion.length) {
      // Only complete Space if it's the very next character and input isn't just whitespace
      if (e.key === " " && ghostSuggestion[input.length] !== " ") return;

      e.preventDefault();
      setInput(ghostSuggestion);
      return;
    }

    if (!open || suggestions.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : prev));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
    } else if (e.key === "Enter" && selectedIndex >= 0) {
      e.preventDefault();
      handleSuggestionClick(suggestions[selectedIndex], selectedIndex);
    }
  };

  return (
    <section className={config.container === false ? "" : "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6"}>
      <div className="relative">
        <div className="flex items-center gap-3 bg-white border-2 border-gray-200 rounded-2xl px-5 py-4 shadow-sm hover:border-indigo-300 focus-within:border-indigo-500 focus-within:ring-4 focus-within:ring-indigo-50 transition-all">
          <Search className="w-5 h-5 text-gray-400 flex-shrink-0" />
          <form
            className="flex-1 relative"
            onSubmit={(e) => {
              e.preventDefault();
              navigateToSearch();
            }}
          >
            {/* Ghost Text Overlay */}
            {ghostSuggestion && (
              <div className="absolute inset-0 pointer-events-none text-base select-none whitespace-pre">
                <span className="text-transparent">{input}</span>
                <span className="text-gray-300">{ghostSuggestion.slice(input.length)}</span>
              </div>
            )}
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onFocus={() => {
                if (suggestions.length > 0) setOpen(true);
              }}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              className="w-full outline-none text-gray-900 placeholder:text-gray-400 text-base bg-transparent relative z-10"
              aria-label="Search"
              autoComplete="off"
            />
          </form>
          {input && (
            <button
              type="button"
              onClick={() => {
                setInput("");
                setOpen(false);
                setSuggestions([]);
                setSelectedIndex(-1);
              }}
              className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
              aria-label="Clear search"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {open && (loading || suggestions.length > 0) && (
          <div className="absolute z-50 mt-2 w-full bg-white border border-gray-200 rounded-2xl shadow-2xl overflow-hidden">
            {loading && (
              <div className="px-5 py-4 flex items-center gap-3 text-sm text-gray-500">
                <div className="w-4 h-4 border-2 border-gray-300 border-t-indigo-500 rounded-full animate-spin" />
                Searching...
              </div>
            )}
            {!loading && suggestions.length > 0 && (
              <div className="max-h-96 overflow-y-auto">
                {suggestions.map((s, idx) => {
                  const isSelected = idx === selectedIndex;
                  const isContent = s.type === "content";
                  const isProduct = isContent && s.content_type === 'product';
                  const Icon = isContent ? getContentIcon(s.content_type) : TrendingUp;

                  return (
                    <button
                      key={`${s.text}-${idx}`}
                      type="button"
                      onMouseDown={(e) => {
                        e.preventDefault(); // Prevent input from blurring
                        handleSuggestionClick(s, idx);
                      }}
                      className={`w-full text-left px-5 py-3 transition-colors flex items-center gap-4 ${isSelected
                        ? "bg-indigo-50"
                        : "hover:bg-gray-50"
                        }`}
                      onMouseEnter={() => setSelectedIndex(idx)}
                    >
                      <div className="w-12 h-12 flex-shrink-0 bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center border border-gray-100">
                        {s.image_url ? (
                          <img src={s.image_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <Icon className={`w-5 h-5 ${isSelected ? "text-indigo-600" : "text-gray-400"}`} />
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span className={`text-sm truncate ${isProduct ? "font-bold" : "font-medium"} ${isSelected ? "text-indigo-900" : "text-gray-900"}`}>
                            {s.text}
                          </span>
                          {isProduct && s.price !== undefined && (
                            <span className="text-sm font-bold text-blue-600 flex-shrink-0">
                              ${parseFloat(s.price).toFixed(2)}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          {isContent ? (
                            <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded">
                              {s.content_type}
                            </span>
                          ) : s.type === 'category' || s.type === 'clause' || s.type === 'filter' ? (
                            <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 bg-indigo-50 text-indigo-600 rounded">
                              {s.type === 'category' ? 'Category' : s.type === 'filter' ? 'Global Filter' : 'Special Collection'}
                            </span>
                          ) : (
                            <span className="text-xs text-indigo-500 font-medium whitespace-nowrap">Popular Search</span>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Click outside to close */}
        {open && (
          <div
            className="fixed inset-0 z-40"
            onClick={() => {
              setOpen(false);
              setSelectedIndex(-1);
            }}
          />
        )}
      </div>
    </section>
  );
}
