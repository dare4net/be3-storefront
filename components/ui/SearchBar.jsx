"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { Search, X, Loader2, TrendingUp, Package, FolderOpen, FileText } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
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

export function SearchBar({ className }) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const tenant = useTenant();
    const { trackImpression, trackClick } = useAnalytics();

    const [query, setQuery] = useState(searchParams.get("q") || "");
    const [suggestions, setSuggestions] = useState([]);
    const [isFocused, setIsFocused] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(-1);

    const containerRef = useRef(null);
    const sessionImpressedRef = useRef(new Set());

    // Sync with URL query
    useEffect(() => {
        setQuery(searchParams.get("q") || "");
    }, [searchParams]);

    // Ghost Suggestion Logic
    const ghostSuggestion = useMemo(() => {
        if (!query || query.length < 2 || suggestions.length === 0) return "";
        const match = suggestions.find(s => s.text.toLowerCase().startsWith(query.toLowerCase()));
        if (match) {
            return query + match.text.slice(query.length);
        }
        return "";
    }, [query, suggestions]);

    // Fetch suggestions
    useEffect(() => {
        let cancelled = false;
        const fetchSuggestions = async () => {
            if (!tenant?.id || query.trim().length < 2) {
                setSuggestions([]);
                return;
            }

            setIsLoading(true);
            try {
                const res = await api.get(`/search/autocomplete?q=${encodeURIComponent(query.trim())}&limit=8`, {
                    headers: { "X-Tenant-ID": tenant.id }
                });
                if (cancelled) return;
                setSuggestions(res.data?.suggestions || []);
            } catch (err) {
                console.warn("Autocomplete fetch failed:", err);
            } finally {
                if (!cancelled) setIsLoading(false);
            }
        };

        const timer = setTimeout(fetchSuggestions, 200);
        return () => {
            cancelled = true;
            clearTimeout(timer);
        };
    }, [query, tenant?.id]);

    // Track impressions
    useEffect(() => {
        if (isFocused && suggestions.length > 0) {
            suggestions.forEach((s, index) => {
                const entityId = s.id || s.content_id || s.slug || s.text;
                if (!sessionImpressedRef.current.has(entityId)) {
                    trackImpression({
                        entity_type: s.type === 'content' ? s.content_type : 'search_suggestion',
                        entity_id: String(entityId),
                        placement_id: 'header_search_autocomplete',
                        placement_type: 'search',
                        position: index + 1,
                        metadata: { term: query, suggestion_text: s.text, suggestion_type: s.type }
                    });
                    sessionImpressedRef.current.add(entityId);
                }
            });
        }
    }, [isFocused, suggestions, query, trackImpression]);

    const handleSearch = (searchTerm, filter) => {
        const term = (searchTerm ?? query).trim();
        if (!term && !filter) return;

        setIsFocused(false);
        const params = new URLSearchParams(searchParams);
        if (term) params.set("q", term);
        if (filter) {
            const filterParts = filter.split("&");
            filterParts.forEach(part => {
                const [k, v] = part.split("=");
                if (k && v) params.set(k, v);
            });
        }
        router.push(`/search?${params.toString()}`);
    };

    const handleSuggestionClick = (s, index) => {
        trackClick({
            entity_type: s.type === 'content' ? s.content_type : 'search_suggestion',
            entity_id: String(s.id || s.content_id || s.slug || s.text),
            placement_id: 'header_search_autocomplete',
            placement_type: 'search',
            position: index + 1,
            metadata: { term: query, suggestion_text: s.text, suggestion_type: s.type }
        });

        if (s.type === "content" && s.content_type === "product" && (s.handle || s.slug)) {
            router.push(`/products/${s.handle || s.slug}`);
            setIsFocused(false);
        } else if (s.type === "content" && s.content_type === "category" && s.slug) {
            router.push(`/categories/${s.slug}`);
            setIsFocused(false);
        } else {
            handleSearch(s.text, s.filter);
        }
    };

    const handleKeyDown = (e) => {
        if ((e.key === "ArrowRight" || e.key === " ") && ghostSuggestion && query.length < ghostSuggestion.length) {
            if (e.key === " " && ghostSuggestion[query.length] !== " ") return;
            e.preventDefault();
            setQuery(ghostSuggestion);
            return;
        }

        if (suggestions.length === 0) return;

        if (e.key === "ArrowDown") {
            e.preventDefault();
            setSelectedIndex(prev => (prev < suggestions.length - 1 ? prev + 1 : prev));
        } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setSelectedIndex(prev => (prev > 0 ? prev - 1 : -1));
        } else if (e.key === "Enter" && selectedIndex >= 0) {
            e.preventDefault();
            handleSuggestionClick(suggestions[selectedIndex], selectedIndex);
        }
    };

    return (
        <div
            ref={containerRef}
            className={cn(
                "relative flex-1 max-w-2xl transition-all duration-200 z-[60]",
                isFocused ? "scale-[1.01]" : "scale-100",
                className
            )}
        >
            <form onSubmit={(e) => { e.preventDefault(); handleSearch(); }} className="relative">
                <div className={cn(
                    "relative flex items-center w-full h-11 bg-gray-100 rounded-xl border-2 transition-all duration-200 overflow-hidden",
                    isFocused
                        ? "bg-white border-blue-500 ring-4 ring-blue-50"
                        : "border-transparent hover:bg-gray-200"
                )}>
                    <div className="pl-4 pr-2 flex items-center justify-center text-gray-400">
                        {isLoading ? (
                            <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
                        ) : (
                            <Search className={cn("w-5 h-5 transition-colors", isFocused && "text-blue-500")} />
                        )}
                    </div>

                    <div className="flex-1 relative h-full flex items-center">
                        {ghostSuggestion && isFocused && (
                            <div className="absolute inset-0 pointer-events-none text-sm select-none flex items-center whitespace-pre px-0">
                                <span className="text-transparent font-medium">{query}</span>
                                <span className="text-gray-300 font-medium">{ghostSuggestion.slice(query.length)}</span>
                            </div>
                        )}
                        <input
                            type="text"
                            value={query}
                            onChange={(e) => { setQuery(e.target.value); setSelectedIndex(-1); }}
                            onFocus={() => setIsFocused(true)}
                            onBlur={() => setTimeout(() => setIsFocused(false), 200)}
                            onKeyDown={handleKeyDown}
                            placeholder="Find your favorite products..."
                            autoComplete="off"
                            className="w-full bg-transparent border-none outline-none text-sm placeholder:text-gray-500 text-gray-900 font-medium h-full relative z-10"
                        />
                    </div>

                    {query && (
                        <button
                            type="button"
                            onClick={() => { setQuery(""); setSuggestions([]); }}
                            className="px-3 h-full flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors"
                        >
                            <X className="w-4 h-4" />
                        </button>
                    )}

                    <button
                        type="submit"
                        className={cn(
                            "h-full px-6 text-sm font-bold transition-all duration-200 hidden md:block",
                            isFocused
                                ? "bg-blue-600 text-white"
                                : "bg-gray-200 text-gray-600 opacity-0 translate-x-2 pointer-events-none group-hover:opacity-100 group-hover:translate-x-0"
                        )}
                    >
                        Search
                    </button>
                </div>
            </form>

            {/* Suggestions Dropdown */}
            {isFocused && suggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-3 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="px-4 py-2 border-b border-gray-50 bg-gray-50/50 flex items-center justify-between">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Quick Suggestions</p>
                        {ghostSuggestion && <span className="text-[10px] font-bold text-blue-500 bg-blue-50 px-2 py-0.5 rounded-full">Hit Space to Complete</span>}
                    </div>

                    <div className="max-h-[70vh] overflow-y-auto p-1.5">
                        {suggestions.map((s, idx) => {
                            const isSelected = idx === selectedIndex;
                            const isContent = s.type === "content";
                            const isProduct = isContent && s.content_type === 'product';
                            const Icon = isContent ? getContentIcon(s.content_type) : TrendingUp;

                            return (
                                <button
                                    key={`${s.text}-${idx}`}
                                    onMouseDown={(e) => { e.preventDefault(); handleSuggestionClick(s, idx); }}
                                    className={cn(
                                        "w-full text-left px-3 py-2.5 rounded-xl transition-all flex items-center gap-4 group/item",
                                        isSelected ? "bg-blue-600 text-white shadow-lg" : "hover:bg-gray-50 text-gray-900"
                                    )}
                                    onMouseEnter={() => setSelectedIndex(idx)}
                                >
                                    <div className={cn(
                                        "w-12 h-12 flex-shrink-0 rounded-lg overflow-hidden flex items-center justify-center border transition-colors",
                                        isSelected ? "bg-white/20 border-white/20" : "bg-gray-50 border-gray-100"
                                    )}>
                                        {s.image_url ? (
                                            <img src={s.image_url} alt="" className="w-full h-full object-cover" />
                                        ) : (
                                            <Icon className={cn("w-5 h-5", isSelected ? "text-white" : "text-gray-400")} />
                                        )}
                                    </div>

                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between gap-2">
                                            <span className={cn(
                                                "text-sm truncate font-bold tracking-tight",
                                                isSelected ? "text-white" : "text-gray-900"
                                            )}>
                                                {s.text}
                                            </span>
                                            {isProduct && s.price !== undefined && (
                                                <span className={cn(
                                                    "text-sm font-black whitespace-nowrap",
                                                    isSelected ? "text-white" : "text-blue-600"
                                                )}>
                                                    ${parseFloat(s.price).toFixed(2)}
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2 mt-0.5">
                                            <span className={cn(
                                                "text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded",
                                                isSelected ? "bg-white/20 text-white" : "bg-gray-100 text-gray-500"
                                            )}>
                                                {s.type === 'category' ? 'Category' : (isContent ? s.content_type : 'Suggestion')}
                                            </span>
                                        </div>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}
