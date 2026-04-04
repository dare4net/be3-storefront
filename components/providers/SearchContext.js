"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import api from "@/lib/axios";
import { useTenant } from "@/components/providers/TenantContext";
import { generateTitle, generateDescription } from "@/lib/utils/AttributeClauseUtil";

const SearchContext = createContext(null);

function normalizeFilters(filters) {
  if (!filters) return {};
  const out = {};
  const keys = Object.keys(filters).sort();
  keys.forEach((k) => {
    const v = filters[k];
    if (v === undefined || v === null || v === "") return;
    out[k] = v;
  });
  return out;
}

function buildQueryString(paramsObj, exclude = []) {
  const params = new URLSearchParams();
  const { q, page, perPage, sort, filters, ...extra } = paramsObj;

  if (q && !exclude.includes("q")) params.set("q", q);
  if (page && page !== 1 && !exclude.includes("page")) params.set("page", String(page));
  if (perPage && !exclude.includes("per_page")) params.set("per_page", String(perPage));
  if (sort && sort !== "relevance" && !exclude.includes("sort")) params.set("sort", sort);

  Object.entries(filters || {}).forEach(([key, val]) => {
    if (val === undefined || val === null || val === "" || exclude.includes(key)) return;
    params.set(key, String(val));
  });

  Object.entries(extra || {}).forEach(([key, val]) => {
    if (val === undefined || val === null || val === "" || exclude.includes(key)) return;
    params.set(key, String(val));
  });

  return params.toString();
}

