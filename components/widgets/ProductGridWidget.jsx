// Product Grid Widget - Display products in a grid
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ShoppingCart, Check, Eye } from 'lucide-react';
import { useCart } from '../providers/CartContext';
import { proxyApi as api } from '@/lib/axios';

export default function ProductGridWidget({ config }) {
    const {
        title = 'Products',
        categoryId = null,
        limit = 8,
        columns = { desktop: 4, tablet: 2, mobile: 1 },
        showAddToCart = true,
        showPrice = true,
        showFeaturedBadge = true,
        showViewDetails = true,
        showTags = false,
        showDescription = false,
        showAttributes = false,
        showSocialProof = false,
        sectionBackground = { type: 'solid', color: '#ffffff' },
        cardStyle = {
            backgroundColor: '#ffffff',
            borderColor: '#e5e7eb',
            borderRadius: '12px',
            shadow: 'md',
            hoverLift: true
        },
        colors = {
            text: '#111827',
            price: '#111827',
            accent: '#3b82f6',
            badgeBackground: '#fbbf24',
            badgeText: '#ffffff'
        }
    } = config;

    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const { addToCart } = useCart();
    const [addingToCart, setAddingToCart] = useState(null);

    useEffect(() => {
        fetchProducts();
    }, [categoryId, limit]);

    const fetchProducts = async () => {
        try {
            const params = {
                limit: limit
            };
            if (categoryId) {
                params.category_id = categoryId;
            }

            // Standardized API call - Tenant ID handled by AxiosTenantProvider
            const res = await api.get('/api/products', { params });
            setProducts(res.data.data || []);
        } catch (error) {
            console.error('Failed to fetch products', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddToCart = async (e, product) => {
        e.preventDefault(); // Prevent navigation
        setAddingToCart(product.id);

        // Add to cart safely
        try {
            await addToCart({
                id: product.id,
                name: product.name,
                price: product.price,
                image: product.image_url,
                quantity: 1
            });

            // Show success state briefly
            setTimeout(() => setAddingToCart(null), 1500);
        } catch (err) {
            console.error("Add to cart failed", err);
            setAddingToCart(null);
        }
    };

    // Generate background style
    const getBackgroundStyle = () => {
        if (sectionBackground?.type === 'gradient' && sectionBackground.gradient) {
            const { type, angle, stops } = sectionBackground.gradient;
            if (stops && stops.length > 0) {
                const gradient = stops.map(s => `${s.color} ${s.position}%`).join(', ');
                return type === 'radial'
                    ? { background: `radial-gradient(circle, ${gradient})` }
                    : { background: `linear-gradient(${angle || 135}deg, ${gradient})` };
            }
        }
        return { backgroundColor: sectionBackground?.color || '#ffffff' };
    };

    if (loading) {
        return (
            <section className="py-16" style={getBackgroundStyle()}>
                <div className="container mx-auto px-4">
                    <div className="text-center text-gray-500">Loading products...</div>
                </div>
            </section>
        );
    }

    return (
        <section className="py-16 transition-colors duration-300" style={getBackgroundStyle()}>
            <div className="container mx-auto px-4">
                {title && (
                    <h2 className="text-3xl md:text-4xl font-bold text-center mb-12" style={{ color: colors.text }}>
                        {title}
                    </h2>
                )}

                <div
                    className="grid gap-6"
                    style={{
                        gridTemplateColumns: `repeat(1, minmax(0, 1fr))`, // Default mobile
                    }}
                >
                    {products.map((product) => (
                        <div
                            key={product.id}
                            className="group block h-full"
                        >
                            <div
                                className={`h-full overflow-hidden transition-all duration-300 relative flex flex-col`}
                                style={{
                                    backgroundColor: cardStyle.backgroundColor,
                                    borderWidth: '1px',
                                    borderStyle: 'solid',
                                    borderColor: cardStyle.borderColor,
                                    borderRadius: cardStyle.borderRadius,
                                    transform: cardStyle.hoverLift ? 'translateY(0)' : 'none',
                                    boxShadow: cardStyle.shadow === 'none' ? 'none' :
                                        cardStyle.shadow === 'sm' ? '0 1px 2px 0 rgb(0 0 0 / 0.05)' :
                                            cardStyle.shadow === 'md' ? '0 4px 6px -1px rgb(0 0 0 / 0.1)' :
                                                cardStyle.shadow === 'lg' ? '0 10px 15px -3px rgb(0 0 0 / 0.1)' : '0 20px 25px -5px rgb(0 0 0 / 0.1)'
                                }}
                            >
                                {/* Product Image */}
                                <Link
                                    href={`/products/${product.slug || product.id}`}
                                    className="relative aspect-square bg-gray-100 overflow-hidden block"
                                >
                                    {product.image_url ? (
                                        <img
                                            src={product.image_url}
                                            alt={product.name}
                                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                                            No Image
                                        </div>
                                    )}

                                    {showFeaturedBadge && product.is_featured && (
                                        <div
                                            className="absolute top-3 right-3 text-xs font-bold px-3 py-1 rounded-full shadow-sm z-10"
                                            style={{
                                                backgroundColor: colors.badgeBackground || '#fbbf24',
                                                color: colors.badgeText || '#ffffff'
                                            }}
                                        >
                                            Featured
                                        </div>
                                    )}

                                    {/* Overlay Actions (Desktop) */}
                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />
                                </Link>

                                {/* Product Info */}
                                <div className="p-5 flex flex-col flex-grow">
                                    <Link href={`/products/${product.slug || product.id}`}>
                                        <h3
                                            className="font-semibold text-lg mb-2 line-clamp-2 transition-colors hover:text-blue-600"
                                            style={{ color: colors.text }}
                                        >
                                            {product.name}
                                        </h3>
                                    </Link>

                                    <div className="mt-2 space-y-2">
                                        {showDescription && product.description && (
                                            <p className="text-sm text-gray-500 line-clamp-2">{product.description}</p>
                                        )}

                                        {showAttributes && product.attributes && Object.keys(product.attributes).length > 0 && (
                                            <div className="flex flex-wrap gap-1 mt-1">
                                                {Object.entries(product.attributes).slice(0, 2).map(([key, value], i) => (
                                                    <span key={i} className="text-xs px-2 py-0.5 bg-gray-50 border border-gray-100 text-gray-600 rounded">
                                                        <span className="font-medium">{key}:</span> {value}
                                                    </span>
                                                ))}
                                            </div>
                                        )}

                                        {showTags && product.tags && Array.isArray(product.tags) && product.tags.length > 0 && (
                                            <div className="flex flex-wrap gap-1">
                                                {product.tags.slice(0, 3).map((tag, i) => (
                                                    <span key={i} className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full">
                                                        {tag}
                                                    </span>
                                                ))}
                                            </div>
                                        )}

                                        {showSocialProof && (
                                            <div className="flex items-center gap-3 text-xs text-gray-400 mt-2">
                                                <span className="flex items-center gap-1">
                                                    <Eye className="w-3 h-3" /> {Math.floor(Math.random() * 500) + 50}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    ❤️ {Math.floor(Math.random() * 50) + 5}
                                                </span>
                                            </div>
                                        )}
                                    </div>

                                    <div className="mt-auto pt-4 flex items-center justify-between gap-2">
                                        <div className="flex flex-col">
                                            {showPrice && (
                                                <span className="text-xl font-bold" style={{ color: colors.price }}>
                                                    ${parseFloat(product.price).toFixed(2)}
                                                </span>
                                            )}
                                        </div>

                                        <div className="flex items-center gap-2">
                                            {showViewDetails && (
                                                <Link
                                                    href={`/products/${product.slug || product.id}`}
                                                    className="p-2.5 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
                                                    aria-label="View Details"
                                                >
                                                    <Eye className="w-5 h-5" />
                                                </Link>
                                            )}

                                            {showAddToCart && (
                                                <button
                                                    onClick={(e) => handleAddToCart(e, product)}
                                                    disabled={addingToCart === product.id}
                                                    className="p-2.5 px-4 rounded-full transition-all duration-200 transform hover:scale-105 active:scale-95 shadow-md flex items-center gap-2"
                                                    style={{
                                                        backgroundColor: addingToCart === product.id ? '#10b981' : (colors.accent || '#3b82f6'),
                                                        color: '#ffffff'
                                                    }}
                                                    aria-label="Add to Cart"
                                                >
                                                    {addingToCart === product.id ? (
                                                        <Check className="w-5 h-5 animate-in zoom-in spin-in-50 duration-300" />
                                                    ) : (
                                                        <>
                                                            <ShoppingCart className="w-5 h-5" />
                                                            <span className="text-sm font-medium hidden md:inline">Add</span>
                                                        </>
                                                    )}
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {products.length === 0 && (
                    <div className="text-center text-gray-500 py-12">
                        No products found
                    </div>
                )}
            </div>

            <style jsx>{`
                @media (min-width: 640px) {
                    .grid { grid-template-columns: repeat(${columns?.tablet || 2}, minmax(0, 1fr)) !important; }
                }
                @media (min-width: 1024px) {
                    .grid { grid-template-columns: repeat(${columns?.desktop || 4}, minmax(0, 1fr)) !important; }
                }
                .group:hover > div {
                    transform: ${cardStyle?.hoverLift ? 'translateY(-8px)' : 'none'} !important;
                }
            `}</style>
        </section>
    );
}
