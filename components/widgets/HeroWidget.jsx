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
        carousel = { images: [], transition: 'fade', interval: 5000 },
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
    const getGradientCSS = (customGradient) => {
        const g = customGradient || gradient;
        if (!g?.stops || g.stops.length === 0) {
            return 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
        }

        const stops = g.stops
            .map(stop => `${stop.color} ${stop.position}%`)
            .join(', ');

        if (g.type === 'radial') {
            return `radial-gradient(circle, ${stops})`;
        }
        return `linear-gradient(${g.angle || 135}deg, ${stops})`;
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

                    {backgroundType === 'carousel' && carousel?.images?.length > 0 && (
                        <BackgroundCarousel
                            images={carousel.images}
                            transition={carousel.transition}
                            interval={carousel.interval}
                            parallaxOffset={parallax.enabled ? parallaxOffset : 0}
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

                    {/* Overlay Layer */}
                    {overlay.enabled && (
                        <div
                            className="absolute inset-0 z-10 overflow-hidden"
                            style={{
                                opacity: overlay.opacity ?? 0.5,
                                mixBlendMode: overlay.blendMode || 'normal'
                            }}
                        >
                            {overlay.type === 'solid' && (
                                <div className="absolute inset-0" style={{ backgroundColor: overlay.color || '#000000' }} />
                            )}

                            {overlay.type === 'gradient' && (
                                <div className="absolute inset-0" style={{ background: getGradientCSS(overlay.gradient) }} />
                            )}

                            {overlay.type === 'mesh' && (
                                <MeshOverlay config={overlay.mesh || {}} />
                            )}

                            {overlay.type === 'pattern' && (
                                <PatternOverlay preset={overlay.pattern?.preset || 'polygons'} config={overlay.pattern || {}} />
                            )}

                            {/* Fallback for legacy overlay config */}
                            {(!overlay.type || (overlay.type === 'solid' && !overlay.color)) && !overlay.gradient && !overlay.pattern && (
                                <div className="absolute inset-0" style={{ backgroundColor: overlay.color || '#000000' }} />
                            )}
                        </div>
                    )}
                </div>

                {/* Content */}
                <div className={`relative z-20 px-4 max-w-7xl mx-auto w-full ${layout === 'split' ? 'flex items-center justify-between' : ''}`}>
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

                /* Overlay Animations */
                @keyframes mesh-drift {
                    0% { transform: translate(0, 0) rotate(0deg); }
                    100% { transform: translate(-10%, -10%) rotate(5deg); }
                }
                .animate-mesh-drift {
                    animation: mesh-drift 10s ease infinite alternate;
                }

                @keyframes wave-scroll {
                    from { transform: translateX(0); }
                    to { transform: translateX(-50%); }
                }
                .animate-wave-scroll {
                    animation: wave-scroll 20s linear infinite;
                }

                @keyframes drift-1 {
                    0% { transform: translate(-20%, -20%) scale(1); }
                    50% { transform: translate(50%, 40%) scale(1.2); }
                    100% { transform: translate(-20%, -20%) scale(1); }
                }
                .animate-drift-1 {
                    animation: drift-1 20s infinite linear;
                }

                @keyframes drift-2 {
                    0% { transform: translate(50%, 50%) scale(1.2); }
                    50% { transform: translate(-20%, -10%) scale(1); }
                    100% { transform: translate(50%, 50%) scale(1.2); }
                }
                .animate-drift-2 {
                    animation: drift-2 25s infinite linear;
                }

                @keyframes grid-move {
                    from { background-position: 0 0; }
                    to { background-position: 80px 80px; }
                }
                .animate-grid-move {
                    animation: grid-move 15s linear infinite;
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

// Mesh Overlay Component
/**
 * Background Carousel Component
 */
function BackgroundCarousel({ images, transition = 'fade', interval = 5000, parallaxOffset = 0 }) {
    const [currentIndex, setCurrentIndex] = useState(0);

    useEffect(() => {
        if (images.length <= 1) return;

        const timer = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % images.length);
        }, interval);

        return () => clearInterval(timer);
    }, [images.length, interval]);

    return (
        <div className="absolute inset-0 w-full h-full overflow-hidden">
            {images.map((image, index) => (
                <div
                    key={index}
                    className="absolute inset-0 w-full h-full bg-cover bg-center transition-all duration-1000 ease-in-out"
                    style={{
                        backgroundImage: `url(${image.url})`,
                        opacity: transition === 'fade' ? (index === currentIndex ? 1 : 0) : 1,
                        transform: `
                            ${transition === 'slide' ? `translateX(${(index - currentIndex) * 100}%)` : ''} 
                            ${parallaxOffset ? `translateY(${parallaxOffset}px)` : ''}
                        `,
                        zIndex: index === currentIndex ? 1 : 0,
                        visibility: (transition === 'fade' && index !== currentIndex) ? 'hidden' : 'visible'
                    }}
                />
            ))}
        </div>
    );
}

const MeshOverlay = ({ config }) => {
    const {
        color1 = '#3b82f6',
        color2 = '#8b5cf6',
        color3 = '#ec4899',
        color4 = '#f59e0b',
        speed = 10
    } = config;

    return (
        <div className="absolute inset-0 overflow-hidden">
            <div
                className="absolute top-[-50%] left-[-50%] w-[200%] h-[200%] animate-mesh-drift"
                style={{
                    backgroundColor: color1,
                    backgroundImage: `
                        radial-gradient(circle at 10% 10%, ${color2} 0, transparent 50%),
                        radial-gradient(circle at 90% 10%, ${color3} 0, transparent 50%),
                        radial-gradient(circle at 90% 90%, ${color4} 0, transparent 50%),
                        radial-gradient(circle at 10% 90%, ${color1} 0, transparent 50%)
                    `,
                    filter: 'blur(60px)',
                    animationDuration: `${speed}s`
                }}
            />
        </div>
    );
}

// Pattern Overlay Main Component
function PatternOverlay({ preset, config }) {
    const {
        primaryColor = '#ffffff',
        secondaryColor = '#3b82f6',
        speed = 5,
        density = 50
    } = config;

    switch (preset) {
        case 'polygons':
            return <PatternPolygons color={primaryColor} speed={speed} count={density} />;
        case 'waves':
            return <PatternWaves color={primaryColor} speed={speed} />;
        case 'abstract':
            return <PatternAbstract color1={primaryColor} color2={secondaryColor} speed={speed} />;
        case 'grid':
            return <PatternGrid color={primaryColor} speed={speed} />;
        default:
            return null;
    }
}

function PatternPolygons({ color, speed, count }) {
    const canvasRef = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        let animationFrame;

        const resize = () => {
            const container = canvas.parentElement;
            canvas.width = container.offsetWidth;
            canvas.height = container.offsetHeight;
        };

        window.addEventListener('resize', resize);
        resize();

        const shapes = Array.from({ length: count || 40 }, () => ({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            size: Math.random() * 80 + 20,
            vx: (Math.random() - 0.5) * (speed / 2),
            vy: (Math.random() - 0.5) * (speed / 2),
            angle: Math.random() * Math.PI * 2,
            va: (Math.random() - 0.5) * 0.02
        }));

        const draw = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.strokeStyle = color;
            ctx.lineWidth = 1;
            ctx.globalAlpha = 0.4;

            shapes.forEach(shape => {
                shape.x += shape.vx;
                shape.y += shape.vy;
                shape.angle += shape.va;

                if (shape.x < -100) shape.x = canvas.width + 100;
                if (shape.x > canvas.width + 100) shape.x = -100;
                if (shape.y < -100) shape.y = canvas.height + 100;
                if (shape.y > canvas.height + 100) shape.y = -100;

                ctx.save();
                ctx.translate(shape.x, shape.y);
                ctx.rotate(shape.angle);
                ctx.beginPath();
                ctx.moveTo(-shape.size / 2, -shape.size / 2);
                ctx.lineTo(shape.size / 2, -shape.size / 2);
                ctx.lineTo(0, shape.size / 2);
                ctx.closePath();
                ctx.stroke();
                ctx.restore();
            });

            animationFrame = requestAnimationFrame(draw);
        };

        draw();
        return () => {
            window.removeEventListener('resize', resize);
            cancelAnimationFrame(animationFrame);
        };
    }, [color, speed, count]);

    return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full" />;
}

