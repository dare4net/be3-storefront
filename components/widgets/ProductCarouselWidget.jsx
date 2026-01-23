// Product Carousel Widget - Scrollable product showcase
'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { proxyApi as api } from '@/lib/axios';
import { useRandomizationData } from '@/lib/hooks/useRandomizationData';
import { applyProductRandomization } from '@/lib/utils/widgetRandomizer';
import { useRandomizationContext } from '@/lib/contexts/RandomizationContext';

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

    // Fetch randomization data if randomization is enabled
    const { data: randomizationData, loading: randomizationLoading } = useRandomizationData();

    // Get randomization context for collision prevention
    const { getNextRandom } = useRandomizationContext();

    // Store randomized config in state to avoid calling setState during render
    const [randomizedConfig, setRandomizedConfig] = useState(config);
    const [randomizationReady, setRandomizationReady] = useState(!config.randomize?.enabled);

    // Apply randomization in useEffect (after render) to avoid setState during render
    useEffect(() => {
        if (!config.randomize?.enabled) {
            setRandomizedConfig(config);
            setRandomizationReady(true);
            return;
        }

        if (randomizationLoading || !randomizationData) {
            return;
        }

        // We reconstruct the context object here to satisfy the helper signature, 
        // but we rely on getNextRandom being stable to prevent effects from re-firing matches
        const contextWrapper = { getNextRandom };

        const newConfig = applyProductRandomization(config, randomizationData, contextWrapper);

        // Debug: Log if we fall back to "all" (which means no dynamic title) despite having randomization data
        if (newConfig.sourceType === 'all' && config.sourceType !== 'all' && config.randomize?.randomizeSource) {
            console.warn('[ProductCarouselWidget] Randomization fell back to "all". Data stats:', {
                categories: randomizationData?.categories?.length,
                collections: randomizationData?.collections?.length,
                attributes: randomizationData?.attributes?.length
            });
        }

        setRandomizedConfig(newConfig);
        setRandomizationReady(true);
    }, [config, randomizationData, randomizationLoading, getNextRandom]);

    // Use randomized config values
    const effectiveSourceType = randomizedConfig.sourceType || sourceType;
    const effectiveCategoryId = randomizedConfig.categoryId || categoryId;
    const effectiveCollectionId = randomizedConfig.collectionId || collectionId;
    const effectiveCollectionSlug = randomizedConfig.collectionSlug || collectionSlug;
    const effectiveAttributeClause = randomizedConfig.attributeClause || attributeClause;
    const effectiveLimit = randomizedConfig.limit || limit;
    const effectiveShowFeaturedOnly = randomizedConfig.showFeaturedOnly !== undefined ? randomizedConfig.showFeaturedOnly : showFeaturedOnly;
    const effectiveSort = randomizedConfig.sort || config.sort;
    // IMPORTANT: Check randomized config for autogenerateTitle as it might be enabled by the randomizer
    const effectiveAutogenerateTitle = randomizedConfig.autogenerateTitle !== undefined ? randomizedConfig.autogenerateTitle : autogenerateTitle;

    // Only fetch products when randomization data is ready (if randomization is enabled)
    useEffect(() => {
        // If randomization is enabled, wait for it to be ready
        if (!randomizationReady) {
            return;
        }


        // Clear metadata when source type changes to avoid stale data
        if (effectiveSourceType !== sourceType) {
            setMetadata({});
        }
        fetchProducts(null);
    }, [effectiveCategoryId, effectiveLimit, effectiveSourceType, effectiveAttributeClause, effectiveShowFeaturedOnly, effectiveSort, randomizationReady]);

    const fetchProducts = async (overrideCatId = null) => {
        try {
            setLoading(true);
            const catId = overrideCatId || effectiveCategoryId;

            // Attribute clause source: resolve random eligible category + products + pretty URL/title
            if (effectiveSourceType === 'clause' && effectiveAttributeClause) {
                const [attribute_code, clause] = String(effectiveAttributeClause).split(':');

                const res = await api.get('/api/search/attribute-clause/random-category', {
                    params: {
                        attribute_code,
                        clause,
                        per_page: effectiveLimit,
                        sort: effectiveSort || 'relevance'
                    }
                });

                setProducts(res.data.results || []);
                setMetadata({
                    category: res.data.category,
                    collection: null,
                    attribute: res.data.attribute,
                    clause: res.data.clause,
                    title: res.data.title,
                    pretty_url: res.data.pretty_url
                });
                return;
            }

            const params = {
                limit: effectiveLimit
            };

            // Handle Source Type
            if (effectiveSourceType === 'category' && catId) {
                params.category_id = catId;
            } else if (effectiveSourceType === 'collection') {
                if (effectiveCollectionId) params.collection_id = effectiveCollectionId;
                if (effectiveCollectionSlug) params.collection_slug = effectiveCollectionSlug;
            }

            // Handle Featured Filter
            if (effectiveShowFeaturedOnly) {
                params.featured = 'true';
            }

            // Handle Sorting
            if (effectiveSort) {
                params.sort = effectiveSort;
            }

            // Standardized API call
            const res = await api.get('/api/products', { params });

            setProducts(res.data.data || []);

            // Ensure metadata is properly set for dynamic title and "See All" link
            // This matches the original implementation - metadata comes from the API response
            const metadataToSet = {
                category: res.data.category || null,
                collection: res.data.collection || null,
                attribute: res.data.attribute || null,
                clause: res.data.clause || null,
                // Preserve title and pretty_url if they exist (for clause sources)
                title: res.data.title || null,
                pretty_url: res.data.pretty_url || null
            };

            setMetadata(metadataToSet);
        } catch (error) {
            console.error('Failed to fetch products', error);
        } finally {
            setLoading(false);
        }
    };

    // Calculate visible items based on screen size and config
    useEffect(() => {
        const handleResize = () => {
            const width = window.innerWidth;
            let cols = config.columns?.desktop || 4;
            if (width < 640) cols = config.columns?.mobile || 1;
            else if (width < 1024) cols = config.columns?.tablet || 2;

            // Apply peak effect
            if (config.peekEffect) {
                cols += 0.25;
            }

            setItemsToShow(cols);
        };

        handleResize(); // Initial calc
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [config.columns, config.peekEffect]);

    const scroll = (direction) => {
        const maxIndex = Math.max(0, products.length - Math.floor(itemsToShow));
        if (direction === 'left') {
            setCurrentIndex(Math.max(0, currentIndex - 1));
        } else {
            setCurrentIndex(Math.min(maxIndex, currentIndex + 1));
        }
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

        let base = '';
        if (effectiveSourceType === 'category' && metadata.category) {
            base = metadata.category.name;
        } else if (effectiveSourceType === 'collection' && metadata.collection) {
            base = metadata.collection.name;
        } else if (effectiveSourceType === 'clause' && metadata.title) {
            base = metadata.title;
        } else if (effectiveSourceType === 'clause' && metadata.category && metadata.clause) {
            const prefix = metadata.clause.prefix ? `${metadata.clause.prefix} ` : '';
            const suffix = metadata.clause.suffix ? ` ${metadata.clause.suffix}` : '';
            base = `${prefix}${metadata.category.name}${suffix}`.trim();

            // Fallback if no prefix/suffix but we have a clause label
            if (base === metadata.category.name && (metadata.clause.label || metadata.clause.name)) {
                base = metadata.clause.label || metadata.clause.name;
            }
        } else if (effectiveSourceType === 'clause' && metadata.clause) {
            base = metadata.clause.label || metadata.clause.name;
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
    if (loading || (config.randomize?.enabled && randomizationLoading)) {
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
                <div className="container mx-auto px-4">
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
                                    width: `calc(${100 / itemsToShow}% - ${(16 * (itemsToShow - 1)) / itemsToShow}px)`,
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

            <div className="container mx-auto px-4">
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
                                gap: '16px' // Explicit gap
                            }}
                        >
                            {products.map((product) => (
                                <Link
                                    key={product.id}
                                    href={`/products/${product.slug || product.id}`}
                                    className="flex-shrink-0 group"
                                    style={{
                                        width: `calc(${100 / itemsToShow}% - ${(16 * (itemsToShow - 1)) / itemsToShow}px)`
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
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-gray-400">
                                                    No Image
                                                </div>
                                            )}
                                            {showFeaturedBadge !== false && product.is_featured && (
                                                <span className="absolute top-2 right-2 bg-yellow-400 text-xs font-bold px-2 py-1 rounded-full shadow-sm">
                                                    FEATURED
                                                </span>
                                            )}
                                        </div>
                                        <div className="p-4 flex-1 flex flex-col">
                                            <h3 className="font-semibold mb-2 line-clamp-1">{product.name}</h3>

                                            {/* Description */}
                                            {showDescription && product.description && (
                                                <p className="text-gray-500 text-sm line-clamp-2 mb-2">
                                                    {product.description}
                                                </p>
                                            )}

                                            {/* Attributes */}
                                            {showAttributes && product.attributes && Object.keys(product.attributes).length > 0 && (
                                                <div className="flex flex-wrap gap-1 mb-2">
                                                    {Object.entries(product.attributes).slice(0, 2).map(([key, value], i) => (
                                                        <span key={i} className="px-2 py-0.5 bg-gray-50 border border-gray-100 text-gray-600 rounded text-xs">
                                                            <span className="font-medium">{key}:</span> {value}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}

                                            {/* Tags */}
                                            {showTags && product.tags && Array.isArray(product.tags) && product.tags.length > 0 && (
                                                <div className="flex flex-wrap gap-1 mb-2">
                                                    {product.tags.slice(0, 2).map((tag, i) => (
                                                        <span key={i} className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full text-xs">
                                                            {tag}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}

                                            {/* Social Proof */}
                                            {showSocialProof && (
                                                <div className="flex items-center gap-3 text-gray-400 mb-2 text-xs">
                                                    <span className="flex items-center gap-1">
                                                        👁️ {Math.floor(Math.random() * 500) + 50}
                                                    </span>
                                                    <span className="flex items-center gap-1">
                                                        ❤️ {Math.floor(Math.random() * 50) + 5}
                                                    </span>
                                                </div>
                                            )}

                                            <div className="mt-auto flex items-center justify-between gap-2">
                                                {showPrice !== false && (
                                                    <p className="text-xl font-bold text-blue-600">${product.price}</p>
                                                )}

                                                <div className="flex items-center gap-2">
                                                    {showViewDetails && (
                                                        <button
                                                            className="p-2 bg-gray-100 text-gray-600 rounded-full hover:bg-gray-200 transition"
                                                            title="View Details"
                                                            onClick={(e) => {
                                                                e.preventDefault();
                                                                window.location.href = `/products/${product.slug || product.id}`;
                                                            }}
                                                        >
                                                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" /><circle cx="12" cy="12" r="3" /></svg>
                                                        </button>
                                                    )}
                                                    {showAddToCart !== false && (
                                                        <button
                                                            className="p-2 bg-blue-50 text-blue-600 rounded-full hover:bg-blue-100 transition"
                                                            title="Add to Cart"
                                                        >
                                                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" /><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" /></svg>
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
