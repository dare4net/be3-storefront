'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Tag, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { proxyApi as api } from '@/lib/axios';
import { useAnalytics } from '@/lib/hooks/useAnalytics';

// Helper to format CSS values (append px if numeric)
const formatCSSValue = (val) => {
    if (!val || val === '0') return '0';
    if (/^\d+(\.\d+)?$/.test(val.toString())) return `${val}px`;
    return val;
};

// ─── Clause Card Component ──────────────────────────────────

function ClauseCard({
    card, index, settings, deviceType, getScaledValue, getResponsiveValue,
    isHovered, onHover, onLeave, getShadowStyles, trackClick, widgetId
}) {
    const [imageError, setImageError] = useState(false);
    const [imageLoaded, setImageLoaded] = useState(false);

    const getRadius = () => {
        if (settings.cardShape === 'circle') return '50%';
        if (settings.cardShape === 'square') return '0';
        const r = getResponsiveValue(settings.borderRadius, settings.borderRadius, settings.mobileBorderRadius);
        return `${getScaledValue(r || 16)}px`;
    };

    const getDirection = (dir) => {
        const map = {
            'to-r': 'to right', 'to-br': 'to bottom right',
            'to-b': 'to bottom', 'to-bl': 'to bottom left',
            'to-l': 'to left', 'to-t': 'to top'
        };
        return map[dir] || 'to bottom right';
    };

    const contentPosition = getResponsiveValue(
        settings.contentPositionDesktop, settings.contentPositionDesktop, settings.contentPositionMobile
    );

    const cardTitleFontSize = getResponsiveValue(
        settings.cardTitleFontSizeDesktop, settings.cardTitleFontSizeTablet, settings.cardTitleFontSizeMobile
    );

    return (
        <Link
            href={`${card.pretty_url}?ref_type=widget&ref_id=${widgetId}`}
            className="block h-full"
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
                            clause_name: card.clause.name
                        }
                    });
                }
            }}
        >
            <div
                className="relative overflow-hidden cursor-pointer group"
                style={{
                    borderRadius: getRadius(),
                    boxShadow: isHovered ? `0 12px 28px rgba(0,0,0,0.15)` : getShadowStyles(),
                    border: `${getScaledValue(settings.borderWidth)}px solid ${settings.borderColor}`,
                    transform: isHovered ? `translateY(-${settings.liftHeight || 4}px)` : 'translateY(0)',
                    transition: `all ${settings.transitionDuration || 300}ms ${settings.easingFunction || 'ease-out'}`
                }}
                onMouseEnter={onHover}
                onMouseLeave={onLeave}
            >
                {/* Image Container */}
                <div className={contentPosition === 'overlay' ? 'aspect-square' : ''} style={{ position: 'relative' }}>
                    <div className="aspect-square w-full relative overflow-hidden" style={{
                        background: settings.backgroundGradient
                            ? `linear-gradient(${getDirection(settings.gradientDirection)}, ${settings.gradientStart}, ${settings.gradientEnd})`
                            : settings.backgroundColor,
                        borderRadius: contentPosition === 'below' ? `${getRadius()} ${getRadius()} 0 0` : getRadius()
                    }}>
                        {/* Fallback Icon */}
                        <div className={`absolute inset-0 flex items-center justify-center transition-opacity duration-300 ${imageLoaded && !imageError ? 'opacity-0' : 'opacity-100'}`}>
                            <Tag className="w-12 h-12 text-gray-400" />
                        </div>

                        {/* Product Image */}
                        {card.image_url && !imageError && (
                            <img
                                src={card.image_url}
                                alt={card.title}
                                className="absolute inset-0 w-full h-full transition-transform duration-500"
                                style={{
                                    objectFit: settings.imageFit || 'cover',
                                    objectPosition: settings.imagePosition || 'center',
                                    transform: isHovered ? `scale(${settings.imageZoomOnHover || 1.05})` : 'scale(1)',
                                    opacity: imageLoaded ? 1 : 0
                                }}
                                loading="lazy"
                                onLoad={() => setImageLoaded(true)}
                                onError={() => setImageError(true)}
                            />
                        )}

                        {/* Overlay */}
                        {contentPosition === 'overlay' && settings.overlayType !== 'none' && (
                            <div className="absolute inset-0 z-10 flex items-end" style={{
                                background: settings.overlayType === 'gradient'
                                    ? `linear-gradient(${getDirection(settings.overlayGradientDirection)}, transparent, rgba(0,0,0,${(settings.overlayOpacity || 40) / 100}))`
                                    : `rgba(0,0,0,${(settings.overlayOpacity || 40) / 100})`
                            }}>
                                <div className="p-3 w-full">
                                    <h3 className="font-semibold drop-shadow-md" style={{
                                        fontSize: `${getScaledValue(cardTitleFontSize)}px`,
                                        fontWeight: settings.cardTitleFontWeight,
                                        color: settings.cardTitleColor || '#ffffff',
                                        textAlign: settings.cardTitleAlignment
                                    }}>
                                        {card.title}
                                    </h3>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Content Below */}
                {contentPosition === 'below' && (
                    <div className="p-3" style={{
                        background: settings.backgroundColor || '#fff',
                        borderRadius: `0 0 ${getRadius()} ${getRadius()}`
                    }}>
                        <h3 className="font-semibold" style={{
                            fontSize: `${getScaledValue(cardTitleFontSize)}px`,
                            fontWeight: settings.cardTitleFontWeight,
                            color: settings.cardTitleColor || '#111827',
                            textAlign: settings.cardTitleAlignment
                        }}>
                            {card.title}
                        </h3>
                    </div>
                )}
            </div>
        </Link>
    );
}

