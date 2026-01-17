'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Folder } from 'lucide-react';
import { proxyApi as api } from '@/lib/axios';

function CategoryCard({ category }) {
    const [imageError, setImageError] = useState(false);
    const [imageLoaded, setImageLoaded] = useState(false);

    return (
        <Link
            href={`/categories/${category.slug || category.id}`}
            className="group"
        >
            {/* Changed gradient to Pink/Orange to debug 'black background' issue */}
            <div className="relative aspect-square rounded-2xl overflow-hidden bg-gradient-to-br from-pink-500 to-orange-500 hover:scale-105 transition-transform flex items-center justify-center border-2 border-white shadow-lg">

                {/* Always show High-Contrast Folder (Yellow) as base layer/fallback */}
                <Folder className={`w-16 h-16 text-yellow-300 absolute transition-opacity duration-300 ${imageLoaded && !imageError ? 'opacity-0' : 'opacity-100'}`} />

                {/* Image Layer - Fades in on load */}
                {category.image_url && !imageError && (
                    <img
                        src={category.image_url}
                        alt={category.name}
                        className={`absolute inset-0 w-full h-full object-cover group-hover:opacity-100 transition-opacity duration-500 ${imageLoaded ? 'opacity-80' : 'opacity-0'}`}
                        onLoad={() => setImageLoaded(true)}
                        onError={() => setImageError(true)}
                    />
                )}

                {/* Gradient/Text Overlay - Made lighter failure case */}
                <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors flex items-center justify-center z-10">
                    <h3 className="text-white text-2xl font-bold text-center px-4 drop-shadow-md">
                        {category.name}
                    </h3>
                </div>
            </div>
        </Link>
    );
}

export default function CategoryGridWidget({ config }) {
    const { title = 'Shop by Category', parentCategoryId = null } = config;
    const [categories, setCategories] = useState([]);

    useEffect(() => {
        fetchCategories();
    }, [parentCategoryId]);

    const fetchCategories = async () => {
        try {
            const res = await api.get('/api/categories');
            let allCats = res.data.categories || [];

            if (parentCategoryId) {
                // Show children of selected parent
                setCategories(allCats.filter(c => c.parent_id === parentCategoryId));
            } else {
                // Default: Show top-level categories
                setCategories(allCats.filter(c => !c.parent_id));
            }
        } catch (error) {
            console.error('Failed to fetch categories', error);
        }
    };

    return (
        <section className="py-16">
            <div className="container mx-auto px-4">
                {title && <h2 className="text-3xl font-bold text-center mb-12">{title}</h2>}

                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    {categories.map((category) => (
                        <CategoryCard key={category.id} category={category} />
                    ))}
                </div>
            </div>
        </section>
    );
}
