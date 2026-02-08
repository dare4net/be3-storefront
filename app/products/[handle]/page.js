import { notFound } from "next/navigation";
import Link from "next/link";
import { Check, Heart, Share2, Tag, ChevronRight, Star } from 'lucide-react';
import { getTenantAndTheme } from "@/lib/context";
import AddToCartButton from "@/components/products/AddToCartButton";
import WishlistButton from "@/components/products/WishlistButton";
import ProductGallery from "@/components/products/ProductGallery";
import RelatedProducts from "@/components/products/RelatedProducts";
import ProductTabs from "@/components/products/ProductTabs";
import DynamicMetaTags from "@/components/DynamicMetaTags";
import SuggestionsCarousel from "@/components/products/SuggestionsCarousel";
import StickyAddToCart from "@/components/products/StickyAddToCart";
import EntityAnalytics from "@/components/analytics/EntityAnalytics";

async function getProduct(handle, tenant) {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:3000';
    try {
        const res = await fetch(`${apiUrl}/products/storefront/products/${handle}`, {
            headers: { 'x-tenant-id': tenant.id },
            cache: 'no-store'
        });

        if (!res.ok) return null;

        const data = await res.json();
        return data.product;
    } catch (e) {
        console.error("[ProductPage] Exception:", e);
        return null;
    }
}

export default async function ProductPage({ params }) {
    const resolvedParams = await params;
    const { handle } = resolvedParams;

    // Fetch tenant context once
    const { tenant } = await getTenantAndTheme();
    if (!tenant) return null;

    const product = await getProduct(handle, tenant);

    if (!product) {
        notFound();
    }

    const { name, price, compare_at_price, description, images = [], attributes = {}, resolved_attributes = [], categories = [], tags = [] } = product;

    // Process gallery images (combine main image_url if not in media list)
    const galleryImages = images.length > 0 ? images : (product.image_url ? [{ url: product.image_url }] : []);
    const mainCategory = categories[0];

    // Calculate Discount
    const discount = compare_at_price && price < compare_at_price
        ? Math.round(((compare_at_price - price) / compare_at_price) * 100)
        : 0;

    return (
        <div className="container mx-auto px-4 py-8 max-w-7xl min-h-screen">
            <DynamicMetaTags meta={product.seo} tenant={tenant} />
            {/* Breadcrumbs */}
            <nav className="flex items-center text-sm text-gray-500 mb-8 overflow-x-auto whitespace-nowrap pb-2 scrollbar-hide">
                <Link href="/" className="hover:text-blue-600 transition-colors">Home</Link>
                <ChevronRight className="w-4 h-4 mx-2 text-gray-400" />
                <Link href="/categories" className="hover:text-blue-600 transition-colors">Categories</Link>
                {mainCategory?.breadcrumb?.map(bc => (
                    <span key={bc.id} className="flex items-center">
                        <ChevronRight className="w-4 h-4 mx-2 text-gray-400" />
                        <Link href={`/categories/${bc.slug}`} className="hover:text-blue-600 transition-colors">
                            {bc.name}
                        </Link>
                    </span>
                ))}
                {!mainCategory && (
                    <>
                        <ChevronRight className="w-4 h-4 mx-2 text-gray-400" />
                        <span className="text-gray-400 italic">Uncategorized</span>
                    </>
                )}
                <ChevronRight className="w-4 h-4 mx-2 text-gray-400" />
                <span className="text-gray-900 font-bold truncate max-w-[200px]">{name}</span>
            </nav>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 lg:gap-16">
                {/* Left Column: Gallery */}
                <div className="space-y-8">
                    <ProductGallery images={galleryImages} title={name} />
                </div>

                {/* Right Column: Info */}
                <div className="space-y-8">
                    {/* Header */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            {tags && tags.length > 0 ? (
                                <div className="flex flex-wrap gap-2">
                                    {tags.map((tag, i) => (
                                        <span key={i} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 uppercase tracking-wide">
                                            {tag}
                                        </span>
                                    ))}
                                </div>
                            ) : <div></div>}

                            {/* Review Placeholder */}
                            <div className="flex items-center gap-1 text-yellow-400">
                                <Star className="w-4 h-4 fill-current" />
                                <Star className="w-4 h-4 fill-current" />
                                <Star className="w-4 h-4 fill-current" />
                                <Star className="w-4 h-4 fill-current" />
                                <Star className="w-4 h-4 fill-current opacity-50" />
                                <span className="text-xs text-gray-400 ml-1">(4.2)</span>
                            </div>
                        </div>

                        <h1 className="text-4xl lg:text-5xl font-extrabold text-gray-900 tracking-tight leading-tight">{name}</h1>

                        <div className="flex items-center gap-4 pt-2">
                            <span className="text-4xl font-bold text-gray-900">
                                ${parseFloat(price).toFixed(2)}
                            </span>
                            {compare_at_price && (
                                <div className="flex flex-col">
                                    <span className="text-lg text-gray-400 line-through">
                                        ${parseFloat(compare_at_price).toFixed(2)}
                                    </span>
                                    {discount > 0 && (
                                        <span className="text-xs font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-md">
                                            SAVE {discount}%
                                        </span>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Short Description (Preview) */}
                    <p className="text-gray-600 text-lg leading-relaxed line-clamp-3">
                        {description}
                    </p>

                    {/* Actions */}
                    <div className="space-y-6 pt-4">
                        <AddToCartButton product={product} />

                        <div className="flex gap-4">
                            <WishlistButton
                                product={product}
                                className="flex-1 flex items-center justify-center gap-2 h-11 border rounded-xl font-medium text-sm"
                            />
                            <button className="flex-1 flex items-center justify-center gap-2 h-11 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors text-sm font-medium text-gray-700">
                                <Share2 className="w-4 h-4" />
                                Share
                            </button>
                        </div>
                    </div>

                    {/* Features Badges */}
                    <div className="grid grid-cols-2 gap-4 py-6 border-t border-b border-gray-100">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-green-50 rounded-full text-green-600">
                                <Check className="w-4 h-4" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-900">Free Shipping</p>
                                <p className="text-xs text-gray-500">On orders over $100</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-50 rounded-full text-blue-600">
                                <Check className="w-4 h-4" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-900">Secure Payment</p>
                                <p className="text-xs text-gray-500">100% protected</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tabs Section */}
            <div className="mt-16">
                <ProductTabs
                    description={description}
                    attributes={attributes}
                    resolvedAttributes={resolved_attributes}
                />
            </div>

            {/* Related Products */}
            <RelatedProducts
                categorySlug={mainCategory?.slug}
                currentProductId={product.id}
                tenantId={tenant.id}
            />

            {/* Trending Section */}
            <SuggestionsCarousel
                title="Trending Now"
                subtitle="Popular picks from across our store"
                sort="trending"
                limit={8}
            />

            {/* Sticky Add to Cart Bar */}
            <StickyAddToCart product={product} />

            {/* Analytics Tracking */}
            <EntityAnalytics type="product" entity={product} />
        </div>
    );
}