// ─── Navigation Arrows ──────────────────────────────────────

function NavigationArrows({ onPrev, onNext, settings }) {
    const arrowStyle = {
        background: settings.arrowBackgroundColor || 'rgba(0,0,0,0.5)',
        color: settings.arrowColor || '#fff',
        borderRadius: settings.arrowShape === 'circle' ? '50%' : settings.arrowShape === 'square' ? '4px' : '50%'
    };

    return (
        <>
            <button
                onClick={onPrev}
                className="absolute left-2 top-1/2 -translate-y-1/2 z-20 w-10 h-10 flex items-center justify-center transition-all hover:opacity-90"
                style={arrowStyle}
            >
                <ChevronLeft className="w-5 h-5" />
            </button>
            <button
                onClick={onNext}
                className="absolute right-2 top-1/2 -translate-y-1/2 z-20 w-10 h-10 flex items-center justify-center transition-all hover:opacity-90"
                style={arrowStyle}
            >
                <ChevronRight className="w-5 h-5" />
            </button>
        </>
    );
}

// ─── Pagination Dots ────────────────────────────────────────

function PaginationDots({ total, current, dotStyle, onClick }) {
    return (
        <div className="flex justify-center gap-2 mt-4">
            {Array.from({ length: total }).map((_, i) => (
                <button
                    key={i}
                    onClick={() => onClick(i)}
                    className={`transition-all duration-300 ${dotStyle === 'line' ? 'h-1 rounded-full' : 'rounded-full'}`}
                    style={{
                        width: i === current ? (dotStyle === 'line' ? 24 : 10) : (dotStyle === 'line' ? 12 : 8),
                        height: dotStyle === 'line' ? 4 : 8,
                        background: i === current ? '#374151' : '#d1d5db'
                    }}
                />
            ))}
        </div>
    );
}

// ─── Main Widget ────────────────────────────────────────────

