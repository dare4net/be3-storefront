// Testimonials Widget - Customer reviews carousel
'use client';

import { useState, useEffect } from 'react';
import { Star, ChevronLeft, ChevronRight, Quote } from 'lucide-react';

export default function TestimonialsWidget({ config }) {
    const {
        testimonials = [],
        layout = 'carousel', // 'carousel' | 'grid'
        autoPlay = true,
        interval = 5000,
        backgroundColor = '#f9fafb',
        title = 'What Our Customers Say',
        titleColor = '#111827',
        showImage = true,
        showRole = true,
        showDate = false,
        cardStyle = {
            backgroundColor: '#ffffff',
            textColor: '#374151',
            starColor: '#facc15',
            borderRadius: '16px',
            shadow: 'xl'
        }
    } = config;

    const [currentIndex, setCurrentIndex] = useState(0);

    // Auto-play for carousel
    useEffect(() => {
        if (layout === 'carousel' && autoPlay && testimonials.length > 1) {
            const timer = setInterval(() => {
                next();
            }, interval);
            return () => clearInterval(timer);
        }
    }, [autoPlay, interval, layout, testimonials.length]);

    if (testimonials.length === 0) return null;

    const next = () => setCurrentIndex((prev) => (prev + 1) % testimonials.length);
    const prev = () => setCurrentIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);

    const current = testimonials[currentIndex];

    // Helper to render a single review card
    const ReviewCard = ({ review }) => (
        <div
            className="relative p-8 md:p-10 h-full flex flex-col items-center text-center transition-all duration-300"
            style={{
                backgroundColor: cardStyle.backgroundColor,
                color: cardStyle.textColor,
                borderRadius: cardStyle.borderRadius,
                boxShadow: cardStyle.shadow === 'none' ? 'none' :
                    cardStyle.shadow === 'sm' ? '0 1px 2px 0 rgb(0 0 0 / 0.05)' :
                        cardStyle.shadow === 'xl' ? '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)' : '0 4px 6px -1px rgb(0 0 0 / 0.1)'
            }}
        >
            <Quote className="w-12 h-12 absolute top-6 left-6 opacity-20" />

            {/* Stars */}
            <div className="flex justify-center gap-1 mb-6 relative z-10">
                {[...Array(review.rating || 5)].map((_, i) => (
                    <Star
                        key={i}
                        className="w-5 h-5 fill-current"
                        style={{ color: cardStyle.starColor }}
                    />
                ))}
            </div>

            {/* Content */}
            <p className="text-lg md:text-xl font-medium mb-8 leading-relaxed relative z-10 flex-grow">
                "{review.content}"
            </p>

            {/* Author */}
            <div className="flex items-center gap-4 mt-auto">
                {showImage && review.avatar && (
                    <img
                        src={review.avatar}
                        alt={review.name}
                        className="w-14 h-14 rounded-full object-cover border-2 border-white shadow-sm"
                    />
                )}
                <div className="text-left">
                    <div className="font-bold text-base">{review.name}</div>
                    <div className="flex flex-col">
                        {showRole && review.role && (
                            <div className="text-sm opacity-75">{review.role}</div>
                        )}
                        {showDate && review.date && (
                            <div className="text-xs opacity-50 mt-1">{new Date(review.date).toLocaleDateString()}</div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );

    return (
        <section className="py-20" style={{ backgroundColor }}>
            <div className="container mx-auto px-4">
                {title && (
                    <h2 className="text-3xl md:text-4xl font-bold text-center mb-12" style={{ color: titleColor }}>
                        {title}
                    </h2>
                )}

                {layout === 'grid' ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {testimonials.map((t, i) => (
                            <ReviewCard key={i} review={t} />
                        ))}
                    </div>
                ) : (
                    <div className="max-w-4xl mx-auto relative">
                        <div className="overflow-hidden p-4"> {/* Padding for shadow */}
                            <div className="animate-fade-in">
                                <ReviewCard review={current} />
                            </div>
                        </div>

                        {/* Navigation */}
                        {testimonials.length > 1 && (
                            <>
                                <button
                                    onClick={prev}
                                    className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 md:-translate-x-12 p-3 rounded-full bg-white shadow-lg hover:scale-110 transition-transform text-gray-800 z-20"
                                    aria-label="Previous review"
                                >
                                    <ChevronLeft className="w-6 h-6" />
                                </button>
                                <button
                                    onClick={next}
                                    className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 md:translate-x-12 p-3 rounded-full bg-white shadow-lg hover:scale-110 transition-transform text-gray-800 z-20"
                                    aria-label="Next review"
                                >
                                    <ChevronRight className="w-6 h-6" />
                                </button>

                                <div className="flex justify-center gap-2 mt-8">
                                    {testimonials.map((_, i) => (
                                        <button
                                            key={i}
                                            onClick={() => setCurrentIndex(i)}
                                            className={`h-2 rounded-full transition-all duration-300 ${i === currentIndex ? 'w-8' : 'w-2 bg-gray-300'
                                                }`}
                                            style={{ backgroundColor: i === currentIndex ? cardStyle.starColor : undefined }}
                                            aria-label={`Go to slide ${i + 1}`}
                                        />
                                    ))}
                                </div>
                            </>
                        )}
                    </div>
                )}
            </div>
        </section>
    );
}
