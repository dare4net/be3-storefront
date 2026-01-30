'use client';

import { createContext, useContext, useState, useCallback, useRef } from 'react';

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

    // Cache Management
    const CACHE_KEY = 'randomization_v1_cache';

    const loadCache = useCallback(() => {
        try {
            const stored = localStorage.getItem(CACHE_KEY);
            return stored ? JSON.parse(stored) : {};
        } catch (e) {
            console.warn('[RandomizationContext] Failed to load cache', e);
            return {};
        }
    }, []);

    const saveCache = useCallback((newPlan) => {
        try {
            const current = loadCache();
            // Merge new plan into cache
            const updated = {
                ...current,
                ...newPlan,
                _timestamp: Date.now() // Update global timestamp for session/cleanup logic if needed
            };
            localStorage.setItem(CACHE_KEY, JSON.stringify(updated));
        } catch (e) {
            console.warn('[RandomizationContext] Failed to save cache', e);
        }
    }, [loadCache]);

    /**
     * Check if cached data is still valid based on frequency
     * @param {number} timestamp - When the data was cached
     * @param {string} frequency - 'always', 'hourly', 'daily', 'session'
     */
    const checkExpiration = useCallback((timestamp, frequency = 'always') => {
        if (!timestamp) return false;

        const now = Date.now();
        const age = now - timestamp;

        switch (frequency) {
            case 'hourly':
                return age < 3600 * 1000; // 1 hour
            case 'daily':
                return age < 24 * 3600 * 1000; // 24 hours
            case 'session':
                return true; // Valid for session (cleared on browser close ideally, but here effectively infinite until explicit clear)
            case 'always':
            default:
                return false; // Always expire on reload
        }
    }, []);

    // --- Backend Master Plan (For Product Widgets) ---
    const [masterPlan, setMasterPlan] = useState({});
    const [isResolving, setIsResolving] = useState(false);

    // Registry to collect widget requirements before batch resolution
    const registryRef = useRef(new Map());
    const resolveTimerRef = useRef(null);
    const resolvedRef = useRef(false);

    /**
     * Resolve the master plan from the backend
     */
    const resolveMasterPlan = useCallback(async () => {
        if (registryRef.current.size === 0) return;

        // If already resolving, fallback or queue? For now, we assume batching handles it.
        if (isResolving) return;

        setIsResolving(true);
        resolvedRef.current = true;

        try {
            const widgetsToResolve = [];
            const cachedPlanMap = {};

            // 1. Check Cache for each widget validity
            const cache = loadCache();

            registryRef.current.forEach((data, id) => {
                const cachedData = cache[id];
                // Support both 'frequency' (new) and 'interval' (legacy/builder) keys
                const rawFreq = data.config.randomize?.frequency || data.config.randomize?.interval;
                // Map 'page_load' to 'always' for consistency, otherwise pass through
                const frequency = rawFreq === 'page_load' ? 'always' : (rawFreq || 'always');

                if (cachedData && checkExpiration(cachedData._timestamp, frequency)) {
                    // Valid cache hit - use it
                    console.log(`[RandomizationContext] Cache HIT for ${id} (${frequency})`);
                    cachedPlanMap[id] = cachedData;
                } else {
                    // Cache miss or expired - needs resolution
                    console.log(`[RandomizationContext] Cache MISS/EXPIRED for ${id} (${frequency})`);
                    widgetsToResolve.push({
                        id,
                        intent: data.intent,
                        config: data.config
                    });
                }
            });

            // Update state with cached items immediately
            if (Object.keys(cachedPlanMap).length > 0) {
                setMasterPlan(prev => ({ ...prev, ...cachedPlanMap }));
            }

            // 2. Fetch missing items from backend
            if (widgetsToResolve.length > 0) {
                console.log(`[RandomizationContext] Requesting master plan for ${widgetsToResolve.length} widgets...`, widgetsToResolve);

                const response = await axios.post('/api/search/randomization/resolve', { widgets: widgetsToResolve });

                console.log("[RandomizationContext] Backend Response:", response.data);

                if (response.data.success) {
                    const newPlanMap = {};
                    const timestamp = Date.now();

                    if (Array.isArray(response.data.results)) {
                        response.data.results.forEach(res => {
                            // Add timestamp to each item for granular expiration
                            newPlanMap[res.widgetId] = { ...res, _timestamp: timestamp };
                        });
                    }

                    console.log("[RandomizationContext] Merging new plan results:", newPlanMap);

                    // Merge new results with cached results in State
                    setMasterPlan(prev => ({ ...prev, ...newPlanMap }));

                    // Persist ONLY the new items to cache (merging with existing cache)
                    saveCache(newPlanMap);
                } else {
                    console.error("[RandomizationContext] Backend reported failure:", response.data);
                }
            }
        } catch (error) {
            console.error("[RandomizationContext] Failed to resolve master plan:", error);
        } finally {
            setIsResolving(false);
        }
    }, [checkExpiration, loadCache, saveCache]);

    /**
     * Register a widget and trigger plan resolution
     */
    const registerWidget = useCallback((id, intent, config) => {
        // Generate stable ID for caching
        const stableId = getStableWidgetId(config, id);

        // 1. Check if we already have this in current state (fastest path)
        if (masterPlan[stableId]) {
            console.log(`[RandomizationContext] Widget ${stableId} already in plan state (fast return)`);
            return;
        }

        // 2. Check if we have valid cache (sync check) logic moved to resolveMasterPlan
        // We register intent regardless, resolveMasterPlan filters based on cache.
        // BUT to solve "Too Late" error: if resolvedRef is true, we try to load from cache immediately

        if (resolvedRef.current) {
            const cache = loadCache();
            const cachedData = cache[stableId];
            // If we have cached data, we can recover even if "too late" for the batch
            if (cachedData) {
                console.log(`[RandomizationContext] Late registration recovered from cache for ${stableId}`);
                setMasterPlan(prev => ({ ...prev, [stableId]: cachedData }));
                return;
            }

            console.warn(`[RandomizationContext] Widget ${stableId} registered too late and no cache available!`);
            // Optional: Trigger specific resolution for this straggler?
            // For now, we accept the warning as per original logic, but cache recovery fixes 90% of cases
            return;
        }

        registryRef.current.set(stableId, { intent, config });

        // Debounce resolution to ensure we catch all widgets mounting in the same tick
        if (resolveTimerRef.current) clearTimeout(resolveTimerRef.current);
        resolveTimerRef.current = setTimeout(() => {
            resolveMasterPlan();
        }, 100); // 100ms
    }, [masterPlan, resolveMasterPlan, getStableWidgetId, loadCache]);

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

    const value = {
        // Client-side utils
        getNextRandom,
        reset: () => {
            // Clear state but NOT cache (unless specifically requested?)
            // Keeping reset simple for now
            const empty = { categories: new Set(), collections: new Set(), attributeClauses: new Set() };
            usedSelectionsRef.current = empty;
            setUsedSelections(empty);
            reuseCount.current.clear();
        },
        getStats: () => ({ /* ... */ }),
        usedSelections,

        // Backend utils
        masterPlan,
        isResolving,
        registerWidget,
        getStableWidgetId // Export helper for widgets to use if needed
    };

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
