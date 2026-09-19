'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import Link from 'next/link';
import { Tag } from 'lucide-react';
import { proxyApi as api } from '@/lib/axios';
import { useAnalytics } from '@/lib/hooks/useAnalytics';

// Helper to format CSS values (append px if numeric)
const formatCSSValue = (val) => {
    if (!val || val === '0') return '0';
    if (/^\d+(\.\d+)?$/.test(val.toString())) return `${val}px`;
    return val;
};

function ClauseCard({ card, config = {}, trackClick, widgetId, index }) {
    const { isBento = false } = config;
    const [imageError, setImageError] = useState(false);
    const [imageLoaded, setImageLoaded] = useState(false);

    // Get responsive font sizes
    const titleFontSizeDesktop = config.categoryTitleFontSizeDesktop || config.titleFontSizeDesktop || 18;
    const titleFontSizeTablet = config.categoryTitleFontSizeTablet || config.titleFontSizeTablet || 16;
    const titleFontSizeMobile = config.categoryTitleFontSizeMobile || config.titleFontSizeMobile || 14;
    const titleFontWeight = config.categoryTitleFontWeight || config.titleFontWeight || 600;
    const titleColor = config.categoryTitleColor || config.titleColor || '#ffffff';
    const titleAlignment = config.categoryTitleAlignment || config.titleAlignment || 'center';

    // Overlay gradient settings
    const overlayType = config.overlayType || 'gradient';
    const overlayColor = config.overlayColor || '#000000';
    const overlayOpacity = config.overlayOpacity || 40;
    const overlayGradientDirection = config.overlayGradientDirection || 'to-t';

    // Determine device type for responsive font sizing
    const [deviceType, setDeviceType] = useState('desktop');

    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth < 768) setDeviceType('mobile');
            else if (window.innerWidth < 1024) setDeviceType('tablet');
            else setDeviceType('desktop');
        };
        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const textStyle = {
        fontSize: `clamp(0.9rem, 0.75rem + 1vw, ${formatCSSValue(titleFontSizeDesktop)})`,
        fontWeight: titleFontWeight,
        color: titleColor,
        textAlign: titleAlignment === 'center' ? 'center' : titleAlignment === 'right' ? 'right' : 'left',
        lineHeight: '1.2'
    };

    // Helper to convert gradient direction to CSS
    const getGradientDirection = (dir) => {
        const directions = {
            'to-t': 'to top', 'to-b': 'to bottom', 'to-l': 'to left', 'to-r': 'to right',
            'to-tl': 'to top left', 'to-tr': 'to top right', 'to-bl': 'to bottom left', 'to-br': 'to bottom right'
        };
        return directions[dir] || 'to top';
    };

    // Build overlay style
    const getOverlayStyle = () => {
        if (overlayType === 'none') return { background: 'transparent' };
        const opacityHex = Math.round(overlayOpacity * 2.55).toString(16).padStart(2, '0');
        if (overlayType === 'gradient') {
            return { background: `linear-gradient(${getGradientDirection(overlayGradientDirection)}, ${overlayColor}00, ${overlayColor}${opacityHex})` };
        }
        return { background: `${overlayColor}${opacityHex}` };
    };

    return (
        <Link
            href={`${card.pretty_url}?ref_type=widget&ref_id=${widgetId}`}
            className="group block h-full w-full"
            onClick={() => {
                if (trackClick) {
                    trackClick({
                        entity_type: 'clause',
                        entity_id: `${card.attribute.code}:${card.clause.name}:${card.category.id}`,
                        placement_id: widgetId,
                        placement_type: 'widget',
                        position: index + 1,
                        metadata: {
                            card_title: card.title,
                            category_name: card.category.name,
                            attribute_code: card.attribute.code,
                            clause_name: card.clause.name,
                            pretty_url: card.pretty_url
                        }
                    });
                }
            }}
        >
            <div className={`relative ${isBento ? 'h-full w-full' : 'aspect-square'} rounded-2xl overflow-hidden bg-gradient-to-br from-indigo-500 to-purple-600 hover:scale-[1.02] transition-transform flex items-center justify-center border-2 border-white shadow-lg`}>
                {/* Fallback icon */}
                <Tag className={`w-16 h-16 text-yellow-300 absolute z-0 transition-opacity duration-300 ${imageLoaded && !imageError ? 'opacity-0' : 'opacity-100'}`} style={{ top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }} />

                {/* Image Layer */}
                {card.image_url && !imageError && (
                    <img
                        src={card.image_url}
                        alt={card.title}
                        className="absolute inset-0 w-full h-full object-cover z-0 transition-opacity duration-500"
                        style={{ opacity: imageLoaded ? 1 : 0 }}
                        loading="lazy"
                        onLoad={() => setImageLoaded(true)}
                        onError={() => setImageError(true)}
                    />
                )}

                {/* Gradient/Text Overlay */}
                <div
                    className="absolute inset-0 flex items-center justify-center z-10 transition-opacity duration-300 group-hover:opacity-100"
                    style={getOverlayStyle()}
                >
                    <h3 className="font-bold text-center px-4 drop-shadow-md" style={textStyle}>
                        {card.title}
                    </h3>
                </div>
            </div>
        </Link>
    );
}

