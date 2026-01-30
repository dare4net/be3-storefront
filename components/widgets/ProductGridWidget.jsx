// Product Grid Widget - Display products in a grid
'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import Link from 'next/link';
import { ShoppingCart, Check, Eye, Heart } from 'lucide-react';
import { useCart } from '../providers/CartContext';
import { useWishlist } from '../providers/WishlistContext';
import { proxyApi as api } from '@/lib/axios';
import { useRandomizationData } from '@/lib/hooks/useRandomizationData';
import { applyProductRandomization } from '@/lib/utils/widgetRandomizer';
import { useRandomizationContext } from '@/lib/contexts/RandomizationContext';

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
        showAddToCart = true,
        showPrice = true,
        showFeaturedBadge = true,
        showViewDetails = true,
        showTags = false,
        showDescription = false,
        showAttributes = false,
        showSocialProof = false,
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

    const [products, setProducts] = useState([]);
    const [metadata, setMetadata] = useState({});
    const [loading, setLoading] = useState(true);
    const { addToCart } = useCart();
    const [addingToCart, setAddingToCart] = useState(null);
    const { toggleWishlist, isInWishlist } = useWishlist();

    // Generate a stable ID if config.id is missing
    const generatedId = useRef(`widget_${Math.random().toString(36).substr(2, 9)}`);
    // Old widgetId removed to prevent duplicate declaration

    // Use Randomization Context
    const { masterPlan, registerWidget, isResolving, getStableWidgetId } = useRandomizationContext();

    // Generate stable ID for caching synchronization if not explicitly provided
    // We use the context helper to ensure frontend/backend ID alignment
    const widgetId = useMemo(() => {
        if (config.id) return config.id;
        // Fallback: Use context helper if available, or temporary local relabel
        return getStableWidgetId ? getStableWidgetId(config) : (config.id || `temp_${Math.random()}`);
    }, [config.id, getStableWidgetId, config]);

    // Register with Master Plan on mount if randomization is enabled
    useEffect(() => {
        if (config.randomize?.enabled) {
            console.log(`[ProductGridWidget] Registering widget ${widgetId} for randomization`);
            const intent = {
                allowedTypes: config.randomize.allowedTypes || ['category', 'clause', 'collection'],
            };
            registerWidget(widgetId, intent, config);
        }
    }, [widgetId, config.randomize?.enabled, registerWidget, config]);

    const resolvedFromPlan = masterPlan[widgetId];
    const isReady = !config.randomize?.enabled || resolvedFromPlan;

    // Use randomized values from plan if available
    const effectiveSourceType = resolvedFromPlan?.resolvedType || sourceType;
    const planMeta = resolvedFromPlan?.meta || {};

    // Determine effective search parameters
    const effectiveLimit = limit;
    const effectiveSort = resolvedFromPlan?.resolvedSort || config.sort || 'relevance';

    useEffect(() => {
        if (isReady) {
            fetchProducts();
        }
    }, [isReady, resolvedFromPlan, effectiveLimit, effectiveSort]);

    const fetchProducts = async () => {
        try {
            setLoading(true);

            // 1. Master Plan Resolution
            if (resolvedFromPlan) {
                let params = { limit: effectiveLimit, sort: effectiveSort };
                let newMetadata = { ...resolvedFromPlan.meta };

                // Case A: Meta has pre-calculated filter
                if (resolvedFromPlan.meta?.filter) {
                    const filterParams = new URLSearchParams(resolvedFromPlan.meta.filter);
                    filterParams.forEach((value, key) => params[key] = value);

                    // Use backend-provided metadata directly
                    newMetadata = { ...resolvedFromPlan.meta };
                }
                // Case B: Manual construction from Selection (Backend returned meta: null)
                else if (resolvedFromPlan.selection) {
                    const { resolvedType, selection } = resolvedFromPlan;

                    if (resolvedType === 'category') {
                        params.category_id = selection.id;
                        newMetadata.category = selection;
                    }
                    else if (resolvedType === 'collection') {
                        params.collection_id = selection.id;
                        newMetadata.collection = selection;
                    }
                    else if (resolvedType === 'clause') {
                        const attrCode = selection.attribute?.code;
                        const clauseValue = selection.clause?.value;
                        const clauseName = selection.clause?.name;

                        if (attrCode && clauseValue) {
                            params[`filter[${attrCode}]`] = Array.isArray(clauseValue) ? clauseValue.join(',') : clauseValue;
                            newMetadata.attribute = selection.attribute;
                            newMetadata.clause = selection.clause;

                            // If backend provided a picked category in meta, use it
                            if (resolvedFromPlan.meta?.pickedCategory) {
                                newMetadata.category = resolvedFromPlan.meta.pickedCategory;
                            }

                            // Construct pretty_url for "See All" link
                            if (clauseName) {
                                newMetadata.pretty_url = `/search?filter[${attrCode}]=${clauseName}`;
                            }
                        }
                    }
                }

                // If we successfully determined a query filter
                if (Object.keys(params).length > 2) {
                    // Check if this is a clause-based filter (contains attribute.code:clause format)
                    const hasClauseFilter = Object.keys(params).some(key => key.startsWith('attribute.'));

                    // Use /search endpoint for clause filters, /api/products for others
                    const endpoint = hasClauseFilter ? '/api/search' : '/api/products';

                    const res = await api.get(endpoint, { params });
                    setProducts(res.data.data || res.data.results || []);
                    setMetadata(newMetadata);
                    return;
                }
            }

            // 2. Fallback to standard manual config
            const params = { limit: effectiveLimit, sort: effectiveSort };
            if (sourceType === 'category' && categoryId) params.category_id = categoryId;
            else if (sourceType === 'collection') {
                if (collectionId) params.collection_id = collectionId;
                if (collectionSlug) params.collection_slug = collectionSlug;
            }

            const res = await api.get('/api/products', { params });
            setProducts(res.data.data || []);
            setMetadata(res.data);
        } catch (error) {
            console.error('[ProductGridWidget] Failed to fetch products', error);
        } finally {
            setLoading(false);
        }
    };


    // Use randomized values from plan if available
    const effectiveAutogenerateTitle = resolvedFromPlan ? true : autogenerateTitle;
    const effectiveShowFeaturedOnly = showFeaturedOnly;

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

    const handleAddToCart = async (e, product) => {
        e.preventDefault(); // Prevent navigation
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


    // Calculate scale factor based on column count
    const getScaleFactor = () => {
        // We use the current effective column count based on screen width
        // simpler approach: use desktop columns as the reference for "design density"
        const cols = columns.desktop || 4;

        if (cols >= 7) return 0.75; // Dense
        if (cols >= 5) return 0.85; // Compact
        return 1.0; // Standard
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
            fontSize: formatCSSValue(titleFontSize),
            fontWeight: titleFontWeight,
            textAlign: titleAlign
        }
    };

    // Show skeleton loader if fetching randomization data or products
    if (loading || (config.randomize?.enabled && isResolving)) {
        const skeletonCount = limit || 8;
        const gridCols = {
            mobile: columns?.mobile || 1,
            tablet: columns?.tablet || 2,
            desktop: columns?.desktop || 4
        };
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
                    <div className="container mx-auto px-4 flex items-center justify-between mb-4" style={styles.titleContainer}>
                        <div className="h-8 bg-gray-200 rounded w-48 animate-pulse"></div>
                        {showSeeAll && (
                            <div className="h-6 bg-gray-200 rounded w-20 animate-pulse"></div>
                        )}
                    </div>
                )}
                <div className="container mx-auto px-4">
                    {showTitle && displayTitle && !config.fullWidthTitle && (
                        <div className="flex items-center justify-between mb-4" style={styles.titleContainer}>
                            <div className="h-8 bg-gray-200 rounded w-48 animate-pulse"></div>
                            {showSeeAll && (
                                <div className="h-6 bg-gray-200 rounded w-20 animate-pulse"></div>
                            )}
                        </div>
                    )}
                    <div
                        className={`grid grid-cols-${gridCols.mobile} md:grid-cols-${gridCols.tablet} lg:grid-cols-${gridCols.desktop}`}
                        style={{
                            gap: formatCSSValue(gridGap)
                        }}
                    >
                        {Array.from({ length: skeletonCount }).map((_, idx) => (
                            <div
                                key={idx}
                                className="bg-white rounded-lg overflow-hidden h-full flex flex-col"
                                style={{
                                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                                }}
                            >
                                <div className="aspect-square bg-gray-200 animate-pulse"></div>
                                <div className="p-4 flex-1 flex flex-col space-y-3">
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
                                        <div className="h-10 bg-gray-200 rounded animate-pulse mt-auto"></div>
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
                                    fontSize: `calc(${styles.title.fontSize} * 0.75)`,
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
                    {products.map((product, index) => (
                        <AnimatedItem
                            key={product.id}
                            delayIndex={index % 4}
                            enabled={enableEntryAnimation}
                            className="group block h-full"
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
                                <Link
                                    href={`/products/${product.slug || product.id}`}
                                    className={`relative bg-gray-100 overflow-hidden block`}
                                    style={{
                                        paddingBottom: scale < 0.8 ? '75%' : '100%' // Switch to 4:3 aspect ratio in dense mode to save height
                                    }}
                                >
                                    {product.image_url ? (
                                        <img
                                            src={product.image_url}
                                            alt={product.name}
                                            className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
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

                                    {showFeaturedBadge && product.is_featured && (
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
                                </Link>

                                {/* Product Info */}
                                <div className="flex flex-col flex-grow" style={{ padding: `${1.1 * scale}rem` }}>
                                    <Link href={`/products/${product.slug || product.id}`}>
                                        <h3
                                            className={`font-semibold mb-2 transition-colors hover:text-blue-600 ${scale < 0.8 ? 'line-clamp-1' : 'line-clamp-2'}`}
                                            style={{
                                                color: colors.text,
                                                fontSize: `${1.125 * scale}rem`,
                                                lineHeight: `${1.5 * scale}rem`
                                            }}
                                        >
                                            {product.name}
                                        </h3>
                                    </Link>

                                    <div className="space-y-2" style={{ marginTop: `${0.4 * scale}rem` }}>
                                        {showDescription && product.description && (
                                            <p className={`text-gray-500 ${scale < 0.8 ? 'line-clamp-1' : 'line-clamp-2'}`} style={{ fontSize: `${0.875 * scale}rem` }}>
                                                {product.description}
                                            </p>
                                        )}

                                        {showAttributes && product.attributes && Object.keys(product.attributes).length > 0 && (
                                            <div className="flex flex-wrap gap-1 mt-1">
                                                {Object.entries(product.attributes).slice(0, 2).map(([key, value], i) => (
                                                    <span key={i} className="px-2 py-0.5 bg-gray-50 border border-gray-100 text-gray-600 rounded" style={{ fontSize: `${0.75 * scale}rem` }}>
                                                        <span className="font-medium">{key}:</span> {value}
                                                    </span>
                                                ))}
                                            </div>
                                        )}

                                        {showTags && product.tags && Array.isArray(product.tags) && product.tags.length > 0 && (
                                            <div className="flex flex-wrap gap-1">
                                                {product.tags.slice(0, 3).map((tag, i) => (
                                                    <span key={i} className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full" style={{ fontSize: `${0.75 * scale}rem` }}>
                                                        {tag}
                                                    </span>
                                                ))}
                                            </div>
                                        )}

                                        {showSocialProof && (
                                            <div className="flex items-center gap-3 text-gray-400 mt-2" style={{ fontSize: `${0.75 * scale}rem` }}>
                                                <span className="flex items-center gap-1">
                                                    <Eye className="w-3 h-3" style={{ width: `${0.75 * scale}rem`, height: `${0.75 * scale}rem` }} />
                                                    {Math.floor(Math.random() * 500) + 50}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    ❤️ {Math.floor(Math.random() * 50) + 5}
                                                </span>
                                            </div>
                                        )}
                                    </div>

                                    <div className="mt-auto flex items-center justify-between gap-2" style={{ paddingTop: `${1 * scale}rem` }}>
                                        <div className="flex flex-col">
                                            {showPrice && (
                                                <span className="font-bold" style={{
                                                    color: colors.price,
                                                    fontSize: `${1.25 * scale}rem`
                                                }}>
                                                    ${parseFloat(product.price).toFixed(2)}
                                                </span>
                                            )}
                                        </div>

                                        <div className="flex items-center gap-2">
                                            {showViewDetails && (
                                                <Link
                                                    href={`/products/${product.slug || product.id}`}
                                                    className="rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
                                                    style={{ padding: `${0.625 * scale}rem` }}
                                                    aria-label="View Details"
                                                >
                                                    <Eye style={{ width: `${1.25 * scale}rem`, height: `${1.25 * scale}rem` }} />
                                                </Link>
                                            )}

                                            {showAddToCart && (
                                                <button
                                                    onClick={(e) => handleAddToCart(e, product)}
                                                    disabled={addingToCart === product.id}
                                                    className="rounded-full transition-all duration-200 transform hover:scale-105 active:scale-95 shadow-md flex items-center gap-2"
                                                    style={{
                                                        backgroundColor: addingToCart === product.id ? '#10b981' : (colors.accent || '#3b82f6'),
                                                        color: '#ffffff',
                                                        padding: `${0.625 * scale}rem ${1 * scale}rem`
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
                    ))}
                </div>
            </div>


            {enableEntryAnimation && <AnimationStyles />}

            <style jsx>{`
                @media (min-width: 640px) {
                    .grid { grid-template-columns: repeat(${columns?.tablet || 2}, minmax(0, 1fr)) !important; }
                }
                @media (min-width: 1024px) {
                    .grid { grid-template-columns: repeat(${columns?.desktop || 4}, minmax(0, 1fr)) !important; }
                }
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

function AnimatedItem({ children, delayIndex = 0, enabled = false, className = '', style = {} }) {
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
        >
            {children}
        </div>
    );
}
