"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ShoppingCart, MessageCircle, Eye, X, Heart, Star } from 'lucide-react';
import { useCart } from '@/components/providers/CartContext';
import { useChatContext } from '@/components/providers/ChatContext';
import WishlistButton from './WishlistButton';

export default function ProductCard({ product, trackClick }) {
    const { addToCart } = useCart();
    const { openChat } = useChatContext();
    const [showOverlay, setShowOverlay] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const [stats, setStats] = useState({ impressions: 0, wishlist_count: 0 });

    useEffect(() => {
        const checkMobile = () => setIsMobile(window.innerWidth < 768);
        checkMobile();
        window.addEventListener('resize', checkMobile);

        // Stats are now injected by the backend (RandomizationService)
        if (product.stats) {
            setStats(product.stats);
        }

        return () => window.removeEventListener('resize', checkMobile);
    }, [product]);

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

                {/* Vendor Tag */}
                {product.attributes?.vendor && (
                    <div className="mt-1 flex">
                        <span className="inline-block px-2 py-0.5 bg-blue-50 border border-blue-100 text-blue-700 rounded font-semibold leading-relaxed text-[clamp(0.65rem,0.6rem+0.1vw,0.75rem)]">
                            {product.vendor_verified ? (() => {
                                const parts = product.attributes.vendor.split(' ');
                                const lastWord = parts.pop();
                                return (
                                    <>
                                        {parts.length > 0 && parts.join(' ') + ' '}
                                        <span className="inline-flex items-center gap-1 whitespace-nowrap align-middle ml-1 sm:ml-0">
                                            {lastWord}
                                            <img
                                                src="/verified.svg"
                                                alt="Verified Business"
                                                title="Verified Business"
                                                className="w-3.5 h-3.5 object-contain shrink-0 relative top-[-1px]"
                                            />
                                        </span>
                                    </>
                                );
                            })() : (
                                product.attributes.vendor
                            )}
                        </span>
                    </div>
                )}

                {/* Rating */}
                {product.rating_summary && parseFloat(product.rating_summary.average_rating) > 0 && (
                    <div className="flex items-center gap-1.5 mt-1 text-xs">
                        <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                        <span className="font-semibold text-gray-700">{parseFloat(product.rating_summary.average_rating).toFixed(1)}</span>
                        <span className="text-gray-500 font-medium">({parseInt(product.rating_summary.total_reviews || 0)} review{parseInt(product.rating_summary.total_reviews || 0) !== 1 ? 's' : ''})</span>
                    </div>
                )}

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

                {/* Social Proof Stats */}
                <div className="mt-2 flex items-center gap-3 text-xs text-gray-500 font-medium">
                    <div className="flex items-center gap-1.5">
                        <Eye className="w-3 h-3 sm:w-4 sm:h-4 text-gray-500" />
                        <span>{stats.impressions || 0}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <Heart className="w-3 h-3 sm:w-4 sm:h-4 text-gray-500" />
                        <span>{stats.wishlist_count || 0}</span>
                    </div>
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
