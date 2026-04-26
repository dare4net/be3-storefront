"use client";

import Link from 'next/link';
import { ChevronRight, Package } from 'lucide-react';
import { useLegacyPageData } from '@/components/providers/LegacyPageContext';
import SuggestionsCarousel from '@/components/products/SuggestionsCarousel';

export default function LegacyWidgetBridge({ config }) {
    const { legacy_type } = config;
    const { data: entity, type: pageType } = useLegacyPageData() || {};

    // Note: search_layout / collection_search / category_search were removed —
    // those widgets are now registered as search_page_layout and rendered directly
    // by WidgetRenderer without passing through this bridge.

    if (!entity) return null;

    switch (legacy_type) {
        case 'collection_hero':
            return <CollectionHero entity={entity} />;
        case 'category_hero':
            return <CategoryHero entity={entity} />;
        case 'category_subnav':
            return <CategorySubnav entity={entity} />;
        case 'category_suggestions':
            return (
                <SuggestionsCarousel
                    title={`More from ${entity.name}`}
                    subtitle="Discover more great products you might love"
                    categoryId={entity.id}
                    sort="random"
                />
            );
        default:
            console.warn(`Unknown legacy type: ${legacy_type}`);
            return null;
    }
}

function CollectionHero({ entity: collection }) {
    return (
        <div className="relative bg-gradient-to-br from-slate-900 via-slate-950 to-black text-white overflow-hidden pt-16 pb-12 lg:pt-24 lg:pb-16">
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
            <div className="relative container mx-auto px-4 max-w-7xl">
                <nav className="flex items-center text-sm text-gray-300 mb-8">
                    <Link href="/" className="hover:text-white transition-colors">Home</Link>
                    <ChevronRight className="w-4 h-4 mx-2 text-gray-500" />
                    <Link href="/products" className="hover:text-white transition-colors">Products</Link>
                    <ChevronRight className="w-4 h-4 mx-2 text-gray-500" />
                    <span className="text-white font-medium">{collection.name}</span>
                </nav>
                <div className="max-w-3xl">
                    <div className="flex flex-col md:flex-row md:items-center gap-6 mb-6">
                        {collection.thumbnail_url && (
                            <div className="w-20 h-20 lg:w-28 lg:h-28 rounded-2xl overflow-hidden border-2 border-white/20 shadow-2xl shrink-0 bg-white/10 backdrop-blur-sm">
                                <img src={collection.thumbnail_url} alt="" className="w-full h-full object-cover" />
                            </div>
                        )}
                        <div className="flex flex-col gap-4">
                            <h1 className="text-4xl lg:text-7xl font-extrabold tracking-tight">
                                {collection.name}
                            </h1>
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                <div className="rounded-xl border border-white/15 bg-white/5 px-4 py-3 backdrop-blur-sm">
                                    <p className="text-[11px] uppercase tracking-[0.2em] text-white/60">Items Sold</p>
                                    <p className="text-lg font-semibold text-white">18.4k</p>
                                </div>
                                <div className="rounded-xl border border-white/15 bg-white/5 px-4 py-3 backdrop-blur-sm">
                                    <p className="text-[11px] uppercase tracking-[0.2em] text-white/60">On Platform</p>
                                    <p className="text-lg font-semibold text-white">3.2 yrs</p>
                                </div>
                                <div className="rounded-xl border border-white/15 bg-white/5 px-4 py-3 backdrop-blur-sm">
                                    <p className="text-[11px] uppercase tracking-[0.2em] text-white/60">Rating</p>
                                    <p className="text-lg font-semibold text-white">4.8 / 5</p>
                                </div>
                                <div className="rounded-xl border border-white/15 bg-white/5 px-4 py-3 backdrop-blur-sm">
                                    <p className="text-[11px] uppercase tracking-[0.2em] text-white/60">Items Listed</p>
                                    <p className="text-lg font-semibold text-white">412</p>
                                </div>
                            </div>
                        </div>
                    </div>
                    {collection.description && (
                        <p className="text-lg lg:text-xl text-gray-200/90 leading-relaxed font-light max-w-2xl">
                            {collection.description}
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}

function CategoryHero({ entity: category }) {
    return (
        <div className="relative bg-gray-900 text-white overflow-hidden">
            {category.image_url && (
                <div className="absolute inset-0">
                    <img
                        src={category.image_url}
                        alt={category.name}
                        className="w-full h-full object-cover opacity-40"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-transparent to-transparent" />
                </div>
            )}
            <div className="relative container mx-auto px-4 py-16 lg:py-24 max-w-7xl">
                <nav className="flex items-center text-sm text-gray-300 mb-6 overflow-x-auto whitespace-nowrap scrollbar-hide">
                    <Link href="/" className="hover:text-white transition-colors">Home</Link>
                    <ChevronRight className="w-4 h-4 mx-2 text-gray-500" />
                    <Link href="/categories" className="hover:text-white transition-colors">Categories</Link>
                    {category.breadcrumb?.filter(bc => bc.id !== category.id).map(bc => (
                        <span key={bc.id} className="flex items-center">
                            <ChevronRight className="w-4 h-4 mx-2 text-gray-500" />
                            <Link href={`/categories/${bc.slug}`} className="hover:text-white transition-colors">
                                {bc.name}
                            </Link>
                        </span>
                    ))}
                    <ChevronRight className="w-4 h-4 mx-2 text-gray-500" />
                    <span className="text-white font-bold">{category.name}</span>
                </nav>
                <h1 className="text-4xl lg:text-6xl font-extrabold tracking-tight mb-6">
                    {category.name}
                </h1>
                {category.description && (
                    <p className="text-lg text-gray-200 max-w-2xl leading-relaxed">
                        {category.description}
                    </p>
                )}
            </div>
        </div>
    );
}

function CategorySubnav({ entity: category }) {
    if (!category.children || category.children.length === 0) return null;
    return (
        <div className="bg-gray-50 border-b border-gray-200 py-6">
            <div className="container mx-auto px-4 max-w-7xl">
                <div className="flex items-center gap-4 overflow-x-auto pb-2 scrollbar-hide">
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-widest whitespace-nowrap">Subcategories</span>
                    {category.children.map(child => (
                        <Link
                            key={child.id}
                            href={`/categories/${child.slug}`}
                            className="flex items-center px-5 py-2 bg-white hover:bg-indigo-50 border border-gray-200 hover:border-indigo-200 rounded-full transition-all whitespace-nowrap text-sm text-gray-700 font-medium hover:text-indigo-700 shadow-sm"
                        >
                            {child.name}
                        </Link>
                    ))}
                </div>
            </div>
        </div>
    );
}
