// Enhanced Features Widget with extensive customization
'use client';

import { useEffect, useRef, useState } from 'react';
import * as LucideIcons from 'lucide-react';
import Link from 'next/link';

export default function FeaturesWidget({ config }) {
    const {
        layout = 'grid',
        columns = { desktop: 4, tablet: 2, mobile: 1 },
        gap = { x: '2rem', y: '2rem' },
        features = [],
        cardStyle = {},
        hoverEffect = 'lift',
        entranceAnimation = 'fade',
        staggerDelay = 100,
        sectionBackground = { type: 'solid', color: '#ffffff' }
    } = config;

    if (!features || features.length === 0) return null;

    // Generate background CSS
    const getBackgroundCSS = () => {
        if (sectionBackground.type === 'gradient' && sectionBackground.gradient) {
            const stops = sectionBackground.gradient.stops
                ?.map(stop => `${stop.color} ${stop.position}%`)
                .join(', ') || '#ffffff 0%, #f9fafb 100%';
            return sectionBackground.gradient.type === 'radial'
                ? `radial-gradient(circle, ${stops})`
                : `linear-gradient(${sectionBackground.gradient.angle || 135}deg, ${stops})`;
        }
        if (sectionBackground.type === 'image' && sectionBackground.image) {
            return `url(${sectionBackground.image})`;
        }
        return sectionBackground.color || '#ffffff';
    };

    const backgroundStyle = sectionBackground.type === 'image'
        ? { backgroundImage: getBackgroundCSS(), backgroundSize: 'cover', backgroundPosition: 'center' }
        : { background: getBackgroundCSS() };

    return (
        <>
            <section className="py-16 relative" style={backgroundStyle}>
                <div className="container mx-auto px-4">
                    {layout === 'grid' && (
                        <div
                            className={`grid gap-${gap.y === '2rem' ? '8' : '6'}`}
                            style={{
                                gridTemplateColumns: `repeat(${columns.desktop}, 1fr)`,
                                gap: `${gap.y} ${gap.x}`
                            }}
                        >
                            {features.map((feature, index) => (
                                <FeatureCard
                                    key={index}
                                    feature={feature}
                                    cardStyle={cardStyle}
                                    hoverEffect={hoverEffect}
                                    entranceAnimation={entranceAnimation}
                                    animationDelay={index * staggerDelay}
                                />
                            ))}
                        </div>
                    )}

                    {layout === 'carousel' && (
                        <FeaturesCarousel
                            features={features}
                            cardStyle={cardStyle}
                            hoverEffect={hoverEffect}
                        />
                    )}

                    {layout === 'masonry' && (
                        <FeaturesMasonry
                            features={features}
                            cardStyle={cardStyle}
                            hoverEffect={hoverEffect}
                            columns={columns}
                        />
                    )}

                    {layout === 'timeline' && (
                        <FeaturesTimeline
                            features={features}
                            cardStyle={cardStyle}
                        />
                    )}
                </div>
            </section>

            <style jsx>{`
                @media (max-width: 768px) {
                    .grid {
                        grid-template-columns: repeat(${columns.mobile}, 1fr) !important;
                    }
                }

                @media (min-width: 769px) and (max-width: 1024px) {
                    .grid {
                        grid-template-columns: repeat(${columns.tablet}, 1fr) !important;
                    }
                }
            `}</style>
        </>
    );
}

// Feature Card Component
function FeatureCard({ feature, cardStyle, hoverEffect, entranceAnimation, animationDelay }) {
    const [isVisible, setIsVisible] = useState(false);
    const cardRef = useRef(null);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting) {
                    setIsVisible(true);
                }
            },
            { threshold: 0.1 }
        );

        if (cardRef.current) {
            observer.observe(cardRef.current);
        }

        return () => observer.disconnect();
    }, []);

    const Icon = feature.iconType === 'lucide' && feature.iconName
        ? LucideIcons[toPascalCase(feature.iconName)]
        : null;

    const hoverEffectClasses = {
        none: '',
        lift: 'hover:-translate-y-2 hover:shadow-xl',
        scale: 'hover:scale-105',
        glow: 'hover:shadow-2xl hover:shadow-blue-500/50',
        tilt: 'hover:rotate-1'
    };

    const animationClasses = {
        none: '',
        fade: isVisible ? 'animate-fade-in' : 'opacity-0',
        'slide-up': isVisible ? 'animate-slide-up' : 'opacity-0',
        'slide-left': isVisible ? 'animate-slide-left' : 'opacity-0',
        zoom: isVisible ? 'animate-zoom' : 'opacity-0'
    };

    const shadowClasses = {
        none: '',
        sm: 'shadow-sm',
        medium: 'shadow-md',
        lg: 'shadow-lg'
    };

    const CardWrapper = feature.link ? Link : 'div';
    const cardProps = feature.link ? { href: feature.link } : {};

    return (
        <CardWrapper
            {...cardProps}
            ref={cardRef}
            className={`group transition-all duration-300 ${hoverEffectClasses[hoverEffect] || hoverEffectClasses.lift} ${animationClasses[entranceAnimation] || ''} ${shadowClasses[cardStyle.shadow] || 'shadow-md'}`}
            style={{
                backgroundColor: cardStyle.backgroundColor || '#ffffff',
                padding: cardStyle.padding || '2rem',
                borderRadius: `${cardStyle.borderRadius || 12}px`,
                border: cardStyle.border?.width ? `${cardStyle.border.width} ${cardStyle.border.style || 'solid'} ${cardStyle.border.color || '#e5e7eb'}` : 'none',
                animationDelay: `${animationDelay || 0}ms`,
                cursor: feature.link ? 'pointer' : 'default'
            }}
        >
            {/* Icon */}
            <div
                className="mb-4 inline-flex items-center justify-center rounded-xl transition-transform group-hover:scale-110"
                style={{
                    backgroundColor: feature.iconBackground || '#eff6ff',
                    width: `${parseInt(feature.iconSize) + 16 || 64}px`,
                    height: `${parseInt(feature.iconSize) + 16 || 64}px`
                }}
            >
                {feature.iconType === 'lucide' && Icon && (
                    <Icon
                        style={{
                            color: feature.iconColor || '#3b82f6',
                            width: `${feature.iconSize || 48}px`,
                            height: `${feature.iconSize || 48}px`
                        }}
                    />
                )}

                {feature.iconType === 'custom' && feature.iconImage && (
                    <img
                        src={feature.iconImage}
                        alt={feature.title}
                        style={{
                            width: `${feature.iconSize || 48}px`,
                            height: `${feature.iconSize || 48}px`,
                            objectFit: 'contain'
                        }}
                    />
                )}

                {feature.iconType === 'emoji' && (
                    <span style={{ fontSize: `${feature.iconSize || 48}px` }}>
                        {feature.emoji || '⭐'}
                    </span>
                )}
            </div>

            {/* Title */}
            <h3 className="font-bold text-lg mb-2 group-hover:text-blue-600 transition-colors">
                {feature.title}
            </h3>

            {/* Description */}
            <p className="text-gray-600 text-sm leading-relaxed">
                {feature.description}
            </p>
        </CardWrapper>
    );
}

