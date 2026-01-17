// Product Carousel Widget - Scrollable product showcase
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { proxyApi as api } from '@/lib/axios';

export default function ProductCarouselWidget({ config }) {
    const { title = 'Featured Products', limit = 10, categoryId = null } = config;
    const [products, setProducts] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);

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

            const res = await api.get('/api/products', { params });
            setProducts(res.data.data || []);
        } catch (error) {
            console.error('Failed to fetch products', error);
        }
    };

    const scroll = (direction) => {
        if (direction === 'left') {
            setCurrentIndex(Math.max(0, currentIndex - 1));
        } else {
            setCurrentIndex(Math.min(products.length - 4, currentIndex + 1));
        }
    };

    return (
        <section className="py-16 bg-gray-50">
            <div className="container mx-auto px-4">
                {title && <h2 className="text-3xl font-bold mb-8">{title}</h2>}

                <div className="relative">
                    {/* Navigation Buttons */}
                    <button
                        onClick={() => scroll('left')}
                        className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-10 bg-white p-3 rounded-full shadow-lg hover:bg-gray-100 disabled:opacity-50"
                        disabled={currentIndex === 0}
                    >
                        <ChevronLeft className="w-6 h-6" />
                    </button>

                    <button
                        onClick={() => scroll('right')}
                        className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-10 bg-white p-3 rounded-full shadow-lg hover:bg-gray-100 disabled:opacity-50"
                        disabled={currentIndex >= products.length - 4}
                    >
                        <ChevronRight className="w-6 h-6" />
                    </button>

                    {/* Products */}
                    <div className="overflow-hidden">
                        <div
                            className="flex gap-4 transition-transform duration-300"
                            style={{ transform: `translateX(-${currentIndex * 25}%)` }}
                        >
                            {products.map((product) => (
                                <Link
                                    key={product.id}
                                    href={`/products/${product.slug || product.id}`}
                                    className="w-[calc(25%-12px)] flex-shrink-0 group"
                                >
                                    <div className="bg-white rounded-lg overflow-hidden shadow hover:shadow-xl transition">
                                        <div className="aspect-square bg-gray-100">
                                            {product.image_url ? (
                                                <img
                                                    src={product.image_url}
                                                    alt={product.name}
                                                    className="w-full h-full object-cover group-hover:scale-110 transition"
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-gray-400">
                                                    No Image
                                                </div>
                                            )}
                                        </div>
                                        <div className="p-4">
                                            <h3 className="font-semibold mb-2 line-clamp-1">{product.name}</h3>
                                            <p className="text-xl font-bold text-blue-600">${product.price}</p>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
