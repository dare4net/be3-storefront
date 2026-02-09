// Product Carousel Widget - Scrollable product showcase
'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, Heart, Check, ShoppingCart, Eye, MessageCircle } from 'lucide-react';
import { useChatContext } from '@/components/providers/ChatContext';
import { proxyApi as api } from '@/lib/axios';
import { useRandomizationContext } from '@/lib/contexts/RandomizationContext';
import { useWishlist } from '../providers/WishlistContext';
import { useCart } from '../providers/CartContext';
import { useAnalytics } from '@/lib/hooks/useAnalytics';

export default function ProductCarouselWidget({ config }) {
    const {
        title = 'Featured Products',
        limit = 10,
        categoryId = null,
        collectionId = null,
        collectionSlug = null,
        attributeClause = null, // e.g. "processor:high_end" (attribute_code:clause_name)
        sourceType = 'all',
        showFeaturedOnly = false,
        // Default all display toggles to TRUE to match Admin UI "ON" state for undefined keys
        showPrice: _showPrice = true,
        showAddToCart: _showAddToCart = true,
        showFeaturedBadge: _showFeaturedBadge = true,
        showViewDetails: _showViewDetails = true,
        showChat: _showChat = true,
        showTags: _showTags = true,
        showDescription: _showDescription = true,
        showAttributes: _showAttributes = true,
        showSocialProof: _showSocialProof = true,
        // New Styling & Spacing
        showTitle = true,
        fullWidthTitle = true,
        titleFontSize = '1.2rem',
        titleFontWeight = '700',
        titleColor = '#111827',
        titleAlign = 'center',
        titleBackgroundColor = 'transparent',
        titlePadding = '10px',
        sectionPaddingTop = '5px',
        sectionPaddingBottom = '5px',
        titleBottomMargin = '15px',
        sectionBackground = 'transparent',
        columns = { desktop: 5, tablet: 3, mobile: 2 },
        cardStyle, // Keep existing cardStyle prop
        gridGap = '12px',

        // New Dynamic Features
        autogenerateTitle = false,
        showSeeAll = false,
        seeAllLabel = 'See All',
        subtitle = ''
    } = config;

    // Helper to robustly handle boolean/string/undefined inputs
    const isTrue = (val) => val === true || val === 'true' || val === undefined;

    const resolveBool = (val, defaultVal) => {
        if (val === 'false') return false;
        if (val === 'true') return true;
        if (val === undefined || val === null) return defaultVal;
        return !!val;
    };

    const showPrice = resolveBool(config.showPrice, true);
    const showAddToCart = resolveBool(config.showAddToCart, true);
    const showFeaturedBadge = resolveBool(config.showFeaturedBadge, true);
    const showViewDetails = resolveBool(config.showViewDetails, true);
    const showChat = resolveBool(config.showChat, true);
    const showTags = resolveBool(config.showTags, true);
    const showDescription = resolveBool(config.showDescription, true);
    const showAttributes = resolveBool(config.showAttributes, true);
    const showSocialProof = resolveBool(config.showSocialProof, true);

    const [products, setProducts] = useState([]);
    const [metadata, setMetadata] = useState({});
    const [loading, setLoading] = useState(true);
    const [itemsToShow, setItemsToShow] = useState(4);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [touchStart, setTouchStart] = useState(null);
    const [touchEnd, setTouchEnd] = useState(null);
    const minSwipeDistance = 50;

    const { toggleWishlist, isInWishlist } = useWishlist();
    const { openChat } = useChatContext();
    const [addingToCart, setAddingToCart] = useState(null);
    const { addToCart } = useCart();
    const { trackImpression, trackClick } = useAnalytics();

    // Generate a stable ID if config.id is missing
    const generatedId = useRef(`widget_${Math.random().toString(36).substr(2, 9)}`);
    // Old widgetId removed to prevent duplicate declaration

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
        return getStableWidgetId ? getStableWidgetId(config) : (config.id || `temp_${Math.random()}`);
    }, [config.id, getStableWidgetId, config]);

    useEffect(() => {
        if (config.randomize?.enabled) {
            console.log(`[ProductCarouselWidget] Registering widget ${widgetId} for randomization`);
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

    // Batch Product Consumption
    const batchData = batchProducts[widgetId];

    useEffect(() => {
        if (batchData && !batchData.loading) {
            if (batchData.results) {
                setProducts(batchData.results);
                setLoading(false);
            }
            if (batchData.pagination) {
                // Merge pagination into metadata if needed
                setMetadata(prev => ({ ...prev, pagination: batchData.pagination }));
            }
        }
    }, [batchData]);

    useEffect(() => {
        if (isReady) {
            fetchProducts();
        }
    }, [isReady, resolvedFromPlan, limit, config.sort, widgetId]);

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

                console.log(`[ProductCarouselWidget] Registering batch fetch for ${widgetId}`);
                registerProductFetch(widgetId, {
                    widgetId,
                    filters,
                    perPage: filters.limit
                });

                setMetadata(prev => ({ ...prev, ...(primary.meta || {}) }));
                return;
            }

            // Case B: Standard manual config
            const params = { limit, sort: config.sort || 'relevance' };
            if (sourceType === 'category' && categoryId) params.category_id = categoryId;
            else if (sourceType === 'collection') {
                if (collectionId) params.collection_id = collectionId;
                if (collectionSlug) params.collection_slug = collectionSlug;
            }

            const res = await api.get('/api/products', { params });
            setProducts(res.data.data || []);
            setMetadata(res.data);
        } catch (error) {
            console.error('[ProductCarouselWidget] Failed to fetch products', error);
        } finally {
            if (!resolvedFromPlan) setLoading(false);
        }
    };

    // Track impressions when products are loaded
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
                        widget_title: displayTitle || title,
                        source_type: effectiveSourceType,
                        category_id: categoryId,
                        collection_id: collectionId,
                        product_name: product.name
                    }
                });
            });
        }
    }, [loading, products, widgetId, trackImpression]);


    // Use randomized values from plan if available
    const effectiveShowFeaturedOnly = showFeaturedOnly;

    // Calculate visible items based on screen size and config
    // Support both 'sneakPeek' and 'peekEffect' keys for compatibility
    const sneakPeek = resolveBool(config.sneakPeek, false) || resolveBool(config.peekEffect, false);

    // Calculate visible items based on screen size and config
    useEffect(() => {
        const handleResize = () => {
            const width = window.innerWidth;
            let cols = 4; // fallback

            if (width < 640) cols = columns.mobile || 2;
            else if (width < 1024) cols = columns.tablet || 3;
            else cols = columns.desktop || 5;

            // If sneakPeek is enabled, show an extra partial slide (e.g. 0.5)
            // Only if we have more products than columns (flexible per breakpoint)
            if (sneakPeek && products.length > cols) {
                cols += 0.5;
            }

            setItemsToShow(cols);
        };
        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [columns, sneakPeek, products.length]);

    const prevSlide = () => {
        const newIndex = currentIndex - itemsToShow;
        setCurrentIndex(newIndex < 0 ? 0 : newIndex);
    };

    const nextSlide = () => {
        const newIndex = currentIndex + itemsToShow;
        if (newIndex < products.length) {
            setCurrentIndex(newIndex);
        }
    };

    const scroll = (direction) => {
        if (direction === 'left') prevSlide();
        else nextSlide();
    };

    // Calculate scale factor based on column count (EXACTLY like ProductGridWidget)
    const getScaleFactor = () => {
        // Use desktop columns as the reference for "design density" - same as ProductGrid
        const cols = columns.desktop || 4;

        if (cols >= 7) return 0.75; // Dense
        if (cols >= 5) return 0.85; // Compact
        return 1.0; // Standard
    };
    const scale = getScaleFactor();

    const handleAddToCart = async (e, product) => {
        e.preventDefault();
        e.stopPropagation();
        setAddingToCart(product.id);
        try {
            await addToCart({
                id: product.id,
                name: product.name,
                price: product.price,
                image: product.image_url,
                quantity: 1
            });
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

    // Touch Handlers
    const onTouchStart = (e) => {
        setTouchEnd(null);
        setTouchStart(e.targetTouches[0].clientX);
    };

    const onTouchMove = (e) => setTouchEnd(e.targetTouches[0].clientX);

    const onTouchEnd = () => {
        if (!touchStart || !touchEnd) return;
        const distance = touchStart - touchEnd;
        const isLeftSwipe = distance > minSwipeDistance;
        const isRightSwipe = distance < -minSwipeDistance;
        if (isLeftSwipe) scroll('right');
        if (isRightSwipe) scroll('left');
    };

    // Reset index if itemsToShow changes to prevent empty space
    useEffect(() => {
        const maxIndex = Math.max(0, products.length - Math.floor(itemsToShow));
        if (currentIndex > maxIndex) setCurrentIndex(maxIndex);
    }, [itemsToShow, products.length]);

    // Auto-generate title based on metadata
    const getDisplayTitle = () => {
        if (!effectiveAutogenerateTitle) {
            return title;
        }

        // Priority 1: Backend-provided title (from Master Plan meta)
        if (metadata.title) return metadata.title;

        // Priority 2: Construct from metadata
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
        // and it's still loading or metadata is empty, we return nothing
        // to avoid "flickering" to the manual title
        if (!base && (loading || Object.keys(metadata).length === 0)) {
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
            color: titleColor,
            fontSize: formatCSSValue(titleFontSize),
            fontWeight: titleFontWeight,
            textAlign: titleAlign
        }
    };

    // Show skeleton loader if fetching randomization data or products
    if (loading || (config.randomize?.enabled && isResolving)) {
        const skeletonCount = limit || 8;
        return (
            <section
                className="transition-colors duration-300"
                style={{
                    backgroundColor: sectionBackground?.color || '#f9fafb',
                    paddingTop: formatCSSValue(sectionPaddingTop),
                    paddingBottom: formatCSSValue(sectionPaddingBottom)
                }}
            >
                {showTitle && config.fullWidthTitle && (
                    <div className="container mx-auto px-4 flex items-center justify-between mb-4" style={styles.titleContainer}>
                        <div className="h-8 bg-gray-200 rounded w-48 animate-pulse"></div>
                        {showSeeAll && (
                            <div className="h-6 bg-gray-200 rounded w-20 animate-pulse"></div>
                        )}
                    </div>
                )}
                <div className="container mx-auto px-2 md:px-4">
                    {showTitle && !config.fullWidthTitle && (
                        <div className="flex items-center justify-between mb-4" style={styles.titleContainer}>
                            <div className="h-8 bg-gray-200 rounded w-48 animate-pulse"></div>
                            {showSeeAll && (
                                <div className="h-6 bg-gray-200 rounded w-20 animate-pulse"></div>
                            )}
                        </div>
                    )}
                    <div className="flex gap-4 overflow-hidden">
                        {Array.from({ length: skeletonCount }).map((_, idx) => (
                            <div
                                key={idx}
                                className="flex-shrink-0 bg-white rounded-lg overflow-hidden"
                                style={{
                                    width: `calc(${100 / itemsToShow}% - ${(parseFloat(gridGap) * (itemsToShow - 1)) / itemsToShow}px)`,
                                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                                }}
                            >
                                <div className="aspect-square bg-gray-200 animate-pulse"></div>
                                <div className="p-4 space-y-3">
                                    <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse"></div>
                                    {showDescription && (
                                        <div className="space-y-2">
                                            <div className="h-3 bg-gray-200 rounded w-full animate-pulse"></div>
                                            <div className="h-3 bg-gray-200 rounded w-5/6 animate-pulse"></div>
                                        </div>
                                    )}
                                    {showPrice && (
                                        <div className="h-5 bg-gray-200 rounded w-20 animate-pulse"></div>
                                    )}
                                    {showAddToCart && (
                                        <div className="h-10 bg-gray-200 rounded animate-pulse"></div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>
        );
    }

    // Don't render anything if no products found
    if (!products || products.length === 0) {
        return null;
    }

    return (
        <section
            className="transition-colors duration-300"
            style={{
                backgroundColor: sectionBackground?.color || '#f9fafb',
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
                                    fontSize: `calc(${styles.title.fontSize} * 0.75)`,
                                    fontWeight: styles.title.fontWeight
                                }}
                            >
                                {seeAllLabel} →
                            </Link>
                        )}
                    </div>
                )}

                <div className="relative">
                    {/* Navigation Buttons */}
                    {products.length > itemsToShow && (
                        <>
                            <button
                                onClick={() => scroll('left')}
                                className="absolute left-1 md:left-0 top-1/2 -translate-y-1/2 -translate-x-1 md:-translate-x-4 z-10 bg-white p-2 md:p-3 rounded-full shadow-lg hover:bg-gray-100 disabled:opacity-50 disabled:hidden block"
                                disabled={currentIndex === 0}
                            >
                                <ChevronLeft className="w-5 h-5 md:w-6 md:h-6" />
                            </button>

                            <button
                                onClick={() => scroll('right')}
                                className="absolute right-1 md:right-0 top-1/2 -translate-y-1/2 translate-x-1 md:translate-x-4 z-10 bg-white p-2 md:p-3 rounded-full shadow-lg hover:bg-gray-100 disabled:opacity-50 disabled:hidden block"
                                disabled={currentIndex >= products.length - itemsToShow}
                            >
                                <ChevronRight className="w-5 h-5 md:w-6 md:h-6" />
                            </button>
                        </>
                    )}

                    {/* Products - Add padding to container to prevent shadow clipping */}
                    <div
                        className="overflow-hidden p-1"
                        onTouchStart={onTouchStart}
                        onTouchMove={onTouchMove}
                        onTouchEnd={onTouchEnd}
                    >
                        <div
                            className="flex transition-transform duration-300 ease-out"
                            style={{
                                transform: `translateX(-${currentIndex * (100 / itemsToShow)}%)`,
                                gap: formatCSSValue(gridGap)
                            }}
                        >
                            {products.map((product, index) => (
                                <Link
                                    key={product.id}
                                    href={`/products/${product.slug || product.id}?ref_type=widget&ref_id=${widgetId}`}
                                    className="flex-shrink-0 group"
                                    style={{
                                        width: `calc(${100 / itemsToShow}% - ${(parseFloat(gridGap) * (itemsToShow - 1)) / itemsToShow}px)`
                                    }}
                                    onClick={() => {
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
                                        className="bg-white overflow-hidden transition h-full flex flex-col"
                                        style={{
                                            backgroundColor: cardStyle?.backgroundColor || '#ffffff',
                                            borderColor: cardStyle?.borderColor || 'transparent',
                                            borderWidth: cardStyle?.borderColor ? '1px' : '0',
                                            borderRadius: cardStyle?.borderRadius || '0.5rem',
                                            boxShadow: cardStyle?.shadow === 'none' ? 'none' :
                                                cardStyle?.shadow === 'sm' ? '0 1px 2px 0 rgb(0 0 0 / 0.05)' :
                                                    cardStyle?.shadow === 'md' ? '0 4px 6px -1px rgb(0 0 0 / 0.1)' :
                                                        cardStyle?.shadow === 'lg' ? '0 10px 15px -3px rgb(0 0 0 / 0.1)' :
                                                            cardStyle?.shadow === 'xl' ? '0 20px 25px -5px rgb(0 0 0 / 0.1)' : '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                                        }}
                                    >
                                        <div className="aspect-square bg-gray-100 relative overflow-hidden">
                                            {product.image_url ? (
                                                <img
                                                    src={product.image_url}
                                                    alt={product.name}
                                                    className="w-full h-full object-cover group-hover:scale-110 transition duration-500"
                                                    loading="lazy"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-gray-400">
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

                                            {showFeaturedBadge !== false && product.is_featured && (
                                                <div
                                                    className="absolute top-3 right-3 font-bold rounded-full shadow-sm z-10"
                                                    style={{
                                                        backgroundColor: '#fbbf24',
                                                        color: '#ffffff',
                                                        fontSize: `${0.75 * scale}rem`,
                                                        padding: `${0.25 * scale}rem ${0.75 * scale}rem`
                                                    }}
                                                >
                                                    Featured
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex-1 flex flex-col" style={{ padding: `${1.1 * scale}rem` }}>
                                            <h3
                                                className={`font-semibold mb-2 transition-colors group-hover:text-blue-600 ${scale < 0.8 ? 'line-clamp-1' : 'line-clamp-2'}`}
                                                style={{ fontSize: `${1.125 * scale}rem`, lineHeight: `${1.5 * scale}rem` }}
                                            >
                                                {product.name}
                                            </h3>

                                            {/* Description */}
                                            {showDescription && product.description && (
                                                <p className={`text-gray-500 ${scale < 0.8 ? 'line-clamp-1' : 'line-clamp-2'} mb-2`} style={{ fontSize: `${0.875 * scale}rem` }}>
                                                    {product.description}
                                                </p>
                                            )}

                                            {/* Attributes */}
                                            {showAttributes && product.attributes && Object.keys(product.attributes).length > 0 && (
                                                <div className="flex flex-wrap gap-1 mb-2">
                                                    {Object.entries(product.attributes).slice(0, 2).map(([key, value], i) => (
                                                        <span key={i} className="px-2 py-0.5 bg-gray-50 border border-gray-100 text-gray-600 rounded" style={{ fontSize: `${0.75 * scale}rem` }}>
                                                            <span className="font-medium">{key}:</span> {value}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}

                                            {/* Tags */}
                                            {showTags && product.tags && Array.isArray(product.tags) && product.tags.length > 0 && (
                                                <div className="flex flex-wrap gap-1 mb-2">
                                                    {product.tags.slice(0, 2).map((tag, i) => (
                                                        <span key={i} className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full" style={{ fontSize: `${0.75 * scale}rem` }}>
                                                            {tag}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}

                                            {/* Social Proof */}
                                            {showSocialProof && (
                                                <div className="flex items-center gap-3 text-gray-400 mb-2" style={{ fontSize: `${0.75 * scale}rem` }}>
                                                    <span className="flex items-center gap-1">
                                                        <Eye style={{ width: `${0.8 * scale}rem`, height: `${0.8 * scale}rem` }} />
                                                        {Math.floor(Math.random() * 500) + 50}
                                                    </span>
                                                    <span className="flex items-center gap-1">
                                                        ❤️ {Math.floor(Math.random() * 50) + 5}
                                                    </span>
                                                </div>
                                            )}

                                            <div className="mt-auto flex items-center justify-between gap-2" style={{ paddingTop: `${1 * scale}rem` }}>
                                                {showPrice !== false && (
                                                    <p className="font-bold text-blue-600" style={{ fontSize: `${1.25 * scale}rem` }}>
                                                        ${product.price}
                                                    </p>
                                                )}

                                                <div className="flex items-center gap-2">
                                                    {showChat && (
                                                        <button
                                                            className="bg-gray-100 text-gray-600 rounded-full hover:bg-gray-200 transition"
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
                                                    {showViewDetails && (
                                                        <button
                                                            className="bg-gray-100 text-gray-600 rounded-full hover:bg-gray-200 transition"
                                                            title="View Details"
                                                            onClick={(e) => {
                                                                e.preventDefault();
                                                                window.location.href = `/products/${product.slug || product.id}`;
                                                            }}
                                                            style={{ padding: `${0.625 * scale}rem` }}
                                                        >
                                                            <Eye style={{ width: `${1.25 * scale}rem`, height: `${1.25 * scale}rem` }} />
                                                        </button>
                                                    )}
                                                    {showAddToCart !== false && (
                                                        <button
                                                            className="bg-blue-50 text-blue-600 rounded-full hover:bg-blue-100 transition flex items-center gap-2"
                                                            title="Add to Cart"
                                                            onClick={(e) => handleAddToCart(e, product)}
                                                            disabled={addingToCart === product.id}
                                                            style={{ padding: `${0.625 * scale}rem` }}
                                                        >
                                                            {addingToCart === product.id ? (
                                                                <Check className="animate-pulse" style={{ width: `${1.25 * scale}rem`, height: `${1.25 * scale}rem` }} />
                                                            ) : (
                                                                <ShoppingCart style={{ width: `${1.25 * scale}rem`, height: `${1.25 * scale}rem` }} />
                                                            )}
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
