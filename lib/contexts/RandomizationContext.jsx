'use client';

import { createContext, useContext, useState, useCallback, useRef } from 'react';

const RandomizationContext = createContext(null);

/**
 * Provider for cross-widget randomization coordination
 * Prevents multiple widgets from selecting the same category/collection/clause
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
    // (State updates are async, so multiple widgets initializing at once would see same empty state)
    const usedSelectionsRef = useRef({
        categories: new Set(),
        collections: new Set(),
        attributeClauses: new Set()
    });

    /**
     * Get next random item from pool, excluding already used items
     * @param {string} type - 'categories' | 'collections' | 'attributeClauses'
     * @param {Array} pool - Available items to pick from
     * @param {string} widgetId - Widget identifier (for debugging)
     * @returns {Object|null} Selected item or null if pool is empty
     */
    const getNextRandom = useCallback((type, pool, widgetId) => {
        if (!pool || pool.length === 0) {
            console.warn(`[RandomizationContext] Empty pool for type "${type}"`);
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
            // Pick from unused items
            selected = available[Math.floor(Math.random() * available.length)];
            id = type === 'attributeClauses'
                ? `${selected.attribute?.code}:${selected.clause?.name}`
                : selected.id;
        } else {
            // Pool exhausted - use smart reuse strategy
            console.warn(
                `[RandomizationContext] Pool exhausted for type "${type}" (${widgetId}). ` +
                `Using least-used item fallback.`
            );

            // Pick item with lowest reuse count
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

            // Increment reuse count
            const reuseKey = `${type}_${id}`;
            reuseCount.current.set(reuseKey, (reuseCount.current.get(reuseKey) || 0) + 1);
        }

        // Mark as used immediately in Ref
        usedSelectionsRef.current = {
            ...usedSelectionsRef.current,
            [type]: new Set([...usedSelectionsRef.current[type], id])
        };

        // Sync to state (for any consumers observing it)
        setUsedSelections(prev => ({
            ...prev,
            [type]: new Set([...prev[type], id])
        }));

        console.log(`[RandomizationContext] Returning selected item for ${type}:`, selected);
        return selected;
    }, []);

    /**
     * Reset all selections (call on page navigation or manual refresh)
     */
    const reset = useCallback(() => {
        const empty = {
            categories: new Set(),
            collections: new Set(),
            attributeClauses: new Set()
        };
        usedSelectionsRef.current = empty;
        setUsedSelections(empty);
        reuseCount.current.clear();
    }, []);

    /**
     * Get current usage statistics (for debugging)
     */
    const getStats = useCallback(() => {
        return {
            categories: {
                used: usedSelectionsRef.current.categories.size,
                reused: Array.from(reuseCount.current.entries())
                    .filter(([key]) => key.startsWith('categories_'))
                    .reduce((sum, [, count]) => sum + count, 0)
            },
            collections: {
                used: usedSelectionsRef.current.collections.size,
                reused: Array.from(reuseCount.current.entries())
                    .filter(([key]) => key.startsWith('collections_'))
                    .reduce((sum, [, count]) => sum + count, 0)
            },
            attributeClauses: {
                used: usedSelectionsRef.current.attributeClauses.size,
                reused: Array.from(reuseCount.current.entries())
                    .filter(([key]) => key.startsWith('attributeClauses_'))
                    .reduce((sum, [, count]) => sum + count, 0)
            }
        };
    }, []);

    const value = {
        getNextRandom,
        reset,
        getStats,
        usedSelections
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
