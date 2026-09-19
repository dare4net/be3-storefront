'use client';

import { createContext, useContext, useState, useCallback, useRef, useMemo, useEffect } from 'react';

import { proxyApi as axios } from '@/lib/axios';
import { usePathname } from 'next/navigation';
const RandomizationContext = createContext(null);

/**
 * Provider for cross-widget randomization coordination
 * Prevents multiple widgets from selecting the same category/collection/clause
 */
/**
 * Provider for cross-widget randomization coordination
 * Prevents multiple widgets from selecting the same category/collection/clause
 * Supports client-side caching to handle navigation and persistence
 */
export function RandomizationProvider({ children }) {
    // Track used selections per page load
    const [usedSelections, setUsedSelections] = useState({
        categories: new Set(),
        collections: new Set(),
        attributeClauses: new Set()
    });

    // Product Batching State
    // Product Batching State
    const [batchProducts, setBatchProducts] = useState(() => {
        if (typeof window === 'undefined') return {};
        try {
            const pageHandle = window.location.pathname.split('/').pop() || 'home';
            const key = `widget_random_plan_${pageHandle}`;
            const stored = localStorage.getItem(key);
            if (stored) {
                const { products } = JSON.parse(stored);
                return products || {};
            }
        } catch (e) { }
        return {};
    });
    const batchRegistryRef = useRef(new Map()); // Map<widgetId, { filter, sort, perPage }>
    const batchTimerRef = useRef(null);

    // Track how many times each item was reused (for smart fallback)
    const reuseCount = useRef(new Map());

    // Track used selections immediately with Ref to prevent race conditions
    const usedSelectionsRef = useRef({
        categories: new Set(),
        collections: new Set(),
        attributeClauses: new Set()
    });

    /**
     * stableHash: Simple string hashing for config fingerprinting
     */
    const stableHash = (str) => {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = (hash << 5) - hash + char;
            hash = hash & hash; // Convert to 32bit integer
        }
        return Math.abs(hash).toString(36);
    };

    /**
     * getStableWidgetId: Generates a stable ID based on config if explicit ID is missing.
     * Including an idPrefix ensures that different types of widgets (e.g. Category Grid vs Product Carousel)
     * never share the same identity even if they have the same title/settings.
     */
    /**
     * getStableWidgetId: Generates a stable ID based on config if explicit ID is missing.
     */
    const getStableWidgetId = useCallback((config) => {
        if (config.id) return config.id;
        // Fallback to fingerprinting title + settings
        const fingerprint = `${config.title || 'untitled'}_${config.sourceType || 'all'}_${config.limit || 10}_${JSON.stringify(config.randomize || {})}`;
        return `stable_${stableHash(fingerprint)}`;
    }, []);

    // --- Global Snapshot Hydration ---
    // The frontend no longer manages its own expiry or local storage.
    // It accepts the "Global Authority" plan from the server.

    // --- Backend Master Plan (For Product Widgets) ---
    const [masterPlan, setMasterPlan] = useState(() => {
        if (typeof window === 'undefined') return {};
        try {
            const pageHandle = window.location.pathname.split('/').pop() || 'home';
            const key = `widget_random_plan_${pageHandle}`;
            const stored = localStorage.getItem(key);
            if (stored) {
                const { data } = JSON.parse(stored);
                return data || {};
            }
        } catch (e) { }
        return {};
    });
    const masterPlanRef = useRef(masterPlan); // Mirror state for stable callbacks
    const [isResolving, setIsResolving] = useState(false);
    const isResolvingRef = useRef(false); // Mirror state for stable callbacks

    // Registry to collect widget requirements before batch resolution
    const registryRef = useRef(new Map());
    const resolveTimerRef = useRef(null);
    const resolvedRef = useRef(false);
    const [isHydrated, setIsHydrated] = useState(() => typeof window !== 'undefined' && !!localStorage.getItem(`widget_random_plan_${window.location.pathname.split('/').pop() || 'home'}`));

    // Persistence Helpers
    const getStorageKey = useCallback((pageHandle) => `widget_random_plan_${pageHandle || 'home'}`, []);

    /**
     * Reset all in-memory state when the route changes.
     * The RandomizationProvider lives in the layout and never unmounts,
     * so without this, masterPlan + batchProducts from the previous page
     * persist into the next page and render stale content.
     */
    const pathname = usePathname();
    const prevPathnameRef = useRef(pathname);

    useEffect(() => {
        // Skip the very first render — state is already initialized from localStorage
        if (prevPathnameRef.current === pathname) return;
        prevPathnameRef.current = pathname;

        const pageHandle = pathname.split('/').pop() || 'home';
        const key = `widget_random_plan_${pageHandle}`;

        // Try to hydrate from the new page's localStorage (may exist from a prior visit)
        let newPlan = {};
        let newBatch = {};
        if (typeof window !== 'undefined') {
            try {
                const stored = localStorage.getItem(key);
                if (stored) {
                    const parsed = JSON.parse(stored);
                    // Respect expiry
                    if (!parsed.expiresAt || parsed.expiresAt > Date.now()) {
                        newPlan = parsed.data || {};
                        newBatch = parsed.products || {};
                    } else {
                        localStorage.removeItem(key);
                    }
                }
            } catch (e) { }
        }

        // Apply new state
        setMasterPlan(newPlan);
        masterPlanRef.current = newPlan;
        setBatchProducts(newBatch);
        setIsHydrated(Object.keys(newPlan).length > 0);

        // Reset all resolution flags
        resolvedRef.current = false;
        isResolvingRef.current = false;
        setIsResolving(false);
        // NOTE: Do NOT clear registryRef or cancel resolveTimerRef here.
        // Child effects (widget registration) fire BEFORE this parent effect in React.
        // Widgets have already registered + started the 150ms timer.
        // Cancelling the timer would leave the resolve stranded with no trigger.
        // The pending timer will fire, read masterPlanRef (now reset to {}), and
        // correctly determine it needs a foreground update with full context.
        batchRegistryRef.current.clear();
        if (batchTimerRef.current) {
            clearTimeout(batchTimerRef.current);
            batchTimerRef.current = null;
        }
    }, [pathname]);


    /**
     * Helper to save current state to localStorage
     */
    const persistToStorage = useCallback((pageHandle, plan, products) => {
        if (typeof window === 'undefined') return;

        try {
            const key = getStorageKey(pageHandle);
            const current = JSON.parse(localStorage.getItem(key) || '{}');

            const payload = {
                ...current,
                expiresAt: current.expiresAt || (Date.now() + 15 * 60 * 1000), // Default 15m if missing
                data: plan || current.data || {},
                products: products || current.products || {}
            };

            localStorage.setItem(key, JSON.stringify(payload));
        } catch (e) {
            console.error("[RandomizationContext] Persistence failed", e);
        }
    }, [getStorageKey]);

    /**
     * Resolve the master plan from the backend
     * @param {boolean} applyToState - If true, updates active React state. If false, only saves to storage.
     * @param {object|null} context - Page context (vendor/category) to scope the pool
     * @param {Array|null} widgetList - Explicit list of { id, intent, config }. If null, reads from registryRef.
     */
    const resolveMasterPlan = useCallback(async (applyToState = true, context = null, widgetList = null) => {
        const pageHandle = window.location.pathname.split('/').pop() || 'home';

        const widgetsToResolve = [];
        let snapshot; // used for configData lookup in background fetch

        if (widgetList) {
            // Explicit list provided by the timer after splitting — registry already cleared
            widgetsToResolve.push(...widgetList);
            snapshot = new Map(widgetList.map(w => [w.id, w]));
        } else {
            // Legacy path: background sync or direct call without pre-split
            snapshot = new Map(registryRef.current);
            registryRef.current.clear();
            snapshot.forEach((data, id) => {
                widgetsToResolve.push({ id, intent: data.intent, config: data.config });
            });

            // Background sync fallback: refresh existing plan widgets if registry was empty
            if (widgetsToResolve.length === 0 && !applyToState) {
                Object.values(masterPlanRef.current).forEach(item => {
                    widgetsToResolve.push({ id: item.widgetId, intent: {}, config: {} });
                });
            }
        }

        if (widgetsToResolve.length === 0) return;
        if (isResolvingRef.current) return;

        setIsResolving(true);
        isResolvingRef.current = true;
        resolvedRef.current = true;

        try {
            console.log(`[RandomizationContext] Resolving plan (applyToState: ${applyToState}, context: ${context?.contextType || 'none'}, widgets: ${widgetsToResolve.length})...`);

            const response = await axios.post('/api/search/randomization/resolve', {
                widgets: widgetsToResolve,
                pageHandle,
                context
            });

            if (response.data.success) {
                const { results } = response.data;
                const newPlanMap = {};
                if (Array.isArray(results)) {
                    results.forEach(res => { newPlanMap[res.widgetId] = res; });
                }

                // Only persist non-context-aware plans to localStorage.
                // Context-aware plans are always resolved fresh — nothing to cache.
                if (!context) {
                    persistToStorage(pageHandle, newPlanMap, null);
                }

                // TRUE BACKGROUND FETCH: Silently pre-warm product cache for next load
                if (!applyToState) {
                    const widgetsForProducts = [];
                    Object.keys(newPlanMap).forEach(widgetId => {
                        const plan = newPlanMap[widgetId];
                        const configData = snapshot.get(widgetId)?.config || {};

                        const selections = plan.multiple ? plan.selections : [plan];
                        const primary = selections[0];
                        if (!primary) return;

                        const filters = {};
                        if (primary.meta?.filter) {
                            const params = new URLSearchParams(primary.meta.filter);
                            for (const [key, val] of params.entries()) { filters[key] = val; }
                        }

                        if (Object.keys(filters).length > 0) {
                            filters.sort = primary.resolvedSort || configData.sort || 'relevance';
                            filters.limit = primary.resolvedLimit || configData.limit || 8;
                            filters.showFeaturedOnly = primary.resolvedFeatured ?? configData.showFeaturedOnly ?? false;
                            widgetsForProducts.push({ widgetId, filters, perPage: filters.limit });
                        }
                    });

                    if (widgetsForProducts.length > 0) {
                        axios.post('/api/search/randomization/batch-products', { widgets: widgetsForProducts })
                            .then(res => {
                                if (res.data.success && res.data.results) {
                                    persistToStorage(pageHandle, null, res.data.results);
                                    console.log('[RandomizationContext] True Background Fetch completely cached.');
                                }
                            })
                            .catch(e => console.error('[RandomizationContext] Silent fetch failed', e));
                    }
                }

                if (applyToState) {
                    setMasterPlan(prev => {
                        const updated = { ...prev };
                        Object.keys(newPlanMap).forEach(key => {
                            // Non-context: only apply if not already in state (no UI jump)
                            // Context-aware: always apply — plan must reflect current context
                            if (!prev[key] || context) {
                                updated[key] = newPlanMap[key];
                            }
                        });
                        masterPlanRef.current = updated;
                        return updated;
                    });
                }
            }
        } catch (error) {
            console.error("[RandomizationContext] Master plan resolution failed:", error);
        } finally {
            setIsResolving(false);
            isResolvingRef.current = false;
        }
    }, [axios, persistToStorage]);

    /**
     * Register a widget and trigger plan resolution
     */
    const registerWidget = useCallback((id, intent, config) => {
        if (!id) return;

        console.log(`[RandomizationContext] Registering ${id}`);
        registryRef.current.set(id, { intent, config });

        if (resolveTimerRef.current) clearTimeout(resolveTimerRef.current);
        resolveTimerRef.current = setTimeout(async () => {
            // Take snapshot + clear registry here (before splitting) so resolveMasterPlan
            // doesn't need to touch the registry at all when given an explicit widgetList.
            const registrySnapshot = new Map(registryRef.current);
            registryRef.current.clear();

            // Split widgets into two independent groups
            const contextWidgets = [];
            const nonContextWidgets = [];
            let context = null;

            for (const [wid, data] of registrySnapshot) {
                if (data.config?.contextAware && data.config?._pageContext) {
                    if (!context) context = data.config._pageContext;
                    contextWidgets.push({ id: wid, intent: data.intent, config: data.config });
                } else {
                    nonContextWidgets.push({ id: wid, intent: data.intent, config: data.config });
                }
            }

            // 1. Context-aware widgets: always foreground, never cached, always fresh
            if (contextWidgets.length > 0) {
                await resolveMasterPlan(true, context, contextWidgets);
            }

            // 2. Non-context widgets: normal snapshot/cache flow (Redis + localStorage)
            if (nonContextWidgets.length > 0) {
                const needsForeground = nonContextWidgets.some(w => !masterPlanRef.current[w.id]);
                await resolveMasterPlan(!!needsForeground, null, nonContextWidgets);
            }
        }, 150);
    }, [resolveMasterPlan]);

    /**
     * Get next random item from pool (Client-side fallback logic remains)
     */
    const getNextRandom = useCallback((type, pool, widgetId) => {
        // ... (existing logic remains)
        if (!pool || pool.length === 0) {
            // ...
            return null;
        }

        const used = usedSelectionsRef.current[type] || new Set();

        // Filter out used items
        const available = pool.filter(item => {
            const id = type === 'attributeClauses'
                ? `${item.attribute?.code}:${item.clause?.name}`
                : item.id;
            return !used.has(id);
        });

        let selected;
        let id;

        if (available.length > 0) {
            selected = available[Math.floor(Math.random() * available.length)];
            id = type === 'attributeClauses'
                ? `${selected.attribute?.code}:${selected.clause?.name}`
                : selected.id;
        } else {
            // ... Reuse logic ...
            let minReuse = Infinity;
            let leastUsed = null;
            for (const item of pool) {
                const itemId = type === 'attributeClauses'
                    ? `${item.attribute?.code}:${item.clause?.name}`
                    : item.id;
                const count = reuseCount.current.get(`${type}_${itemId}`) || 0;
                if (count < minReuse) {
                    minReuse = count;
                    leastUsed = item;
                }
            }
            selected = leastUsed || pool[Math.floor(Math.random() * pool.length)];
            id = type === 'attributeClauses'
                ? `${selected.attribute?.code}:${selected.clause?.name}`
                : selected.id;
            const reuseKey = `${type}_${id}`;
            reuseCount.current.set(reuseKey, (reuseCount.current.get(reuseKey) || 0) + 1);
        }

        // Mark as used immediately
        usedSelectionsRef.current = {
            ...usedSelectionsRef.current,
            [type]: new Set([...usedSelectionsRef.current[type], id])
        };

        setUsedSelections(prev => ({
            ...prev,
            [type]: new Set([...prev[type], id])
        }));

        return selected;
    }, []);

    /**
     * Seed the master plan from external source (e.g. server-side injection)
     * reconcile with local cache to maintain stickiness for hourly/daily settings
     */
    const seedPlan = useCallback((serverPlan) => {
        if (!serverPlan) return;
        setMasterPlan(prev => {
            const updated = { ...prev, ...serverPlan };
            masterPlanRef.current = updated;
            return updated;
        });
    }, []);

    /**
     * registerProductFetch: Widgets call this to participate in the product batching
     */
    const registerProductFetch = useCallback((widgetId, intent) => {
        if (!widgetId) return;

        batchRegistryRef.current.set(widgetId, intent);

        if (batchTimerRef.current) clearTimeout(batchTimerRef.current);
        batchTimerRef.current = setTimeout(() => {
            resolveBatchProducts();
        }, 150); // Slightly longer debounce to catch all widgets on page
    }, []);

    /**
     * resolveBatchProducts: Executes the consolidated network request
     */
    const resolveBatchProducts = useCallback(async () => {
        const registry = batchRegistryRef.current;
        if (registry.size === 0) return;

        console.log(`[RandomizationContext] Resolving batch products for ${registry.size} widgets`);

        const widgets = [];
        registry.forEach((intent, widgetId) => {
            const w = { widgetId, ...intent };
            // Merge context filters declared by the widget (vendor or category injection)
            if (intent._contextFilters && typeof intent._contextFilters === 'object') {
                w.filters = { ...(w.filters || {}), ...intent._contextFilters };
                delete w._contextFilters;
            }
            widgets.push(w);
        });

        // Clear registry immediately to prevent duplicate triggers
        registry.clear();

        // Mark as loading in state
        setBatchProducts(prev => {
            const next = { ...prev };
            widgets.forEach(w => {
                next[w.widgetId] = { ...next[w.widgetId], loading: true };
            });
            return next;
        });

        try {
            const response = await axios.post('/api/search/randomization/batch-products', { widgets });

            if (response.data.success) {
                const results = response.data.results;
                setBatchProducts(prev => {
                    const next = { ...prev, ...results };

                    // Persist to storage immediately
                    const pageHandle = window.location.pathname.split('/').pop() || 'home';
                    persistToStorage(pageHandle, null, next);

                    return next;
                });
            }
        } catch (error) {
            console.error('[RandomizationContext] Batch product resolution failed', error);
            // Mark all as failed/not loading
            setBatchProducts(prev => {
                const next = { ...prev };
                widgets.forEach(w => {
                    next[w.widgetId] = { ...next[w.widgetId], loading: false, error: 'Batch fetch failed' };
                });
                return next;
            });
        }
    }, [axios]);

    const value = useMemo(() => ({
        // Client-side utils
        getNextRandom,
        reset: () => {
            const empty = { categories: new Set(), collections: new Set(), attributeClauses: new Set() };
            usedSelectionsRef.current = empty;
            setUsedSelections(empty);
            reuseCount.current.clear();
            setBatchProducts({});
        },
        getStats: () => ({ /* ... */ }),
        usedSelections,

        // Backend utils
        masterPlan,
        isResolving,
        registerWidget,
        getStableWidgetId,
        seedPlan,

        // Product Batching
        batchProducts,
        registerProductFetch,
        isHydrated
    }), [
        getNextRandom, usedSelections, masterPlan, isResolving,
        registerWidget, getStableWidgetId, seedPlan, batchProducts, registerProductFetch, isHydrated
    ]);

    // --- Initialization & Background Sync ---
    useEffect(() => {
        if (typeof window === 'undefined') return;

        const hydrateFromStorage = () => {
            const pageHandle = window.location.pathname.split('/').pop() || 'home';
            const key = getStorageKey(pageHandle);
            const stored = localStorage.getItem(key);

            if (!stored) return false;

            try {
                const { data, products, expiresAt, cacheId } = JSON.parse(stored);
                console.log(`[RandomizationContext] Hydrating from localStorage (CacheID: ${cacheId})`);

                // Immediate Hydration
                if (data) {
                    setMasterPlan(data);
                    masterPlanRef.current = data;
                }

                if (products) {
                    setBatchProducts(products);
                }

                setIsHydrated(true);

                // Background Revalidation after a small delay
                setTimeout(async () => {
                    console.log(`[RandomizationContext] Background checking cache validity...`);
                    try {
                        const check = await axios.post('/api/search/randomization/validate', {
                            cacheId,
                            pageHandle
                        });

                        const isExpired = Date.now() > expiresAt;

                        if (!check.data.valid || isExpired) {
                            console.log(`[RandomizationContext] Cache invalid or expired. Fetching fresh resolution for NEXT load.`);
                            resolveMasterPlan(false);
                        } else {
                            console.log(`[RandomizationContext] Cache still valid.`);
                        }
                    } catch (e) {
                        console.warn("[RandomizationContext] Background validation failed:", e);
                    }
                }, 2000);

                return true;
            } catch (e) {
                console.error("[RandomizationContext] Failed to parse stored plan", e);
                localStorage.removeItem(getStorageKey(window.location.pathname.split('/').pop() || 'home'));
                return false;
            }
        };

        // Run on initial mount
        hydrateFromStorage();

        // Also run on bfcache restoration (back/forward navigation)
        // persisted=true means the page was restored from bfcache
        const handlePageShow = (e) => {
            if (e.persisted) {
                console.log('[RandomizationContext] bfcache restore detected — re-hydrating.');
                hydrateFromStorage();
            }
        };

        window.addEventListener('pageshow', handlePageShow);
        return () => window.removeEventListener('pageshow', handlePageShow);
    }, [resolveMasterPlan, getStorageKey, axios]);

    return (
        <RandomizationContext.Provider value={value}>
            {children}
        </RandomizationContext.Provider>
    );
}

/**
 * Hook to access randomization context
 * Returns fallback implementation if not wrapped in provider (backward compatible)
 */
export function useRandomizationContext() {
    const context = useContext(RandomizationContext);

    if (!context) {
        // Fallback for backward compatibility
        // Returns basic random selection without deduplication
        return {
            getNextRandom: (type, pool) => {
                if (!pool || pool.length === 0) return null;
                return pool[Math.floor(Math.random() * pool.length)];
            },
            reset: () => { },
            getStats: () => ({
                categories: { used: 0, reused: 0 },
                collections: { used: 0, reused: 0 },
                attributeClauses: { used: 0, reused: 0 }
            }),
            usedSelections: {
                categories: new Set(),
                collections: new Set(),
                attributeClauses: new Set()
            }
        };
    }

    return context;
}