// Carousel Layout
function FeaturesCarousel({ features, cardStyle, hoverEffect }) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [itemsPerView, setItemsPerView] = useState(3);

    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth < 768) setItemsPerView(1);
            else if (window.innerWidth < 1024) setItemsPerView(2);
            else setItemsPerView(3);
        };

        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const next = () => {
        setCurrentIndex((prev) => (prev + 1) % features.length);
    };

    const prev = () => {
        setCurrentIndex((prev) => (prev - 1 + features.length) % features.length);
    };

    return (
        <div className="relative">
            <div className="overflow-hidden">
                <div
                    className="flex transition-transform duration-500 gap-4"
                    style={{
                        transform: `translateX(-${(currentIndex * 100) / itemsPerView}%)`
                    }}
                >
                    {features.map((feature, index) => (
                        <div
                            key={index}
                            style={{ minWidth: `${100 / itemsPerView}%` }}
                            className="px-2"
                        >
                            <FeatureCard
                                feature={feature}
                                cardStyle={cardStyle}
                                hoverEffect={hoverEffect}
                                entranceAnimation="none"
                            />
                        </div>
                    ))}
                </div>
            </div>

            {/* Navigation Buttons */}
            <button
                onClick={prev}
                className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 bg-white rounded-full p-3 shadow-lg hover:bg-gray-100 transition"
            >
                <LucideIcons.ChevronLeft className="w-6 h-6" />
            </button>
            <button
                onClick={next}
                className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 bg-white rounded-full p-3 shadow-lg hover:bg-gray-100 transition"
            >
                <LucideIcons.ChevronRight className="w-6 h-6" />
            </button>
        </div>
    );
}

// Masonry Layout
function FeaturesMasonry({ features, cardStyle, hoverEffect, columns }) {
    return (
        <div
            className="masonry-grid"
            style={{
                columnCount: columns.desktop,
                columnGap: '2rem'
            }}
        >
            {features.map((feature, index) => (
                <div key={index} className="masonry-item mb-8 break-inside-avoid">
                    <FeatureCard
                        feature={feature}
                        cardStyle={cardStyle}
                        hoverEffect={hoverEffect}
                        entranceAnimation="fade"
                        animationDelay={index * 100}
                    />
                </div>
            ))}

            <style jsx>{`
                @media (max-width: 768px) {
                    .masonry-grid {
                        column-count: ${columns.mobile} !important;
                    }
                }

                @media (min-width: 769px) and (max-width: 1024px) {
                    .masonry-grid {
                        column-count: ${columns.tablet} !important;
                    }
                }
            `}</style>
        </div>
    );
}

// Timeline Layout
function FeaturesTimeline({ features, cardStyle }) {
    return (
        <div className="max-w-4xl mx-auto relative">
            {/* Vertical Line */}
            <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-gray-300 -translate-x-1/2" />

            {features.map((feature, index) => {
                const Icon = feature.iconType === 'lucide' && feature.iconName
                    ? LucideIcons[toPascalCase(feature.iconName)]
                    : null;

                return (
                    <div
                        key={index}
                        className={`relative flex items-center mb-12 ${index % 2 === 0 ? 'flex-row' : 'flex-row-reverse'}`}
                    >
                        {/* Timeline Marker */}
                        <div className="absolute left-1/2 -translate-x-1/2 w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center z-10">
                            {Icon && <Icon className="w-6 h-6 text-white" />}
                        </div>

                        {/* Content Card */}
                        <div className={`w-5/12 ${index % 2 === 0 ? 'pr-12 text-right' : 'pl-12 text-left'}`}>
                            <FeatureCard
                                feature={feature}
                                cardStyle={cardStyle}
                                hoverEffect="lift"
                                entranceAnimation="fade"
                                animationDelay={index * 150}
                            />
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

// Helper function
function toPascalCase(str) {
    return str
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join('');
}
