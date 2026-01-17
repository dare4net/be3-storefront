// Enhanced Hero Widget with extensive customization
'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import * as LucideIcons from 'lucide-react';

export default function HeroWidget({ config }) {
    const {
        layout = 'centered',
        height = { desktop: '600px', tablet: '500px', mobile: '400px' },
        backgroundType = 'image',
        backgroundImage = '',
        videoUrl = '',
        gradient = { type: 'linear', angle: 135, stops: [] },
        parallax = { enabled: false, speed: 0.5 },
        particles = { count: 50, color: '#ffffff', speed: 3 },
        overlay = { enabled: true, type: 'solid', color: '#000000', opacity: 0.5 },

        ctas = [],
        ctaAlignment = ''
    } = config;

    // Handle both string and object formats for title/subtitle
    const titleConfig = typeof config.title === 'string' ? { text: config.title } : (config.title || {});
    const subtitleConfig = typeof config.subtitle === 'string' ? { text: config.subtitle } : (config.subtitle || {});

    const title = {
        text: titleConfig.text || 'Welcome',
        fontSize: titleConfig.fontSize || { desktop: '4.5rem', tablet: '3rem', mobile: '2rem' },
        color: titleConfig.color || '#ffffff',
        fontWeight: titleConfig.fontWeight || '700',
        animation: titleConfig.animation || {}
    };

    const subtitle = {
        text: subtitleConfig.text || '',
        fontSize: subtitleConfig.fontSize || { desktop: '1.5rem', tablet: '1.25rem', mobile: '1rem' },
        color: subtitleConfig.color || '#ffffff',
        animation: subtitleConfig.animation || {}
    };


    const sectionRef = useRef(null);
    const [parallaxOffset, setParallaxOffset] = useState(0);

    // Parallax scroll effect
    useEffect(() => {
        if (!parallax.enabled) return;

        const handleScroll = () => {
            const scrolled = window.scrollY;
            const rate = scrolled * parallax.speed;
            setParallaxOffset(rate);
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, [parallax]);

    // Gradient CSS generation
    const getGradientCSS = () => {
        if (!gradient.stops || gradient.stops.length === 0) {
            return 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
        }

        const stops = gradient.stops
            .map(stop => `${stop.color} ${stop.position}%`)
            .join(', ');

        if (gradient.type === 'radial') {
            return `radial-gradient(circle, ${stops})`;
        }
        return `linear-gradient(${gradient.angle || 135}deg, ${stops})`;
    };

    // Layout classes
    const layoutClasses = {
        centered: 'text-center items-center justify-center',
        left: 'text-left items-center justify-start',
        right: 'text-right items-center justify-end',
        split: 'text-left items-center justify-between flex-row',
        fullscreen: 'text-center items-center justify-center min-h-screen'
    };

    return (
        <>
            <section
                ref={sectionRef}
                className={`relative flex overflow-hidden ${layoutClasses[layout] || layoutClasses.centered}`}
                style={{
                    height: height.desktop,
                    minHeight: height.mobile
                }}
            >
                {/* Background Layer */}
                <div className="absolute inset-0">
                    {backgroundType === 'image' && backgroundImage && (
                        <div
                            className="w-full h-full bg-cover bg-center"
                            style={{
                                backgroundImage: `url(${backgroundImage})`,
                                transform: parallax.enabled ? `translateY(${parallaxOffset}px)` : 'none',
                                transition: 'transform 0.1s ease-out'
                            }}
                        />
                    )}

                    {backgroundType === 'video' && videoUrl && (
                        <video
                            autoPlay
                            loop
                            muted
                            playsInline
                            className="w-full h-full object-cover"
                        >
                            <source src={videoUrl} type="video/mp4" />
                        </video>
                    )}

                    {(backgroundType === 'gradient' || backgroundType === 'particles') && (
                        <div
                            className="w-full h-full absolute inset-0"
                            style={{ background: getGradientCSS() }}
                        />
                    )}

                    {backgroundType === 'particles' && (
                        <ParticlesBackground config={particles} />
                    )}

                    {backgroundType === 'solid' && (
                        <div
                            className="w-full h-full"
                            style={{ backgroundColor: gradient.stops?.[0]?.color || '#667eea' }}
                        />
                    )}

                    {/* Overlay */}
                    {overlay.enabled && (
                        <div
                            className="absolute inset-0"
                            style={{
                                backgroundColor: overlay.color,
                                opacity: overlay.opacity,
                                mixBlendMode: overlay.blendMode || 'normal'
                            }}
                        />
                    )}
                </div>

                {/* Content */}
                <div className={`relative z-10 px-4 max-w-7xl mx-auto w-full ${layout === 'split' ? 'flex items-center justify-between' : ''}`}>
                    <div className={layout === 'split' ? 'w-1/2' : 'max-w-4xl mx-auto'}>
                        {/* Title */}
                        {title.text && (
                            <h1
                                key={`title-${title.animation?.type || 'default'}`}
                                className={`font-bold mb-6 ${getAnimationClass(title.animation)}`}
                                style={{
                                    color: title.color,
                                    fontSize: title.fontSize?.desktop || '4.5rem',
                                    fontWeight: title.fontWeight || '700',
                                    fontFamily: title.fontFamily || 'inherit',
                                    animationDelay: `${title.animation?.delay || 0}ms`
                                }}
                            >
                                {title.text}
                            </h1>
                        )}

                        {/* Subtitle */}
                        {subtitle.text && (
                            <p
                                key={`subtitle-${subtitle.animation?.type || 'default'}`}
                                className={`mb-8 opacity-90 ${getAnimationClass(subtitle.animation)}`}
                                style={{
                                    color: subtitle.color,
                                    fontSize: subtitle.fontSize?.desktop || '1.5rem',
                                    animationDelay: `${subtitle.animation?.delay || 200}ms`
                                }}
                            >
                                {subtitle.text}
                            </p>
                        )}

                        {/* CTA Buttons */}
                        {ctas && ctas.length > 0 && (
                            <div className={`flex gap-4 ${getAlignmentClass(layout, ctaAlignment)} flex-wrap`}>
                                {ctas.map((cta, index) => (
                                    <CTAButton key={`${index}-${cta.animation?.type || 'default'}`} cta={cta} index={index} />
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </section>

            <style jsx global>{`
                @keyframes fade-up {
                    from {
                        opacity: 0;
                        transform: translateY(30px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }

                @keyframes fade-in {
                    from {
                        opacity: 0;
                    }
                    to {
                        opacity: 1;
                    }
                }

                @keyframes slide-left {
                    from {
                        opacity: 0;
                        transform: translateX(30px);
                    }
                    to {
                        opacity: 1;
                        transform: translateX(0);
                    }
                }

                @keyframes zoom-in {
                    from {
                        opacity: 0;
                        transform: scale(0.9);
                    }
                    to {
                        opacity: 1;
                        transform: scale(1);
                    }
                }

                @keyframes fade-down {
                    from {
                        opacity: 0;
                        transform: translateY(-30px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }

                @keyframes slide-right {
                    from {
                        opacity: 0;
                        transform: translateX(-30px);
                    }
                    to {
                        opacity: 1;
                        transform: translateX(0);
                    }
                }

                .animate-fade-up {
                    animation: fade-up 0.8s ease-out forwards;
                    opacity: 0;
                }

                .animate-fade {
                    animation: fade-in 0.8s ease-out forwards;
                    opacity: 0;
                }

                .animate-slide-left {
                    animation: slide-left 0.8s ease-out forwards;
                    opacity: 0;
                }

                .animate-zoom {
                    animation: zoom-in 0.8s ease-out forwards;
                    opacity: 0;
                }

                .animate-slide-up {
                    animation: fade-up 0.8s ease-out forwards;
                    opacity: 0;
                }

                .animate-slide-down {
                    animation: fade-down 0.8s ease-out forwards;
                    opacity: 0;
                }

                .animate-slide-right {
                    animation: slide-right 0.8s ease-out forwards;
                    opacity: 0;
                }
            `}</style>

            <style jsx>{`
                @media (max-width: 768px) {
                    section {
                        height: ${height.mobile} !important;
                    }
                    h1 {
                        font-size: ${title.fontSize?.mobile || '2rem'} !important;
                    }
                    p {
                        font-size: ${subtitle.fontSize?.mobile || '1rem'} !important;
                    }
                }

                @media (min-width: 769px) and (max-width: 1024px) {
                    section {
                        height: ${height.tablet} !important;
                    }
                    h1 {
                        font-size: ${title.fontSize?.tablet || '3rem'} !important;
                    }
                    p {
                        font-size: ${subtitle.fontSize?.tablet || '1.25rem'} !important;
                    }
                }
            `}</style>
        </>
    );
}

// CTA Button Component
function CTAButton({ cta, index }) {
    const Icon = cta.icon && LucideIcons[toPascalCase(cta.icon)];

    const buttonStyles = {
        primary: 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg',
        secondary: 'bg-white hover:bg-gray-100 text-gray-900 shadow-lg',
        outline: 'bg-transparent border-2 border-white hover:bg-white hover:text-gray-900 text-white',
        ghost: 'bg-transparent hover:bg-white/10 text-white'
    };

    return (
        <Link
            href={cta.link || '#'}
            className={`inline-flex items-center gap-2 px-8 py-4 font-semibold rounded-full transition-all hover:scale-105 ${getAnimationClass(cta.animation)} ${buttonStyles[cta.style] || buttonStyles.primary}`}
            style={{
                animationDelay: `${cta.animation?.delay || 400}ms`
            }}
        >
            {cta.text}
            {Icon && <Icon className="w-5 h-5" />}
        </Link>
    );
}

// Particles Background Component
function ParticlesBackground({ config }) {
    const canvasRef = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        canvas.width = canvas.offsetWidth;
        canvas.height = canvas.offsetHeight;

        const particles = [];
        const particleCount = config.count || 50;

        // Create particles
        for (let i = 0; i < particleCount; i++) {
            particles.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height,
                radius: Math.random() * 2 + 1,
                speedX: (Math.random() - 0.5) * (config.speed || 1),
                speedY: (Math.random() - 0.5) * (config.speed || 1)
            });
        }

        // Animation loop
        function animate() {
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            particles.forEach(particle => {
                ctx.beginPath();
                ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
                ctx.fillStyle = config.color || '#ffffff';
                ctx.fill();

                // Update position
                particle.x += particle.speedX;
                particle.y += particle.speedY;

                // Wrap around edges
                if (particle.x < 0) particle.x = canvas.width;
                if (particle.x > canvas.width) particle.x = 0;
                if (particle.y < 0) particle.y = canvas.height;
                if (particle.y > canvas.height) particle.y = 0;
            });

            requestAnimationFrame(animate);
        }

        animate();

        // Handle resize
        const handleResize = () => {
            canvas.width = canvas.offsetWidth;
            canvas.height = canvas.offsetHeight;
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, [config]);

    return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />;
}

// Helper functions
function getAnimationClass(animation) {
    if (!animation || !animation.type || animation.type === 'none') return '';

    const typeMap = {
        'fade-up': 'animate-fade-up',
        'fade-down': 'animate-slide-down',
        'fade': 'animate-fade',
        'slide-left': 'animate-slide-left',
        'slide-right': 'animate-slide-right',
        'slide-up': 'animate-slide-up',
        'zoom': 'animate-zoom'
    };

    return typeMap[animation.type] || 'animate-fade-up';
}

function toPascalCase(str) {
    return str
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join('');
}

function getAlignmentClass(layout, ctaAlignment) {
    if (ctaAlignment === 'center') return 'justify-center';
    if (ctaAlignment === 'right') return 'justify-end';
    if (ctaAlignment === 'left') return 'justify-start';

    // Fallback to layout
    if (layout === 'centered') return 'justify-center';
    if (layout === 'right') return 'justify-end';
    return 'justify-start';
}
