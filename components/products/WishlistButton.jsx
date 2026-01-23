"use client";

import React from 'react';
import { Heart } from 'lucide-react';
import { useWishlist } from '@/components/providers/WishlistContext';

export default function WishlistButton({ product, className = "" }) {
    const { toggleWishlist, isInWishlist } = useWishlist();
    const active = isInWishlist(product.id);

    return (
        <button
            onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                toggleWishlist(product);
            }}
            className={`transition-all duration-300 transform active:scale-90 ${className} ${active ? 'text-red-500 bg-red-50 border-red-100' : 'text-gray-400 hover:text-red-500 hover:bg-red-50'}`}
            title={active ? "Remove from wishlist" : "Add to wishlist"}
        >
            <Heart
                className={`w-full h-full ${active ? 'fill-current' : 'fill-none'}`}
                strokeWidth={2}
            />
        </button>
    );
}
