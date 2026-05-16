"use client";

import { useState } from 'react';
import { ShoppingCart, Check, Eye, Heart, Star } from 'lucide-react';
import { useCart } from '@/components/providers/CartContext';
import { useWishlist } from '@/components/providers/WishlistContext';
import { useAnalytics } from '@/lib/hooks/useAnalytics';
import { cn, formatAttributeValue } from '@/lib/utils';

export default function ProductCardPremium({
    product,
    trackClick,
    scale = 1.0,
    showAddToCart = true,
    showPrice = true,
    showFeaturedBadge = true,
    showViewDetails = true,
    showChat = true,
    showTags = true,
    showDescription = true,
    showAttributes = true,
    showSocialProof = true,
    showRating = true,
    widgetId = "search_results",
    colors = { text: '#111827', price: '#3b82f6', accent: '#3b82f6' },
    cardStyle = {
        backgroundColor: '#ffffff',
        borderColor: 'transparent',
        borderRadius: '0.5rem',
        shadow: 'md'
    }
}) {
    const { addToCart } = useCart();
    const { toggleWishlist, isInWishlist } = useWishlist();
    const { trackClick: trackAnalyticsClick } = useAnalytics();
    const [addingToCart, setAddingToCart] = useState(null);

    const handleAddToCart = async (e) => {
        e.preventDefault();
        e.stopPropagation();
        setAddingToCart(product.id);
        try {
            await addToCart({
                id: product.id,
                name: product.name,
                price: product.price,
                image: product.image_url || product.thumbnail_url || product.image,
                quantity: 1
            });
            setTimeout(() => setAddingToCart(null), 1500);
        } catch (err) {
            console.error("Add to cart failed", err);
            setAddingToCart(null);
        }
    };

    const handleWishlistToggle = (e) => {
        e.preventDefault();
        e.stopPropagation();
        toggleWishlist(product);
    };

    const handleCardClick = (e) => {
        if (trackClick) trackClick(product);
        if (trackAnalyticsClick) {
            trackAnalyticsClick({
                entity_type: 'product',
                entity_id: product.id,
                placement_id: widgetId,
                placement_type: 'search_result',
                metadata: { product_name: product.name }
            });
        }

        // Navigate directly on both mobile and desktop
        window.location.href = productHref;
    };

    const productHref = `/products/${product.handle || product.slug || product.id}`;

    // Replicate ProductCarouselWidget's Shadow Logic
    const getShadowStyle = () => {
        const shadow = cardStyle?.shadow || 'md';
        if (shadow === 'none') return 'none';
        if (shadow === 'sm') return '0 1px 2px 0 rgb(0 0 0 / 0.05)';
        if (shadow === 'md') return '0 4px 6px -1px rgb(0 0 0 / 0.1)';
        if (shadow === 'lg') return '0 10px 15px -3px rgb(0 0 0 / 0.1)';
        if (shadow === 'xl') return '0 20px 25px -5px rgb(0 0 0 / 0.1)';
        return '0 4px 6px -1px rgb(0 0 0 / 0.1)';
    };

    return (
        <div className="group relative h-full flex flex-col cursor-pointer" onClick={handleCardClick}>
            <div
                className="bg-white overflow-hidden transition h-full flex flex-col relative"
                style={{
                    backgroundColor: cardStyle?.backgroundColor || '#ffffff',
                    borderColor: cardStyle?.borderColor || '#e5e7eb',
                    borderWidth: '1px',
                    borderStyle: 'solid',
                    borderRadius: cardStyle?.borderRadius || '0.5rem',
                    boxShadow: 'none'
                }}
            >
                {/* Image Section */}
                <div className="aspect-square bg-gray-100 relative overflow-hidden">
                    {(product.image_url || product.thumbnail_url || product.image) ? (
                        <img
                            src={product.image_url || product.thumbnail_url || product.image}
                            alt={product.name}
                            className="w-full h-full object-cover group-hover:scale-110 transition duration-500"
                            loading="lazy"
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                            No Image
                        </div>
                    )}

                    {/* Wishlist Button */}
                    <button
                        onClick={handleWishlistToggle}
                        className="absolute top-2 left-2 p-1.5 rounded-full bg-white/80 hover:bg-white text-gray-600 hover:text-red-500 transition-all shadow-sm z-10"
                        style={{ padding: `${0.35 * scale}rem` }}
                    >
                        <Heart
                            className={cn("transition-colors", isInWishlist(product.id) ? 'fill-red-500 text-red-500' : '')}
                            style={{ width: `${1.2 * scale}rem`, height: `${1.2 * scale}rem` }}
                        />
                    </button>

                    {showFeaturedBadge !== false && product.is_featured && (
                        <div
                            className="absolute top-3 right-3 font-bold rounded-full shadow-sm z-10"
                            style={{
                                backgroundColor: '#fbbf24',
                                color: colors?.text || '#111827',
                                fontSize: `clamp(${0.875 * scale}rem, ${0.75 * scale}rem + ${0.5 * scale}vw, ${1.125 * scale}rem)`,
                                lineHeight: `clamp(${1.1 * scale}rem, ${1 * scale}rem + ${0.5 * scale}vw, ${1.5 * scale}rem)`,
                                padding: `${0.25 * scale}rem ${0.75 * scale}rem`
                            }}
                        >
                            Featured
                        </div>
                    )}
                </div>

                {/* Info Section */}
                <div className="flex-1 flex flex-col" style={{ padding: `${1.1 * scale}rem` }}>
                    <h3
                        className={cn("font-semibold mb-2 transition-colors group-hover:text-blue-600", scale < 0.8 ? 'line-clamp-1' : 'line-clamp-2')}
                        style={{
                            fontSize: `clamp(${0.875 * scale}rem, ${0.75 * scale}rem + ${0.5 * scale}vw, ${1.125 * scale}rem)`,
                            lineHeight: `clamp(${1.1 * scale}rem, ${1 * scale}rem + ${0.5 * scale}vw, ${1.5 * scale}rem)`
                        }}
                    >
                        {product.name}
                    </h3>

                    {/* Description */}
                    {showDescription && product.description && (
                        <p
                            className={cn("text-gray-500 mb-2", scale < 0.8 ? 'line-clamp-1' : 'line-clamp-2')}
                            style={{ fontSize: `clamp(${0.75 * scale}rem, ${0.7 * scale}rem + ${0.2 * scale}vw, ${0.875 * scale}rem)` }}
                        >
                            {product.description}
                        </p>
                    )}

                    {/* Attributes */}
                    {showAttributes && product.attributes && Object.keys(product.attributes).length > 0 && (
                        <div className="flex flex-wrap items-center gap-1.5 mb-2">
                            {product.attributes.vendor && (
                                <div
                                    className="inline-block px-2 py-0.5 bg-blue-50 border border-blue-100 text-blue-700 rounded font-semibold leading-relaxed"
                                    style={{ fontSize: `clamp(${0.65 * scale}rem, ${0.6 * scale}rem + ${0.1 * scale}vw, ${0.75 * scale}rem)` }}
                                >
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
                                                        className="object-contain shrink-0 relative top-[-1px]"
                                                        style={{ width: `${0.85 * scale}rem`, height: `${0.85 * scale}rem` }}
                                                    />
                                                </span>
                                            </>
                                        );
                                    })() : (
                                        product.attributes.vendor
                                    )}
                                </div>
                            )}
                            {Object.entries(product.attributes).filter(([key]) => key !== 'vendor').slice(0, 2).map(([key, value], i) => (
                                <div
                                    key={i}
                                    className="inline-flex items-center px-2 py-0.5 bg-gray-50 border border-gray-100 text-gray-600 rounded"
                                    style={{ fontSize: `clamp(${0.65 * scale}rem, ${0.6 * scale}rem + ${0.1 * scale}vw, ${0.75 * scale}rem)` }}
                                >
                                    <span className="whitespace-nowrap">{formatAttributeValue(value)}</span>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Tags */}
                    {showTags && product.tags && Array.isArray(product.tags) && product.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-2">
                            {product.tags.slice(0, 2).map((tag, i) => (
                                <span
                                    key={i}
                                    className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full"
                                    style={{ fontSize: `clamp(${0.65 * scale}rem, ${0.6 * scale}rem + ${0.1 * scale}vw, ${0.75 * scale}rem)` }}
                                >
                                    {tag}
                                </span>
                            ))}
                        </div>
                    )}

                    {/* Social Proof */}
                    {showSocialProof && (
                        <div
                            className="flex items-center gap-3 text-gray-500 font-medium mb-2"
                            style={{ fontSize: `clamp(${0.65 * scale}rem, ${0.6 * scale}rem + ${0.1 * scale}vw, ${0.75 * scale}rem)` }}
                        >
                            <span className="flex items-center gap-1.5">
                                <Eye className="text-gray-500" style={{ width: `${0.85 * scale}rem`, height: `${0.85 * scale}rem` }} />
                                {product.stats?.impressions || 0}
                            </span>
                            <span className="flex items-center gap-1.5">
                                <Heart className="text-gray-500" style={{ width: `${0.85 * scale}rem`, height: `${0.85 * scale}rem` }} />
                                {product.stats?.wishlist_count || 0}
                            </span>
                        </div>
                    )}

                    {/* Rating */}
                    {showRating && product.rating_summary && parseFloat(product.rating_summary.average_rating) > 0 && (
                        <div className="flex items-center gap-1.5 mb-2" style={{ fontSize: `${0.75 * scale}rem` }}>
                            <Star className="fill-yellow-400 text-yellow-400" style={{ width: `${0.8 * scale}rem`, height: `${0.8 * scale}rem` }} />
                            <span className="font-semibold text-gray-700">{parseFloat(product.rating_summary.average_rating).toFixed(1)}</span>
                            <span className="text-gray-500 font-medium">({parseInt(product.rating_summary.total_reviews || 0)} review{parseInt(product.rating_summary.total_reviews || 0) !== 1 ? 's' : ''})</span>
                        </div>
                    )}

                    {/* Actions Row */}
                    <div className="mt-auto flex items-center justify-between gap-2" style={{ paddingTop: `${1 * scale}rem` }}>
                        {showPrice !== false && (
                            <p
                                className="font-bold text-blue-600"
                                style={{ fontSize: `clamp(${1 * scale}rem, ${0.9 * scale}rem + ${0.6 * scale}vw, ${1.25 * scale}rem)` }}
                            >
                                ${parseFloat(product.price).toFixed(2)}
                            </p>
                        )}

                        <div className="flex items-center gap-2">
                            {showAddToCart !== false && (
                                <button
                                    className={cn(
                                        "rounded-full transition flex items-center gap-2 shadow-sm",
                                        addingToCart === product.id ? "bg-green-500 text-white" : "bg-blue-50 text-blue-600 hover:bg-blue-100"
                                    )}
                                    title="Add to Cart"
                                    onClick={handleAddToCart}
                                    disabled={addingToCart === product.id}
                                    style={{ padding: `${0.625 * scale}rem` }}
                                >
                                    {addingToCart === product.id ? (
                                        <Check className="animate-pulse" style={{ width: `${1.25 * scale}rem`, height: `${1.25 * scale}rem` }} />
                                    ) : (
                                        <ShoppingCart style={{ width: `${1.25 * scale}rem`, height: `${1.25 * scale}rem` }} />
                                    )}
                                </button>
                            )}
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
