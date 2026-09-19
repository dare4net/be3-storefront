// Announcement Bar Widget - Full-width bar that renders above the sticky header
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
        // position is now handled by the Header.js rendering logic (always above header)
        backgroundColor = 'var(--primary)',
        textColor = 'var(--primary-foreground, #ffffff)',
        minHeight = '44px',
        // Legacy `height` config support
        height,
        dismissible = true,
        dismissCookieDuration = 1,
        autoRotate = true,
        rotateInterval = 5000,
        messages = []
    } = config;

    const [isVisible, setIsVisible] = useState(true);
    const [isDismissing, setIsDismissing] = useState(false);
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
            try {
                const dismissed = localStorage.getItem(storageKey);
                if (dismissed) {
                    const dismissedTime = parseInt(dismissed);
                    const daysSinceDismissed = (Date.now() - dismissedTime) / (1000 * 60 * 60 * 24);
                    if (daysSinceDismissed < dismissCookieDuration) {
                        setIsVisible(false);
                    }
                }
            } catch (e) {
                // localStorage may be unavailable (SSR / private browsing)
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
        if (dismissible) {
            try {
                localStorage.setItem(storageKey, Date.now().toString());
            } catch (e) {}
        }
        // Animate out — set a flag so we render with height:0, then remove after transition
        setIsDismissing(true);
        setTimeout(() => setIsVisible(false), 350);
    };

    if (!isVisible) return null;

    // Determine current message object safely
    let currentMessage = { text: message, link, linkText };

    if (autoRotate && messages && messages.length > 0) {
        const index = currentMessageIndex % messages.length;
        currentMessage = messages[index] || currentMessage;
    }

    // Handle missing message safely
    if (!currentMessage?.text) return null;

    const Icon = icon ? LucideIcons[toPascalCase(icon)] : null;

    // Resolve effective background — normalize the old hardcoded default (#3b82f6)
    // back to the CSS variable so existing saved configs auto-comply with theme
    const OLD_DEFAULT_COLOR = '#3b82f6';
    const rawBg = backgroundColor || '';
    const effectiveBackground = (!rawBg || rawBg === OLD_DEFAULT_COLOR)
        ? 'var(--primary)'
        : rawBg;
    const effectiveTextColor = (!textColor || textColor === '#ffffff' && rawBg === OLD_DEFAULT_COLOR)
        ? 'var(--primary-foreground, #ffffff)'
        : (textColor || 'var(--primary-foreground, #ffffff)');
    // Support legacy `height` config but prefer `minHeight`
    const effectiveMinHeight = height || minHeight || '44px';

    return (
        <div
            className="w-full z-[60] shadow-sm transition-all duration-300 flex items-center overflow-hidden"
            style={{
                backgroundColor: effectiveBackground,
                color: effectiveTextColor,
                maxHeight: isDismissing ? '0px' : '200px',
                opacity: isDismissing ? 0 : 1,
                transition: 'max-height 0.35s ease, opacity 0.3s ease',
                minHeight: isDismissing ? '0px' : effectiveMinHeight,
            }}
        >
            <div className="w-full max-w-7xl mx-auto px-4">
                <div className="flex items-center justify-center gap-3 relative py-2">
                    {/* Icon */}
                    {Icon && <Icon className="w-4 h-4 flex-shrink-0 opacity-90" />}

                    {/* Message */}
                    <div className="flex items-center gap-2 text-sm font-medium">
                        <span key={currentMessage.text} className="animate-fade-in">
                            {currentMessage.text}
                        </span>

                        {/* Link */}
                        {currentMessage.link && (
                            <Link
                                href={currentMessage.link}
                                className="underline hover:no-underline font-bold whitespace-nowrap inline-flex items-center gap-1 opacity-90 hover:opacity-100 transition-opacity"
                                style={{ color: effectiveTextColor }}
                            >
                                {currentMessage.linkText || 'Learn More'}
                                <LucideIcons.ArrowRight className="w-3.5 h-3.5" />
                            </Link>
                        )}
                    </div>

                    {/* Dismiss Button */}
                    {dismissible && (
                        <button
                            onClick={handleDismiss}
                            className="absolute right-0 p-1 hover:opacity-75 transition-opacity"
                            style={{ color: effectiveTextColor }}
                            aria-label="Dismiss announcement"
                        >
                            <LucideIcons.X className="w-4 h-4" />
                        </button>
                    )}
                </div>

                {/* Rotation Indicator dots */}
                {autoRotate && messages && messages.length > 1 && (
                    <div className="flex justify-center gap-1 pb-1">
                        {messages.map((_, index) => (
                            <div
                                key={index}
                                className="h-1 rounded-full transition-all duration-300"
                                style={{
                                    width: index === currentMessageIndex ? '16px' : '6px',
                                    backgroundColor: effectiveTextColor,
                                    opacity: index === currentMessageIndex ? 1 : 0.4,
                                }}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

// Helper to convert kebab-case or space-case to PascalCase for icon names
function toPascalCase(str) {
    if (!str) return 'Truck'; // Default fallback
    return str
        .split(/[-\s]/)
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
