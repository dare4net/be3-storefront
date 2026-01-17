"use client";

import Link from 'next/link';
import { ShoppingCart } from 'lucide-react';
import { useCart } from '@/components/providers/CartContext';

export default function ProductCard({ product }) {
    const { addToCart } = useCart();

    const handleAddToCart = (e) => {
        e.preventDefault();
        e.stopPropagation();
        addToCart(product, 1);
    };

    return (
        <div className="group bg-white rounded-lg border overflow-hidden hover:shadow-lg transition-all duration-300">
            {/* Image */}
            <Link href={`/products/${product.handle}`} className="block relative aspect-square overflow-hidden bg-gray-100">
                {product.image_url ? (
                    <img
                        src={product.image_url}
                        alt={product.name}
                        className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                        No Image
                    </div>
                )}
            </Link>

            {/* Content */}
            <div className="p-4">
                <Link href={`/products/${product.handle}`}>
                    <h3 className="text-lg font-medium text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-1">
                        {product.name}
                    </h3>
                </Link>

                <div className="mt-2 flex items-center justify-between">
                    <div className="flex flex-col">
                        <span className="text-xl font-bold text-gray-900">
                            ${parseFloat(product.price).toFixed(2)}
                        </span>
                        {product.compare_at_price && (
                            <span className="text-sm text-gray-500 line-through">
                                ${parseFloat(product.compare_at_price).toFixed(2)}
                            </span>
                        )}
                    </div>

                    <button
                        onClick={handleAddToCart}
                        className="p-2 rounded-full bg-blue-600 text-white hover:bg-blue-700 transition-colors shadow-md hover:shadow-lg"
                        title="Add to Cart"
                    >
                        <ShoppingCart className="w-5 h-5" />
                    </button>
                </div>
            </div>
        </div>
    );
}
