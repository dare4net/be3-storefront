'use client';

import Link from 'next/link';
import { ChevronRight } from 'lucide-react';

/**
 * CollectionHeader
 * Renders a curated collection hero above widgets — only for collection_type !== 'vendor'.
 * Shows collection image (if available), name, and description.
 */
export default function CollectionHeader({ collection }) {
    if (!collection) return null;

    return (
        <div className="relative bg-gradient-to-br from-slate-900 via-slate-950 to-black text-white overflow-hidden pt-16 pb-12 lg:pt-24 lg:pb-16 mb-0">
            {/* Background Image with Overlay */}
            {collection.image_url && (
                <div className="absolute inset-0">
                    <img
                        src={collection.image_url}
                        alt={collection.name}
                        className="w-full h-full object-cover opacity-35"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-transparent to-transparent" />
                </div>
            )}
            
            {/* Content Container */}
            <div className="relative container mx-auto px-4 max-w-7xl z-10">
                
                {/* Breadcrumbs */}
                <nav className="flex items-center text-sm text-gray-300 mb-8">
                    <Link href="/" className="hover:text-white transition-colors">Home</Link>
                    <ChevronRight className="w-4 h-4 mx-2 text-gray-500" />
                    <Link href="/products" className="hover:text-white transition-colors">Products</Link>
                    <ChevronRight className="w-4 h-4 mx-2 text-gray-500" />
                    <span className="text-white font-medium">{collection.name}</span>
                </nav>

                <div className="max-w-4xl">
                    <div className="flex flex-col md:flex-row md:items-center gap-6 mb-6">
                        
                        {/* Thumbnail */}
                        {collection.thumbnail_url && (
                            <div className="w-20 h-20 lg:w-28 lg:h-28 rounded-2xl overflow-hidden border-2 border-white/20 shadow-2xl shrink-0 bg-white/10 backdrop-blur-sm">
                                <img src={collection.thumbnail_url} alt="" className="w-full h-full object-cover" />
                            </div>
                        )}
                        
                        {/* Titles & Badge */}
                        <div className="flex flex-col gap-4">
                            <span className="inline-flex items-center px-3 py-1 text-xs font-bold tracking-widest uppercase text-white/60 bg-white/5 border border-white/15 rounded-full w-fit backdrop-blur-sm">
                                Curated Collection
                            </span>
                            <h1 className="text-4xl lg:text-7xl font-extrabold tracking-tight">
                                {collection.name}
                            </h1>
                        </div>
                        
                    </div>
                    
                    {/* Description */}
                    {collection.description && (
                        <p className="text-lg lg:text-xl text-gray-200/90 leading-relaxed font-light max-w-2xl mt-6">
                            {collection.description}
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}
