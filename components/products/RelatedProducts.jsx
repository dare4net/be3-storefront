"use client";

import { useEffect, useState } from 'react';
import ProductCard from './ProductCard';

export default function RelatedProducts({ categorySlug, currentProductId, tenantId }) {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!categorySlug || !tenantId) return;

        async function fetchRelated() {
            try {
                const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:3000';
                const res = await fetch(`${apiUrl}/products/storefront?category=${categorySlug}&exclude=${currentProductId}&limit=4`, {
                    headers: {
                        'x-tenant-id': tenantId
                    }
                });

                if (res.ok) {
                    const data = await res.json();
                    setProducts(data.data);
                }
            } catch (err) {
                console.error("Failed to fetch related products", err);
            } finally {
                setLoading(false);
            }
        }

        fetchRelated();
    }, [categorySlug, currentProductId, tenantId]);

    if (loading) return <div className="h-64 bg-gray-50 rounded-lg animate-pulse"></div>;
    if (products.length === 0) return null;

    return (
        <div className="mt-16 border-t pt-12">
            <h2 className="text-2xl font-bold mb-8">You Might Also Like</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {products.map(product => (
                    <ProductCard key={product.id} product={product} />
                ))}
            </div>
        </div>
    );
}
