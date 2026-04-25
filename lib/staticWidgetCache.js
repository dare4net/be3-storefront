/**
 * Static Widget Cache
 * 
 * Caching layer for non-randomized (Case B) product widgets.
 * Mirrors the stale-while-revalidate pattern used by RandomizationContext.
 * 
 * Strategy:
 *  - On page load: serve from localStorage immediately (even if stale)
 *  - If stale: background-refresh the cache silently, UI updates on NEXT visit
 *  - On first load (no cache): show loading, fetch, save, render
 * 
 * TTL: 15 minutes (matching the randomization plan cache)
 */

const TTL_MS = 15 * 60 * 1000; // 15 minutes
const STORAGE_PREFIX = 'widget_static_';

/**
 * Reads cached products for a static widget.
 * @param {string} widgetId 
 * @returns {{ products: Array, isStale: boolean } | null}
 */
export function getStaticCache(widgetId) {
    if (typeof window === 'undefined' || !widgetId) return null;
    try {
        const raw = localStorage.getItem(`${STORAGE_PREFIX}${widgetId}`);
        if (!raw) return null;
        const { products, expiresAt } = JSON.parse(raw);
        if (!Array.isArray(products) || products.length === 0) return null;
        return {
            products,
            isStale: Date.now() > expiresAt
        };
    } catch {
        return null;
    }
}

/**
 * Saves fetched products to localStorage for a static widget.
 * @param {string} widgetId
 * @param {Array} products
 */
export function saveStaticCache(widgetId, products) {
    if (typeof window === 'undefined' || !widgetId || !products?.length) return;
    try {
        localStorage.setItem(`${STORAGE_PREFIX}${widgetId}`, JSON.stringify({
            products,
            expiresAt: Date.now() + TTL_MS
        }));
    } catch (e) {
        // localStorage quota exceeded or unavailable — fail silently
        console.warn('[staticWidgetCache] Could not save cache:', e.message);
    }
}

/**
 * Removes the cache entry for a static widget.
 * @param {string} widgetId
 */
export function clearStaticCache(widgetId) {
    if (typeof window === 'undefined' || !widgetId) return;
    try {
        localStorage.removeItem(`${STORAGE_PREFIX}${widgetId}`);
    } catch {
        // ignore
    }
}
