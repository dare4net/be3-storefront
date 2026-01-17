// Before/After Image Comparison Slider Widget
'use client';

import { useState, useRef, useEffect } from 'react';

export default function BeforeAfterSliderWidget({ config }) {
    const {
        beforeImage = { url: '', label: 'Before' },
        afterImage = { url: '', label: 'After' },
        defaultPosition = 50,
        orientation = 'horizontal',
        handleStyle = 'arrow',
        handleColor = '#ffffff',
        showLabels = true,
        labelPosition = 'overlay',
        labelStyle = {
            fontSize: '1rem',
            color: '#ffffff',
            backgroundColor: 'rgba(0,0,0,0.6)',
            padding: '0.5rem 1rem'
        },
        autoSlide = false,
        autoSlideSpeed = 2000,
        hoverToSlide = false,
        aspectRatio = '16:9',
        height = '500px'
    } = config;

    const [sliderPosition, setSliderPosition] = useState(defaultPosition);
    const [isDragging, setIsDragging] = useState(false);
    const containerRef = useRef(null);

    // Auto-slide effect
    useEffect(() => {
        if (!autoSlide) return;

        let direction = 1;
        const interval = setInterval(() => {
            setSliderPosition((prev) => {
                const next = prev + direction * 0.5;
                if (next >= 100 || next <= 0) {
                    direction *= -1;
                }
                return Math.max(0, Math.min(100, next));
            });
        }, 50);

        return () => clearInterval(interval);
    }, [autoSlide]);

    // Hover to slide effect
    const handleMouseMove = (e) => {
        if (!hoverToSlide && !isDragging) return;

        const container = containerRef.current;
        if (!container) return;

        const rect = container.getBoundingClientRect();

        if (orientation === 'horizontal') {
            const x = e.clientX - rect.left;
            const percentage = (x / rect.width) * 100;
            setSliderPosition(Math.max(0, Math.min(100, percentage)));
        } else {
            const y = e.clientY - rect.top;
            const percentage = (y / rect.height) * 100;
            setSliderPosition(Math.max(0, Math.min(100, percentage)));
        }
    };

    // Touch events for mobile
    const handleTouchMove = (e) => {
        if (!isDragging) return;

        const container = containerRef.current;
        if (!container) return;

        const rect = container.getBoundingClientRect();
        const touch = e.touches[0];

        if (orientation === 'horizontal') {
            const x = touch.clientX - rect.left;
            const percentage = (x / rect.width) * 100;
            setSliderPosition(Math.max(0, Math.min(100, percentage)));
        } else {
            const y = touch.clientY - rect.top;
            const percentage = (y / rect.height) * 100;
            setSliderPosition(Math.max(0, Math.min(100, percentage)));
        }
    };

    const handleStart = () => setIsDragging(true);
    const handleEnd = () => setIsDragging(false);

    // Calculate aspect ratio
    const getAspectRatioHeight = () => {
        if (aspectRatio === 'custom') return height;

        const ratios = {
            '16:9': '56.25%',
            '4:3': '75%',
            '1:1': '100%',
            '21:9': '42.86%'
        };

        return ratios[aspectRatio] || '56.25%';
    };

    return (
        <section className="py-12 bg-gray-50">
            <div className="container mx-auto px-4">
                <div className="max-w-5xl mx-auto">
                    {/* Labels Above/Below */}
                    {showLabels && (labelPosition === 'top' || labelPosition === 'bottom') && labelPosition === 'top' && (
                        <div className="flex justify-between mb-4">
                            <div
                                className="font-bold rounded px-4 py-2"
                                style={{
                                    fontSize: labelStyle.fontSize,
                                    color: labelStyle.color,
                                    backgroundColor: labelStyle.backgroundColor
                                }}
                            >
                                {beforeImage.label}
                            </div>
                            <div
                                className="font-bold rounded px-4 py-2"
                                style={{
                                    fontSize: labelStyle.fontSize,
                                    color: labelStyle.color,
                                    backgroundColor: labelStyle.backgroundColor
                                }}
                            >
                                {afterImage.label}
                            </div>
                        </div>
                    )}

                    {/* Before/After Container */}
                    <div
                        ref={containerRef}
                        className="relative overflow-hidden rounded-xl shadow-2xl cursor-col-resize select-none"
                        style={{
                            paddingBottom: aspectRatio === 'custom' ? 0 : getAspectRatioHeight(),
                            height: aspectRatio === 'custom' ? height : 'auto'
                        }}
                        onMouseDown={handleStart}
                        onMouseUp={handleEnd}
                        onMouseMove={handleMouseMove}
                        onMouseLeave={handleEnd}
                        onTouchStart={handleStart}
                        onTouchEnd={handleEnd}
                        onTouchMove={handleTouchMove}
                    >
                        {/* After Image (Background) */}
                        <div
                            className="absolute inset-0 bg-cover bg-center"
                            style={{
                                backgroundImage: `url(${afterImage.url})`
                            }}
                        >
                            {showLabels && labelPosition === 'overlay' && (
                                <div
                                    className="absolute top-4 right-4 font-bold rounded"
                                    style={{
                                        fontSize: labelStyle.fontSize,
                                        color: labelStyle.color,
                                        backgroundColor: labelStyle.backgroundColor,
                                        padding: labelStyle.padding
                                    }}
                                >
                                    {afterImage.label}
                                </div>
                            )}
                        </div>

                        {/* Before Image (Clipped Overlay) */}
                        <div
                            className="absolute inset-0 bg-cover bg-center transition-all duration-100"
                            style={{
                                backgroundImage: `url(${beforeImage.url})`,
                                clipPath: orientation === 'horizontal'
                                    ? `polygon(0 0, ${sliderPosition}% 0, ${sliderPosition}% 100%, 0 100%)`
                                    : `polygon(0 0, 100% 0, 100% ${sliderPosition}%, 0 ${sliderPosition}%)`
                            }}
                        >
                            {showLabels && labelPosition === 'overlay' && (
                                <div
                                    className="absolute top-4 left-4 font-bold rounded"
                                    style={{
                                        fontSize: labelStyle.fontSize,
                                        color: labelStyle.color,
                                        backgroundColor: labelStyle.backgroundColor,
                                        padding: labelStyle.padding
                                    }}
                                >
                                    {beforeImage.label}
                                </div>
                            )}
                        </div>

                        {/* Slider Handle */}
                        <div
                            className="absolute z-20 transition-all duration-100"
                            style={
                                orientation === 'horizontal'
                                    ? {
                                        left: `${sliderPosition}%`,
                                        top: 0,
                                        bottom: 0,
                                        transform: 'translateX(-50%)'
                                    }
                                    : {
                                        top: `${sliderPosition}%`,
                                        left: 0,
                                        right: 0,
                                        transform: 'translateY(-50%)'
                                    }
                            }
                        >
                            {/* Divider Line */}
                            <div
                                className="absolute bg-white shadow-lg"
                                style={
                                    orientation === 'horizontal'
                                        ? {
                                            width: '3px',
                                            height: '100%',
                                            left: '50%',
                                            transform: 'translateX(-50%)'
                                        }
                                        : {
                                            height: '3px',
                                            width: '100%',
                                            top: '50%',
                                            transform: 'translateY(-50%)'
                                        }
                                }
                            />

                            {/* Handle Button */}
                            <div
                                className="absolute flex items-center justify-center rounded-full shadow-xl cursor-grab active:cursor-grabbing hover:scale-110 transition-transform"
                                style={{
                                    backgroundColor: handleColor,
                                    width: '48px',
                                    height: '48px',
                                    [orientation === 'horizontal' ? 'top' : 'left']: '50%',
                                    [orientation === 'horizontal' ? 'left' : 'top']: '50%',
                                    transform: 'translate(-50%, -50%)'
                                }}
                            >
                                {handleStyle === 'arrow' && (
                                    <div className="flex items-center gap-0">
                                        <svg
                                            className="w-4 h-4 text-gray-800"
                                            fill="currentColor"
                                            viewBox="0 0 20 20"
                                            transform={orientation === 'horizontal' ? '' : 'rotate(90)'}
                                        >
                                            <path d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" />
                                        </svg>
                                        <svg
                                            className="w-4 h-4 text-gray-800"
                                            fill="currentColor"
                                            viewBox="0 0 20 20"
                                            transform={orientation === 'horizontal' ? '' : 'rotate(90)'}
                                        >
                                            <path d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" />
                                        </svg>
                                    </div>
                                )}

                                {handleStyle === 'circle' && (
                                    <div className="w-6 h-6 rounded-full border-2 border-gray-800" />
                                )}

                                {handleStyle === 'line' && (
                                    <div
                                        className="bg-gray-800"
                                        style={
                                            orientation === 'horizontal'
                                                ? { width: '2px', height: '24px' }
                                                : { width: '24px', height: '2px' }
                                        }
                                    />
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Labels Below */}
                    {showLabels && labelPosition === 'bottom' && (
                        <div className="flex justify-between mt-4">
                            <div
                                className="font-bold rounded px-4 py-2"
                                style={{
                                    fontSize: labelStyle.fontSize,
                                    color: labelStyle.color,
                                    backgroundColor: labelStyle.backgroundColor
                                }}
                            >
                                {beforeImage.label}
                            </div>
                            <div
                                className="font-bold rounded px-4 py-2"
                                style={{
                                    fontSize: labelStyle.fontSize,
                                    color: labelStyle.color,
                                    backgroundColor: labelStyle.backgroundColor
                                }}
                            >
                                {afterImage.label}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </section>
    );
}
