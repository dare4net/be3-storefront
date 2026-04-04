import { notFound } from "next/navigation";
import Link from "next/link";
import { Check, Heart, Share2, Star, ShieldCheck, Truck, RefreshCw, MessageCircle } from 'lucide-react';
import { getTenantAndTheme } from "@/lib/context";
import AddToCartButton from "@/components/products/AddToCartButton";
import WishlistButton from "@/components/products/WishlistButton";
import ProductGallery from "@/components/products/ProductGallery";
import RelatedProducts from "@/components/products/RelatedProducts";
import ProductDetailsStacked from "@/components/products/ProductDetailsStacked";
import DynamicMetaTags from "@/components/DynamicMetaTags";
import VariantSelector from "@/components/products/VariantSelector";
import ProductInfoSidebar from "@/components/products/ProductInfoSidebar";
import SuggestionsCarousel from "@/components/products/SuggestionsCarousel";
import StickyAddToCart from "@/components/products/StickyAddToCart";
import EntityAnalytics from "@/components/analytics/EntityAnalytics";
import ChatButton from "@/components/chat/ChatButton";
import { ChevronRight } from 'lucide-react';
import ProductLocation from "@/components/product/ProductLocation";

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

async function getRelatedVariants(productId, parentId, tenant) {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:3000';
    const effectiveParentId = parentId || productId;

    try {
        const [variantsRes, parentRes] = await Promise.all([
            fetch(`${apiUrl}/products/${effectiveParentId}/variants`, {
                headers: { 'x-tenant-id': tenant.id },
                cache: 'no-store'
            }),
            parentId ? fetch(`${apiUrl}/products/storefront/products/by-id/${parentId}`, {
                headers: { 'x-tenant-id': tenant.id },
                cache: 'no-store'
            }) : Promise.resolve(null)
        ]);

        const variantsData = await variantsRes.json();
        let parentProduct = null;
        if (parentRes) {
            const parentData = await parentRes.json();
            parentProduct = parentData.product;
        }

        return {
            variants: variantsData.variants || [],
            parentProduct
        };
    } catch (e) {
        console.error("[ProductPage] Variants Fetch Exception:", e);
        return { variants: [], parentProduct: null };
    }
}


export default async function ProductPage({ params }) {
    const { handle } = await params;

    // Fetch tenant context once
    const { tenant } = await getTenantAndTheme();
    if (!tenant) return null;


    const product = await getProduct(handle, tenant);

    if (!product) {
        notFound();
    }

    const { variants, parentProduct } = await getRelatedVariants(product.id, product.parent_id, tenant);

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

                {/* Right Column: Info — single flowing panel */}
                <div className="space-y-0 divide-y divide-gray-100 border border-gray-200 rounded-2xl overflow-hidden">

                    {/* Title + Rating */}
                    <div className="px-6 py-6 space-y-2">
                        {tags && tags.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 mb-2">
                                {tags.map((tag, i) => (
                                    <span key={i} className="text-[11px] font-semibold bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full uppercase tracking-wide">
                                        {tag}
                                    </span>
                                ))}
                            </div>
                        )}
                        <h1 className="text-2xl font-bold text-gray-900 leading-snug">{name}</h1>
                        <div className="flex items-center gap-2 text-sm pt-1">
                            <div className="flex text-yellow-400">
                                {[...Array(5)].map((_, i) => (
                                    <Star key={i} className={`w-4 h-4 ${i < 5 ? 'fill-current' : ''} ${i === 4 ? 'opacity-30' : ''}`} />
                                ))}
                            </div>
                            <span className="font-semibold text-gray-900">4.8</span>
                            <span className="text-gray-300">·</span>
                            <span className="text-gray-500">3 ratings</span>
                            <span className="text-gray-300">·</span>
                            <span className="text-blue-600 font-medium">142 sold</span>
                        </div>
                    </div>

                    {/* Price */}
                    <div className="px-6 py-5">
                        <div className="flex items-end gap-3">
                            <span className="text-3xl font-bold text-gray-900">${parseFloat(price).toFixed(2)}</span>
                            {compare_at_price && (
                                <span className="text-base text-gray-400 line-through pb-0.5">${parseFloat(compare_at_price).toFixed(2)}</span>
                            )}
                        </div>
                        {discount > 0 && (
                            <p className="text-sm text-green-600 font-medium mt-1">
                                Save {discount}% · You save ${(compare_at_price - price).toFixed(2)}
                            </p>
                        )}
                    </div>


                    {/* Location */}
                    {product.vendor_location && (
                        <div className="px-6 py-4">
                            <ProductLocation location={product.vendor_location} otherLocations={product.other_locations} />
                        </div>
                    )}

                    {/* Variant Selector */}
                    <div className="px-6">
                        <VariantSelector currentHandle={product.handle} variants={variants} parentProduct={parentProduct} currentProduct={product} />
                    </div>

                    {/* Actions */}
                    <div className="px-6 py-6 space-y-3">
                        <AddToCartButton product={product} />
                        <div className="flex gap-3">
                            <WishlistButton
                                product={product}
                                className="flex-1 flex items-center justify-center gap-2 h-10 border border-gray-200 rounded-full text-sm font-medium text-gray-700 hover:border-gray-400 transition-colors"
                            />
                            <ChatButton
                                productId={product.id}
                                productName={product.name}
                                className="flex-1 flex items-center justify-center gap-2 h-10 border border-gray-200 rounded-full text-sm font-medium text-gray-700 hover:border-gray-400 transition-colors"
                            />
                            <button className="flex-1 flex items-center justify-center gap-2 h-10 border border-gray-200 rounded-full text-sm font-medium text-gray-700 hover:border-gray-400 transition-colors">
                                <Share2 className="w-4 h-4" />
                                Share
                            </button>
                        </div>
                    </div>

                    {/* Trust badges — compact row */}
                    <div className="px-6 py-5 grid grid-cols-2 gap-x-6 gap-y-4">
                        {[
                            { icon: <Check className="w-4 h-4" />, label: "Free Shipping", sub: "Orders over $100" },
                            { icon: <ShieldCheck className="w-4 h-4" />, label: "Secure Payment", sub: "100% protected" },
                            { icon: <RefreshCw className="w-4 h-4" />, label: "30-Day Returns", sub: "No questions asked" },
                            { icon: <Truck className="w-4 h-4" />, label: "Fast Dispatch", sub: "Ships within 24h" },
                        ].map(({ icon, label, sub }) => (
                            <div key={label} className="flex items-center gap-3">
                                <span className="text-gray-400">{icon}</span>
                                <div>
                                    <p className="text-xs font-semibold text-gray-900">{label}</p>
                                    <p className="text-xs text-gray-400">{sub}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                </div>
            </div>

            {/* Two-Column below-fold layout */}
            <div className="mt-8 grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-12 items-start">
                {/* Left: Stacked Details */}
                <div>
                    <ProductDetailsStacked
                        description={description}
                        attributes={attributes}
                        resolvedAttributes={resolved_attributes}
                    />
                </div>

                {/* Right: Info Sidebar (sticky on desktop) */}
                <div className="lg:sticky lg:top-24">
                    <ProductInfoSidebar product={product} />
                </div>
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
