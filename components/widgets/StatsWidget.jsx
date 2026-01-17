// Enhanced Stats Counter Widget with extensive customization
'use client';

import { useEffect, useState, useRef } from 'react';
import * as LucideIcons from 'lucide-react';

export default function StatsWidget({ config }) {
    const {
        layout = 'horizontal',
        columns = { desktop: 4, tablet: 2, mobile: 2 },
        stats = [],
        textColor = '#ffffff',
        valueSize = { desktop: '4rem', tablet: '3rem', mobile: '2.5rem' },
        labelSize = { desktop: '1.25rem', tablet: '1rem', mobile: '0.875rem' },
        background = { type: 'gradient', gradient: {} },
        separator = { enabled: true, color: 'rgba(255,255,255,0.2)', width: 1 }
    } = config;

    if (!stats || stats.length === 0) return null;

    // Generate background CSS
    const getBackgroundCSS = () => {
        if (background.type === 'gradient' && background.gradient) {
            const stops = background.gradient.stops
                ?.map(stop => `${stop.color} ${stop.position}%`)
                .join(', ') || '#3b82f6 0%, #8b5cf6 100%';
            return background.gradient.type === 'radial'
                ? `radial-gradient(circle, ${stops})`
                : `linear-gradient(${background.gradient.angle || 45}deg, ${stops})`;
        }
        if (background.type === 'image' && background.image) {
            return `url(${background.image})`;
        }
        if (background.type === 'solid') {
            return background.color || '#3b82f6';
        }
        return 'linear-gradient(45deg, #3b82f6 0%, #8b5cf6 100%)';
    };

    const backgroundStyle = background.type === 'image'
        ? { backgroundImage: getBackgroundCSS(), backgroundSize: 'cover', backgroundPosition: 'center' }
        : { background: getBackgroundCSS() };

    return (
        <>
            <section className="py-20 relative overflow-hidden" style={backgroundStyle}>
                {/* Video Background */}
                {background.type === 'video' && background.video && (
                    <video
                        autoPlay
                        loop
                        muted
                        playsInline
                        className="absolute inset-0 w-full h-full object-cover"
                    >
                        <source src={background.video} type="video/mp4" />
                    </video>
                )}

                {/* Overlay */}
                {background.overlay?.enabled && (
                    <div
                        className="absolute inset-0 bg-black"
                        style={{ opacity: background.overlay.opacity || 0.7 }}
                    />
                )}

                <div className="container mx-auto px-4 relative z-10">
                    <div
                        className={`grid gap-8 ${separator.enabled ? 'divide-x-0' : ''}`}
                        style={{
                            gridTemplateColumns: `repeat(${columns.desktop}, 1fr)`
                        }}
                    >
                        {stats.map((stat, index) => (
                            <div key={index} className="stats-item-wrapper relative">
                                <StatCounter
                                    stat={stat}
                                    textColor={textColor}
                                    valueSize={valueSize}
                                    labelSize={labelSize}
                                />

                                {/* Separator */}
                                {separator.enabled && index < stats.length - 1 && (
                                    <div
                                        className="absolute right-0 top-1/2 -translate-y-1/2 h-3/4 hidden md:block"
                                        style={{
                                            width: `${separator.width}px`,
                                            backgroundColor: separator.color
                                        }}
                                    />
                                )}
                            </div>
                        ))}
                    </div>
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

function StatCounter({ stat, textColor, valueSize, labelSize }) {
    const [count, setCount] = useState(0);
    const [isVisible, setIsVisible] = useState(false);
    const ref = useRef(null);
    const hasAnimated = useRef(false);

    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                if (entry.isIntersecting && !hasAnimated.current) {
                    setIsVisible(true);
                    animateCount();
                    hasAnimated.current = true;
                }
            },
            { threshold: 0.1 }
        );

        if (ref.current) {
            observer.observe(ref.current);
        }

        return () => observer.disconnect();
    }, []);

    const animateCount = () => {
        const target = parseFloat(stat.value || 0);
        const duration = stat.animationDuration || 2000;
        const startTime = Date.now();
        const decimals = stat.decimals || 0;

        const easing = {
            easeOutExpo: (t) => t === 1 ? 1 : 1 - Math.pow(2, -10 * t),
            easeOutQuad: (t) => t * (2 - t),
            linear: (t) => t,
            easeInOutCubic: (t) => t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1
        };

        const easingFunc = easing[stat.animationEasing] || easing.easeOutExpo;

        const animate = () => {
            const now = Date.now();
            const elapsed = now - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const easedProgress = easingFunc(progress);
            const currentCount = easedProgress * target;

            setCount(currentCount);

            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                setCount(target);
            }
        };

        requestAnimationFrame(animate);
    };

    // Format number based on stat configuration
    const formatNumber = (num) => {
        const decimals = stat.decimals || 0;
        const formatted = num.toFixed(decimals);

        if (stat.format === 'currency') {
            return parseFloat(formatted).toLocaleString('en-US', {
                minimumFractionDigits: decimals,
                maximumFractionDigits: decimals
            });
        }

        if (stat.format === 'percentage') {
            return parseFloat(formatted).toLocaleString('en-US', {
                minimumFractionDigits: decimals,
                maximumFractionDigits: decimals
            });
        }

        // Standard number format with separator
        if (stat.separator === ',') {
            return parseFloat(formatted).toLocaleString('en-US', {
                minimumFractionDigits: decimals,
                maximumFractionDigits: decimals
            });
        }

        return formatted;
    };

    const Icon = stat.icon ? LucideIcons[toPascalCase(stat.icon)] : null;

    return (
        <div
            ref={ref}
            className={`text-center transition-all duration-500 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}
            style={{ color: textColor }}
        >
            {/* Icon */}
            {Icon && (
                <div className="mb-3 flex justify-center">
                    <Icon
                        className="w-12 h-12 opacity-80"
                        style={{ color: stat.iconColor || textColor }}
                    />
                </div>
            )}

            {/* Value */}
            <div
                className="font-bold mb-2 leading-none"
                style={{
                    fontSize: valueSize.desktop
                }}
            >
                <span className="inline-block">
                    {stat.prefix && <span className="opacity-90">{stat.prefix}</span>}
                    {formatNumber(count)}
                    {stat.suffix && <span className="opacity-90">{stat.suffix}</span>}
                </span>
            </div>

            {/* Label */}
            <div
                className="opacity-90 font-medium"
                style={{
                    fontSize: labelSize.desktop
                }}
            >
                {stat.label}
            </div>

            <style jsx>{`
                @media (max-width: 768px) {
                    .font-bold {
                        font-size: ${valueSize.mobile} !important;
                    }
                    .font-medium {
                        font-size: ${labelSize.mobile} !important;
                    }
                }

                @media (min-width: 769px) and (max-width: 1024px) {
                    .font-bold {
                        font-size: ${valueSize.tablet} !important;
                    }
                    .font-medium {
                        font-size: ${labelSize.tablet} !important;
                    }
                }
            `}</style>
        </div>
    );
}

function toPascalCase(str) {
    return str
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join('');
}