export function SearchProvider({ children, initialPerPage = 20, initialFilters = {} }) {
  const tenant = useTenant();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [q, setQ] = useState(searchParams.get("q") || "");
  const [sort, setSort] = useState(searchParams.get("sort") || "relevance");
  const [page, setPage] = useState(parseInt(searchParams.get("page") || "1", 10) || 1);
  const [perPage, setPerPage] = useState(parseInt(searchParams.get("per_page") || String(initialPerPage), 10) || initialPerPage);

  const [filters, setFilters] = useState(() => {
    const f = { ...initialFilters };
    // Known core filters
    const priceMin = searchParams.get("price_min");
    const priceMax = searchParams.get("price_max");
    const categoryId = searchParams.get("category_id");
    const status = searchParams.get("status");
    const isFeatured = searchParams.get("is_featured");
    const collectionId = searchParams.get("collection_id");
    const collectionSlug = searchParams.get("collection_slug");
    const tag = searchParams.get("tag");

    if (priceMin) f.price_min = priceMin;
    if (priceMax) f.price_max = priceMax;
    if (categoryId) f.category_id = categoryId;
    if (status) f.status = status;
    if (isFeatured !== null && isFeatured !== undefined && isFeatured !== "") f.is_featured = isFeatured === "true";
    if (collectionId) f.collection_id = collectionId;
    if (collectionSlug) f.collection_slug = collectionSlug;
    if (tag) f.tag = tag;

    // Attribute filters: attribute.<code>=value
    for (const [k, v] of searchParams.entries()) {
      if (k.startsWith("attribute.")) f[k] = v;
    }
    return f;
  });

  const [schema, setSchema] = useState({ categories: [], attributes: [], supportedSorts: [], supportedFilters: {} });
  const [results, setResults] = useState([]);
  const [facets, setFacets] = useState(null);
  const [pagination, setPagination] = useState({ page: 1, perPage: initialPerPage, total: 0, totalPages: 0 });
  const [category, setCategory] = useState(null);
  const [seo, setSeo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isSearchActive, setIsSearchActive] = useState(false);
  const [includeStats, setIncludeStats] = useState(false);

  // --- Image Search State ---
  const [imageSource, setImageSource] = useState(null); // URL or base64
  const [imageMode, setImageMode] = useState(false);    // true when searching by image
  const [activeVector, setActiveVector] = useState(null); // Cached embedding from backend

  const lastRequestKeyRef = useRef("");

  const setFilter = useCallback((key, value) => {
    setFilters((prev) => {
      const next = { ...prev };
      if (value === undefined || value === null || value === "") {
        delete next[key];
      } else {
        next[key] = value;
      }
      return next;
    });
    setPage(1);
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({});
    setPage(1);
  }, []);

  const syncUrl = useCallback(
    (nextState) => {
      const exclude = [];
      if (pathname.startsWith("/categories/")) exclude.push("category_id");
      if (pathname.startsWith("/collections/")) {
        exclude.push("collection_id");
        exclude.push("collection_slug");
      }

      const qs = buildQueryString(nextState, exclude);
      router.replace(`${pathname}${qs ? `?${qs}` : ""}`, { scroll: false });
    },
    [router, pathname]
  );

  // Load filter schema (categories + attribute definitions)
  const loadSchema = useCallback(
    async (categoryId) => {
      if (!tenant?.id) return;
      const res = await api.get(`/search/filter-schema${categoryId ? `?category_id=${encodeURIComponent(categoryId)}` : ""}`, {
        headers: { "X-Tenant-ID": tenant.id },
      });
      if (res.data?.success) {
        setSchema(res.data);
      }
    },
    [tenant?.id]
  );

  const runSearch = useCallback(
    async (overrides = {}) => {
      const statsPref = overrides.includeStats !== undefined ? overrides.includeStats : includeStats;
      if (!tenant?.id) return;

      const oq = overrides.q ?? q;
      const cleanFilters = normalizeFilters(overrides.filters ?? filters);
      const currentPage = overrides.page ?? page;
      const effectiveImageSource = overrides.imageSource ?? imageSource;
      const effectiveImageMode = overrides.imageMode ?? imageMode;
      // OPTIMIZATION: Use the cached vector if we have one and the source hasn't changed
      const effectiveImage = (effectiveImageMode && !overrides.imageSource) ? (activeVector || effectiveImageSource) : effectiveImageSource;

      const requestParams = {
        q: oq,
        page: currentPage,
        perPage,
        sort,
        filters: cleanFilters,
        include_stats: statsPref ? "true" : "false",
        mode: effectiveImageMode ? "image" : (overrides.mode ?? "keyword"),
        image: effectiveImage,
      };

      const requestKey = JSON.stringify(requestParams);

      // Deduplicate: If we already have this data or a request for it is in flight
      if (lastRequestKeyRef.current === requestKey && !overrides.force) return;
      lastRequestKeyRef.current = requestKey;

      setLoading(true);
      setError(null);

      try {
        let res;
        if (effectiveImageMode && effectiveImageSource) {
          // Use POST for image search (handles large base64)
          res = await api.post("/search", requestParams, {
            headers: { "X-Tenant-ID": tenant.id, "Content-Type": "application/json" },
          });
        } else {
          // Use GET for standard text search
          const qs = buildQueryString(requestParams);
          res = await api.get(`/search${qs ? `?${qs}` : ""}`, {
            headers: { "X-Tenant-ID": tenant.id },
          });
        }

        // If another request started while this one was pending, ignore this result
        if (lastRequestKeyRef.current !== requestKey) return;

        if (res.data?.success) {
          setResults(res.data.results || []);
          setFacets(res.data.facets || null);
          setPagination(res.data.pagination || { page: currentPage, perPage, total: 0, totalPages: 0 });
          setCategory(res.data.category || null);

          // STORE VECTOR FOR ROUND-TRIP OPTIMIZATION
          if (res.data.query_vector) {
            setActiveVector(res.data.query_vector);
          }

          // Only update SEO if not currently locked by a branded page
          setSeo((prev) => {
            if (prev?.is_branded) return prev;
            return res.data.seo || null;
          });
        } else {
          setResults([]);
          setFacets(null);
          setPagination({ page: currentPage, perPage, total: 0, totalPages: 0 });
          setSeo(null);
        }
      } catch (e) {
        if (lastRequestKeyRef.current !== requestKey) return;
        setError(e?.response?.data?.message || e.message || "Search failed");
        setResults([]);
        setFacets(null);
        setPagination({ page: currentPage, perPage, total: 0, totalPages: 0 });
        setSeo(null);
      } finally {
        if (lastRequestKeyRef.current === requestKey) setLoading(false);
      }
    },
    [tenant?.id, q, page, perPage, sort, filters, includeStats, imageMode, imageSource]
  );

  /**
   * Run a visual/image-based search.
   * Pass null to clear image mode and revert to text search.
   */
  const runImageSearch = useCallback(
    async (source) => {
      if (!source) {
        // Clear image mode
        setImageSource(null);
        setImageMode(false);
        setPage(1);
        // runSearch will be triggered by useEffect due to imageMode change
        return;
      }

      if (!tenant?.id) return;
      setImageSource(source);
      setImageMode(true);
      setActiveVector(null); // Reset cached vector for new image
      setPage(1);

      // Explicitly trigger to ensure immediate feedback even before useEffect
      runSearch({
        imageSource: source,
        imageMode: true,
        page: 1,
        force: true,
      });
    },
    [tenant?.id, perPage, runSearch]
  );

  // Sync URL + schema + results when on /search. Use q from URL so search works after
  // SearchBarWidget navigates to /search?q=... (state q can be stale until we sync).
  // Only call syncUrl when the target would differ from the current URL to avoid
  // router.replace → URL change → effect re-run loop. Use searchParams.toString()
  // in deps (not searchParams) to avoid object-reference churn.
  const currentQsRef = useRef("");
  const qs = searchParams.toString();

  // 1. URL -> State Sync
  useEffect(() => {
    const isSystemRoute = pathname === "/search" || pathname.startsWith("/categories/") || pathname.startsWith("/collections/");
    if (!isSystemRoute && !isSearchActive) return;

    const urlQ = searchParams.get("q") || "";
    if (urlQ !== q) setQ(urlQ);

    const urlPage = parseInt(searchParams.get("page") || "1", 10) || 1;
    if (urlPage !== page) setPage(urlPage);

    const urlSort = searchParams.get("sort") || "relevance";
    if (urlSort !== sort) setSort(urlSort);

    // Track current URL to avoid loop in step 2
    currentQsRef.current = qs;
  }, [pathname, qs]);

  // 2. State -> URL Sync
  useEffect(() => {
    if (!tenant?.id) return;
    const isSystemRoute = pathname === "/search" || pathname.startsWith("/categories/") || pathname.startsWith("/collections/");
    if (!isSystemRoute && !isSearchActive) return;

    const cleanFilters = normalizeFilters(filters);
    const next = { q, page, perPage, sort, filters: cleanFilters };
    const targetQs = buildQueryString(next);

    // For branded pages (non-system routes), only sync if the SEO is already branded
    // This prevents the race condition where setFilters runs before setSeo
    if (!isSystemRoute && !seo?.is_branded) return;

    // Once it IS branded, we still don't want to sync the base filters back to the URL
    // unless the user is interacting with facets/pagination
    if (seo?.is_branded) {
      // If the current filters specifically match the URL we are on, don't sync
      // But for now, let's just keep it simple and return to protect the pretty URL
      return;
    }

    if (targetQs !== currentQsRef.current) {
      syncUrl(next);
      currentQsRef.current = targetQs;
    }
  }, [tenant?.id, pathname, q, page, perPage, sort, filters, syncUrl]);

  // 3. State -> Data Fetch
  useEffect(() => {
    if (!tenant?.id) return;
    const isSystemRoute = pathname === "/search" || pathname.startsWith("/categories/") || pathname.startsWith("/collections/");
    if (!isSystemRoute && !isSearchActive) return;

    const cleanFilters = normalizeFilters(filters);
    loadSchema(cleanFilters.category_id || null).catch(() => { });
    runSearch();
  }, [tenant?.id, pathname, q, page, perPage, sort, filters, runSearch, loadSchema, includeStats]);

  // 4. Dynamic SEO Generation
  useEffect(() => {
    // Find active clause if any
    let activeAttribute = null;
    let activeClause = null;

    const attrKeys = Object.keys(filters).filter(k => k.startsWith('attribute.'));
    for (const key of attrKeys) {
      const parts = key.replace('attribute.', '').split(':');
      const attrCode = parts[0];
      const clauseName = parts[1];

      if (clauseName) {
        const attr = schema.attributes.find(a => a.code === attrCode);
        if (attr) {
          const clause = (attr.clauses || []).find(c => c.name === clauseName);
          if (clause) {
            activeAttribute = attr;
            activeClause = clause;
            break;
          }
        }
      }
    }

    // If this is a branded/locked SEO object from backend, don't override
    if (seo?.is_branded) return;

    // If no clause is active and we have a static SEO object from backend, don't override
    if (!activeClause && seo && !seo.is_dynamic) return;

    const title = generateTitle(category, activeAttribute, activeClause);
    const description = generateDescription(category, activeAttribute, activeClause);

    // Update document head (side effect)
    if (typeof document !== 'undefined') {
      // Don't update document title if it's already set by a more specific component or branded source
      if (document.title !== title && !seo?.is_branded) {
        document.title = title;
      }
      const metaDesc = document.querySelector('meta[name="description"]');
      if (metaDesc && metaDesc.getAttribute('content') !== description && !seo?.is_branded) {
        metaDesc.setAttribute('content', description);
      }
    }

    // Update state to match, but only if it differs from current to avoid loops
    if (seo?.title !== title || seo?.description !== description) {
      setSeo(prev => {
        if (prev?.is_branded) return prev;
        return {
          ...prev,
          title,
          description,
          is_dynamic: true
        };
      });
    }

  }, [category, filters, schema.attributes, seo]);

  const value = useMemo(
    () => ({
      q,
      setQ: (v) => {
        setQ(v);
        setPage(1);
      },
      sort,
      setSort: (v) => {
        setSort(v);
        setPage(1);
      },
      page,
      setPage,
      perPage,
      setPerPage,
      filters,
      setFilters,
      setFilter,
      clearFilters,
      schema,
      results,
      facets,
      pagination,
      category,
      seo,
      setSeo,
      isSearchActive,
      setIsSearchActive,
      loading,
      error,
      includeStats,
      setIncludeStats,
      refresh: runSearch,
      // Image search
      imageMode,
      imageSource,
      runImageSearch,
    }),
    [q, sort, page, perPage, filters, setFilters, setFilter, clearFilters, schema, results, facets, pagination, category, seo, setSeo, isSearchActive, setIsSearchActive, loading, error, includeStats, runSearch, imageMode, imageSource, runImageSearch]
  );

  return <SearchContext.Provider value={value}>{children}</SearchContext.Provider>;
}

export function useSearch() {
  const ctx = useContext(SearchContext);
  if (!ctx) throw new Error("useSearch must be used within a SearchProvider");
  return ctx;
}

