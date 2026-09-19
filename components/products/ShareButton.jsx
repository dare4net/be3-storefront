"use client";

import React, { useState } from 'react';
import { Share2 } from 'lucide-react';

export default function ShareButton({ title, url, className = "", style }) {
    const [copied, setCopied] = useState(false);

    const handleShare = async () => {
        const shareUrl = url || (typeof window !== 'undefined' ? window.location.href : '');
        const shareData = {
            title: title || 'Product',
            text: `Check out ${title || 'this product'}!`,
            url: shareUrl,
        };

        if (typeof navigator !== 'undefined' && navigator.share && navigator.canShare && navigator.canShare(shareData)) {
            try {
                await navigator.share(shareData);
            } catch (err) {
                if (err.name !== 'AbortError') {
                    copyToClipboard(shareUrl);
                }
            }
        } else {
            copyToClipboard(shareUrl);
        }
    };

    const copyToClipboard = (text) => {
        if (typeof navigator !== 'undefined' && navigator.clipboard) {
            navigator.clipboard.writeText(text).then(() => {
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
            });
        }
    };

    return (
        <button
            type="button"
            onClick={handleShare}
            className={className}
            style={style}
            title="Share this product"
        >
            <Share2 className="w-4 h-4 flex-shrink-0" />
            <span>{copied ? 'Link Copied!' : 'Share'}</span>
        </button>
    );
}
