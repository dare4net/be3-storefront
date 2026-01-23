"use client";

import React, { useState, useEffect } from 'react';
import { ShoppingCart, Heart } from 'lucide-react';
import { useCart } from '@/components/providers/CartContext';
import { useWishlist } from '@/components/providers/WishlistContext';

export default function StickyAddToCart({ product }) {
    const [isVisible, setIsVisible] = useState(false);
    const { addToCart } = useCart();
    const { toggleWishlist, isInWishlist } = useWishlist();
    const active = isInWishlist(product.id);

    useEffect(() => {
        const handleScroll = () => {
            // Show bar after scrolling past the main buy button (approx 600px)
            if (window.scrollY > 600) {
                setIsVisible(true);
            } else {
                setIsVisible(false);
            }
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    if (!product) return null;

    return (
        <div className={`fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-2xl z-50 transition-transform duration-500 ease-in-out ${isVisible ? 'translate-y-0' : 'translate-y-full'}`}>
            <div className="container mx-auto px-4 py-3 max-w-7xl">
                <div className="flex items-center justify-between gap-4">
                    {/* Product Info - Hidden on very small screens */}
                    <div className="hidden sm:flex items-center gap-3 min-w-0">
                        <img
                            src={product.image_url}
                            alt={product.name}
                            className="w-12 h-12 object-cover rounded-md border border-gray-100"
                        />
                        <div className="min-w-0">
                            <h4 className="font-bold text-gray-900 truncate text-sm">{product.name}</h4>
                            <p className="text-blue-600 font-bold text-base">${parseFloat(product.price).toFixed(2)}</p>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 flex-1 sm:flex-none">
                        <button
                            onClick={() => toggleWishlist(product)}
                            className={`p-3 rounded-xl border transition-all ${active ? 'bg-red-50 border-red-100 text-red-500' : 'bg-gray-50 border-gray-100 text-gray-400 hover:text-red-500'}`}
                            title={active ? "Remove from wishlist" : "Add to wishlist"}
                        >
                            <Heart className={`w-5 h-5 ${active ? 'fill-current' : 'fill-none'}`} />
                        </button>

                        <button
                            onClick={() => addToCart(product, 1)}
                            className="flex-1 sm:w-64 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-xl transition-all shadow-md active:scale-95"
                        >
                            <ShoppingCart className="w-5 h-5" />
                            <span>Add to Cart</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