function PatternWaves({ color, speed }) {
    return (
        <div className="absolute inset-0 pointer-events-none flex items-end opacity-60 overflow-hidden">
            <div className="absolute w-[200%] h-full flex animate-wave-scroll" style={{ animationDuration: `${20 / speed}s` }}>
                <svg className="w-1/2 h-full" viewBox="0 0 1440 320" preserveAspectRatio="none">
                    <path fill={color} d="M0,192L48,176C96,160,192,128,288,144C384,160,480,224,576,218.7C672,213,768,139,864,128C960,117,1056,171,1152,186.7C1248,203,1344,181,1392,170.7L1440,160L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
                </svg>
                <svg className="w-1/2 h-full" viewBox="0 0 1440 320" preserveAspectRatio="none">
                    <path fill={color} d="M0,192L48,176C96,160,192,128,288,144C384,160,480,224,576,218.7C672,213,768,139,864,128C960,117,1056,171,1152,186.7C1248,203,1344,181,1392,170.7L1440,160L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path>
                </svg>
            </div>
        </div>
    );
}

function PatternAbstract({ color1, color2, speed }) {
    return (
        <div className="absolute inset-0 overflow-hidden">
            <div className="absolute top-[10%] left-[10%] w-[60%] h-[60%] animate-drift-1 rounded-full" style={{ background: `radial-gradient(circle, ${color1}, transparent 70%)`, filter: 'blur(60px)', animationDuration: `${20 / speed}s` }} />
            <div className="absolute bottom-[10%] right-[10%] w-[60%] h-[60%] animate-drift-2 rounded-full" style={{ background: `radial-gradient(circle, ${color2}, transparent 70%)`, filter: 'blur(60px)', animationDuration: `${25 / speed}s` }} />
        </div>
    );
}

