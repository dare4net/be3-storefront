'use client';

import { useLegacyPageData } from '@/components/providers/LegacyPageContext';

/**
 * usePageContext
 * Derives a typed page context signal from the existing LegacyPageContext.
 * Returns { contextType: 'vendor'|'category', contextValue: string } or null.
 *
 * Context map:
 *   vendor collection page  → { contextType: 'vendor',   contextValue: collection.name }
 *   category detail page    → { contextType: 'category', contextValue: category.id }
 *   branded search page     → { contextType: 'category', contextValue: <category_id from filter> }
 */
export function usePageContext() {
    const ctx = useLegacyPageData();
    if (!ctx?.data || !ctx?.type) return null;

    const { data, type } = ctx;

    // Vendor collection pages
    if (type === 'collection' && data.collection_type === 'vendor') {
        return { contextType: 'vendor', contextValue: data.name };
    }

    // Category detail pages
    if (type === 'category') {
        return { contextType: 'category', contextValue: data.id };
    }

    // Branded search pages — filter string always contains category_id
    if (type === 'branded_search') {
        const catId = data.category_id
            || new URLSearchParams(data.filter || '').get('category_id');
        if (catId) return { contextType: 'category', contextValue: catId };
    }

    return null;
}
