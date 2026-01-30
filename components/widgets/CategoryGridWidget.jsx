'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import Link from 'next/link';
import { Folder } from 'lucide-react';
import { proxyApi as api } from '@/lib/axios';
import { useRandomizationData } from '@/lib/hooks/useRandomizationData';
import { applyCategoryRandomization } from '@/lib/utils/widgetRandomizer';

function CategoryCard({ category, config = {} }) {
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
    const overlayType = config.overlayType || 'gradient'; // 'none', 'gradient', 'solid'
    const overlayColor = config.overlayColor || '#000000';
    const overlayOpacity = config.overlayOpacity || 40; // 0-100
    const overlayGradientDirection = config.overlayGradientDirection || 'to-t'; // 'to-t', 'to-b', 'to-l', 'to-r', 'to-tl', 'to-tr', 'to-bl', 'to-br'

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

    const fontSize = deviceType === 'mobile' ? titleFontSizeMobile : deviceType === 'tablet' ? titleFontSizeTablet : titleFontSizeDesktop;

    const textStyle = {
        fontSize: `${fontSize}px`,
        fontWeight: titleFontWeight,
        color: titleColor,
        textAlign: titleAlignment === 'center' ? 'center' : titleAlignment === 'right' ? 'right' : 'left'
    };

    // Helper to convert gradient direction to CSS
    const getGradientDirection = (dir) => {
        const directions = {
            'to-t': 'to top',
            'to-b': 'to bottom',
            'to-l': 'to left',
            'to-r': 'to right',
            'to-tl': 'to top left',
            'to-tr': 'to top right',
            'to-bl': 'to bottom left',
            'to-br': 'to bottom right'
        };
        return directions[dir] || 'to top';
    };

    // Build overlay style
    const getOverlayStyle = () => {
        if (overlayType === 'none') return { background: 'transparent' };

        const opacityHex = Math.round(overlayOpacity * 2.55).toString(16).padStart(2, '0');

        if (overlayType === 'gradient') {
            return {
                background: `linear-gradient(${getGradientDirection(overlayGradientDirection)}, ${overlayColor}00, ${overlayColor}${opacityHex})`
            };
        } else {
            // solid
            return {
                background: `${overlayColor}${opacityHex}`
            };
        }
    };

    return (
        <Link
            href={`/categories/${category.slug || category.id}`}
            className="group block h-full w-full"
        >
            <div className={`relative ${isBento ? 'h-full w-full' : 'aspect-square'} rounded-2xl overflow-hidden bg-gradient-to-br from-pink-500 to-orange-500 hover:scale-[1.02] transition-transform flex items-center justify-center border-2 border-white shadow-lg`}>
                {/* Always show High-Contrast Folder (Yellow) as base layer/fallback */}
                <Folder className={`w-16 h-16 text-yellow-300 absolute z-0 transition-opacity duration-300 ${imageLoaded && !imageError ? 'opacity-0' : 'opacity-100'}`} style={{ top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }} />

                {/* Image Layer - Always visible when loaded */}
                {category.image_url && !imageError && (
                    <img
                        src={category.image_url}
                        alt={category.name}
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
                        {category.name}
                    </h3>
                </div>
            </div>
        </Link>
    );
}

export default function CategoryGridWidget({ config }) {
    const {
        title = "Shop by Category",
        sourceType = 'top-level',
        parentCategoryId = null,
        manualCategoryIds = [],
        randomCount = 6,
        sortOrder = 'alphabetical',
        maxCategories = 12,

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
        sectionBackground = 'transparent',

        columns = { desktop: 5, tablet: 3, mobile: 2 },
        layoutMode = 'grid', // 'grid' | 'bento'
        enableEntryAnimation = false
    } = config;

    const isBento = layoutMode === 'bento';

    const [categories, setCategories] = useState([]);

    // Fetch randomization data if randomization is enabled
    const { data: randomizationData, loading: randomizationLoading } = useRandomizationData();

    // Apply randomization to config
    const randomizedConfig = useMemo(() => {
        if (!config.randomize?.enabled || randomizationLoading || !randomizationData) {
            return config;
        }
        return applyCategoryRandomization(config, randomizationData);
    }, [config, randomizationData, randomizationLoading]);

    // Use randomized config values
    const effectiveSourceType = randomizedConfig.sourceType || sourceType;
    const effectiveParentCategoryId = randomizedConfig.parentCategoryId || parentCategoryId;
    const effectiveSortOrder = randomizedConfig.sortOrder || sortOrder;
    const effectiveMaxCategories = randomizedConfig.maxCategories || maxCategories;
    const effectiveRandomCount = randomizedConfig.randomCount || randomCount;
    const effectiveManualCategoryIds = randomizedConfig.manualCategoryIds || manualCategoryIds;

    useEffect(() => {
        fetchCategories();
    }, [effectiveSourceType, effectiveParentCategoryId, effectiveSortOrder, effectiveMaxCategories, effectiveRandomCount, JSON.stringify(effectiveManualCategoryIds)]);

    const fetchCategories = async () => {
        try {
            const res = await api.get('/api/categories');
            let filtered = res.data.categories || [];

            // Apply filtering based on source type
            switch (effectiveSourceType) {
                case 'all':
                    // Use all categories
                    break;
                case 'top-level':
                    filtered = filtered.filter(cat => !cat.parent_id);
                    break;
                case 'subcategories':
                    if (effectiveParentCategoryId) {
                        filtered = filtered.filter(cat => cat.parent_id === effectiveParentCategoryId);
                    }
                    break;
                case 'all-subcategories':
                    filtered = filtered.filter(cat => cat.parent_id);
                    break;
                case 'manual':
                    filtered = filtered.filter(cat => effectiveManualCategoryIds.includes(cat.id));
                    break;
                case 'random':
                    filtered = filtered.sort(() => 0.5 - Math.random());
                    break;
            }

            // Apply sorting
            if (effectiveSortOrder === 'alphabetical') {
                filtered.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
            } else if (effectiveSortOrder === 'random') {
                filtered.sort(() => 0.5 - Math.random());
            }

            // Apply max limit
            if (effectiveMaxCategories) {
                filtered = filtered.slice(0, effectiveMaxCategories);
            }

            setCategories(filtered);
        } catch (error) {
            console.error('Failed to fetch categories', error);
        }
    };

    // Helper to format CSS values (append px if numeric)
    const formatCSSValue = (val) => {
        if (!val || val === '0') return '0';
        if (/^\d+(\.\d+)?$/.test(val.toString())) return `${val}px`;
        return val;
    };

    const styles = {
        title: {
            color: titleColor,
            fontSize: formatCSSValue(titleFontSize),
            fontWeight: titleFontWeight,
            textAlign: titleAlign,
            backgroundColor: titleBackgroundColor,
            padding: formatCSSValue(titlePadding),
            marginBottom: formatCSSValue(titleBottomMargin)
        }
    };

    return (
        <section
            className="transition-colors duration-300"
            style={{
                paddingTop: formatCSSValue(sectionPaddingTop),
                paddingBottom: formatCSSValue(sectionPaddingBottom),
                backgroundColor: sectionBackground
            }}
        >
            {showTitle && title && config.fullWidthTitle && (
                <h2
                    className="font-bold"
                    style={styles.title}
                >
                    {title}
                </h2>
            )}

            <div className="container mx-auto px-4">
                {showTitle && title && !config.fullWidthTitle && (
                    <h2
                        className="font-bold"
                        style={styles.title}
                    >
                        {title}
                    </h2>
                )}

                <>
                    <style dangerouslySetInnerHTML={{
                        __html: `
                            .category-grid-widget-${columns?.mobile || 2}-${columns?.tablet || 3}-${columns?.desktop || 4} {
                                display: grid;
                                grid-template-columns: repeat(${columns?.mobile || 2}, minmax(0, 1fr));
                                gap: ${formatCSSValue(gridGap)};
                            }
                            @media (min-width: 768px) {
                                .category-grid-widget-${columns?.mobile || 2}-${columns?.tablet || 3}-${columns?.desktop || 4} {
                                    grid-template-columns: repeat(${columns?.tablet || 3}, minmax(0, 1fr));
                                }
                            }
                            @media (min-width: 1024px) {
                                .category-grid-widget-${columns?.mobile || 2}-${columns?.tablet || 3}-${columns?.desktop || 4} {
                                    grid-template-columns: repeat(${columns?.desktop || 4}, minmax(0, 1fr));
                                }
                            }
                        `
                    }} />
                    {isBento && (
                        <style dangerouslySetInnerHTML={{
                            __html: `
                            .bento-grid {
                                display: grid;
                                grid-template-columns: repeat(2, 1fr);
                                grid-auto-rows: minmax(180px, auto);
                                gap: ${formatCSSValue(gridGap || '12px')};
                                grid-auto-flow: dense;
                            }
                            
                            /* Mobile Pattern (Strict 2-Column Masonry) 
                                Items never span full width (span 2) to maintain distinct 2 columns */
                            .bento-item-0 { grid-column: span 1; grid-row: span 2; } /* Tall, not Wide */
                            .bento-item-3 { grid-column: span 1; grid-row: span 2; } /* Tall */
                            .bento-item-6 { grid-column: span 1; grid-row: span 2; } /* Another Tall for variety */
                            
                            @media (min-width: 768px) {
                                .bento-grid {
                                    grid-template-columns: repeat(3, 1fr);
                                    grid-auto-rows: minmax(220px, auto);
                                }
                                /* Tablet Pattern (3 cols) */
                                .bento-item-0 { grid-column: span 2; grid-row: span 2; } /* Restore Big Hero */
                                .bento-item-1 { grid-column: span 1; grid-row: span 1; }
                                .bento-item-2 { grid-column: span 1; grid-row: span 2; } 
                                .bento-item-3 { grid-column: span 2; grid-row: span 1; } /* Restore Wide */
                                .bento-item-4 { grid-column: span 1; grid-row: span 1; }
                                .bento-item-5 { grid-column: span 1; grid-row: span 1; }
                                .bento-item-6 { grid-column: span 1; grid-row: span 1; } /* Reset mobile overrides */
                            }

                            @media (min-width: 1024px) {
                                .bento-grid {
                                    grid-template-columns: repeat(4, 1fr);
                                    grid-auto-rows: minmax(240px, auto);
                                }
                                /* Desktop Pattern (4 cols) */
                                .bento-item-0 { grid-column: span 2; grid-row: span 2; }
                                .bento-item-1 { grid-column: span 1; grid-row: span 1; }
                                .bento-item-2 { grid-column: span 1; grid-row: span 1; }
                                .bento-item-3 { grid-column: span 1; grid-row: span 2; }
                                .bento-item-4 { grid-column: span 1; grid-row: span 1; }
                                .bento-item-5 { grid-column: span 2; grid-row: span 1; }
                                .bento-item-6 { grid-column: span 1; grid-row: span 1; }
                                .bento-item-7 { grid-column: span 1; grid-row: span 1; }
                            }
                            `
                        }} />
                    )}

                    {enableEntryAnimation && (
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
                    )}

                    <div className={isBento ? 'bento-grid' : `category-grid-widget-${columns?.mobile || 2}-${columns?.tablet || 3}-${columns?.desktop || 4}`}>
                        {categories.map((category, index) => (
                            <AnimatedItem
                                key={category.id}
                                delayIndex={index % 6} // Slightly larger stagger loop for categories
                                enabled={enableEntryAnimation}
                                className={isBento ? `bento-item-${index % 8}` : ''}
                                style={isBento ? { minHeight: '200px' } : {}}
                            >
                                <CategoryCard
                                    category={category}
                                    config={{ ...config, isBento }}
                                />
                            </AnimatedItem>
                        ))}
                    </div>
                </>
            </div>
        </section>
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
