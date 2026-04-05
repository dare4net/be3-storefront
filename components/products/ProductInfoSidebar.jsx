"use client";

import { MapPin, Truck, ShieldCheck, Star, Store, RefreshCw, ChevronRight, Clock, Award, Package } from 'lucide-react';
import Link from 'next/link';

export default function ProductInfoSidebar({ product }) {
    return (
        <div className="space-y-4">

            {/* Delivery Info */}
            <div className="border border-gray-200 rounded-2xl overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-3">
                    <Truck className="w-5 h-5 text-blue-600" />
                    <span className="font-semibold text-gray-900 text-sm">Delivery & Shipping</span>
                </div>
                <div className="px-5 py-4 space-y-4">
                    <div className="flex items-start gap-3">
                        <div className="mt-1 w-2 h-2 rounded-full bg-green-500 flex-shrink-0" />
                        <div>
                            <p className="text-sm font-semibold text-gray-900">Free Standard Delivery</p>
                            <p className="text-xs text-gray-500 mt-0.5">Estimated: <span className="text-gray-900 font-medium">Apr 10 – Apr 14</span></p>
                        </div>
                    </div>
                    <div className="flex items-start gap-3">
                        <div className="mt-1 w-2 h-2 rounded-full bg-blue-500 flex-shrink-0" />
                        <div>
                            <p className="text-sm font-semibold text-gray-900">Express Delivery</p>
                            <p className="text-xs text-gray-500 mt-0.5">Estimated: <span className="text-gray-900 font-medium">Apr 7 – Apr 9</span> · from $4.99</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-500 bg-gray-50 rounded-xl px-3 py-2">
                        <MapPin className="w-4 h-4 flex-shrink-0" />
                        <span>Delivering to <span className="text-gray-900 font-medium">United States, 10001</span></span>
                        <button className="ml-auto text-blue-600 font-semibold whitespace-nowrap">Change</button>
                    </div>
                </div>
            </div>

            {/* Returns & Buyer Protection */}
            <div className="border border-gray-200 rounded-2xl overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-3">
                    <ShieldCheck className="w-5 h-5 text-blue-600" />
                    <span className="font-semibold text-gray-900 text-sm">Buyer Protection</span>
                </div>
                <div className="px-5 py-4 space-y-3">
                    <div className="flex items-start gap-3">
                        <RefreshCw className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />
                        <div>
                            <p className="text-sm font-semibold text-gray-900">30-Day Free Returns</p>
                            <p className="text-xs text-gray-500 mt-0.5">Return for any reason within 30 days of receiving your order.</p>
                        </div>
                    </div>
                    <div className="flex items-start gap-3">
                        <Package className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />
                        <div>
                            <p className="text-sm font-semibold text-gray-900">Purchase Protection</p>
                            <p className="text-xs text-gray-500 mt-0.5">Full refund if the item doesn't arrive or doesn't match the description.</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Seller Info */}
            <div className="border border-gray-200 rounded-2xl overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-3">
                    <Store className="w-5 h-5 text-blue-600" />
                    <span className="font-semibold text-gray-900 text-sm">Sold by</span>
                </div>
                <div className="px-5 py-4">
                    <div className="flex items-center gap-3 mb-4">
                        {product?.store_collection?.image_url ? (
                            <img src={product.store_collection.image_url} alt={product.vendor} className="w-12 h-12 rounded-xl object-cover border border-gray-200 flex-shrink-0" />
                        ) : (
                            <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 font-bold text-lg flex-shrink-0">
                                {product?.vendor?.charAt(0)?.toUpperCase() || 'S'}
                            </div>
                        )}
                        <div>
                            <p className="font-bold text-gray-900 text-sm">{product?.vendor || 'Official Store'}</p>
                            <div className="flex items-center gap-1 mt-0.5">
                                <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
                                <span className="text-xs font-semibold text-gray-700">{product?.vendor_stats?.rating_score || '4.8'}</span>
                                <span className="text-xs text-gray-400">({product?.vendor_stats?.total_ratings || 0} ratings)</span>
                            </div>
                        </div>
                        {product?.store_collection?.slug && (
                            <Link href={`/collections/${product.store_collection.slug}`} className="ml-auto flex items-center gap-1 text-xs text-blue-600 font-semibold border border-blue-200 rounded-lg px-3 py-1.5 hover:bg-blue-50 transition-colors">
                                Visit Store <ChevronRight className="w-3 h-3" />
                            </Link>
                        )}
                    </div>
                    <div className="grid grid-cols-3 gap-3 border-t border-gray-100 pt-4">
                        <div className="text-center">
                            <p className="text-lg font-bold text-gray-900">{product?.vendor_stats?.positive_ratings || 0}%</p>
                            <p className="text-[11px] text-gray-500 mt-0.5">Positive ratings</p>
                        </div>
                        <div className="text-center border-x border-gray-100">
                            <p className="text-lg font-bold text-gray-900">
                                {product?.vendor_stats?.items_sold >= 1000
                                    ? (product.vendor_stats.items_sold / 1000).toFixed(1) + 'K+'
                                    : (product?.vendor_stats?.items_sold || 0)}
                            </p>
                            <p className="text-[11px] text-gray-500 mt-0.5">Items sold</p>
                        </div>
                        <div className="text-center">
                            <p className="text-lg font-bold text-gray-900">{product?.vendor_stats?.years_on_platform || 0} yrs</p>
                            <p className="text-[11px] text-gray-500 mt-0.5">On platform</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Coupons & Offers */}
            <div className="border border-dashed border-blue-300 bg-blue-50/50 rounded-2xl overflow-hidden">
                <div className="px-5 py-4 border-b border-blue-100 flex items-center gap-3">
                    <Award className="w-5 h-5 text-blue-600" />
                    <span className="font-semibold text-blue-900 text-sm">Available Coupons</span>
                </div>
                <div className="px-5 py-4 space-y-3">
                    <div className="flex items-center justify-between">
                        <div>
                            <span className="text-xs font-bold text-blue-700 border border-blue-300 rounded px-2 py-0.5 bg-white">SAVE10</span>
                            <p className="text-xs text-gray-600 mt-1.5">10% off on your first order</p>
                        </div>
                        <button className="text-xs text-blue-600 font-bold ml-4">Claim</button>
                    </div>
                    <div className="flex items-center justify-between">
                        <div>
                            <span className="text-xs font-bold text-blue-700 border border-blue-300 rounded px-2 py-0.5 bg-white">FREESHIP</span>
                            <p className="text-xs text-gray-600 mt-1.5">Free shipping on orders $50+</p>
                        </div>
                        <button className="text-xs text-blue-600 font-bold ml-4">Claim</button>
                    </div>
                </div>
            </div>

            {/* Safe Checkout */}
            <div className="border border-gray-200 rounded-2xl px-5 py-4 flex items-center gap-4">
                <ShieldCheck className="w-8 h-8 text-green-600 flex-shrink-0" />
                <div>
                    <p className="text-sm font-semibold text-gray-900">Guaranteed Safe Checkout</p>
                    <p className="text-xs text-gray-500 mt-0.5">Encrypted payments via Stripe & PayPal. Your data is never stored.</p>
                </div>
            </div>

        </div>
    );
}
