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
            <div className="relative w-full aspect-[4/3] md:aspect-square bg-white rounded-2xl border overflow-hidden shadow-sm group">
                <img
                    src={selectedImage}
                    alt={title}
                    className="w-full h-full object-contain p-4 transition-transform duration-500 group-hover:scale-105"
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
                                "relative w-24 aspect-square flex-shrink-0 bg-white rounded-lg border-2 overflow-hidden transition-all",
                                selectedImage === img
                                    ? "border-blue-600 ring-1 ring-blue-600 shadow-md scale-95"
                                    : "border-transparent hover:border-gray-300"
                            )}
                        >
                            <img
                                src={img}
                                alt={`${title} view ${idx + 1}`}
                                className="w-full h-full object-contain p-1"
                            />
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
