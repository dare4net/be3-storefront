// Gallery Widget - Grid of images
'use client';

import { useState } from 'react';
import { X } from 'lucide-react';

export default function GalleryWidget({ config }) {
    const { images = [] } = config;
    const [lightboxImage, setLightboxImage] = useState(null);

    if (images.length === 0) return null;

    return (
        <>
            <section className="py-16 bg-white">
                <div className="container mx-auto px-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {images.map((image, index) => (
                            <button
                                key={index}
                                onClick={() => setLightboxImage(image)}
                                className="relative aspect-square rounded-lg overflow-hidden group cursor-pointer"
                            >
                                <img
                                    src={image.url || image}
                                    alt={image.alt || `Gallery image ${index + 1}`}
                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                                />
                                <div className="absolute inset-0 bg-black opacity-0 group-hover:opacity-30 transition-opacity" />
                            </button>
                        ))}
                    </div>
                </div>
            </section>

            {/* Lightbox */}
            {lightboxImage && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4"
                    onClick={() => setLightboxImage(null)}
                >
                    <button
                        className="absolute top-4 right-4 text-white p-2 hover:bg-white/20 rounded-full"
                        onClick={() => setLightboxImage(null)}
                    >
                        <X className="w-8 h-8" />
                    </button>
                    <img
                        src={lightboxImage.url || lightboxImage}
                        alt={lightboxImage.alt || 'Gallery image'}
                        className="max-w-full max-h-full object-contain"
                        onClick={(e) => e.stopPropagation()}
                    />
                </div>
            )}
        </>
    );
}
