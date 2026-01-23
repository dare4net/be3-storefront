'use client';

import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function CarouselWidget({ config = {}, children }) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [deviceType, setDeviceType] = useState('desktop');
    const [touchStart, setTouchStart] = useState(null);
    const [touchEnd, setTouchEnd] = useState(null);
    const autoPlayRef = useRef(null);
    const containerRef = useRef(null);

    // Minimum swipe distance (px)
    const minSwipeDistance = 50;

    // Default configuration
    const settings = {
        itemsPerRowDesktop: config.itemsPerRowDesktop || 4,
        itemsPerRowTablet: config.itemsPerRowTablet || 3,
        itemsPerRowMobile: config.itemsPerRowMobile || 2,
        gap: config.gap || 'md',
        infiniteLoop: config.infiniteLoop ?? true,
        autoPlay: config.autoPlay ?? false,
        autoPlayInterval: config.autoPlayInterval || 3000,
        showArrows: config.showArrows || 'hover',
        showDots: config.showDots ?? true,
        transitionDuration: config.transitionDuration || 500,
        padding: config.padding || 'py-8',
        backgroundColor: config.backgroundColor || 'transparent',
        maxWidth: config.maxWidth || '7xl',
        peekEffect: config.peekEffect ?? false,
    };

    const childrenArray = React.Children.toArray(children);

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

    const getItemsPerRow = () => {
        const base = deviceType === 'mobile' ? settings.itemsPerRowMobile :
            deviceType === 'tablet' ? settings.itemsPerRowTablet :
                settings.itemsPerRowDesktop;
        return settings.peekEffect ? base + 0.25 : base;
    };

    const currentItemsPerRow = getItemsPerRow();
    const maxIndex = Math.max(0, childrenArray.length - Math.floor(currentItemsPerRow));

    const handlePrev = () => {
        setCurrentIndex((prev) =>
            prev === 0 ? (settings.infiniteLoop ? maxIndex : 0) : prev - 1
        );
    };

    const handleNext = () => {
        setCurrentIndex((prev) =>
            prev >= maxIndex ? (settings.infiniteLoop ? 0 : maxIndex) : prev + 1
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

    useEffect(() => {
        if (settings.autoPlay && childrenArray.length > currentItemsPerRow) {
            autoPlayRef.current = setInterval(handleNext, settings.autoPlayInterval);
            return () => clearInterval(autoPlayRef.current);
        }
    }, [settings.autoPlay, currentIndex, childrenArray.length, currentItemsPerRow]);

    if (childrenArray.length === 0) return null;

    const gapValue = { sm: '4px', md: '8px', lg: '16px', xl: '24px' }[settings.gap] || '8px';

    return (
        <div className={`w-full ${settings.padding}`} style={{ backgroundColor: settings.backgroundColor }}>
            <div className={`max-w-${settings.maxWidth} mx-auto px-4 relative group`}>
                <div
                    className="overflow-hidden"
                    ref={containerRef}
                    onTouchStart={onTouchStart}
                    onTouchMove={onTouchMove}
                    onTouchEnd={onTouchEnd}
                >
                    <div
                        className="flex transition-transform ease-in-out"
                        style={{
                            transform: `translateX(-${currentIndex * (100 / currentItemsPerRow)}%)`,
                            transitionDuration: `${settings.transitionDuration}ms`,
                        }}
                    >
                        {childrenArray.map((child, index) => (
                            <div
                                key={index}
                                className="flex-shrink-0"
                                style={{
                                    flex: `0 0 ${100 / currentItemsPerRow}%`,
                                    paddingLeft: gapValue,
                                    paddingRight: gapValue,
                                }}
                            >
                                {child}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Navigation Arrows */}
                {settings.showArrows !== 'never' && childrenArray.length > currentItemsPerRow && (
                    <>
                        <button
                            onClick={handlePrev}
                            className={`absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 z-10 p-2 bg-white shadow-lg rounded-full hover:bg-gray-50 transition-all hidden md:flex ${settings.showArrows === 'hover' ? 'opacity-0 group-hover:opacity-100' : 'opacity-100'}`}
                            disabled={!settings.infiniteLoop && currentIndex === 0}
                        >
                            <ChevronLeft size={24} />
                        </button>
                        <button
                            onClick={handleNext}
                            className={`absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 z-10 p-2 bg-white shadow-lg rounded-full hover:bg-gray-50 transition-all hidden md:flex ${settings.showArrows === 'hover' ? 'opacity-0 group-hover:opacity-100' : 'opacity-100'}`}
                            disabled={!settings.infiniteLoop && currentIndex >= maxIndex}
                        >
                            <ChevronRight size={24} />
                        </button>
                    </>
                )}

                {/* Pagination Dots */}
                {settings.showDots && childrenArray.length > currentItemsPerRow && (
                    <div className="flex justify-center gap-2 mt-6">
                        {Array.from({ length: maxIndex + 1 }).map((_, index) => (
                            <button
                                key={index}
                                onClick={() => setCurrentIndex(index)}
                                className={`w-2 h-2 rounded-full transition-all ${currentIndex === index ? 'bg-blue-600 w-4' : 'bg-gray-300'}`}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
