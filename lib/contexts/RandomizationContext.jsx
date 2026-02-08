'use client';

import { createContext, useContext, useState, useCallback, useRef, useMemo, useEffect } from 'react';

import { proxyApi as axios } from '@/lib/axios';
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
    const [batchProducts, setBatchProducts] = useState({}); // { widgetId: { results, pagination, loading } }
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
     * getStableWidgetId: Generates a stable ID based on config if explicit ID is missing
     */
    const getStableWidgetId = useCallback((config, fallbackId) => {
        if (config.id) return config.id;
        // Fallback to fingerprinting title + settings
        const fingerprint = `${config.title || 'untitled'}_${config.sourceType || 'all'}_${config.limit || 10}_${JSON.stringify(config.randomize || {})}`;
        return `stable_${stableHash(fingerprint)}`;
    }, []);

    // --- Global Snapshot Hydration ---
    // The frontend no longer manages its own expiry or local storage.
    // It accepts the "Global Authority" plan from the server.

    // --- Backend Master Plan (For Product Widgets) ---
    const [masterPlan, setMasterPlan] = useState({});
    const masterPlanRef = useRef(masterPlan); // Mirror state for stable callbacks
    const [isResolving, setIsResolving] = useState(false);
    const isResolvingRef = useRef(false); // Mirror state for stable callbacks

    // Registry to collect widget requirements before batch resolution
    const registryRef = useRef(new Map());
    const resolveTimerRef = useRef(null);
    const resolvedRef = useRef(false);

    /**
     * Resolve the master plan from the backend
     */
    /**
     * Resolve the master plan from the backend
     */
    const resolveMasterPlan = useCallback(async () => {
        if (registryRef.current.size === 0) return;
        if (isResolvingRef.current) return;

        setIsResolving(true);
        isResolvingRef.current = true;
        resolvedRef.current = true;

        try {
            const widgetsToResolve = [];
            const snapshot = new Map(registryRef.current);
            registryRef.current.clear();

            snapshot.forEach((data, id) => {
                widgetsToResolve.push({
                    id,
                    intent: data.intent,
                    config: data.config
                });
            });

            // Fetch from backend (which will use the same Global Snapshot logic)
            const response = await axios.post('/api/search/randomization/resolve', {
                widgets: widgetsToResolve,
                pageHandle: window.location.pathname.split('/').pop() || 'home'
            });

            if (response.data.success) {
                const newPlanMap = {};
                if (Array.isArray(response.data.results)) {
                    response.data.results.forEach(res => {
                        newPlanMap[res.widgetId] = res;
                    });
                }

                setMasterPlan(prev => {
                    const updated = { ...prev, ...newPlanMap };
                    masterPlanRef.current = updated;
                    return updated;
                });
            }
        } catch (error) {
            console.error("[RandomizationContext] Failed to resolve stragglers:", error);
        } finally {
            setIsResolving(false);
            isResolvingRef.current = false;
        }
    }, []);

    /**
     * Register a widget and trigger plan resolution
     */
    const registerWidget = useCallback((id, intent, config) => {
        const stableId = getStableWidgetId(config, id);

        // 0. Plan Respect: If we already have a plan item (from SSR), skip
        if (masterPlanRef.current[stableId]) {
            return;
        }

        // 2. Handle Stragglers (Widgets mounting after initial resolution)
        // This is now the ONLY path for client-side resolution
        console.log(`[RandomizationContext] Registering straggler: ${stableId}.`);
        registryRef.current.set(stableId, { intent, config });

        if (resolveTimerRef.current) clearTimeout(resolveTimerRef.current);
        resolveTimerRef.current = setTimeout(() => {
            resolveMasterPlan();
        }, 100);
    }, [resolveMasterPlan, getStableWidgetId]);

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
            widgets.push({ widgetId, ...intent });
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
                setBatchProducts(prev => ({
                    ...prev,
                    ...results // Merge results which include results, pagination, and no loading
                }));
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
        registerProductFetch
    }), [
        getNextRandom, usedSelections, masterPlan, isResolving,
        registerWidget, getStableWidgetId, seedPlan, batchProducts, registerProductFetch
    ]);

    // --- Initialization ---
    // Zero frontend state management. Pure Global Snapshot.

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
