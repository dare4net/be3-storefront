"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ShoppingCart, MessageCircle, Eye, X } from 'lucide-react';
import { useCart } from '@/components/providers/CartContext';
import { useChatContext } from '@/components/providers/ChatContext';
import WishlistButton from './WishlistButton';

export default function ProductCard({ product, trackClick }) {
    const { addToCart } = useCart();
    const { openChat } = useChatContext();
    const [showOverlay, setShowOverlay] = useState(false);
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 768);
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    const handleAddToCart = (e) => {
        e.preventDefault();
        e.stopPropagation();
        addToCart(product, 1);
    };

    const handleCardClick = (e) => {
        if (isMobile) {
            e.preventDefault();
            e.stopPropagation();
            setShowOverlay(true);
        } else if (trackClick) {
            trackClick(product);
        }
    };

    return (
        <div className="group relative bg-white rounded-lg border overflow-hidden hover:shadow-lg transition-all duration-300">
            {/* Image */}
            <Link
                href={`/products/${product.handle}`}
                className="block relative aspect-square overflow-hidden bg-gray-100"
                onClick={handleCardClick}
            >
                {(product.image_url || product.thumbnail_url || product.image) ? (
                    <img
                        src={product.image_url || product.thumbnail_url || product.image}
                        alt={product.name}
                        className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                        No Image
                    </div>
                )}

                {/* Wishlist Button Overlay */}
                <WishlistButton
                    product={product}
                    className="absolute top-2 right-2 p-2 rounded-full bg-white/80 backdrop-blur-sm shadow-sm z-10 w-9 h-9"
                />
            </Link>

            {/* Content */}
            <div className="p-2 sm:p-4">
                <Link href={`/products/${product.handle}`} onClick={handleCardClick}>
                    <h3 className="text-[clamp(0.875rem,0.8rem+0.4vw,1.125rem)] font-medium text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-1">
                        {product.name}
                    </h3>
                </Link>

                <div className="mt-1 sm:mt-2 flex items-center justify-between">
                    <div className="flex flex-col">
                        <span className="text-[clamp(1rem,0.9rem+0.5vw,1.25rem)] font-bold text-gray-900">
                            ${parseFloat(product.price).toFixed(2)}
                        </span>
                        {product.compare_at_price && (
                            <span className="text-[clamp(0.7rem,0.65rem+0.2vw,0.875rem)] text-gray-500 line-through">
                                ${parseFloat(product.compare_at_price).toFixed(2)}
                            </span>
                        )}
                    </div>

                    <button
                        onClick={handleAddToCart}
                        className="p-1.5 sm:p-2 rounded-full bg-blue-600 text-white hover:bg-blue-700 transition-colors shadow-md hover:shadow-lg"
                        title="Add to Cart"
                    >
                        <ShoppingCart className="w-4 h-4 sm:w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* Mobile Overlay */}
            {isMobile && showOverlay && (
                <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <button
                        onClick={() => setShowOverlay(false)}
                        className="absolute top-2 right-2 p-1 rounded-full bg-white/20 text-white hover:bg-white/30 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>

                    <div className="flex flex-col gap-3 w-full px-4">
                        <Link
                            href={`/products/${product.handle}`}
                            className="flex items-center justify-center gap-2 w-full py-3 bg-white text-gray-900 rounded-full font-semibold shadow-xl active:scale-95 transition-transform"
                            onClick={() => setShowOverlay(false)}
                        >
                            <Eye className="w-5 h-5 text-blue-600" />
                            View
                        </Link>

                        <button
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                openChat('product', product.id, product.name);
                                setShowOverlay(false);
                            }}
                            className="flex items-center justify-center gap-2 w-full py-3 bg-blue-600 text-white rounded-full font-semibold shadow-xl active:scale-95 transition-transform"
                        >
                            <MessageCircle className="w-5 h-5" />
                            Chat Seller
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
