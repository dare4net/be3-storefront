"use client";

import React from 'react';
import Link from 'next/link';
import { Heart, ShoppingBag, Trash2 } from 'lucide-react';
import { useWishlist } from '@/components/providers/WishlistContext';
import ProductCard from '@/components/products/ProductCard';

export default function WishlistPage() {
    const { wishlist, removeFromWishlist } = useWishlist();

    return (
        <div className="bg-gray-50 min-h-screen py-12">
            <div className="container mx-auto px-4">
                <div className="max-w-6xl mx-auto">
                    {/* Header */}
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                                <Heart className="w-8 h-8 text-red-500 fill-current" />
                                My Wishlist
                            </h1>
                            <p className="text-gray-500 mt-1">
                                {wishlist.length} {wishlist.length === 1 ? 'item' : 'items'} saved for later
                            </p>
                        </div>
                        <Link
                            href="/search"
                            className="text-blue-600 hover:text-blue-700 font-medium flex items-center gap-2"
                        >
                            <ShoppingBag className="w-5 h-5" />
                            Continue Shopping
                        </Link>
                    </div>

                    {wishlist.length === 0 ? (
                        <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
                            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                                <Heart className="w-10 h-10 text-gray-300" />
                            </div>
                            <h2 className="text-xl font-semibold text-gray-900 mb-2">Your wishlist is empty</h2>
                            <p className="text-gray-500 mb-8 max-w-sm mx-auto">
                                Start adding items you love to your wishlist and they'll appear here!
                            </p>
                            <Link
                                href="/search"
                                className="inline-flex items-center justify-center px-8 py-3 bg-blue-600 text-white font-bold rounded-full hover:bg-blue-700 transition-all shadow-md hover:shadow-lg active:scale-95"
                            >
                                Browse Products
                            </Link>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                            {wishlist.map((product) => (
                                <div key={product.id} className="relative group">
                                    <ProductCard product={product} />
                                    {/* Additional hover action for wishlist specific removal if needed, 
                                        but toggle heart suffices globally */}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
