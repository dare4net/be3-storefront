import { getTenantAndTheme } from "@/lib/context";
import ProductCard from "@/components/products/ProductCard";

export const dynamic = 'force-dynamic';

async function getProducts(searchParams, tenant) {
    if (!tenant) return [];

    const params = new URLSearchParams(searchParams);
    // Ensure we don't pass undefined/nulls literally
    const query = params.toString();

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:3000';
    try {
        const res = await fetch(`${apiUrl}/products/storefront?${query}`, {
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

export default async function ShopPage({ searchParams }) {
    const resolvedParams = await searchParams;
    const { tenant } = await getTenantAndTheme();

    if (!tenant) {
        return <div className="p-8 text-center">Store not found</div>;
    }

    const products = await getProducts(resolvedParams, tenant);
    const categoryFilter = resolvedParams.category;

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">
                        {categoryFilter ? (
                            <span className="capitalize">{categoryFilter.replace(/-/g, ' ')}</span>
                        ) : (
                            "All Products"
                        )}
                    </h1>
                    <p className="text-gray-500 mt-2">
                        {products.length} {products.length === 1 ? 'product' : 'products'} found
                    </p>
                </div>
            </div>

            {products.length === 0 ? (
                <div className="text-center py-24 bg-gray-50 rounded-xl">
                    <p className="text-lg text-gray-500">No products found.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {products.map(product => (
                        <ProductCard key={product.id} product={product} />
                    ))}
                </div>
            )}
        </div>
    );
}
