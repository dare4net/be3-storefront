"use client";

import React from 'react';
import ProductCarouselWidget from '@/components/widgets/ProductCarouselWidget';

export default function SuggestionsCarousel({
    title = "You Might Also Like",
    subtitle = "Handpicked for you based on your interests",
    categoryId,
    isFeatured,
    limit = 10,
    sort = "random"
}) {
    const config = {
        title,
        subtitle,
        categoryId,
        sourceType: categoryId ? 'category' : 'all',
        showFeaturedOnly: isFeatured,
        limit,
        sort,
        columns: { mobile: 1, tablet: 2, desktop: 4 },
        peekEffect: true,
        padding: "py-12",
        backgroundColor: "transparent",
        container: true,
        titleSize: "text-3xl",
        titleColor: "text-gray-900",
        subtitleColor: "text-gray-500",
        placement_type: 'suggestions_carousel'
    };

    return (
        <div className="bg-white border-t border-gray-100">
            <ProductCarouselWidget config={config} />
        </div>
    );
}
