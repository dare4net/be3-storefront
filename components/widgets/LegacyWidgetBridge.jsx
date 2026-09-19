"use client";

import { useState } from 'react';
import Link from 'next/link';
import { ChevronRight, Package, Clock, Star, LayoutList, UserPlus, UserCheck, MessageCircle } from 'lucide-react';
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
            if (entity.collection_type !== 'vendor') return null;
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
    const [followed, setFollowed] = useState(false);
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

                <div className="flex flex-col md:flex-row md:items-center gap-6 mb-4">
                    {/* Thumbnail */}
                    {collection.thumbnail_url && (
                        <div className="w-20 h-20 lg:w-28 lg:h-28 rounded-2xl overflow-hidden border-2 border-white/20 shadow-2xl shrink-0 bg-white/10 backdrop-blur-sm">
                            <img src={collection.thumbnail_url} alt="" className="w-full h-full object-cover" />
                        </div>
                    )}

                    {/* Name + Description */}
                    <div className="flex flex-col gap-2">
                        <h1 className="text-4xl lg:text-7xl font-extrabold tracking-tight">
                            {collection.vendor_verified ? (() => {
                                const parts = collection.name.split(' ');
                                const lastWord = parts.pop();
                                return (
                                    <>
                                        {parts.length > 0 && parts.join(' ') + ' '}
                                        <span className="whitespace-nowrap">
                                            {lastWord}
                                            <img
                                                src="/verified-white.svg"
                                                alt="Verified Business"
                                                title="Verified Business"
                                                className="w-8 h-8 lg:w-10 lg:h-10 object-contain drop-shadow-lg inline-block align-middle ml-3"
                                            />
                                        </span>
                                    </>
                                );
                            })() : collection.name}
                        </h1>
                        {collection.description && (
                            <p className="text-base lg:text-lg text-gray-300/90 font-light leading-snug max-w-2xl">
                                {collection.description}
                            </p>
                        )}
                    </div>
                </div>

                {/* Stats Row */}
                <div className="flex items-center gap-6 mt-6 flex-wrap">
                    {[
                        { icon: <Package className="w-4 h-4" />, value: '18.4K', label: 'Items Sold' },
                        { icon: <Clock className="w-4 h-4" />, value: '3.2 Yrs', label: 'On BE3' },
                        { icon: <Star className="w-4 h-4" />, value: '4.8 / 5', label: 'Store Rating' },
                        { icon: <LayoutList className="w-4 h-4" />, value: '412', label: 'Items Listed' },
                    ].map(({ icon, value, label }) => (
                        <div key={label} className="flex items-center gap-2 text-white/80">
                            <span className="text-white/50">{icon}</span>
                            <span className="text-sm font-bold text-white">{value}</span>
                            <span className="text-xs text-white/50">{label}</span>
                        </div>
                    ))}
                </div>

                {/* CTAs */}
                <div className="flex items-center gap-3 mt-6">
                    <button
                        onClick={() => setFollowed(f => !f)}
                        className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold transition-all active:scale-95 ${
                            followed
                                ? 'bg-white/10 border border-white/20 text-white hover:bg-white/15'
                                : 'bg-blue-600 hover:bg-blue-500 text-white'
                        }`}
                    >
                        {followed ? <UserCheck className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
                        {followed ? 'Following' : 'Follow Store'}
                    </button>
                    <button className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-bold border border-white/20 text-white hover:bg-white/10 transition-all active:scale-95">
                        <MessageCircle className="w-4 h-4" />
                        Chat with Seller
                    </button>
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
