// Interactive Countdown Timer Widget
'use client';

import { useEffect, useState } from 'react';

export default function CountdownTimerWidget({ config }) {
    const {
        targetDate = '2026-12-31T23:59:59',
        timezone = 'UTC',
        showDays = true,
        showHours = true,
        showMinutes = true,
        showSeconds = true,
        labels = { days: 'Days', hours: 'Hours', minutes: 'Minutes', seconds: 'Seconds' },
        layout = 'horizontal',
        digitStyle = 'static',
        size = 'md',
        colorScheme = 'primary',
        onExpiry = { action: 'hide', message: 'Sale Ended!', redirectUrl: '' },
        pulseWhenLow = true,
        lowThreshold = { days: 1 },
        urgentColor = '#ef4444',
        title = '',
        subtitle = ''
    } = config;

    const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());
    const [isExpired, setIsExpired] = useState(false);
    const [isLow, setIsLow] = useState(false);

    function calculateTimeLeft() {
        const difference = new Date(targetDate).getTime() - new Date().getTime();

        if (difference <= 0) {
            return { days: 0, hours: 0, minutes: 0, seconds: 0 };
        }

        return {
            days: Math.floor(difference / (1000 * 60 * 60 * 24)),
            hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
            minutes: Math.floor((difference / 1000 / 60) % 60),
            seconds: Math.floor((difference / 1000) % 60)
        };
    }

    useEffect(() => {
        const timer = setInterval(() => {
            const time = calculateTimeLeft();
            setTimeLeft(time);

            // Check if expired
            if (time.days === 0 && time.hours === 0 && time.minutes === 0 && time.seconds === 0) {
                setIsExpired(true);
                clearInterval(timer);

                // Handle expiry action
                if (onExpiry.action === 'redirect' && onExpiry.redirectUrl) {
                    setTimeout(() => {
                        window.location.href = onExpiry.redirectUrl;
                    }, 2000);
                }
            }

            // Check if low threshold
            if (pulseWhenLow && time.days <= (lowThreshold.days || 1)) {
                setIsLow(true);
            }
        }, 1000);

        return () => clearInterval(timer);
    }, [targetDate]);

    if (isExpired && onExpiry.action === 'hide') {
        return null;
    }

    if (isExpired && onExpiry.action === 'show-message') {
        return (
            <section className="py-12 bg-gray-100">
                <div className="container mx-auto px-4 text-center">
                    <div className="text-3xl font-bold text-gray-700">
                        {onExpiry.message || 'This offer has ended'}
                    </div>
                </div>
            </section>
        );
    }

    const sizeClasses = {
        sm: 'text-3xl',
        md: 'text-5xl',
        lg: 'text-7xl'
    };

    const colorSchemes = {
        primary: 'bg-blue-600 text-white',
        danger: 'bg-red-600 text-white',
        success: 'bg-green-600 text-white',
        custom: 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
    };

    const layoutClasses = {
        horizontal: 'flex-row',
        vertical: 'flex-col',
        circular: 'flex-row'
    };

    const units = [
        { value: timeLeft.days, label: labels.days, show: showDays },
        { value: timeLeft.hours, label: labels.hours, show: showHours },
        { value: timeLeft.minutes, label: labels.minutes, show: showMinutes },
        { value: timeLeft.seconds, label: labels.seconds, show: showSeconds }
    ].filter(unit => unit.show);

    return (
        <section className={`py-12 ${isLow ? 'bg-red-50' : 'bg-gradient-to-r from-blue-50 to-purple-50'}`}>
            <div className="container mx-auto px-4">
                <div className="max-w-5xl mx-auto text-center">
                    {/* Title */}
                    {title && (
                        <h2 className="text-3xl md:text-4xl font-bold mb-4">
                            {title}
                        </h2>
                    )}

                    {/* Subtitle */}
                    {subtitle && (
                        <p className="text-lg text-gray-600 mb-8">
                            {subtitle}
                        </p>
                    )}

                    {/* Countdown */}
                    <div className={`flex ${layoutClasses[layout]} justify-center items-center gap-4 md:gap-8`}>
                        {units.map((unit, index) => (
                            <div key={index}>
                                {layout === 'circular' ? (
                                    <CircularCounter
                                        value={unit.value}
                                        label={unit.label}
                                        max={index === 0 ? 365 : index === 1 ? 24 : 60}
                                        size={size}
                                        isLow={isLow}
                                        urgentColor={urgentColor}
                                    />
                                ) : (
                                    <div
                                        className={`${digitStyle === 'flip' ? 'flip-container' : ''
                                            } ${isLow ? 'animate-pulse' : ''}`}
                                    >
                                        <div
                                            className={`${colorSchemes[colorScheme]} rounded-xl px-6 md:px-8 py-4 md:py-6 shadow-xl ${isLow ? 'ring-4 ring-red-400' : ''
                                                }`}
                                            style={{
                                                backgroundColor: isLow ? urgentColor : undefined
                                            }}
                                        >
                                            <div className={`font-bold ${sizeClasses[size]} leading-none mb-2`}>
                                                {digitStyle === 'static' && String(unit.value).padStart(2, '0')}
                                                {digitStyle === 'flip' && (
                                                    <FlipDigit value={unit.value} />
                                                )}
                                                {digitStyle === 'slide' && (
                                                    <SlideDigit value={unit.value} />
                                                )}
                                            </div>
                                            <div className="text-sm md:text-base opacity-90 uppercase tracking-wider">
                                                {unit.label}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                    {/* Low threshold message */}
                    {isLow && (
                        <div className="mt-6 text-red-600 font-bold text-xl animate-bounce">
                            ⚡ Hurry! Limited Time Remaining!
                        </div>
                    )}
                </div>
            </div>
        </section>
    );
}

// Flip digit animation component
function FlipDigit({ value }) {
    const [currentValue, setCurrentValue] = useState(value);
    const [isFlipping, setIsFlipping] = useState(false);

    useEffect(() => {
        if (value !== currentValue) {
            setIsFlipping(true);
            setTimeout(() => {
                setCurrentValue(value);
                setIsFlipping(false);
            }, 300);
        }
    }, [value]);

    return (
        <div className="relative inline-block">
            <div className={`transition-all duration-300 ${isFlipping ? 'scale-y-0' : 'scale-y-100'}`}>
                {String(currentValue).padStart(2, '0')}
            </div>
        </div>
    );
}

// Slide digit animation component
function SlideDigit({ value }) {
    return (
        <div className="relative inline-block overflow-hidden h-16">
            <div
                className="absolute transition-transform duration-500 ease-out"
                style={{ transform: `translateY(-${value * 100}%)` }}
            >
                {Array.from({ length: 100 }, (_, i) => (
                    <div key={i} className="h-16 flex items-center justify-center">
                        {String(i).padStart(2, '0')}
                    </div>
                ))}
            </div>
        </div>
    );
}

// Circular countdown component
function CircularCounter({ value, label, max, size, isLow, urgentColor }) {
    const percent = (value / max) * 100;
    const circumference = 2 * Math.PI * 45;
    const strokeDashoffset = circumference - (percent / 100) * circumference;

    const sizeMap = {
        sm: { width: 80, fontSize: '1.5rem' },
        md: { width: 120, fontSize: '2rem' },
        lg: { width: 160, fontSize: '3rem' }
    };

    const dimensions = sizeMap[size] || sizeMap.md;

    return (
        <div className="relative inline-flex flex-col items-center">
            <svg
                width={dimensions.width}
                height={dimensions.width}
                className={isLow ? 'animate-pulse' : ''}
            >
                {/* Background circle */}
                <circle
                    cx={dimensions.width / 2}
                    cy={dimensions.width / 2}
                    r="45"
                    fill="none"
                    stroke="#e5e7eb"
                    strokeWidth="8"
                />
                {/* Progress circle */}
                <circle
                    cx={dimensions.width / 2}
                    cy={dimensions.width / 2}
                    r="45"
                    fill="none"
                    stroke={isLow ? urgentColor : '#3b82f6'}
                    strokeWidth="8"
                    strokeDasharray={circumference}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                    transform={`rotate(-90 ${dimensions.width / 2} ${dimensions.width / 2})`}
                    className="transition-all duration-1000"
                />
                {/* Value text */}
                <text
                    x="50%"
                    y="50%"
                    dominantBaseline="middle"
                    textAnchor="middle"
                    fontSize={dimensions.fontSize}
                    fontWeight="bold"
                    fill={isLow ? urgentColor : '#1f2937'}
                >
                    {value}
                </text>
            </svg>
            <div className="mt-2 text-sm font-medium text-gray-600 uppercase">
                {label}
            </div>
        </div>
    );
}
