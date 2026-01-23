'use client';

import { useState, useEffect } from 'react';
import { proxyApi } from '@/lib/axios';
import api from '@/lib/axios'; // Use api instance with baseURL for backend endpoints
import { useTenant } from '@/components/providers/TenantContext';

/**
 * Hook to fetch all data needed for widget randomization
 * Caches data in sessionStorage to avoid repeated fetches
 */
export function useRandomizationData() {
    const tenant = useTenant();
    const [data, setData] = useState({
        categories: [],
        collections: [],
        attributes: []
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!tenant?.id) {
            setLoading(false);
            return;
        }

        const fetchData = async () => {
            try {
                setLoading(true);
                setError(null);

                // Check sessionStorage cache first
                const cacheKey = `randomization_data_${tenant.id}`;
                const cacheVersionKey = `randomization_data_version_${tenant.id}`;
                const currentCacheVersion = '3'; // Increment when cache structure changes or fixes are applied

                const cached = sessionStorage.getItem(cacheKey);
                const cachedVersion = sessionStorage.getItem(cacheVersionKey);

                if (cached && cachedVersion === currentCacheVersion) {
                    try {
                        const parsed = JSON.parse(cached);
                        const categoriesCount = parsed.categories?.length || 0;
                        const collectionsCount = parsed.collections?.length || 0;
                        const attributesCount = parsed.attributes?.length || 0;


                        // If cache has categories but no collections/attributes, it might be stale from before the fix
                        // Force a refresh if we have categories but missing other data (unless they're legitimately empty)
                        // We'll refresh if categories exist but collections/attributes are 0, as this suggests a failed fetch
                        if (categoriesCount > 0 && collectionsCount === 0 && attributesCount === 0) {
                            console.warn('[useRandomizationData] Cache appears incomplete (has categories but no collections/attributes), forcing refresh');
                            sessionStorage.removeItem(cacheKey);
                            sessionStorage.removeItem(cacheVersionKey);
                            // Continue to fetch fresh data
                        } else {
                            // Cache is valid for the session, use it
                            setData(parsed);
                            setLoading(false);
                            return;
                        }
                    } catch (e) {
                        console.warn('[useRandomizationData] Invalid cache, fetching fresh data');
                        sessionStorage.removeItem(cacheKey);
                        sessionStorage.removeItem(cacheVersionKey);
                        // Invalid cache, continue to fetch
                    }
                } else if (cached && cachedVersion !== currentCacheVersion) {
                    sessionStorage.removeItem(cacheKey);
                    sessionStorage.removeItem(cacheVersionKey);
                }

                // Fetch all data in parallel

                const [categoriesRes, collectionsRes, attributesRes] = await Promise.all([
                    // Categories - use existing proxy route (relative path, no baseURL needed)
                    proxyApi.get('/api/categories').catch(err => {
                        console.error('[useRandomizationData] Failed to fetch categories:', err);
                        return { data: { success: false, categories: [] } };
                    }),

                    // Collections - call backend directly (needs baseURL, so use api instance)
                    api.get('/products/collections', {
                        headers: { 'X-Tenant-ID': tenant.id }
                    }).catch(err => {
                        console.error('[useRandomizationData] Failed to fetch collections:', err);
                        return { data: { success: false, collections: [] } };
                    }),

                    // Attributes - use filter-schema endpoint (needs baseURL, so use api instance)
                    api.get('/search/filter-schema', {
                        headers: { 'X-Tenant-ID': tenant.id }
                    }).catch(err => {
                        console.error('[useRandomizationData] Failed to fetch attributes:', err);
                        return { data: { success: false, attributes: [] } };
                    })
                ]);


                const categories = categoriesRes.data?.success ? (categoriesRes.data.categories || []) : [];
                const collections = collectionsRes.data?.success ? (collectionsRes.data.collections || []) : [];
                const attributes = attributesRes.data?.success ? (attributesRes.data.attributes || []) : [];

                // Filter attributes to only those with clauses
                const attributesWithClauses = attributes.filter(attr => {
                    const clauses = attr.clauses || [];
                    return Array.isArray(clauses) && clauses.length > 0;
                });

                const result = {
                    categories: categories.filter(c => c.is_active !== false), // Ensure only active
                    collections: collections.filter(c => c.is_active !== false), // Ensure only active
                    attributes: attributesWithClauses
                };


                // Cache in sessionStorage
                try {
                    sessionStorage.setItem(cacheKey, JSON.stringify(result));
                    sessionStorage.setItem(cacheVersionKey, currentCacheVersion);
                } catch (e) {
                    console.warn('[useRandomizationData] Failed to cache data:', e);
                }

                setData(result);
            } catch (err) {
                console.error('[useRandomizationData] Error fetching randomization data:', err);
                setError(err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [tenant?.id]);

    return { data, loading, error };
}
