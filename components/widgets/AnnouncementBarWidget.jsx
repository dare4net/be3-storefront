// Announcement Bar Widget - Sticky top/bottom bar
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import * as LucideIcons from 'lucide-react';

export default function AnnouncementBarWidget({ config }) {
    const {
        message = 'Free shipping on orders over $50!',
        link = '',
        linkText = 'Learn More',
        icon = 'truck',
        position = 'top',
        sticky = false,
        backgroundColor = '#3b82f6',
        textColor = '#ffffff',
        height = '48px',
        dismissible = true,
        dismissCookieDuration = 1,
        autoRotate = true,
        rotateInterval = 5000,
        messages = []
    } = config;

    const [isVisible, setIsVisible] = useState(true);
    const [currentMessageIndex, setCurrentMessageIndex] = useState(0);

    // Generate a unique key based on content to ensure new messages are seen
    const contentKey = autoRotate
        ? JSON.stringify(messages)
        : `${message}-${link}`;

    // Simple hash for the storage key
    const storageKey = `announcement_dismissed_${simpleHash(contentKey)}`;

    useEffect(() => {
        // Reset visibility when config changes (important for editor)
        setIsVisible(true);

        if (dismissible) {
            const dismissed = localStorage.getItem(storageKey);
            if (dismissed) {
                const dismissedTime = parseInt(dismissed);
                const daysSinceDismissed = (Date.now() - dismissedTime) / (1000 * 60 * 60 * 24);

                if (daysSinceDismissed < dismissCookieDuration) {
                    setIsVisible(false);
                }
            }
        }
    }, [dismissible, dismissCookieDuration, storageKey]);

    // Safe rotation interval with minimum
    const safeRotateInterval = Math.max(1000, rotateInterval || 5000);

    // Auto-rotate messages
    useEffect(() => {
        if (autoRotate && messages && messages.length > 1) {
            const interval = setInterval(() => {
                setCurrentMessageIndex((prev) => {
                    const next = prev + 1;
                    return next >= messages.length ? 0 : next;
                });
            }, safeRotateInterval);

            return () => clearInterval(interval);
        }
    }, [autoRotate, messages, safeRotateInterval]);

    const handleDismiss = () => {
        setIsVisible(false);
        if (dismissible) {
            localStorage.setItem(storageKey, Date.now().toString());
        }
    };

    if (!isVisible) return null;

    // Determine current message object safely
    let currentMessage = { text: message, link, linkText };

    if (autoRotate && messages && messages.length > 0) {
        // Ensure index is valid
        const index = currentMessageIndex % messages.length;
        currentMessage = messages[index] || currentMessage;
    }

    // Handle missing message safely
    if (!currentMessage?.text) return null;

    const Icon = icon ? LucideIcons[toPascalCase(icon)] : null;

    return (
        <div
            className={`w-full z-[60] ${sticky ? 'sticky' : 'relative'} ${position === 'top' ? 'top-0' : 'bottom-0'} shadow-md transition-all duration-300`}
            style={{
                backgroundColor,
                color: textColor,
                height
            }}
        >
            <div className="container mx-auto px-4 h-full">
                <div className="flex items-center justify-center h-full gap-3 relative">
                    {/* Icon */}
                    {Icon && <Icon className="w-5 h-5 flex-shrink-0" />}

                    {/* Message */}
                    <div className="flex items-center gap-3 text-sm md:text-base font-medium truncate max-w-[80vw]">
                        <span key={currentMessage.text} className="animate-fade-in">
                            {currentMessage.text}
                        </span>

                        {/* Link */}
                        {currentMessage.link && (
                            <Link
                                href={currentMessage.link}
                                className="underline hover:no-underline font-bold whitespace-nowrap"
                            >
                                {currentMessage.linkText || 'Learn More'}
                                <LucideIcons.ArrowRight className="inline w-4 h-4 ml-1" />
                            </Link>
                        )}
                    </div>

                    {/* Dismiss Button */}
                    {dismissible && (
                        <button
                            onClick={handleDismiss}
                            className="absolute right-0 md:right-4 p-1 hover:opacity-75 transition"
                            aria-label="Dismiss"
                        >
                            <LucideIcons.X className="w-5 h-5" />
                        </button>
                    )}

                    {/* Rotation Indicator */}
                    {autoRotate && messages && messages.length > 1 && (
                        <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex gap-1">
                            {messages.map((_, index) => (
                                <div
                                    key={index}
                                    className={`w-1.5 h-1.5 rounded-full transition-all ${index === currentMessageIndex
                                        ? 'bg-white w-4'
                                        : 'bg-white/50'
                                        }`}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

// Helper to convert kebab-case to PascalCase for icon names
function toPascalCase(str) {
    if (!str) return 'Truck'; // Default fallback
    return str
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join('');
}

// Simple string hash function
function simpleHash(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = (hash << 5) - hash + char;
        hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash).toString(16);
}
