'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Package, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { proxyApi as api } from '@/lib/axios';
import { useRandomizationContext } from '@/lib/contexts/RandomizationContext';
import { useAnalytics } from '@/lib/hooks/useAnalytics';

// Helper to format CSS values (append px if numeric)
const formatCSSValue = (val) => {
    if (!val || val === '0') return '0';
    if (/^\d+(\.\d+)?$/.test(val.toString())) return `${val}px`;
    return val;
};

export default function CategoryCarouselWidget({ config = {} }) {
    // 2. Context & Hooks
    const { masterPlan, registerWidget, getStableWidgetId } = useRandomizationContext();
    const { trackImpression, trackClick } = useAnalytics();
    
    // 1. Initial State Resolution (Instant Text)
    const widgetId = useMemo(() => {
        if (config.id) return config.id;
        // Fallback: Use context helper if available, or temporary local relabel
        return getStableWidgetId ? getStableWidgetId(config, 'cat_carousel') : (config.id || `temp_${Math.random()}`);
    }, [config.id, getStableWidgetId, config]);
    
    // Ensure stableId is consistent with the prefix logic
    const stableId = widgetId;
    const resolvedFromPlan = masterPlan?.[stableId];

    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(!resolvedFromPlan && config.randomize?.enabled);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isHovered, setIsHovered] = useState(null);
    const [tooltipPosition, setTooltipPosition] = useState({});
    const carouselRef = useRef(null);
    const autoPlayRef = useRef(null);
    const [deviceType, setDeviceType] = useState('desktop'); // 'mobile', 'tablet', 'desktop'
    const [touchStart, setTouchStart] = useState(null);
    const [touchEnd, setTouchEnd] = useState(null);
    const minSwipeDistance = 50;

    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth < 768) setDeviceType('mobile');
            else if (window.innerWidth < 1024) setDeviceType('tablet');
            else setDeviceType('desktop');
        };
        handleResize(); // Init
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const {
        title = "Shop by Category",
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

    // Default Configuration with all 70+ options
    const settings = {
        // Category Selection
        sourceType: config.sourceType || 'top-level', // 'top-level', 'subcategories', 'all-subcategories', 'random', 'manual'
        parentCategoryId: config.parentCategoryId || null,
        manualCategoryIds: config.manualCategoryIds || [],
        randomCount: config.randomCount || 6,
        sortOrder: config.sortOrder || 'alphabetical', // 'alphabetical', 'random', 'manual'
        showEmptyCategories: config.showEmptyCategories ?? true,
        maxCategories: config.maxCategories || 12,

        // Layout & Structure
        displayMode: config.displayMode || 'carousel', // 'carousel', 'grid'
        itemsPerRowDesktop: columns.desktop || 4,
        itemsPerRowTablet: columns.tablet || 3,
        itemsPerRowMobile: columns.mobile || 2,
        gap: config.gap || 'md', // 'sm', 'md', 'lg', 'xl'
        gridGap: config.gridGap || '12px',
        infiniteLoop: config.infiniteLoop ?? true,
        itemsToScroll: config.itemsToScroll || 1,
        centerMode: config.centerMode ?? false,
        variableWidth: config.variableWidth ?? false,
        globalScale: config.globalScale || 1.0,

        // Card Shape & Style
        cardShape: config.cardShape || 'rounded-square', // 'square', 'circle', 'rounded-square', 'hexagon'
        borderRadius: config.borderRadius || 16,
        mobileBorderRadius: config.mobileBorderRadius ?? (config.borderRadius || 16) / 2,
        aspectRatio: config.aspectRatio || '1:1', // '1:1', '4:3', '16:9', 'custom'
        cardStyle: config.cardStyle || 'elevated', // 'flat', 'bordered', 'elevated', 'glassmorphic'
        borderWidth: config.borderWidth || 0,
        borderWidthMobile: config.borderWidthMobile !== undefined ? config.borderWidthMobile : (config.borderWidth || 0),
        borderColor: config.borderColor || '#e5e7eb',
        backgroundColor: config.backgroundColor || '#ffffff',
        backgroundGradient: config.backgroundGradient ?? false,
        gradientStart: config.gradientStart || '#f9fafb',
        gradientEnd: config.gradientEnd || '#e5e7eb',
        gradientDirection: config.gradientDirection || 'to-br', // 'to-r', 'to-br', 'to-b', 'to-bl'

        // Shadow & Depth
        shadowStyle: config.shadowStyle || 'medium', // 'none', 'soft', 'medium', 'hard', 'custom'
        shadowColor: config.shadowColor || 'rgba(0, 0, 0, 0.1)',
        shadowBlur: config.shadowBlur || 20,
        shadowSpread: config.shadowSpread || 0,
        shadowOffsetX: config.shadowOffsetX || 0,
        shadowOffsetY: config.shadowOffsetY || 8,

        // Image & Overlay
        imageFit: config.imageFit || 'cover', // 'cover', 'contain', 'fill'
        imagePosition: config.imagePosition || 'center', // 'center', 'top', 'bottom'
        overlayType: config.overlayType || 'gradient', // 'none', 'gradient', 'solid'
        overlayColor: config.overlayColor || '#000000',
        overlayOpacity: config.overlayOpacity || 40,
        overlayGradientDirection: config.overlayGradientDirection || 'to-t',
        imageZoomOnHover: config.imageZoomOnHover || 1.1,
        imageFilter: config.imageFilter || 'none', // 'none', 'grayscale', 'sepia', 'blur'

        // Typography & Positioning
        contentPositionDesktop: config.contentPositionDesktop || 'overlay', // 'overlay', 'below'
        contentPositionMobile: config.contentPositionMobile || 'below',   // 'overlay', 'below'
        titleFontSizeDesktop: config.titleFontSizeDesktop || 18,
        titleFontSizeTablet: config.titleFontSizeTablet || 16,
        titleFontSizeMobile: config.titleFontSizeMobile || 14,
        titleFontWeight: titleFontWeight || 600,
        // Card Title Styling
        cardTitleFontSizeDesktop: config.categoryTitleFontSizeDesktop || config.titleFontSizeDesktop || 18,
        cardTitleFontSizeTablet: config.categoryTitleFontSizeTablet || config.titleFontSizeTablet || 16,
        cardTitleFontSizeMobile: config.categoryTitleFontSizeMobile || config.titleFontSizeMobile || 14,
        cardTitleFontWeight: config.categoryTitleFontWeight || config.titleFontWeight || 600,
        cardTitleColor: config.categoryTitleColor || config.titleColor || (config.contentPositionDesktop === 'overlay' ? '#ffffff' : '#111827'),
        cardTitleAlignment: config.categoryTitleAlignment || config.titleAlignment || titleAlign || 'center',
        showProductCount: config.showProductCount ?? true,
        countStyle: config.countStyle || 'text', // 'badge', 'text', 'icon-text'
        countColor: config.categoryCountColor || '#6b7280',

        // Hover Effects
        hoverAnimation: config.hoverAnimation || 'lift', // 'none', 'lift', 'zoom', 'tilt', 'glow', 'pulse'
        liftHeight: config.liftHeight || 8,
        zoomScale: config.zoomScale || 1.05,
        tiltAngle: config.tiltAngle || 5,
        hoverShadowEnhancement: config.hoverShadowEnhancement ?? true,
        titleColorOnHover: config.categoryTitleColorOnHover || config.titleColorOnHover || null,
        overlayOpacityOnHover: config.overlayOpacityOnHover || 20,

        // Interactive States
        showTooltip: config.showTooltip ?? false,
        tooltipContent: config.tooltipContent || 'description', // 'description', 'product-count', 'custom'
        tooltipPosition: config.tooltipPosition || 'top', // 'top', 'bottom', 'left', 'right'
        clickAction: config.clickAction || 'navigate', // 'navigate', 'modal', 'custom'
        activeStateStyling: config.activeStateStyling ?? false,

        // Animations & Transitions
        entranceAnimation: config.entranceAnimation || 'fade', // 'fade', 'slide', 'zoom', 'bounce', 'none'
        staggerDelay: config.staggerDelay || 100,
        transitionDuration: config.transitionDuration || 300,
        easingFunction: config.easingFunction || 'ease-out', // 'linear', 'ease', 'ease-in', 'ease-out'
        autoPlay: config.autoPlay ?? false,
        autoPlayInterval: config.autoPlayInterval || 3000,

        // Navigation Controls
        showArrows: config.showArrows || 'hover', // 'always', 'hover', 'never'
        arrowStyle: config.arrowStyle || 'modern', // 'classic', 'modern', 'minimal', 'custom'
        arrowShape: config.arrowShape || 'circle', // 'circle', 'square', 'none'
        arrowPosition: config.arrowPosition || 'inside', // 'inside', 'outside', 'overlay'
        arrowColor: config.arrowColor || '#ffffff',
        arrowBackgroundColor: config.arrowBackgroundColor || 'rgba(0, 0, 0, 0.5)',
        showDots: config.showDots ?? true,
        dotStyle: config.dotStyle || 'circle', // 'circle', 'line', 'bullet'

        // Empty State
        emptyMessage: config.emptyMessage || 'No categories available',
        emptyIcon: config.emptyIcon || 'Package',
        emptyStateBackground: config.emptyStateBackground || '#f9fafb',
        showExploreCTA: config.showExploreCTA ?? true,

        // Advanced Effects
        parallaxEffect: config.parallaxEffect ?? false,
        blurBackgroundOnHover: config.blurBackgroundOnHover ?? false,
        categoryIconOverlay: config.categoryIconOverlay ?? false,
        badgeLabel: config.badgeLabel || null, // 'New', 'Featured', etc.
        badgePosition: config.badgePosition || 'top-right', // 'top-left', 'top-right', 'bottom'
        glassmorphism: config.glassmorphism ?? false,

        // Section Styling
        sectionBackground: sectionBackground,
        sectionPaddingTop: sectionPaddingTop,
        sectionPaddingBottom: sectionPaddingBottom,
        sectionPadding: `py-[${sectionPaddingTop}]`, // Helper for Tailwind spacing
        sectionTitle: title,
        sectionTitleColor: config.sectionTitleColor || titleColor,
        sectionSubtitle: config.sectionSubtitle || '',
        showSectionTitle: showTitle,
        fullWidthTitle: fullWidthTitle,
        peekEffect: config.peekEffect ?? false,

        // New Detailed Styling (Section Header)
        titleFontSize: config.sectionTitleFontSize || titleFontSize,
        titleFontWeight: config.sectionTitleFontWeight || titleFontWeight,
        titleAlign: config.sectionTitleAlign || titleAlign,
        titleBackgroundColor: config.sectionTitleBackgroundColor || titleBackgroundColor,
        titlePadding: config.sectionTitlePadding || titlePadding,
        titleBottomMargin: config.sectionTitleBottomMargin || titleBottomMargin
    };

    const getScaledValue = (value) => {
        if (typeof value === 'string') {
            // Check if percentage
            if (value.includes('%')) return value;
            return value; // Don't scale string values generally unless parsed
        }
        return Math.round(value * (settings.globalScale || 1));
    };

    const getResponsiveValue = (desktop, tablet, mobile) => {
        if (deviceType === 'mobile') return mobile;
        if (deviceType === 'tablet') return tablet;
        return desktop;
    };

    const effectiveSourceType = resolvedFromPlan?.resolvedType || settings.sourceType;
    const effectiveSettings = {
        ...settings,
        sourceType: effectiveSourceType
    };

    useEffect(() => {
        if (config.randomize?.enabled) {
            console.log(`[CategoryCarouselWidget] Registering ${stableId} for randomization`);
            registerWidget(widgetId, {
                allowedTypes: ['category'],
                sourceType: settings.sourceType,
                randomCount: settings.randomCount,
                parentCategoryId: settings.parentCategoryId,
                manualCategoryIds: settings.manualCategoryIds
            }, config);
        }
    }, [widgetId, config.randomize?.enabled, registerWidget, stableId]);

    // 2. Computed Categories (Render-Phase Resolution)
    // This eliminates the flicker by calculating data immediately if the plan exists
    const displayCategories = useMemo(() => {
        let list = [];
        if (!config.randomize?.enabled) {
            list = categories;
        } else if (resolvedFromPlan) {
            list = resolvedFromPlan.multiple
                ? resolvedFromPlan.selections.map(s => s.selection).filter(Boolean)
                : (resolvedFromPlan.selection ? [resolvedFromPlan.selection] : []);
        }

        // Deduplicate and sanitize
        const seen = new Set();
        return list.filter(cat => {
            if (!cat || (!cat.id && !cat.slug)) return false;
            const key = cat.id || cat.slug;
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
        });
    }, [categories, resolvedFromPlan, config.randomize?.enabled]);

    // Main data fetching effect (Now only for NON-randomized or initial loading)
    useEffect(() => {
        if (config.randomize?.enabled) {
            if (!resolvedFromPlan) {
                setLoading(true);
            } else {
                setLoading(false);
                // Track impressions when plan is ready
                displayCategories.forEach((cat, index) => {
                    trackImpression({
                        entity_type: 'category',
                        entity_id: cat.id,
                        placement_id: widgetId,
                        placement_type: 'widget',
                        position: index + 1,
                        metadata: {
                            widget_title: title,
                            category_name: cat.name,
                            category_slug: cat.slug,
                            source_type: effectiveSourceType
                        }
                    });
                });
            }
            return;
        }

        // Standard non-randomized path
        fetchCategories();
    }, [resolvedFromPlan, config.randomize?.enabled, widgetId, stableId, displayCategories.length]);

    // Auto-play functionality
    useEffect(() => {
        if (settings.autoPlay && settings.displayMode === 'carousel') {
            autoPlayRef.current = setInterval(() => {
                handleNext();
            }, settings.autoPlayInterval);

            return () => clearInterval(autoPlayRef.current);
        }
    }, [settings.autoPlay, currentIndex, categories.length]);

    const fetchCategories = async () => {
        try {
            setLoading(true);
            const response = await api.get('/api/categories');

            if (response.data.success) {
                let filtered = response.data.categories || [];

                // Apply filtering based on source type
                switch (effectiveSettings.sourceType) {
                    case 'top-level':
                        filtered = filtered.filter(cat => !cat.parent_id);
                        break;
                    case 'subcategories':
                        if (effectiveSettings.parentCategoryId) {
                            filtered = filtered.filter(cat => String(cat.parent_id) === String(effectiveSettings.parentCategoryId));
                        }
                        break;
                    case 'all-subcategories':
                        filtered = filtered.filter(cat => cat.parent_id);
                        break;
                    case 'manual':
                        if (effectiveSettings.manualCategoryIds?.length > 0) {
                            const manualIds = effectiveSettings.manualCategoryIds.map(String);
                            filtered = filtered.filter(cat => manualIds.includes(String(cat.id)));
                        }
                        break;
                    case 'random':
                        filtered = filtered.sort(() => 0.5 - Math.random()).slice(0, effectiveSettings.randomCount);
                        break;
                }

                // Apply sorting
                if (effectiveSettings.sortOrder === 'alphabetical') {
                    filtered.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
                } else if (effectiveSettings.sortOrder === 'random') {
                    filtered.sort(() => 0.5 - Math.random());
                }

                // Apply max limit
                if (effectiveSettings.maxCategories) {
                    filtered = filtered.slice(0, effectiveSettings.maxCategories);
                }

                setCategories(filtered);

                // Track impressions for all loaded categories
                filtered.forEach((cat, index) => {
                    trackImpression({
                        entity_type: 'category',
                        entity_id: cat.id,
                        placement_id: widgetId,
                        placement_type: 'widget',
                        position: index + 1,
                        metadata: {
                            widget_title: title,
                            category_name: cat.name,
                            category_slug: cat.slug,
                            source_type: settings.sourceType
                        }
                    });
                });
            }
        } catch (error) {
            console.error('Failed to fetch categories:', error);
        } finally {
            setLoading(false);
        }
    };

    const handlePrev = () => {
        setCurrentIndex((prev) =>
            prev === 0 ? (settings.infiniteLoop ? categories.length - settings.itemsToScroll : 0) : prev - settings.itemsToScroll
        );
    };

    const handleNext = () => {
        const itemsPerRow = getItemsPerRow();
        const maxIndex = Math.max(0, categories.length - Math.floor(itemsPerRow));
        setCurrentIndex((prev) =>
            prev >= maxIndex ? (settings.infiniteLoop ? 0 : maxIndex) : prev + settings.itemsToScroll
        );
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
        if (isLeftSwipe) handleNext();
        if (isRightSwipe) handlePrev();
    };



    // Generate dynamic styles
    // Generate dynamic styles
    // Generate dynamic styles
    const getGapPadding = () => {
        // Use gridGap if provided (in px), otherwise fall back to gap preset
        if (settings.gridGap) {
            const gapValue = typeof settings.gridGap === 'string'
                ? parseFloat(settings.gridGap.replace('px', '')) || 8
                : settings.gridGap;
            return getScaledValue(gapValue);
        }
        const baseGap = { sm: 4, md: 8, lg: 12, xl: 16 }[settings.gap] || 8;
        return getScaledValue(baseGap);
    };

    const getItemsPerRow = () => {
        const base = getResponsiveValue(settings.itemsPerRowDesktop, settings.itemsPerRowTablet, settings.itemsPerRowMobile);
        return settings.peekEffect ? base + 0.25 : base;
    };

    const getShadowStyles = () => {
        const presets = {
            none: 'none',
            soft: '0 2px 8px rgba(0, 0, 0, 0.05)',
            medium: '0 4px 16px rgba(0, 0, 0, 0.1)',
            hard: '0 8px 24px rgba(0, 0, 0, 0.2)',
        };

        if (settings.shadowStyle === 'custom') {
            return `${settings.shadowOffsetX}px ${settings.shadowOffsetY}px ${settings.shadowBlur}px ${settings.shadowSpread}px ${settings.shadowColor}`;
        }

        return presets[settings.shadowStyle] || presets.medium;
    };

    const getHoverTransform = (index) => {
        if (!isHovered === index) return '';

        const transforms = [];
        if (settings.hoverAnimation === 'lift') transforms.push(`translateY(-${settings.liftHeight}px)`);
        if (settings.hoverAnimation === 'zoom') transforms.push(`scale(${settings.zoomScale})`);
        if (settings.hoverAnimation === 'tilt') transforms.push(`rotate(${settings.tiltAngle}deg)`);

        return transforms.join(' ');
    };

    const getEntranceAnimation = (index) => {
        const animations = {
            fade: 'animate-fadeIn',
            slide: 'animate-slideUp',
            zoom: 'animate-zoomIn',
            bounce: 'animate-bounceIn',
            none: ''
        };

        return animations[settings.entranceAnimation] || '';
    };

    // Calculate generic responsive value (Safe location)
    const currentItemsPerRow = getItemsPerRow();


    // Empty State & Loading State
    const isLoading = loading || (config.randomize?.enabled && !resolvedFromPlan);

    if (displayCategories.length === 0 && !isLoading) {
        return (
            <div className={`w-full`} style={{ 
                background: settings.sectionBackground,
                paddingTop: formatCSSValue(settings.sectionPaddingTop),
                paddingBottom: formatCSSValue(settings.sectionPaddingBottom)
             }}>
                <div className="max-w-7xl mx-auto px-4">
                    <div
                        className="text-center py-16 rounded-xl"
                        style={{ background: settings.emptyStateBackground }}
                    >
                        <Package className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                        <p className="text-gray-600 text-lg mb-4">{settings.emptyMessage}</p>
                        {settings.showExploreCTA && (
                            <Link
                                href="/categories"
                                className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                            >
                                Explore Categories
                                <ArrowRight className="w-4 h-4" />
                            </Link>
                        )}
                    </div>
                </div>
            </div>
        );
    }


    return (
        <div
            className="w-full relative transition-colors duration-300"
            style={{
                background: settings.sectionBackground,
                paddingTop: formatCSSValue(settings.sectionPaddingTop),
                paddingBottom: formatCSSValue(settings.sectionPaddingBottom)
            }}
        >
            {settings.showSectionTitle && config.fullWidthTitle && (
                <div
                    className="mb-8"
                    style={{
                        textAlign: settings.titleAlign,
                        marginBottom: formatCSSValue(settings.titleBottomMargin)
                    }}
                >
                    <h2
                        className="font-bold"
                        style={{
                            color: settings.sectionTitleColor,
                            fontSize: `clamp(1rem, 0.75rem + 1vw, ${formatCSSValue(settings.titleFontSize)})`,
                            fontWeight: settings.titleFontWeight,
                            fontFamily: 'inherit',
                            backgroundColor: settings.titleBackgroundColor,
                            padding: formatCSSValue(settings.titlePadding)
                        }}
                    >
                        {settings.sectionTitle}
                    </h2>
                    {settings.sectionSubtitle && (
                        <p className="text-gray-600 mt-2">{settings.sectionSubtitle}</p>
                    )}
                </div>
            )}

            <div className="max-w-7xl mx-auto px-4">
                {/* Section Header */}
                {settings.showSectionTitle && !config.fullWidthTitle && (
                    <div
                        className="mb-8"
                        style={{
                            textAlign: settings.titleAlign,
                            marginBottom: formatCSSValue(settings.titleBottomMargin)
                        }}
                    >
                        <h2
                            className="font-bold"
                            style={{
                                color: settings.sectionTitleColor,
                                fontSize: `clamp(1rem, 0.75rem + 1vw, ${formatCSSValue(settings.titleFontSize)})`,
                                fontWeight: settings.titleFontWeight,
                                backgroundColor: settings.titleBackgroundColor,
                                padding: formatCSSValue(settings.titlePadding)
                            }}
                        >
                            {settings.sectionTitle}
                        </h2>
                        {settings.sectionSubtitle && (
                            <p className="text-gray-600 mt-2">{settings.sectionSubtitle}</p>
                        )}
                    </div>
                )}

                {/* Carousel/Grid Container */}
                <div className="relative group">
                    {settings.displayMode === 'carousel' ? (
                        <>
                            {/* Carousel View */}
                            <div
                                className="overflow-hidden"
                                ref={carouselRef}
                                onTouchStart={onTouchStart}
                                onTouchMove={onTouchMove}
                                onTouchEnd={onTouchEnd}
                            >
                                    <div
                                        className={`flex transition-transform duration-${settings.transitionDuration} ${settings.easingFunction}`}
                                        style={{
                                            transform: `translateX(-${currentIndex * (100 / currentItemsPerRow)}%)`
                                        }}
                                    >
                                        {isLoading && displayCategories.length === 0 ? (
                                            /* Render Skeletons in carousel view */
                                            Array.from({ length: settings.randomCount || 6 }).map((_, idx) => (
                                                <div
                                                    key={`skeleton-${idx}`}
                                                    className="flex-shrink-0"
                                                    style={{
                                                        flex: `0 0 ${100 / currentItemsPerRow}%`,
                                                        padding: `${getGapPadding()}px`
                                                    }}
                                                >
                                                    <div className="aspect-square bg-gray-200 animate-pulse rounded-2xl"></div>
                                                </div>
                                            ))
                                        ) : (
                                            displayCategories.map((category, index) => (
                                                <div
                                                    key={`${category.id || category.slug}-${index}`}
                                                    className="flex-shrink-0"
                                                    style={{
                                                        flex: `0 0 ${100 / currentItemsPerRow}%`,
                                                        padding: `${getGapPadding()}px`
                                                    }}
                                                >
                                                    <CategoryCard
                                                        category={category}
                                                        index={index}
                                                        settings={settings}
                                                        deviceType={deviceType}
                                                        getScaledValue={getScaledValue}
                                                        getResponsiveValue={getResponsiveValue}
                                                        isHovered={isHovered === index}
                                                        onHover={() => setIsHovered(index)}
                                                        onLeave={() => setIsHovered(null)}
                                                        getShadowStyles={getShadowStyles}
                                                        getHoverTransform={getHoverTransform}
                                                        getEntranceAnimation={getEntranceAnimation}
                                                        trackClick={trackClick}
                                                        widgetId={widgetId}
                                                    />
                                                </div>
                                            ))
                                        )}
                                    </div>
                            </div>

                            {/* Navigation Arrows */}
                            {settings.showArrows !== 'never' && (
                                <div className={`${settings.showArrows === 'hover' ? 'opacity-0 group-hover:opacity-100' : ''} transition-opacity duration-300`}>
                                    <NavigationArrows
                                        onPrev={handlePrev}
                                        onNext={handleNext}
                                        settings={settings}
                                        currentIndex={currentIndex}
                                        maxIndex={categories.length - Math.floor(currentItemsPerRow)}
                                    />
                                </div>
                            )}

                            {/* Pagination Dots */}
                            {settings.showDots && (
                                <PaginationDots
                                    total={Math.ceil(categories.length / settings.itemsPerRowDesktop)}
                                    current={Math.floor(currentIndex / settings.itemsPerRowDesktop)}
                                    dotStyle={settings.dotStyle}
                                    onClick={(index) => setCurrentIndex(index * settings.itemsPerRowDesktop)}
                                />
                            )}
                        </>
                    ) : (
                        /* Grid View */
                        <>
                            <style dangerouslySetInnerHTML={{
                                __html: `
                                    .category-grid-${settings.itemsPerRowMobile}-${settings.itemsPerRowTablet}-${settings.itemsPerRowDesktop} {
                                        display: grid;
                                        grid-template-columns: repeat(${settings.itemsPerRowMobile}, minmax(0, 1fr));
                                        gap: ${formatCSSValue(settings.gridGap || '12px')};
                                    }
                                    @media (min-width: 768px) {
                                        .category-grid-${settings.itemsPerRowMobile}-${settings.itemsPerRowTablet}-${settings.itemsPerRowDesktop} {
                                            grid-template-columns: repeat(${settings.itemsPerRowTablet}, minmax(0, 1fr));
                                        }
                                    }
                                    @media (min-width: 1024px) {
                                        .category-grid-${settings.itemsPerRowMobile}-${settings.itemsPerRowTablet}-${settings.itemsPerRowDesktop} {
                                            grid-template-columns: repeat(${settings.itemsPerRowDesktop}, minmax(0, 1fr));
                                        }
                                    }
                                `
                            }} />
                            <div className={`category-grid-${settings.itemsPerRowMobile}-${settings.itemsPerRowTablet}-${settings.itemsPerRowDesktop}`}>
                                {isLoading && displayCategories.length === 0 ? (
                                    /* Render Skeletons in grid view */
                                    Array.from({ length: settings.randomCount || 6 }).map((_, idx) => (
                                        <div
                                            key={`skeleton-grid-${idx}`}
                                            className="aspect-square bg-gray-200 animate-pulse rounded-2xl"
                                        ></div>
                                    ))
                                ) : (
                                    displayCategories.map((category, index) => (
                                        <CategoryCard
                                            key={category.id}
                                            category={category}
                                            index={index}
                                            settings={settings}
                                            isHovered={isHovered === index}
                                            onHover={() => setIsHovered(index)}
                                            onLeave={() => setIsHovered(null)}
                                            getShadowStyles={getShadowStyles}
                                            getHoverTransform={getHoverTransform}
                                            getEntranceAnimation={getEntranceAnimation}
                                            trackClick={trackClick}
                                            widgetId={widgetId}
                                        />
                                    ))
                                )}
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

// Category Card Component
function CategoryCard({
    category,
    index,
    settings,
    deviceType,
    getScaledValue,
    getResponsiveValue,
    isHovered,
    onHover,
    onLeave,
    getShadowStyles,
    getHoverTransform,
    getEntranceAnimation,
    trackClick,
    widgetId
}) {
    const cardRef = useRef(null);

    const getShapeClass = () => {
        if (settings.cardShape === 'hexagon') return 'clip-hexagon';
        return '';
    };

    const getRadius = () => {
        if (settings.cardShape === 'circle') return '50%';
        if (settings.cardShape === 'square') return '0';
        if (settings.cardShape === 'hexagon') return '0';

        const r = getResponsiveValue(settings.borderRadius, settings.borderRadius, settings.mobileBorderRadius);
        return `${getScaledValue(r || 16)}px`;
    };

    const getDirection = (dir) => {
        const map = {
            'to-r': 'to right',
            'to-br': 'to bottom right',
            'to-b': 'to bottom',
            'to-bl': 'to bottom left',
            'to-l': 'to left',
            'to-tl': 'to top left',
            'to-t': 'to top',
            'to-tr': 'to top right'
        };
        return map[dir] || dir || 'to bottom right';
    };

    const cardStyle = {
        backgroundImage: settings.backgroundGradient
            ? `linear-gradient(${getDirection(settings.gradientDirection)}, ${settings.gradientStart}, ${settings.gradientEnd})`
            : undefined,
        backgroundColor: settings.backgroundGradient
            ? undefined
            : (settings.glassmorphism ? 'rgba(255, 255, 255, 0.7)' : settings.backgroundColor),
        border: (settings.cardStyle === 'bordered' || (settings.cardStyle === 'custom' && getResponsiveValue(settings.borderWidth, settings.borderWidth, settings.borderWidthMobile) > 0))
            ? `${getScaledValue(getResponsiveValue(settings.borderWidth || 1, settings.borderWidth, settings.borderWidthMobile))}px solid ${settings.borderColor}`
            : 'none',
        boxShadow: isHovered && settings.hoverShadowEnhancement
            ? '0 20px 40px rgba(0, 0, 0, 0.2)'
            : getShadowStyles(),
        transform: getHoverTransform(index),
        transition: `all ${settings.transitionDuration}ms ${settings.easingFunction}`,
        animationDelay: `${index * settings.staggerDelay}ms`,
        backdropFilter: settings.glassmorphism ? 'blur(10px) saturate(180%)' : 'none',
        borderRadius: getRadius(),
    };

    const overlayStyle = {
        background: settings.overlayType === 'gradient'
            ? `linear-gradient(${getDirection(settings.overlayGradientDirection || 'to-t')}, ${settings.overlayColor || '#000000'}00, ${settings.overlayColor || '#000000'}${Math.round((settings.overlayOpacity || 40) * 2.55).toString(16).padStart(2, '0')})`
            : settings.overlayType === 'solid'
                ? `${settings.overlayColor || '#000000'}${Math.round((isHovered ? (settings.overlayOpacityOnHover || 20) : (settings.overlayOpacity || 40)) * 2.55).toString(16).padStart(2, '0')}`
                : 'transparent',
        transition: `all ${settings.transitionDuration}ms ${settings.easingFunction}`,
    };

    const imageStyle = {
        objectFit: settings.imageFit,
        objectPosition: settings.imagePosition,
        transform: isHovered ? `scale(${settings.imageZoomOnHover})` : 'scale(1)',
        filter: settings.imageFilter !== 'none' ? `${settings.imageFilter}(100%)` : 'none',
        transition: `all ${settings.transitionDuration}ms ${settings.easingFunction}`,
    };

    const CategoryContent = ({ isBelow = false }) => {
        const responsiveFontSize = getResponsiveValue(settings.cardTitleFontSizeDesktop, settings.cardTitleFontSizeTablet, settings.cardTitleFontSizeMobile);
        const finalFontSize = responsiveFontSize ? `${getScaledValue(responsiveFontSize)}px` : '18px';

        return (
            <>
                <h3
                    className="font-bold mb-1"
                    style={{
                        fontSize: `clamp(0.9rem, 0.75rem + 1vw, ${formatCSSValue(settings.cardTitleFontSizeDesktop)})`,
                        fontWeight: settings.cardTitleFontWeight,
                        color: isBelow
                            ? (settings.cardTitleColor === '#ffffff' ? '#111827' : settings.cardTitleColor)
                            : (isHovered && settings.titleColorOnHover ? settings.titleColorOnHover : settings.cardTitleColor),
                        textAlign: settings.cardTitleAlignment,
                        transition: `color ${settings.transitionDuration}ms ${settings.easingFunction}`,
                    }}
                >
                    {category.name}
                </h3>
                {settings.showProductCount && (
                    <p className="opacity-90" style={{
                        color: isBelow ? settings.countColor : (settings.contentPositionDesktop === 'overlay' ? 'rgba(255,255,255,0.9)' : settings.countColor),
                        fontSize: `clamp(0.65rem, 0.6rem + 0.3vw, 0.8rem)`,
                        textAlign: settings.cardTitleAlignment,
                    }}>
                        {category.product_count || 0} {settings.countStyle === 'text' ? 'products' : ''}
                    </p>
                )}
            </>
        );
    };

    // Determine layout mode
    const contentPos = getResponsiveValue(settings.contentPositionDesktop, settings.contentPositionDesktop, settings.contentPositionMobile);
    const applyStylesToLink = contentPos === 'overlay';

    // Shared styling classes
    const shapeClasses = `${getShapeClass()} ${getEntranceAnimation(index)} ${settings.hoverAnimation === 'pulse' && isHovered ? 'animate-pulse' : ''
        } ${settings.hoverAnimation === 'glow' && isHovered ? 'ring-4 ring-blue-400 ring-opacity-50' : ''
        }`;

    return (
        <Link
            href={`/categories/${category.slug}?ref_type=widget&ref_id=${widgetId}`}
            ref={cardRef}
            className={`block w-full cursor-pointer group category-card-link ${applyStylesToLink ? `relative overflow-hidden ${shapeClasses}` : ''}`}
            style={applyStylesToLink ? cardStyle : {}}
            onMouseEnter={onHover}
            onMouseLeave={onLeave}
            onClick={() => {
                if (trackClick) {
                    trackClick({
                        entity_type: 'category',
                        entity_id: category.id,
                        placement_id: widgetId,
                        placement_type: 'widget',
                        position: index + 1,
                        metadata: {
                            category_name: category.name,
                            category_slug: category.slug
                        }
                    });
                }
            }}
        >
            {/* Image Container (Styled if text is below, otherwise just aspect ratio wrapper) */}
            <div
                className={`relative ${!applyStylesToLink ? `overflow-hidden ${shapeClasses}` : ''}`}
                style={{
                    ...(applyStylesToLink ? {} : cardStyle),
                    paddingBottom: settings.aspectRatio === '1:1' ? '100%' : settings.aspectRatio === '4:3' ? '75%' : '56.25%'
                }}
            >
                {category.image_url ? (
                    <img
                        src={category.image_url}
                        alt={category.name}
                        className="absolute inset-0 w-full h-full"
                        style={imageStyle}
                        loading="lazy"
                    />
                ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                        <Package className="w-12 h-12 text-gray-400" />
                    </div>
                )}

                {/* Overlay */}
                <div className="absolute inset-0" style={overlayStyle} />

                {/* Badge */}
                {settings.badgeLabel && (
                    <div
                        className={`absolute ${settings.badgePosition === 'top-left' ? 'top-2 left-2' :
                            settings.badgePosition === 'top-right' ? 'top-2 right-2' :
                                'bottom-2 left-2'
                            } bg-red-500 text-white font-bold rounded-full`}
                        style={{
                            padding: `clamp(0.15rem, 0.1rem + 0.2vw, 0.25rem) clamp(0.5rem, 0.4rem + 0.5vw, 0.75rem)`,
                            fontSize: `clamp(0.55rem, 0.45rem + 0.2vw, 0.75rem)`,
                        }}
                    >
                        {settings.badgeLabel}
                    </div>
                )}

                {/* Content Overlay (Only rendered if styles on link/overlay mode) */}
                {applyStylesToLink && (
                    <div className={`absolute inset-0 flex flex-col items-${settings.cardTitleAlignment === 'center' ? 'center' : settings.cardTitleAlignment === 'right' ? 'end' : 'start'} justify-end p-4`}>
                        <CategoryContent />
                    </div>
                )}
            </div>

            {/* Content Below (Only rendered if styles NOT on link/below mode) */}
            {!applyStylesToLink && (
                <div className={`flex flex-col items-${settings.cardTitleAlignment === 'center' ? 'center' : settings.cardTitleAlignment === 'right' ? 'end' : 'start'} pt-3 px-1`}>
                    <CategoryContent isBelow />
                </div>
            )}

            {/* Tooltip */}
            {settings.showTooltip && isHovered && (
                <div className={`absolute ${settings.tooltipPosition === 'top' ? 'bottom-full mb-2' :
                    settings.tooltipPosition === 'bottom' ? 'top-full mt-2' :
                        settings.tooltipPosition === 'left' ? 'right-full mr-2' :
                            'left-full ml-2'
                    } left-1/2 transform -translate-x-1/2 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg whitespace-nowrap z-50 pointer-events-none`}>
                    {settings.tooltipContent === 'description' && category.description}
                    {settings.tooltipContent === 'product-count' && `${category.product_count || 0} products`}
                    <div className={`absolute ${settings.tooltipPosition === 'top' ? 'top-full' :
                        settings.tooltipPosition === 'bottom' ? 'bottom-full' :
                            'top-1/2 transform -translate-y-1/2'
                        } left-1/2 transform -translate-x-1/2 w-0 h-0 border-4 border-transparent ${settings.tooltipPosition === 'top' ? 'border-t-gray-900' :
                            settings.tooltipPosition === 'bottom' ? 'border-b-gray-900' :
                                'border-l-gray-900'
                        }`} />
                </div>
            )
            }
        </Link >
    );
}

// Navigation Arrows Component
function NavigationArrows({ onPrev, onNext, settings, currentIndex, maxIndex }) {
    const arrowClasses = `
        ${settings.arrowShape === 'circle' ? 'rounded-full' : settings.arrowShape === 'square' ? 'rounded-lg' : ''}
        p-3 transition-all duration-300 hover:scale-110
    `;

    const arrowStyle = {
        color: settings.arrowColor,
        background: settings.arrowBackgroundColor,
    };

    const positionClasses = settings.arrowPosition === 'outside'
        ? 'absolute -left-2 md:-left-16 -right-2 md:-right-16 top-1/2 transform -translate-y-1/2'
        : settings.arrowPosition === 'overlay'
            ? 'absolute left-4 right-4 top-1/2 transform -translate-y-1/2'
            : 'absolute left-1 md:left-2 right-1 md:right-2 top-1/2 transform -translate-y-1/2';

    return (
        <div className={`${positionClasses} flex justify-between pointer-events-none`}>
            {/* Pointer events auto for buttons to make them clickable */}
            <button
                onClick={onPrev}
                className={`${arrowClasses} pointer-events-auto`}
                style={arrowStyle}
                disabled={!settings.infiniteLoop && currentIndex === 0}
            >
                <ChevronLeft className="w-6 h-6" />
            </button>
            <button
                onClick={onNext}
                className={`${arrowClasses} pointer-events-auto`}
                style={arrowStyle}
                disabled={!settings.infiniteLoop && currentIndex >= maxIndex}
            >
                <ChevronRight className="w-6 h-6" />
            </button>
        </div>
    );
}

// Pagination Dots Component
function PaginationDots({ total, current, dotStyle, onClick }) {
    return (
        <div className="flex justify-center gap-2 mt-6">
            {Array.from({ length: total }).map((_, index) => (
                <button
                    key={index}
                    onClick={() => onClick(index)}
                    className={`transition-all duration-300 ${dotStyle === 'circle' ? 'w-2 h-2 rounded-full' :
                        dotStyle === 'line' ? 'w-8 h-1 rounded-full' :
                            'w-2 h-2 rounded-sm'
                        } ${current === index ? 'bg-blue-600 scale-125' : 'bg-gray-300 hover:bg-gray-400'
                        }`}
                />
            ))}
        </div>
    );
}
