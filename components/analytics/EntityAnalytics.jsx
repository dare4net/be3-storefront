'use client';

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useAnalytics } from '@/lib/hooks/useAnalytics';

/**
 * Generic Analytics component for tracking page views of any entity
 * Ensures consistent ID normalization and metadata attachment
 */
export default function EntityAnalytics({ type, entity }) {
    const { trackPageView } = useAnalytics();
    const searchParams = useSearchParams();

    useEffect(() => {
        if (!entity) return;

        // Determine the most stable ID (ID > Slug/Handle > Name)
        const entityId = entity.id || entity.slug || entity.handle || entity.name;

        if (entityId) {
            // Extract referral info from URL params
            const refType = searchParams.get('ref_type');
            const refId = searchParams.get('ref_id');

            trackPageView({
                entity_type: type,
                entity_id: String(entityId),
                referrer_entity_type: refType,
                referrer_entity_id: refId,
                metadata: {
                    name: entity.name,
                    // Categorization info if relevant
                    category_id: type === 'product' ? entity.categories?.[0]?.id : (type === 'category' ? entity.parent_id : undefined),
                    // Capture search/filter context if present
                    path: typeof window !== 'undefined' ? window.location.pathname : '',
                    has_filters: Array.from(searchParams.keys()).some(k => k.startsWith('attribute.') || ['price_min', 'price_max'].includes(k))
                }
            });
        }
    }, [entity, type, searchParams, trackPageView]);

    return null;
}
