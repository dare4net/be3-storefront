"use client";

import { useState } from 'react';
import { cn, formatAttributeValue } from "@/lib/utils";

export default function ProductTabs({ description, attributes, resolvedAttributes = [], reviews = [] }) {
    const [activeTab, setActiveTab] = useState('description');

    const tabs = [
        { id: 'description', label: 'Description' },
        { id: 'specs', label: 'Specifications' },
        { id: 'reviews', label: 'Reviews' },
    ];

    // Determine attributes to display
    // If resolvedAttributes is provided (from API), use it. Otherwise fallback to raw attributes map.
    const hasAttributes = resolvedAttributes.length > 0 || Object.keys(attributes).length > 0;
    const displayAttributes = resolvedAttributes.length > 0
        ? resolvedAttributes
        : Object.entries(attributes).map(([key, value]) => ({ code: key, label: key.replace(/_/g, ' '), value, icon: null }));

    return (
        <div className="mt-16 bg-white border-t border-gray-100">
            {/* Tab Headers */}
            <div className="flex border-b border-gray-100 overflow-x-auto scrollbar-hide">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={cn(
                            "px-8 py-5 text-sm font-semibold transition-colors whitespace-nowrap border-b-2",
                            activeTab === tab.id
                                ? "border-blue-600 text-blue-600"
                                : "border-transparent text-gray-500 hover:text-gray-900"
                        )}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            <div className="py-12 min-h-[300px]">
                {activeTab === 'description' && (
                    <div className="prose max-w-none text-gray-600 leading-relaxed">
                        <p>{description}</p>
                    </div>
                )}

                {activeTab === 'specs' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
                        {hasAttributes ? (
                            displayAttributes.map((attr) => (
                                <div key={attr.code} className="flex justify-between items-center border-b pb-2 last:border-0">
                                    <div className="flex items-center gap-2 text-gray-500">
                                        {attr.icon && (
                                            <img src={attr.icon} alt="" className="w-5 h-5 object-contain opacity-60" />
                                        )}
                                        <span className="capitalize">{attr.label}</span>
                                    </div>
                                    <span className="font-medium text-gray-900">{formatAttributeValue(attr.value)}</span>
                                </div>
                            ))
                        ) : (
                            <div className="col-span-full text-center text-gray-400 italic py-8">
                                No specifications available.
                            </div>
                        )}
                    </div>
                )}

                {activeTab === 'reviews' && (
                    <div className="text-center py-12">
                        <div className="flex justify-center gap-1 mb-4 text-yellow-400">
                            {[...Array(5)].map((_, i) => (
                                <svg key={i} className="w-8 h-8 fill-current" viewBox="0 0 24 24"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" /></svg>
                            ))}
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No Reviews Yet</h3>
                        <p className="text-gray-500 mb-6">Be the first to review this product!</p>
                        <button className="px-6 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors">
                            Write a Review
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