export default function ClauseCarouselWidget({ config = {} }) {
    const { trackImpression, trackClick } = useAnalytics();

    const widgetId = useMemo(() => {
        return config.id || `clause_carousel_${config.traversalMode || 'default'}`;
    }, [config.id, config.traversalMode]);

    const [cards, setCards] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isHovered, setIsHovered] = useState(null);
    const [deviceType, setDeviceType] = useState('desktop');
    const [touchStart, setTouchStart] = useState(null);
    const [touchEnd, setTouchEnd] = useState(null);
    const autoPlayRef = useRef(null);
    const minSwipeDistance = 50;

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

    const {
        title = "Browse Collections",
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
        columns = { desktop: 5, tablet: 3, mobile: 2 }
    } = config;

    const settings = {
        itemsPerRowDesktop: columns.desktop || 5,
        itemsPerRowTablet: columns.tablet || 3,
        itemsPerRowMobile: columns.mobile || 2,
        gridGap: config.gridGap || '12px',
        infiniteLoop: config.infiniteLoop ?? true,
        itemsToScroll: config.itemsToScroll || 1,
        globalScale: config.globalScale || 1.0,
        cardShape: config.cardShape || 'rounded-square',
        borderRadius: config.borderRadius || 16,
        mobileBorderRadius: config.mobileBorderRadius ?? (config.borderRadius || 16) / 2,
        borderWidth: config.borderWidth || 0,
        borderColor: config.borderColor || '#e5e7eb',
        backgroundColor: config.backgroundColor || '#ffffff',
        backgroundGradient: config.backgroundGradient ?? false,
        gradientStart: config.gradientStart || '#f9fafb',
        gradientEnd: config.gradientEnd || '#e5e7eb',
        gradientDirection: config.gradientDirection || 'to-br',
        shadowStyle: config.shadowStyle || 'medium',
        imageFit: config.imageFit || 'cover',
        imagePosition: config.imagePosition || 'center',
        overlayType: config.overlayType || 'gradient',
        overlayColor: config.overlayColor || '#000000',
        overlayOpacity: config.overlayOpacity || 40,
        overlayGradientDirection: config.overlayGradientDirection || 'to-t',
        imageZoomOnHover: config.imageZoomOnHover || 1.1,
        contentPositionDesktop: config.contentPositionDesktop || 'overlay',
        contentPositionMobile: config.contentPositionMobile || 'below',
        cardTitleFontSizeDesktop: config.categoryTitleFontSizeDesktop || 18,
        cardTitleFontSizeTablet: config.categoryTitleFontSizeTablet || 16,
        cardTitleFontSizeMobile: config.categoryTitleFontSizeMobile || 14,
        cardTitleFontWeight: config.categoryTitleFontWeight || 600,
        cardTitleColor: config.categoryTitleColor || (config.contentPositionDesktop === 'overlay' ? '#ffffff' : '#111827'),
        cardTitleAlignment: config.categoryTitleAlignment || 'center',
        hoverAnimation: config.hoverAnimation || 'lift',
        liftHeight: config.liftHeight || 8,
        transitionDuration: config.transitionDuration || 300,
        easingFunction: config.easingFunction || 'ease-out',
        autoPlay: config.autoPlay ?? false,
        autoPlayInterval: config.autoPlayInterval || 3000,
        showArrows: config.showArrows || 'hover',
        arrowShape: config.arrowShape || 'circle',
        arrowColor: config.arrowColor || '#ffffff',
        arrowBackgroundColor: config.arrowBackgroundColor || 'rgba(0, 0, 0, 0.5)',
        showDots: config.showDots ?? true,
        dotStyle: config.dotStyle || 'circle',
        peekEffect: config.peekEffect ?? false,

        // Clause-specific
        traversalMode: config.traversalMode || 'category_fixed_attribute_traverse_clauses',
        categoryId: config.categoryId || null,
        categoryIds: config.categoryIds || null,
        sourceType: config.sourceType || null,
        parentCategoryId: config.parentCategoryId || null,
        attributeCode: config.attributeCode || null,
        maxItems: config.maxItems || 12,
        allowRepeatAttribute: config.allowRepeatAttribute ?? false
    };

    const getScaledValue = (value) => {
        if (typeof value === 'string') return value;
        return Math.round(value * (settings.globalScale || 1));
    };

    const getResponsiveValue = (desktop, tablet, mobile) => {
        if (deviceType === 'mobile') return mobile;
        if (deviceType === 'tablet') return tablet;
        return desktop;
    };

    const getGapPadding = () => {
        if (settings.gridGap) {
            const gapValue = typeof settings.gridGap === 'string'
                ? parseFloat(settings.gridGap.replace('px', '')) || 8
                : settings.gridGap;
            return getScaledValue(gapValue);
        }
        return 8;
    };

    const getItemsPerRow = () => {
        const base = getResponsiveValue(settings.itemsPerRowDesktop, settings.itemsPerRowTablet, settings.itemsPerRowMobile);
        return settings.peekEffect ? base + 0.25 : base;
    };

    const getShadowStyles = () => {
        const presets = {
            none: 'none', soft: '0 2px 8px rgba(0,0,0,0.05)',
            medium: '0 4px 16px rgba(0,0,0,0.1)', hard: '0 8px 24px rgba(0,0,0,0.2)'
        };
        return presets[settings.shadowStyle] || presets.medium;
    };

    const currentItemsPerRow = getItemsPerRow();

    // Fetch cards from API
    useEffect(() => {
        fetchCards();
    }, [settings.traversalMode, settings.categoryId, settings.attributeCode]);

    const fetchCards = async () => {
        try {
            setLoading(true);
            const params = new URLSearchParams();
            params.set('mode', settings.traversalMode);
            if (settings.categoryId) params.set('category_id', settings.categoryId);
            if (settings.categoryIds) params.set('category_ids', Array.isArray(settings.categoryIds) ? settings.categoryIds.join(',') : settings.categoryIds);
            if (settings.sourceType) params.set('source_type', settings.sourceType);
            if (settings.parentCategoryId) params.set('parent_category_id', settings.parentCategoryId);
            if (settings.attributeCode) params.set('attribute_code', settings.attributeCode);
            params.set('max_items', String(settings.maxItems));
            params.set('allow_repeat_attribute', String(settings.allowRepeatAttribute));

            const res = await api.get(`/api/search/storefront/clause-cards?${params.toString()}`);

            if (res.data.success) {
                setCards(res.data.cards || []);

                (res.data.cards || []).forEach((card, idx) => {
                    trackImpression({
                        entity_type: 'clause',
                        entity_id: `${card.attribute.code}:${card.clause.name}:${card.category.id}`,
                        placement_id: widgetId,
                        placement_type: 'widget',
                        position: idx + 1,
                        metadata: { widget_title: title, card_title: card.title }
                    });
                });
            }
        } catch (err) {
            console.error('[ClauseCarouselWidget] Failed to fetch clause cards:', err);
        } finally {
            setLoading(false);
        }
    };

    // Auto-play
    useEffect(() => {
        if (settings.autoPlay && cards.length > 0) {
            autoPlayRef.current = setInterval(() => handleNext(), settings.autoPlayInterval);
            return () => clearInterval(autoPlayRef.current);
        }
    }, [settings.autoPlay, currentIndex, cards.length]);

    const handlePrev = () => {
        setCurrentIndex((prev) =>
            prev === 0 ? (settings.infiniteLoop ? Math.max(0, cards.length - settings.itemsToScroll) : 0) : prev - settings.itemsToScroll
        );
    };

    const handleNext = () => {
        const maxIndex = Math.max(0, cards.length - Math.floor(currentItemsPerRow));
        setCurrentIndex((prev) =>
            prev >= maxIndex ? (settings.infiniteLoop ? 0 : maxIndex) : prev + settings.itemsToScroll
        );
    };

    // Touch handlers
    const onTouchStart = (e) => { setTouchEnd(null); setTouchStart(e.targetTouches[0].clientX); };
    const onTouchMove = (e) => setTouchEnd(e.targetTouches[0].clientX);
    const onTouchEnd = () => {
        if (!touchStart || !touchEnd) return;
        const distance = touchStart - touchEnd;
        if (distance > minSwipeDistance) handleNext();
        if (distance < -minSwipeDistance) handlePrev();
    };

    const isLoading = loading && cards.length === 0;

    // Empty state
    if (!isLoading && cards.length === 0) {
        return null;
    }

    return (
        <div
            className="w-full relative transition-colors duration-300"
            style={{
                background: sectionBackground,
                paddingTop: formatCSSValue(sectionPaddingTop),
                paddingBottom: formatCSSValue(sectionPaddingBottom)
            }}
        >
            {showTitle && (
                <div
                    className="mb-8"
                    style={{
                        textAlign: titleAlign,
                        marginBottom: formatCSSValue(titleBottomMargin)
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
                <div className="relative group">
                    {/* Carousel */}
                    <div
                        className="overflow-hidden"
                        onTouchStart={onTouchStart}
                        onTouchMove={onTouchMove}
                        onTouchEnd={onTouchEnd}
                    >
                        <div
                            className="flex transition-transform duration-300 ease-out"
                            style={{
                                transform: `translateX(-${currentIndex * (100 / currentItemsPerRow)}%)`
                            }}
                        >
                            {isLoading ? (
                                Array.from({ length: settings.maxItems || 6 }).map((_, idx) => (
                                    <div
                                        key={`skel-${idx}`}
                                        className="flex-shrink-0"
                                        style={{ flex: `0 0 ${100 / currentItemsPerRow}%`, padding: `${getGapPadding()}px` }}
                                    >
                                        <div className="aspect-square bg-gray-200 animate-pulse rounded-2xl"></div>
                                    </div>
                                ))
                            ) : (
                                cards.map((card, index) => (
                                    <div
                                        key={`${card.category.id}-${card.attribute.code}-${card.clause.name}`}
                                        className="flex-shrink-0"
                                        style={{ flex: `0 0 ${100 / currentItemsPerRow}%`, padding: `${getGapPadding()}px` }}
                                    >
                                        <ClauseCard
                                            card={card}
                                            index={index}
                                            settings={settings}
                                            deviceType={deviceType}
                                            getScaledValue={getScaledValue}
                                            getResponsiveValue={getResponsiveValue}
                                            isHovered={isHovered === index}
                                            onHover={() => setIsHovered(index)}
                                            onLeave={() => setIsHovered(null)}
                                            getShadowStyles={getShadowStyles}
                                            trackClick={trackClick}
                                            widgetId={widgetId}
                                        />
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Navigation Arrows */}
                    {settings.showArrows !== 'never' && cards.length > Math.floor(currentItemsPerRow) && (
                        <div className={`${settings.showArrows === 'hover' ? 'opacity-0 group-hover:opacity-100' : ''} transition-opacity duration-300`}>
                            <NavigationArrows onPrev={handlePrev} onNext={handleNext} settings={settings} />
                        </div>
                    )}

                    {/* Pagination Dots */}
                    {settings.showDots && cards.length > Math.floor(currentItemsPerRow) && (
                        <PaginationDots
                            total={Math.ceil(cards.length / settings.itemsPerRowDesktop)}
                            current={Math.floor(currentIndex / settings.itemsPerRowDesktop)}
                            dotStyle={settings.dotStyle}
                            onClick={(index) => setCurrentIndex(index * settings.itemsPerRowDesktop)}
                        />
                    )}
                </div>
            </div>
        </div>
    );
}
