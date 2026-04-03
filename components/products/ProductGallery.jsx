"use client";

import { useState } from 'react';
import { cn } from "@/lib/utils";

export default function ProductGallery({ images = [], title }) {
    // If no images, show placeholder
    const safeImages = images.length > 0 ? images.map(img => img.url) : [];
    const [selectedImage, setSelectedImage] = useState(safeImages[0] || null);

    if (!selectedImage) {
        return (
            <div className="w-full aspect-square bg-gray-100 rounded-xl flex items-center justify-center text-gray-300">
                <span className="text-xl">No Image</span>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-4">
            {/* Main Image Container */}
            <div className="relative w-full bg-white border border-gray-100 flex items-center justify-center overflow-hidden" style={{ height: '480px' }}>
                <img
                    src={selectedImage}
                    alt={title}
                    className="w-full h-full object-contain p-6"
                />
            </div>

            {/* Thumbnails */}
            {safeImages.length > 1 && (
                <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                    {safeImages.map((img, idx) => (
                        <button
                            key={idx}
                            onClick={() => setSelectedImage(img)}
                            className={cn(
                                "relative w-20 aspect-square flex-shrink-0 bg-white border overflow-hidden transition-colors flex items-center justify-center p-2",
                                selectedImage === img
                                    ? "border-blue-600"
                                    : "border-gray-100 hover:border-gray-300"
                            )}
                        >
                            <img
                                src={img}
                                alt={`${title} view ${idx + 1}`}
                                className="w-full h-full object-contain"
                            />
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
