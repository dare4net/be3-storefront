"use client";

import { CheckCircle2 } from 'lucide-react';
import { formatAttributeValue } from '@/lib/utils';
import ReviewSection from './ReviewSection';

export default function ProductDetailsStacked({ description, attributes, resolvedAttributes = [], whatsIncluded, ratingSummary, productId }) {
    const hasAttributes = resolvedAttributes.length > 0 || Object.keys(attributes).length > 0;
    const displayAttributes = resolvedAttributes.length > 0
        ? resolvedAttributes
        : Object.entries(attributes).map(([key, value]) => ({ code: key, label: key.replace(/_/g, ' '), value, icon: null }));

    const hasWhatsIncluded = whatsIncluded && Array.isArray(whatsIncluded) && whatsIncluded.length > 0;

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

            {/* What's Included */}
            {hasWhatsIncluded && (
                <div className="border border-gray-200 rounded-2xl overflow-hidden">
                    <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                        <h2 className="text-base font-bold text-gray-900">What's Included</h2>
                    </div>
                    <div className="px-6 py-5 grid grid-cols-2 gap-3 text-sm text-gray-700">
                        {whatsIncluded.map((item) => (
                            <div key={item} className="flex items-center gap-2">
                                <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                                <span>{item}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Reviews — Interactive client component */}
            <ReviewSection productId={productId} ratingSummary={ratingSummary} />
        </div>
    );
}
