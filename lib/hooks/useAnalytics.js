/**
 * Analytics Tracking Hook
 * Provides a simple interface for tracking impressions, clicks, and page views
 */

import { useCallback, useRef, useEffect } from 'react';
import { useTenant } from '@/components/providers/TenantContext';
import api from '@/lib/axios';

// Generate a stable session ID for the browser session
const getSessionId = () => {
    if (typeof window === 'undefined') return 'ssr';

    let sessionId = sessionStorage.getItem('analytics_session_id');
    if (!sessionId) {
        // Double-check just in case of parallel execution context
        sessionId = `sess_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        try {
            sessionStorage.setItem('analytics_session_id', sessionId);
            // Verify it was set
            const verify = sessionStorage.getItem('analytics_session_id');
            if (verify) sessionId = verify;
        } catch (e) {
            console.warn('[Analytics] sessionStorage failed', e);
        }
    }
    return sessionId;
};

export function useAnalytics() {
    const tenant = useTenant();
    const impressionCache = useRef(new Set());
    const pageViewCache = useRef(new Set());
    const sessionId = useRef(null);

    // Lazy init session ID once
    if (!sessionId.current) {
        sessionId.current = getSessionId();
    }
    const eventBuffer = useRef([]);
    const flushInterval = useRef(null);

    // Flush buffer to server
    const flushEvents = useCallback(async () => {
        if (eventBuffer.current.length === 0 || !tenant?.id) return;

        const events = [...eventBuffer.current];
        eventBuffer.current = []; // Clear buffer immediately to avoid duplicates during async call

        try {
            await api.post('/analytics/collect', {
                batch: true,
                events: events.map(e => ({
                    ...e,
                    session_id: sessionId.current
                }))
            }, {
                headers: { 'X-Tenant-ID': tenant.id }
            });
        } catch (error) {
            console.error('[Analytics] Batch flush failed:', error);
            // Optionally put events back in buffer if it's a transient failure
            // eventBuffer.current = [...events, ...eventBuffer.current];
        }
    }, [tenant]);

    // Setup periodic flush
    useEffect(() => {
        flushInterval.current = setInterval(flushEvents, 3000); // Flush every 3s

        return () => {
            if (flushInterval.current) clearInterval(flushInterval.current);
            flushEvents(); // Final flush on unmount
            impressionCache.current.clear();
        };
    }, [flushEvents]);

    /**
     * Add event to buffer and check for immediate flush
     */
    const bufferEvent = useCallback((event) => {
        eventBuffer.current.push(event);

        // Immediate flush if buffer is Getting large
        if (eventBuffer.current.length >= 20) {
            flushEvents();
        }
    }, [flushEvents]);

    /**
     * Track an impression event (Now batched)
     */
    const trackImpression = useCallback(({
        entity_type,
        entity_id,
        placement_id,
        placement_type = 'general',
        position,
        metadata = {}
    }) => {
        if (!tenant?.id) return;

        const cacheKey = `${placement_id}:${entity_type}:${entity_id}`;
        if (impressionCache.current.has(cacheKey)) return;

        bufferEvent({
            event_type: 'impression',
            entity_type,
            entity_id: String(entity_id),
            placement_id,
            placement_type,
            position,
            metadata,
            timestamp: new Date().toISOString()
        });

        impressionCache.current.add(cacheKey);
    }, [tenant, bufferEvent]);

    /**
     * Track a click event (Now batched)
     */
    const trackClick = useCallback(({
        entity_type,
        entity_id,
        placement_id,
        placement_type = 'general',
        position,
        event_type = 'click', // Added default and allowed override
        referrer_entity_type,
        referrer_entity_id,
        metadata = {}
    }) => {
        if (!tenant?.id) return;

        bufferEvent({
            event_type,
            entity_type,
            entity_id: String(entity_id),
            placement_id,
            placement_type,
            position,
            referrer_entity_type,
            referrer_entity_id,
            referrer_url: typeof window !== 'undefined' ? window.location.href : '',
            metadata,
            timestamp: new Date().toISOString()
        });

        // Immediate flush for critical cart events
        if (['add_to_cart', 'remove_from_cart', 'checkout_success'].includes(event_type)) {
            flushEvents();
        }
    }, [tenant, bufferEvent, flushEvents]);

    const trackPageView = useCallback(async ({
        entity_type,
        entity_id,
        referrer_entity_type,
        referrer_entity_id,
        metadata = {}
    }) => {
        if (!tenant?.id || !entity_id) return;

        // Prevent double-tracking same entity view in same session/page load
        const cacheKey = `page:${entity_type}:${entity_id}`;
        if (pageViewCache.current.has(cacheKey)) return;
        pageViewCache.current.add(cacheKey);

        // Page views are critical, we keep them synchronous or push them to start of next batch
        try {
            await api.post('/analytics/collect', {
                event_type: 'page_view',
                entity_type,
                entity_id: String(entity_id),
                placement_id: 'page_view',
                placement_type: 'general',
                referrer_entity_type,
                referrer_entity_id,
                referrer_url: typeof window !== 'undefined' ? document.referrer : '',
                session_id: sessionId.current,
                metadata
            }, {
                headers: { 'X-Tenant-ID': tenant.id }
            });
        } catch (error) {
            console.error('[Analytics] Failed to track page view:', error);
            pageViewCache.current.delete(cacheKey); // Allow retry on failure
        }
    }, [tenant]);

    return {
        trackImpression,
        trackClick,
        trackPageView,
        sessionId: sessionId.current,
        flushEvents // Expose for manual flushes on critical actions
    };
}