export default function ClauseGridWidget({ config = {} }) {
    const {
        title = "Shop by Style",
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
        sectionBackground = 'transparent',
        columns = { desktop: 5, tablet: 3, mobile: 2 },
        layoutMode = 'grid',
        enableEntryAnimation = false,

        // Clause-specific config
        traversalMode = 'category_fixed_attribute_traverse_clauses',
        categoryId = null,
        categoryIds = null,
        sourceType = null,
        parentCategoryId = null,
        attributeCode = null,
        maxItems = 12,
        allowRepeatAttribute = false
    } = config;

    const isBento = layoutMode === 'bento';
    const { trackImpression, trackClick } = useAnalytics();

    const widgetId = useMemo(() => {
        return config.id || `clause_grid_${traversalMode}_${categoryId || 'all'}`;
    }, [config.id, traversalMode, categoryId]);

    const [cards, setCards] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchCards();
    }, [traversalMode, categoryId, attributeCode]);

    const fetchCards = async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams();
            params.set('mode', traversalMode);
            if (categoryId) params.set('category_id', categoryId);
            if (categoryIds) params.set('category_ids', Array.isArray(categoryIds) ? categoryIds.join(',') : categoryIds);
            if (sourceType) params.set('source_type', sourceType);
            if (parentCategoryId) params.set('parent_category_id', parentCategoryId);
            if (attributeCode) params.set('attribute_code', attributeCode);
            params.set('max_items', String(maxItems));
            params.set('allow_repeat_attribute', String(allowRepeatAttribute));

            const res = await api.get(`/api/search/storefront/clause-cards?${params.toString()}`);

            if (res.data.success) {
                setCards(res.data.cards || []);

                // Track impressions
                (res.data.cards || []).forEach((card, idx) => {
                    trackImpression({
                        entity_type: 'clause',
                        entity_id: `${card.attribute.code}:${card.clause.name}:${card.category.id}`,
                        placement_id: widgetId,
                        placement_type: 'widget',
                        position: idx + 1,
                        metadata: {
                            widget_title: title,
                            card_title: card.title,
                            traversal_mode: traversalMode
                        }
                    });
                });
            }
        } catch (err) {
            console.error('[ClauseGridWidget] Failed to fetch clause cards:', err);
        } finally {
            setLoading(false);
        }
    };

    // Skeleton loading
    if (loading && cards.length === 0) {
        return (
            <div className="w-full" style={{
                background: sectionBackground,
                paddingTop: formatCSSValue(sectionPaddingTop),
                paddingBottom: formatCSSValue(sectionPaddingBottom)
            }}>
                <div className="max-w-7xl mx-auto px-4">
                    <style dangerouslySetInnerHTML={{
                        __html: `
                            .clause-grid-skel { display: grid; grid-template-columns: repeat(${columns.mobile || 2}, 1fr); gap: ${gridGap}; }
                            @media (min-width: 768px) { .clause-grid-skel { grid-template-columns: repeat(${columns.tablet || 3}, 1fr); } }
                            @media (min-width: 1024px) { .clause-grid-skel { grid-template-columns: repeat(${columns.desktop || 5}, 1fr); } }
                        `
                    }} />
                    <div className="clause-grid-skel">
                        {Array.from({ length: maxItems || 6 }).map((_, idx) => (
                            <div key={`skel-${idx}`} className="aspect-square be3-logo-skeleton rounded-2xl">
                                <div className="be3-logo-text">BE3</div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    // Empty state
    if (!loading && cards.length === 0) {
        return null; // Don't show empty clause widgets
    }

    const gridId = `clause-grid-${columns.mobile}-${columns.tablet}-${columns.desktop}`;

    return (
        <div className="w-full relative" style={{
            background: sectionBackground,
            paddingTop: formatCSSValue(sectionPaddingTop),
            paddingBottom: formatCSSValue(sectionPaddingBottom)
        }}>
            {/* Section Title */}
            {showTitle && (
                <div
                    className="mb-8"
                    style={{
                        textAlign: titleAlign,
                        marginBottom: formatCSSValue(titleBottomMargin),
                        ...(fullWidthTitle ? {} : { maxWidth: '80rem', margin: '0 auto', padding: '0 1rem' })
                    }}
                >
                    <h2
                        className="font-bold"
                        style={{
                            color: titleColor,
                            fontSize: `clamp(1rem, 0.75rem + 1vw, ${formatCSSValue(titleFontSize)})`,
                            fontWeight: titleFontWeight,
                            fontFamily: 'inherit',
                            backgroundColor: titleBackgroundColor,
                            padding: formatCSSValue(titlePadding)
                        }}
                    >
                        {title}
                    </h2>
                </div>
            )}

            <div className="max-w-7xl mx-auto px-4">
                <style dangerouslySetInnerHTML={{
                    __html: `
                        .${gridId} { display: grid; grid-template-columns: repeat(${columns.mobile || 2}, minmax(0, 1fr)); gap: ${formatCSSValue(gridGap)}; }
                        @media (min-width: 768px) { .${gridId} { grid-template-columns: repeat(${columns.tablet || 3}, minmax(0, 1fr)); } }
                        @media (min-width: 1024px) { .${gridId} { grid-template-columns: repeat(${columns.desktop || 5}, minmax(0, 1fr)); } }
                    `
                }} />
                <div className={gridId}>
                    {cards.map((card, index) => (
                        <ClauseCard
                            key={`${card.category.id}-${card.attribute.code}-${card.clause.name}`}
                            card={card}
                            config={config}
                            trackClick={trackClick}
                            widgetId={widgetId}
                            index={index}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
}
