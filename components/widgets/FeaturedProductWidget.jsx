// Featured Product Widget
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ShoppingCart, Star } from 'lucide-react';
import { proxyApi as api } from '@/lib/axios';

export default function FeaturedProductWidget({ config }) {
    const { productId } = config;
    const [product, setProduct] = useState(null);

    useEffect(() => {
        if (productId) {
            console.log('[FeaturedProduct] Fetching ID:', productId);
            fetchProduct();
        } else {
            console.warn('[FeaturedProduct] No Product ID configured');
        }
    }, [productId]);

    const fetchProduct = async () => {
        try {
            const res = await api.get(`/api/products/${productId}`);
            const data = res.data;
            console.log('[FeaturedProduct] Data:', data);
            setProduct(data.product);
        } catch (error) {
            console.error('Failed to fetch product', error);
        }
    };

    if (!product) return null;

    return (
        <section className="py-16 bg-gradient-to-br from-blue-50 to-purple-50">
            <div className="container mx-auto px-4">
                <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-12 items-center">
                    {/* Product Image */}
                    <div className="relative aspect-square rounded-2xl overflow-hidden shadow-2xl">
                        {product.image_url ? (
                            <img
                                src={product.image_url}
                                alt={product.name}
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                                No Image
                            </div>
                        )}
                        <div className="absolute top-4 right-4 bg-yellow-500 text-white px-4 py-2 rounded-full font-bold shadow-lg">
                            Featured
                        </div>
                    </div>

                    {/* Product Info */}
                    <div>
                        <div className="flex items-center gap-2 mb-4">
                            {[...Array(5)].map((_, i) => (
                                <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                            ))}
                            <span className="text-gray-600">(4.9)</span>
                        </div>
                        <h2 className="text-4xl md:text-5xl font-bold mb-4">{product.name}</h2>
                        <p className="text-gray-600 text-lg mb-6">{product.description}</p>
                        <div className="text-4xl font-bold text-blue-600 mb-8">
                            ${product.price}
                        </div>
                        <div className="flex gap-4">
                            <button className="flex-1 bg-blue-600 text-white py-4 px-8 rounded-full font-bold hover:bg-blue-700 transition flex items-center justify-center gap-2">
                                <ShoppingCart className="w-5 h-5" />
                                Add to Cart
                            </button>
                            <Link
                                href={`/products/${product.slug || product.id}`}
                                className="px-8 py-4 border-2 border-gray-300 rounded-full font-bold hover:border-gray-400 transition"
                            >
                                View Details
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