function PatternGrid({ color, speed }) {
    return (
        <div className="absolute inset-0">
            <div
                className="w-full h-full animate-grid-move"
                style={{
                    backgroundImage: `linear-gradient(to right, ${color} 1px, transparent 1px), linear-gradient(to bottom, ${color} 1px, transparent 1px)`,
                    backgroundSize: '80px 80px',
                    animationDuration: `${15 / speed}s`
                }}
            />
        </div>
    );
}

// CTA Button Component
function CTAButton({ cta, index }) {
    const Icon = cta.icon && LucideIcons[toPascalCase(cta.icon)];

    const buttonStyles = {
        primary: 'btn-theme-primary bg-blue-600 hover:bg-blue-700 text-white shadow-lg',
        secondary: 'btn-theme-secondary bg-white hover:bg-gray-100 text-gray-900 shadow-lg',
        outline: 'bg-transparent border-2 border-white hover:bg-white hover:text-gray-900 text-white',
        ghost: 'bg-transparent hover:bg-white/10 text-white'
    };

    return (
        <Link
            href={cta.link || '#'}
            className={`inline-flex items-center gap-2 px-8 py-4 font-semibold rounded-full transition-all hover:scale-105 ${getAnimationClass(cta.animation)} ${buttonStyles[cta.style] || buttonStyles.primary}`}
            style={{
                backgroundColor: cta.style === 'primary' || !cta.style ? 'var(--btn-primary-bg, var(--primary))' : undefined,
                color: cta.style === 'primary' || !cta.style ? 'var(--btn-primary-text, #ffffff)' : undefined,
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
        const container = canvas.parentElement;
        canvas.width = container.offsetWidth;
        canvas.height = container.offsetHeight;

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
            canvas.width = container.offsetWidth;
            canvas.height = container.offsetHeight;
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
