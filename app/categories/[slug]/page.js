import { notFound } from "next/navigation";
import Link from 'next/link';
import { ChevronRight, Filter, SlidersHorizontal } from 'lucide-react';
import { getTenantAndTheme } from "@/lib/context";
import ProductCard from "@/components/products/ProductCard";

// Helper to fetch data
async function getCategory(slug, tenant) {
    try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:3000';
        const res = await fetch(`${apiUrl}/products/storefront/categories/${slug}`, {
            headers: { 'x-tenant-id': tenant.id },
            cache: 'no-store'
        });
        if (!res.ok) return null;
        const data = await res.json();
        return data.category;
    } catch (e) {
        console.error("Failed to fetch category", e);
        return null;
    }
}

async function getCategoryProducts(slug, tenant) {
    try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:3000';
        const res = await fetch(`${apiUrl}/products/storefront?category=${slug}&limit=50`, {
            headers: { 'x-tenant-id': tenant.id },
            cache: 'no-store'
        });
        if (!res.ok) return [];
        const data = await res.json();
        return data.data;
    } catch (e) {
        console.error("Failed to fetch products", e);
        return [];
    }
}

export default async function CategoryPage({ params }) {
    const resolvedParams = await params;
    const { slug } = resolvedParams;

    const { tenant } = await getTenantAndTheme();
    if (!tenant) return null;

    // Parallel fetching
    const [category, products] = await Promise.all([
        getCategory(slug, tenant),
        getCategoryProducts(slug, tenant)
    ]);

    if (!category) {
        notFound();
    }

    return (
        <div className="min-h-screen bg-white">
            {/* Hero Section */}
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
                <div className="relative container mx-auto px-4 py-20 lg:py-32 max-w-7xl">
                    <nav className="flex items-center text-sm text-gray-300 mb-6">
                        <Link href="/" className="hover:text-white transition-colors">Home</Link>
                        <ChevronRight className="w-4 h-4 mx-2" />
                        <span className="text-white font-medium">{category.name}</span>
                    </nav>
                    <h1 className="text-5xl lg:text-6xl font-extrabold tracking-tight mb-6">
                        {category.name}
                    </h1>
                    {category.description && (
                        <p className="text-xl text-gray-200 max-w-2xl leading-relaxed">
                            {category.description}
                        </p>
                    )}
                </div>
            </div>

            <div className="container mx-auto px-4 py-12 max-w-7xl">
                {/* Subcategories */}
                {category.children && category.children.length > 0 && (
                    <div className="mb-12">
                        <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">Explore More</h2>
                        <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
                            {category.children.map(child => (
                                <Link
                                    key={child.id}
                                    href={`/categories/${child.slug}`}
                                    className="flex items-center px-6 py-3 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-full transition-all whitespace-nowrap text-gray-700 font-medium hover:shadow-sm"
                                >
                                    {child.name}
                                </Link>
                            ))}
                        </div>
                    </div>
                )}

                {/* Toolbar */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 pb-6 border-b">
                    <p className="text-gray-600">
                        Showing <span className="font-semibold text-gray-900">{products.length}</span> results
                    </p>
                    <div className="flex gap-3">
                        <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                            <Filter className="w-4 h-4" />
                            Filters
                        </button>
                        <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
                            <SlidersHorizontal className="w-4 h-4" />
                            Sort
                        </button>
                    </div>
                </div>

                {/* Product Grid */}
                {products.length === 0 ? (
                    <div className="text-center py-24 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                        <div className="max-w-md mx-auto">
                            <h3 className="text-lg font-medium text-gray-900 mb-2">No products found</h3>
                            <p className="text-gray-500 mb-6">We couldn't find any products in this category. Check back later!</p>
                            <Link href="/products" className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700">
                                View All Products
                            </Link>
                        </div>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
                        {products.map(product => (
                            <ProductCard key={product.id} product={product} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
