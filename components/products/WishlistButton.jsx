"use client";

import React from 'react';
import { Heart } from 'lucide-react';
import { useWishlist } from '@/components/providers/WishlistContext';

export default function WishlistButton({ product, className = "", showLabel = false, style }) {
    const { toggleWishlist, isInWishlist } = useWishlist();
    const active = isInWishlist(product?.id);

    return (
        <button
            type="button"
            onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                toggleWishlist(product);
            }}
            className={`transition-all duration-300 transform active:scale-95 ${className} ${active ? 'text-red-500' : ''}`}
            style={style}
            title={active ? "Remove from wishlist" : "Add to wishlist"}
        >
            <Heart
                className={`${showLabel ? 'w-4 h-4 flex-shrink-0' : 'w-full h-full'} ${active ? 'fill-red-500 text-red-500' : ''}`}
                strokeWidth={2}
            />
            {showLabel && (
                <span>{active ? 'Saved' : 'Wishlist'}</span>
            )}
        </button>
    );
}

