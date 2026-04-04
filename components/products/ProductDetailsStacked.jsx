"use client";

import { Star, ThumbsUp, CheckCircle2 } from 'lucide-react';
import { formatAttributeValue } from '@/lib/utils';

export default function ProductDetailsStacked({ description, attributes, resolvedAttributes = [], reviews = [] }) {
    const hasAttributes = resolvedAttributes.length > 0 || Object.keys(attributes).length > 0;
    const displayAttributes = resolvedAttributes.length > 0
        ? resolvedAttributes
        : Object.entries(attributes).map(([key, value]) => ({ code: key, label: key.replace(/_/g, ' '), value, icon: null }));

    const mockReviews = [
        { id: 1, author: "Alex Jenkins", rating: 5, date: "Oct 12, 2025", title: "Exactly what I was looking for", text: "Absolutely fantastic quality. Feels incredibly premium and holds up well over time." },
        { id: 2, author: "Sarah Connor", rating: 4, date: "Sep 28, 2025", title: "Great but slow shipping", text: "Really good product. Shipping took a little longer than expected, but the item itself is exactly what I needed." },
        { id: 3, author: "Michael T.", rating: 5, date: "Sep 15, 2025", title: "Exceeded my expectations", text: "Highly recommend purchasing. Will definitely buy from this brand again." }
    ];

    const ratingCounts = [
        { stars: 5, pct: 78 },
        { stars: 4, pct: 14 },
        { stars: 3, pct: 5 },
        { stars: 2, pct: 2 },
        { stars: 1, pct: 1 },
    ];

    return (
        <div className="space-y-1">
            {/* Description */}
            <div className="border border-gray-200 rounded-2xl overflow-hidden">
                <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                    <h2 className="text-base font-bold text-gray-900">Product Description</h2>
                </div>
                <div className="px-6 py-5 text-gray-700 leading-relaxed text-sm">
                    <p>{description}</p>
                </div>
            </div>

            {/* Specifications */}
            {hasAttributes && (
                <div className="border border-gray-200 rounded-2xl overflow-hidden">
                    <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                        <h2 className="text-base font-bold text-gray-900">Specifications</h2>
                    </div>
                    <div className="divide-y divide-gray-100">
                        {displayAttributes.map((attr, idx) => (
                            <div key={attr.code} className={`flex items-center px-6 py-3.5 text-sm ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/60'}`}>
                                <div className="flex items-center gap-2 text-gray-500 w-2/5 flex-shrink-0">
                                    {attr.icon && <img src={attr.icon} alt="" className="w-4 h-4 object-contain opacity-50" />}
                                    <span className="capitalize">{attr.label}</span>
                                </div>
                                <span className="font-semibold text-gray-900 w-3/5">{formatAttributeValue(attr.value)}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* In the Box */}
            <div className="border border-gray-200 rounded-2xl overflow-hidden">
                <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                    <h2 className="text-base font-bold text-gray-900">What's in the Box</h2>
                </div>
                <div className="px-6 py-5 grid grid-cols-2 gap-3 text-sm text-gray-700">
                    {['1x Main Product', '1x User Manual', '1x Warranty Card', '1x Accessory Kit'].map((item) => (
                        <div key={item} className="flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                            <span>{item}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Reviews */}
            <div className="border border-gray-200 rounded-2xl overflow-hidden">
                <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex items-center justify-between">
                    <h2 className="text-base font-bold text-gray-900">Customer Reviews</h2>
                    <button className="text-xs text-blue-600 font-semibold border border-blue-200 rounded-lg px-3 py-1.5 hover:bg-blue-50 transition-colors">+ Write a Review</button>
                </div>

                {/* Rating summary */}
                <div className="px-6 py-5 flex gap-8 items-center border-b border-gray-100">
                    <div className="text-center flex-shrink-0">
                        <p className="text-5xl font-bold text-gray-900">4.8</p>
                        <div className="flex justify-center text-yellow-400 mt-1">
                            {[...Array(5)].map((_, i) => <Star key={i} className="w-4 h-4 fill-current" />)}
                        </div>
                        <p className="text-xs text-gray-500 mt-1">3 reviews</p>
                    </div>
                    <div className="flex-1 space-y-1.5">
                        {ratingCounts.map(({ stars, pct }) => (
                            <div key={stars} className="flex items-center gap-2 text-xs text-gray-500">
                                <span className="w-5 text-right">{stars}</span>
                                <Star className="w-3 h-3 fill-yellow-400 text-yellow-400 flex-shrink-0" />
                                <div className="flex-1 bg-gray-100 rounded-full h-1.5 overflow-hidden">
                                    <div className="h-full bg-yellow-400 rounded-full" style={{ width: `${pct}%` }} />
                                </div>
                                <span className="w-7">{pct}%</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Individual Reviews */}
                <div className="divide-y divide-gray-100">
                    {mockReviews.map((review) => (
                        <div key={review.id} className="px-6 py-5">
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex text-yellow-400">
                                    {[...Array(5)].map((_, i) => (
                                        <Star key={i} className={`w-3.5 h-3.5 ${i < review.rating ? 'fill-current' : 'text-gray-200'}`} />
                                    ))}
                                </div>
                                <span className="text-xs text-gray-400">{review.date}</span>
                            </div>
                            <h4 className="font-semibold text-gray-900 text-sm mb-1">{review.title}</h4>
                            <p className="text-gray-600 text-sm leading-relaxed mb-3">{review.text}</p>
                            <div className="flex items-center gap-2 text-xs">
                                <span className="font-medium text-gray-800">{review.author}</span>
                                <span className="text-gray-200">•</span>
                                <span className="text-green-600 font-medium flex items-center gap-1">
                                    <ThumbsUp className="w-3 h-3" /> Verified Buyer
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

        </div>
    );
}
