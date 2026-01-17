"use client";

import { useState } from 'react';
import { cn } from "@/lib/utils";

export default function ProductTabs({ description, attributes, reviews = [] }) {
    const [activeTab, setActiveTab] = useState('description');

    const tabs = [
        { id: 'description', label: 'Description' },
        { id: 'specs', label: 'Specifications' },
        { id: 'reviews', label: 'Reviews' },
    ];

    return (
        <div className="mt-12 bg-white rounded-2xl border overflow-hidden">
            {/* Tab Headers */}
            <div className="flex border-b overflow-x-auto scrollbar-hide">
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={cn(
                            "px-8 py-4 text-sm font-medium transition-colors whitespace-nowrap",
                            activeTab === tab.id
                                ? "border-b-2 border-blue-600 text-blue-600 bg-blue-50/50"
                                : "text-gray-500 hover:text-gray-700 hover:bg-gray-50"
                        )}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Tab Content */}
            <div className="p-8 min-h-[300px]">
                {activeTab === 'description' && (
                    <div className="prose max-w-none text-gray-600 leading-relaxed">
                        <p>{description}</p>
                    </div>
                )}

                {activeTab === 'specs' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-4">
                        {Object.keys(attributes).length > 0 ? (
                            Object.entries(attributes).map(([key, value]) => (
                                <div key={key} className="flex justify-between border-b pb-2 last:border-0">
                                    <span className="text-gray-500 capitalize">{key.replace(/_/g, ' ')}</span>
                                    <span className="font-medium text-gray-900">{value}</span>
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
