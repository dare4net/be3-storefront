// Product Grid Widget - Display products in a grid
'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import Link from 'next/link';
import { ShoppingCart, Check, Eye, Heart, MessageCircle, X } from 'lucide-react';
import { useChatContext } from '@/components/providers/ChatContext';
import { useCart } from '../providers/CartContext';
import { useWishlist } from '../providers/WishlistContext';
import { proxyApi as api } from '@/lib/axios';

import { useRandomizationContext } from '@/lib/contexts/RandomizationContext';
import { useAnalytics } from '@/lib/hooks/useAnalytics';

export default function ProductGridWidget({ config }) {
    const {
        title = 'Products',
        sourceType = 'all', // 'all' | 'category' | 'collection'
        categoryId = null,
        collectionId = null,
        collectionSlug = null,
        attributeClause = null, // e.g. "processor:high_end" (attribute_code:clause_name)
        limit = 8,
        showFeaturedOnly = false,
        columns = { desktop: 4, tablet: 2, mobile: 1 },
        sectionBackground = { type: 'solid', color: '#ffffff' },
        cardStyle = {
            backgroundColor: '#ffffff',
            borderColor: '#e5e7eb',
            borderRadius: '12px',
            shadow: 'md',
            hoverLift: true
        },
        colors = {
            text: '#111827',
            price: '#111827',
            accent: '#3b82f6',
            badgeBackground: '#fbbf24',
            badgeText: '#ffffff'
        },

        // New Styling & Spacing
        showTitle = true,
        fullWidthTitle = true,
        gridGap = '12px',
        titleFontSize = '1.2rem',
        titleFontWeight = '700',
        titleColor = '#111827',
        titleAlign = 'center',
        titleBackgroundColor = 'transparent',
        titlePadding = '10px',
        sectionPaddingTop = '5px',
        sectionPaddingBottom = '5px',
        titleBottomMargin = '15px',

        // New Dynamic Features
        autogenerateTitle = false,
        showSeeAll = false,
        seeAllLabel = 'See All',
        subtitle = '',
        enableEntryAnimation = false
    } = config;

    const { addToCart } = useCart();
    const [addingToCart, setAddingToCart] = useState(null);
    const { toggleWishlist, isInWishlist } = useWishlist();
    const { trackImpression, trackClick } = useAnalytics();
    const { openChat } = useChatContext();
    const [activeAddToCart, setActiveAddToCart] = useState(null);
    const [deviceType, setDeviceType] = useState('desktop');

    // Viewport Detection for Responsive Display
    useEffect(() => {
        const handleResize = () => {
            const width = window.innerWidth;
            if (width < 768) setDeviceType('mobile');
            else if (width < 1024) setDeviceType('tablet');
            else setDeviceType('desktop');
        };

        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Resolve responsive display elements
    const getDisplaySetting = (key, defaultValue = true) => {
        const override = config.responsiveDisplay?.[deviceType]?.[key];
        if (override !== undefined) return override;
        
        const baseVal = config[key];
        if (baseVal === 'false') return false;
        if (baseVal === 'true') return true;
        if (baseVal === undefined || baseVal === null) return defaultValue;
        
        // If it's a number (or string that looks like one), return it as a number
        if (typeof baseVal === 'number' || (typeof baseVal === 'string' && /^\d+$/.test(baseVal))) {
            return parseInt(baseVal);
        }
        
        return !!baseVal;
    };

    const effectiveShowPrice = getDisplaySetting('showPrice', true);
    const effectiveShowAddToCart = getDisplaySetting('showAddToCart', true);
    const effectiveShowViewDetails = getDisplaySetting('showViewDetails', true);
    const effectiveShowFeaturedBadge = getDisplaySetting('showFeaturedBadge', true);
    const effectiveShowVendor = getDisplaySetting('showVendor', false);
    const effectiveShowTags = getDisplaySetting('showTags', true);
    const effectiveShowDescription = getDisplaySetting('showDescription', true);
    const effectiveShowAttributes = getDisplaySetting('showAttributes', true);
    const effectiveShowSocialProof = getDisplaySetting('showSocialProof', true);
    const effectiveShowRating = getDisplaySetting('showRating', true);
    const effectiveShowChat = getDisplaySetting('showChat', true);
    const attributesCount = getDisplaySetting('attributesCount', 2);
    const tagsCount = getDisplaySetting('tagsCount', 3);

    // Use Randomization Context
    const {
        masterPlan,
        registerWidget,
        isResolving,
        getStableWidgetId,
        registerProductFetch,
        batchProducts
    } = useRandomizationContext();

    // Generate stable ID for caching synchronization if not explicitly provided
    // We use the context helper to ensure frontend/backend ID alignment
    const widgetId = useMemo(() => {
        if (config.id) return config.id;
        // Fallback: Use context helper if available, or temporary local relabel
        return getStableWidgetId ? getStableWidgetId(config, 'prod_grid') : (config.id || `temp_${Math.random()}`);
    }, [config.id, getStableWidgetId, config]);

    // Check cache synchronously to avoid skeleton blink on navigation
    const cachedBatch = batchProducts?.[widgetId];
    const hasCache = cachedBatch && !cachedBatch.loading && cachedBatch.results;

    // 1. Synchronous Hydration from LocalStorage (Instant Text)
    const sanitizeProducts = (list) => {
        if (!Array.isArray(list)) return [];
        const seen = new Set();
        return list.filter(p => {
            if (!p || (!p.id && !p.slug)) return false;
            const key = p.id || p.slug;
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
        });
    };

    const getInitialData = () => {
        if (typeof window === 'undefined') return { products: [], metadata: {}, loading: true };
        
        try {
            const pageHandle = window.location.pathname.split('/').pop() || 'home';
            const key = `widget_random_plan_${pageHandle}`;
            const stored = localStorage.getItem(key);
            
            if (stored) {
                const { products: cachedBatches } = JSON.parse(stored);
                const cached = cachedBatches?.[widgetId];
                if (cached?.results) {
                    return {
                        products: sanitizeProducts(cached.results),
                        metadata: cached.pagination ? { pagination: cached.pagination } : {},
                        loading: false
                    };
                }
            }
        } catch (e) {
            console.warn("[ProductGridWidget] Sync hydration failed", e);
        }
        return { products: [], metadata: {}, loading: true };
    };

    const initialData = getInitialData();

    const [products, setProducts] = useState(initialData.products);
    const [metadata, setMetadata] = useState(initialData.metadata);
    const [loading, setLoading] = useState(initialData.loading);

    // Register with Master Plan on mount if randomization is enabled
    useEffect(() => {
        if (config.randomize?.enabled) {
            console.log(`[ProductGridWidget] Registering widget ${widgetId} for randomization`);
            const intent = {
                allowedTypes: config.randomize.allowedTypes || ['category', 'clause', 'collection'],
                sourceType: sourceType === 'category' ? 'subcategories' : sourceType,
                parentCategoryId: categoryId,
                collectionId: collectionId,
                manualCategoryIds: config.manualCategoryIds || []
            };
            registerWidget(widgetId, intent, config);
        }
    }, [widgetId, config.randomize?.enabled, registerWidget]);

    const resolvedFromPlan = masterPlan[widgetId];
    const isReady = !config.randomize?.enabled || resolvedFromPlan;

    // Use randomized values from plan if available
    const effectiveSourceType = resolvedFromPlan?.resolvedType || sourceType;
    const effectiveAutogenerateTitle = resolvedFromPlan ? true : autogenerateTitle;
    const effectiveShowFeaturedOnly = showFeaturedOnly;

    // Trigger fetch when ready
    useEffect(() => {
        if (isReady) {
            fetchProducts();
        }
    }, [isReady, resolvedFromPlan, limit, config.sort]);

    // Batch Product Consumption
    const batchData = batchProducts[widgetId];

    useEffect(() => {
        if (batchData && !batchData.loading) {
            if (batchData.results) {
                setProducts(sanitizeProducts(batchData.results));
                setLoading(false);
            }
            if (batchData.pagination) {
                // Merge pagination into metadata if needed
                setMetadata(prev => ({ ...prev, pagination: batchData.pagination }));
            }
        }
    }, [batchData]);

    const fetchProducts = async () => {
        try {
            setLoading(true);

            // If randomized but no plan yet, wait (prevents flicker)
            if (config.randomize?.enabled && !resolvedFromPlan) {
                return;
            }

            // Case A: Randomized according to Master Plan
            if (resolvedFromPlan) {
                const selections = resolvedFromPlan.multiple ? resolvedFromPlan.selections : [resolvedFromPlan];

                // For a grid, we typically only show the first selection's products if multiple were returned but grid expects one
                // OR we could merge them. But usually ProductGrid is 1:1. 
                // Let's assume we want the first one's criteria for the batch fetch.
                const primary = selections[0];
                const filters = {};

                if (primary.meta?.filter) {
                    const params = new URLSearchParams(primary.meta.filter);
                    for (const [key, val] of params.entries()) {
                        filters[key] = val;
                    }
                } else if (primary.selection) {
                    const { resolvedType, selection } = primary;
                    if (resolvedType === 'category') filters.category_id = selection.id;
                    else if (resolvedType === 'collection') filters.collection_id = selection.id;
                    else if (resolvedType === 'clause') {
                        const attrCode = selection.attribute?.code;
                        const clauseValue = selection.clause?.value;
                        if (attrCode && clauseValue) {
                            filters[`attribute.${attrCode}`] = Array.isArray(clauseValue) ? clauseValue.join(',') : clauseValue;
                            if (primary.meta?.pickedCategory) {
                                filters.category_id = primary.meta.pickedCategory.id;
                            }
                        }
                    }
                }

                // Add resolved overrides
                filters.sort = primary.resolvedSort || config.sort || 'relevance';
                filters.limit = primary.resolvedLimit || config.limit || 8;
                filters.showFeaturedOnly = primary.resolvedFeatured ?? config.showFeaturedOnly ?? false;

                console.log(`[ProductGridWidget] Registering batch fetch for ${widgetId}`);
                registerProductFetch(widgetId, {
                    widgetId,
                    filters,
                    perPage: filters.limit
                });

                setMetadata(prev => ({ ...prev, ...(primary.meta || {}) }));
                return;
            }

            // Case B: Standard manual config (Static widget)
            const params = { limit, sort: config.sort || 'relevance' };
            if (sourceType === 'category' && categoryId) params.category_id = categoryId;
            else if (sourceType === 'collection') {
                if (collectionId) params.collection_id = collectionId;
                if (collectionSlug) params.collection_slug = collectionSlug;
            }

            const res = await api.get('/products', { params });
            const fetchedProducts = res.data.data || [];
            const sanitized = sanitizeProducts(fetchedProducts);
            setProducts(sanitized);
            setMetadata(res.data.metadata || {});
        } catch (error) {
            console.error('[ProductGridWidget] Failed to fetch products', error);
        } finally {
            if (!resolvedFromPlan) setLoading(false);
        }
    };

    // Track impressions when products load
    useEffect(() => {
        if (!loading && products.length > 0) {
            products.forEach((product, index) => {
                trackImpression({
                    entity_type: 'product',
                    entity_id: product.id,
                    placement_id: widgetId,
                    placement_type: config.placement_type || 'widget',
                    position: index + 1,
                    metadata: {
                        widget_title: title,
                        product_name: product.name,
                        product_slug: product.slug,
                        source_type: effectiveSourceType
                    }
                });
            });
        }
    }, [products, loading, widgetId, title, trackImpression, effectiveSourceType]);


    // Auto-generate title based on metadata
    const getDisplayTitle = () => {
        if (!effectiveAutogenerateTitle) {
            return title;
        }

        if (metadata.title) return metadata.title; // Server-provided title

        let base = '';
        if (effectiveSourceType === 'category' && metadata.category) {
            base = metadata.category.name;
        } else if (effectiveSourceType === 'collection' && metadata.collection) {
            base = metadata.collection.name;
        } else if (effectiveSourceType === 'clause' && metadata.clause) {
            // Try prefix/suffix pattern first
            const prefix = metadata.clause.prefix ? `${metadata.clause.prefix} ` : '';
            const suffix = metadata.clause.suffix ? ` ${metadata.clause.suffix}` : '';

            // If we have a category, use it with prefix/suffix
            if (metadata.category) {
                base = `${prefix}${metadata.category.name}${suffix}`.trim();
            }
            // Otherwise, use just prefix + suffix (if both exist)
            else if (prefix && suffix) {
                base = `${prefix}${suffix}`.trim();
            }
            // Fallback to clause label
            else {
                base = metadata.clause.label || metadata.clause.name;
            }
        }

        // If autogenerate is on but we couldn't resolve a base yet,
        if (!base && loading) {
            return '';
        }

        // Final fallback if we really can't get a dynamic title
        if (!base) base = title;

        return subtitle ? `${base} | ${subtitle}` : base;
    };

    // Resolve "See All" link
    const getSeeAllLink = () => {
        if (metadata.pretty_url) {
            return metadata.pretty_url; // Backend-provided URL for clauses
        }
        if (effectiveSourceType === 'category' && metadata.category?.slug) {
            return `/categories/${metadata.category.slug}`;
        }
        if (effectiveSourceType === 'collection' && metadata.collection?.slug) {
            return `/collections/${metadata.collection.slug}`;
        }
        return '/search';
    };

    const displayTitle = getDisplayTitle();
    const seeAllLink = getSeeAllLink();

    const handleAddToCart = async (e, product) => {
        e.preventDefault();
        e.stopPropagation();
        setAddingToCart(product.id);

        // Add to cart safely
        try {
            await addToCart({
                id: product.id,
                name: product.name,
                price: product.price,
                image: product.image_url,
                quantity: 1
            });

            // Show success state briefly
            // Show success state briefly
            setTimeout(() => setAddingToCart(null), 1500);
        } catch (err) {
            console.error("Add to cart failed", err);
            setAddingToCart(null);
        }
    };

    const handleWishlistToggle = (e, product) => {
        e.preventDefault();
        e.stopPropagation();
        toggleWishlist(product);
    };


    // Calculate scale factor based on column count (Density Scaling)
    const getScaleFactor = () => {
        const cols = columns.desktop || 4;
        if (cols >= 7) return 0.75;
        if (cols >= 5) return 0.85;
        return 1.0;
    };
    const scale = getScaleFactor();


    // Generate background style
    const getBackgroundStyle = () => {
        if (sectionBackground?.type === 'gradient' && sectionBackground.gradient) {
            const { type, angle, stops } = sectionBackground.gradient;
            if (stops && stops.length > 0) {
                const gradient = stops.map(s => `${s.color} ${s.position}%`).join(', ');
                return type === 'radial'
                    ? { background: `radial-gradient(circle, ${gradient})` }
                    : { background: `linear-gradient(${angle || 135}deg, ${gradient})` };
            }
        }
        return { backgroundColor: sectionBackground?.color || '#ffffff' };
    };

    // Helper to format CSS values (append px if numeric)
    const formatCSSValue = (val) => {
        if (!val || val === '0') return '0';
        if (/^\d+(\.\d+)?$/.test(val.toString())) return `${val}px`;
        return val;
    };

    const styles = {
        titleContainer: {
            backgroundColor: titleBackgroundColor,
            padding: formatCSSValue(titlePadding),
            marginBottom: formatCSSValue(titleBottomMargin)
        },
        title: {
            color: titleColor || colors.text,
            fontSize: `clamp(1rem, 0.75rem + 1vw, ${formatCSSValue(titleFontSize)})`,
            fontWeight: titleFontWeight,
            fontFamily: 'inherit',
            textAlign: titleAlign
        }
    };

    // Show per-card skeleton if loading and no products in cache
    const showSkeletons = products.length === 0 && (loading || (config.randomize?.enabled && isResolving));

    // Don't render anything if no products found and not loading
    if (!showSkeletons && products.length === 0) {
        return null;
    }

    return (
        <section
            className="transition-colors duration-300"
            style={{
                ...getBackgroundStyle(),
                paddingTop: formatCSSValue(sectionPaddingTop),
                paddingBottom: formatCSSValue(sectionPaddingBottom)
            }}
        >
            {showTitle && displayTitle && config.fullWidthTitle && (
                <div className="container mx-auto px-4 flex items-center justify-between" style={styles.titleContainer}>
                    <h2
                        className="font-bold flex-1"
                        style={styles.title}
                    >
                        {displayTitle}
                    </h2>
                    {showSeeAll && (
                        <Link
                            href={seeAllLink}
                            className="font-semibold transition-colors whitespace-nowrap ml-4 hover:opacity-70"
                            style={{
                                color: styles.title.color,
                                fontSize: `calc(${styles.title.fontSize} * 0.75)`,
                                fontWeight: styles.title.fontWeight
                            }}
                        >
                            {seeAllLabel} →
                        </Link>
                    )}
                </div>
            )}

            <div className="container mx-auto px-2 md:px-4">
                {showTitle && displayTitle && !config.fullWidthTitle && (
                    <div className="flex items-center justify-between mb-4" style={styles.titleContainer}>
                        <h2
                            className="font-bold flex-1"
                            style={styles.title}
                        >
                            {displayTitle}
                        </h2>
                        {showSeeAll && (
                            <Link
                                href={seeAllLink}
                                className="font-semibold transition-colors whitespace-nowrap ml-4 hover:opacity-70"
                                style={{
                                    color: styles.title.color,
                                    fontSize: `clamp(0.875rem, 0.75rem + 0.4vw, 1rem)`,
                                    fontWeight: styles.title.fontWeight
                                }}
                            >
                                {seeAllLabel} →
                            </Link>
                        )}
                    </div>
                )}

                <div
                    className={`grid ${columns?.mobile ? `grid-cols-${columns.mobile}` : 'grid-cols-1'} ${columns?.tablet ? `md:grid-cols-${columns.tablet}` : 'md:grid-cols-2'} ${columns?.desktop ? `lg:grid-cols-${columns.desktop}` : 'lg:grid-cols-4'}`}
                    style={{
                        gap: formatCSSValue(gridGap)
                    }}
                >
                    {showSkeletons ? (
                         Array.from({ length: limit || 8 }).map((_, idx) => (
                            <div
                                key={`skeleton-${idx}`}
                                className="bg-white rounded-lg overflow-hidden h-full flex flex-col"
                                style={{
                                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                                    borderRadius: cardStyle.borderRadius
                                }}
                            >
                                <div className="aspect-square bg-gray-200 animate-pulse"></div>
                                <div className="p-4 flex-1 flex flex-col space-y-3">
                                    <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse"></div>
                                    {effectiveShowDescription && (
                                        <div className="space-y-2">
                                            <div className="h-3 bg-gray-200 rounded w-full animate-pulse"></div>
                                            <div className="h-3 bg-gray-200 rounded w-5/6 animate-pulse"></div>
                                        </div>
                                    )}
                                    {effectiveShowPrice && <div className="h-5 bg-gray-200 rounded w-20 animate-pulse"></div>}
                                    {effectiveShowAddToCart && <div className="h-10 bg-gray-200 rounded animate-pulse mt-auto"></div>}
                                </div>
                            </div>
                        ))
                    ) : (
                        products.map((product, index) => (
                            <AnimatedItem
                                key={`${product.id || product.slug}-${index}`}
                                delayIndex={index % 4}
                                enabled={enableEntryAnimation}
                                className="group block h-full cursor-pointer"
                                onClick={() => {
                                    window.location.href = `/products/${product.slug || product.id}?ref_type=widget&ref_id=${widgetId}`;
                                    trackClick({
                                        entity_type: 'product',
                                        entity_id: product.id,
                                        placement_id: widgetId,
                                        placement_type: config.placement_type || 'widget',
                                        position: index + 1,
                                        metadata: {
                                            widget_title: displayTitle || title,
                                            product_name: product.name,
                                            product_slug: product.slug
                                        }
                                    });
                                }}
                            >
                                <div
                                    className={`h-full overflow-hidden transition-all duration-300 relative flex flex-col`}
                                    style={{
                                        backgroundColor: cardStyle.backgroundColor,
                                        borderWidth: '1px',
                                        borderStyle: 'solid',
                                        borderColor: cardStyle.borderColor,
                                        borderRadius: cardStyle.borderRadius,
                                        transform: cardStyle.hoverLift ? 'translateY(0)' : 'none',
                                        boxShadow: cardStyle.shadow === 'none' ? 'none' :
                                            cardStyle.shadow === 'sm' ? '0 1px 2px 0 rgb(0 0 0 / 0.05)' :
                                                cardStyle.shadow === 'md' ? '0 4px 6px -1px rgb(0 0 0 / 0.1)' :
                                                    cardStyle.shadow === 'lg' ? '0 10px 15px -3px rgb(0 0 0 / 0.1)' : '0 20px 25px -5px rgb(0 0 0 / 0.1)'
                                    }}
                                >
                                    {/* Product Image */}
                                    <div
                                        className={`relative bg-gray-100 overflow-hidden block aspect-square transition-transform duration-500`}
                                    >
                                        {(product.image_url || product.thumbnail_url || product.image) ? (
                                            <img
                                                src={product.image_url || product.thumbnail_url || product.image}
                                                alt={product.name}
                                                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                                loading="lazy"
                                            />
                                        ) : (
                                            <div className="absolute inset-0 w-full h-full flex items-center justify-center text-gray-400">
                                                No Image
                                            </div>
                                        )}

                                        {/* Wishlist Button */}
                                        <button
                                            onClick={(e) => handleWishlistToggle(e, product)}
                                            className="absolute top-2 left-2 p-1.5 rounded-full bg-white/80 hover:bg-white text-gray-600 hover:text-red-500 transition-all shadow-sm z-10"
                                            style={{ padding: `${0.35 * scale}rem` }}
                                        >
                                            <Heart
                                                className={`transition-colors ${isInWishlist(product.id) ? 'fill-red-500 text-red-500' : ''}`}
                                                style={{ width: `${1.2 * scale}rem`, height: `${1.2 * scale}rem` }}
                                            />
                                        </button>

                                        {effectiveShowFeaturedBadge && product.is_featured && (
                                            <div
                                                className="absolute top-3 right-3 font-bold rounded-full shadow-sm z-10"
                                                style={{
                                                    backgroundColor: colors.badgeBackground || '#fbbf24',
                                                    color: colors.badgeText || '#ffffff',
                                                    fontSize: `${0.75 * scale}rem`,
                                                    padding: `${0.25 * scale}rem ${0.75 * scale}rem`
                                                }}
                                            >
                                                Featured
                                            </div>
                                        )}

                                        {/* Overlay Actions (Desktop) */}
                                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />
                                    </div>

                                    {/* Product Info */}
                                    <div className="flex flex-col flex-grow" style={{ padding: `${1.1 * scale}rem` }}>
                                        <div>
                                            <h3
                                                className={`font-semibold mb-2 transition-colors hover:text-blue-600 ${scale < 0.8 ? 'line-clamp-1' : 'line-clamp-2'}`}
                                                style={{
                                                    color: colors.text,
                                                    fontSize: `clamp(${0.875 * scale}rem, ${0.75 * scale}rem + ${0.5 * scale}vw, ${1.125 * scale}rem)`,
                                                    lineHeight: `clamp(${1.1 * scale}rem, ${1 * scale}rem + ${0.5 * scale}vw, ${1.5 * scale}rem)`
                                                }}
                                            >
                                                {product.name}
                                            </h3>
                                        </div>
                                        <div className="space-y-2" style={{ marginTop: `${0.4 * scale}rem` }}>
                                            {effectiveShowDescription && product.description && (
                                                <p className={`text-gray-500 ${scale < 0.8 ? 'line-clamp-1' : 'line-clamp-2'}`} style={{ fontSize: `clamp(${0.75 * scale}rem, ${0.7 * scale}rem + ${0.2 * scale}vw, ${0.875 * scale}rem)` }}>
                                                    {product.description}
                                                </p>
                                            )}

                                            {(effectiveShowVendor || effectiveShowAttributes) && product.attributes && (
                                                <div className="flex flex-wrap gap-1 mt-1">
                                                    {/* Dedicated Vendor Badge */}
                                                    {effectiveShowVendor && product.attributes.vendor && (
                                                        <span className="px-2 py-0.5 bg-blue-50 border border-blue-100 text-blue-700 rounded font-medium flex items-center gap-1" style={{ fontSize: `clamp(${0.65 * scale}rem, ${0.6 * scale}rem + ${0.1 * scale}vw, ${0.75 * scale}rem)` }}>
                                                            {product.attributes.vendor}
                                                        </span>
                                                    )}

                                                    {/* Remaining Attributes (Excluding Vendor) */}
                                                    {effectiveShowAttributes && Object.entries(product.attributes)
                                                        .filter(([key]) => key !== 'vendor')
                                                        .slice(0, attributesCount)
                                                        .map(([key, value], i) => (
                                                            <span key={i} className="px-2 py-0.5 bg-gray-50 border border-gray-100 text-gray-600 rounded" style={{ fontSize: `clamp(${0.65 * scale}rem, ${0.6 * scale}rem + ${0.1 * scale}vw, ${0.75 * scale}rem)` }}>
                                                                {value}
                                                            </span>
                                                        ))
                                                    }
                                                </div>
                                            )}

                                            {effectiveShowTags && product.tags && Array.isArray(product.tags) && product.tags.length > 0 && (
                                                <div className="flex flex-wrap gap-1">
                                                    {product.tags
                                                        .filter(tag => !product.attributes?.vendor || tag.toLowerCase() !== product.attributes.vendor.toLowerCase())
                                                        .slice(0, tagsCount)
                                                        .map((tag, i) => (
                                                            <span key={i} className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full" style={{ fontSize: `clamp(${0.65 * scale}rem, ${0.6 * scale}rem + ${0.1 * scale}vw, ${0.75 * scale}rem)` }}>
                                                                {tag}
                                                            </span>
                                                        ))
                                                    }
                                                </div>
                                            )}
                                            {effectiveShowSocialProof && (
                                                <div className="flex items-center gap-3 text-gray-400 mt-2" style={{ fontSize: `${0.75 * scale}rem` }}>
                                                    <span className="flex items-center gap-1">
                                                        <Eye className="w-3 h-3" style={{ width: `${0.75 * scale}rem`, height: `${0.75 * scale}rem` }} />
                                                        {product.stats?.impressions || 0}
                                                    </span>
                                                    <span className="flex items-center gap-1">
                                                        <Heart className="w-3 h-3" style={{ width: `${0.75 * scale}rem`, height: `${0.75 * scale}rem` }} />
                                                        {product.stats?.wishlist_count || 0}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                        <div className="mt-auto flex items-center justify-between gap-2" style={{ paddingTop: `${1 * scale}rem` }}>
                                            <div className="flex flex-col">
                                                {effectiveShowPrice && (
                                                    <span className="font-bold" style={{
                                                        color: colors.price,
                                                        // Use scale for density, clamp for viewport (sync with name scaling)
                                                        fontSize: `clamp(${0.95 * scale}rem, ${0.85 * scale}rem + ${0.5 * scale}vw, ${1.25 * scale}rem)`
                                                    }}>
                                                        ${parseFloat(product.price).toFixed(2)}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {effectiveShowChat && (
                                                    <button
                                                        className="hidden md:block rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
                                                        title="Chat with Seller"
                                                        onClick={(e) => {
                                                            e.preventDefault();
                                                            openChat('product', product.id, product.name);
                                                        }}
                                                        style={{ padding: `${0.625 * scale}rem` }}
                                                    >
                                                        <MessageCircle style={{ width: `${1.25 * scale}rem`, height: `${1.25 * scale}rem` }} />
                                                    </button>
                                                )}
                                                {effectiveShowViewDetails && (
                                                    <Link
                                                        href={`/products/${product.slug || product.id}?ref_type=widget&ref_id=${widgetId}`}
                                                        className="hidden md:block rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
                                                        onClick={() => trackClick({
                                                            entity_type: 'product',
                                                            entity_id: product.id,
                                                            placement_id: widgetId,
                                                            placement_type: 'widget',
                                                            position: index + 1,
                                                            metadata: { type: 'quick_view' }
                                                        })}
                                                        style={{ padding: `${0.625 * scale}rem` }}
                                                        aria-label="View Details"
                                                    >
                                                        <Eye style={{ width: `${1.25 * scale}rem`, height: `${1.25 * scale}rem` }} />
                                                    </Link>
                                                )}
                                                {effectiveShowAddToCart && (
                                                    <button
                                                        onClick={(e) => handleAddToCart(e, product)}
                                                        disabled={addingToCart === product.id}
                                                        className="rounded-full transition-all duration-200 transform hover:scale-105 active:scale-95 shadow-md flex items-center gap-2"
                                                        style={{
                                                            backgroundColor: addingToCart === product.id ? '#10b981' : (colors.accent || '#3b82f6'),
                                                            color: '#ffffff',
                                                            padding: deviceType === 'mobile' 
                                                                ? `${0.5 * scale}rem ${0.8 * scale}rem` 
                                                                : `${0.625 * scale}rem ${1 * scale}rem`
                                                        }}
                                                        aria-label="Add to Cart"
                                                    >
                                                        {addingToCart === product.id ? (
                                                            <Check className="animate-in zoom-in spin-in-50 duration-300" style={{ width: `${1.25 * scale}rem`, height: `${1.25 * scale}rem` }} />
                                                        ) : (
                                                            <>
                                                                <ShoppingCart style={{ width: `${1.25 * scale}rem`, height: `${1.25 * scale}rem` }} />
                                                                <span className="font-medium hidden md:inline" style={{ fontSize: `${0.875 * scale}rem` }}>Add</span>
                                                            </>
                                                        )}
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                </div>
                            </AnimatedItem>
                        ))
                    )}
                </div>            </div>


            {enableEntryAnimation && <AnimationStyles />}

            <style jsx>{`
                .group:hover > div {
                    transform: ${cardStyle?.hoverLift ? 'translateY(-8px)' : 'none'} !important;
                }
            `}</style>
        </section >
    );
}

function AnimationStyles() {
    return (
        <style dangerouslySetInnerHTML={{
            __html: `
            @keyframes fadeInUp {
                from { opacity: 0; transform: translateY(30px); }
                to { opacity: 1; transform: translateY(0); }
            }
            .animate-entry {
                opacity: 0;
                animation: fadeInUp 0.8s cubic-bezier(0.2, 0.8, 0.2, 1) forwards;
            }
            .delay-0 { animation-delay: 0ms; }
            .delay-1 { animation-delay: 100ms; }
            .delay-2 { animation-delay: 200ms; }
            .delay-3 { animation-delay: 300ms; }
            .delay-4 { animation-delay: 400ms; }
            .delay-5 { animation-delay: 500ms; }
            .delay-6 { animation-delay: 600ms; }
            .delay-7 { animation-delay: 700ms; }
            .delay-8 { animation-delay: 800ms; }
            .delay-9 { animation-delay: 900ms; }
            .delay-10 { animation-delay: 1000ms; }
            .delay-11 { animation-delay: 1100ms; }
            `
        }} />
    );
}

function AnimatedItem({ children, delayIndex = 0, enabled = false, className = '', style = {}, onClick }) {
    const [inView, setInView] = useState(false);
    const ref = useRef(null);

    useEffect(() => {
        if (!enabled || inView) return;

        const observer = new IntersectionObserver(([entry]) => {
            if (entry.isIntersecting) {
                setInView(true);
                observer.disconnect();
            }
        }, { threshold: 0.1 });

        if (ref.current) {
            observer.observe(ref.current);
        }

        return () => observer.disconnect();
    }, [enabled, inView]);

    const shouldAnimate = enabled && inView;

    return (
        <div
            ref={ref}
            className={`${className} ${shouldAnimate ? `animate-entry delay-${delayIndex}` : (enabled ? 'opacity-0' : '')}`}
            style={style}
            onClick={onClick}
        >
            {children}
        </div>
    );
}
