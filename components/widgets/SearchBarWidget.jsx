"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Search, X, TrendingUp, Package, FolderOpen, FileText } from "lucide-react";
import api from "@/lib/axios";
import { useTenant } from "@/components/providers/TenantContext";

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
      const s = suggestions[selectedIndex];
      const isContent = s.type === "content";

      if (s.type === 'clause' && s.slug) {
        router.push(`/${s.slug}`);
      } else if (isContent && s.content_type === 'product' && s.handle) {
        router.push(`/products/${s.handle}`);
      } else if (isContent && s.content_type === 'category' && s.slug) {
        router.push(`/categories/${s.slug}`);
      } else if (isContent && s.content_type === 'collection' && s.slug) {
        router.push(`/collections/${s.slug}`);
      } else {
        navigateToSearch(s.text, s.filter);
        return;
      }
      setOpen(false);
      setInput("");
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
                        if (isProduct && s.handle) {
                          router.push(`/products/${s.handle}`);
                          setOpen(false);
                          setInput("");
                        } else if (isContent && s.content_type === 'category' && s.slug) {
                          router.push(`/categories/${s.slug}`);
                          setOpen(false);
                          setInput("");
                        } else if (isContent && s.content_type === 'collection' && s.slug) {
                          router.push(`/collections/${s.slug}`);
                          setOpen(false);
                          setInput("");
                        } else if (s.type === 'clause' && s.slug) {
                          // If it's a clause-based suggestion with a pretty slug, navigate to it!
                          router.push(`/${s.slug}`);
                          setOpen(false);
                          setInput("");
                        } else {
                          // Fallback to search query
                          navigateToSearch(s.text, s.filter);
                        }
                      }}
                      className={`w-full text-left px-5 py-3 transition-colors flex items-center gap-4 ${isSelected
                        ? "bg-indigo-50"
                        : "hover:bg-gray-50"
                        }`}
                      onMouseEnter={() => setSelectedIndex(idx)}
                    >
                      <div className="w-12 h-12 flex-shrink-0 bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center border border-gray-100">
                        {isContent && s.image_url ? (
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
                          ) : (
                            <span className="text-xs text-indigo-500 font-medium">Popular Search</span>
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
