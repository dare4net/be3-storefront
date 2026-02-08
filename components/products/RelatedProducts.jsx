"use client";

import { useEffect, useState, useRef } from 'react';
import ProductCard from './ProductCard';
import { useAnalytics } from '@/lib/hooks/useAnalytics';

export default function RelatedProducts({ categorySlug, currentProductId, tenantId }) {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const { trackImpression, trackClick } = useAnalytics();
    const impressionTrackedRef = useRef(new Set());

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

    // Track impressions when products load
    useEffect(() => {
        if (!loading && products.length > 0) {
            products.forEach((product, index) => {
                if (!impressionTrackedRef.current.has(product.id)) {
                    trackImpression({
                        entity_type: 'product',
                        entity_id: product.id,
                        placement_id: 'related_products_grid',
                        placement_type: 'related_products',
                        position: index + 1,
                        metadata: {
                            related_to_product_id: currentProductId,
                            category_slug: categorySlug
                        }
                    });
                    impressionTrackedRef.current.add(product.id);
                }
            });
        }
    }, [products, loading, trackImpression, categorySlug, currentProductId]);

    if (loading) return <div className="h-64 bg-gray-50 rounded-lg animate-pulse"></div>;
    if (products.length === 0) return null;

    const handleProductClick = (product) => {
        trackClick({
            entity_type: 'product',
            entity_id: product.id,
            placement_id: 'related_products_grid',
            placement_type: 'related_products',
            position: products.findIndex(p => p.id === product.id) + 1,
            metadata: {
                related_to_product_id: currentProductId,
                category_slug: categorySlug
            }
        });
    };

    return (
        <div className="mt-16 border-t pt-12">
            <h2 className="text-2xl font-bold mb-8">You Might Also Like</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {products.map(product => (
                    <ProductCard
                        key={product.id}
                        product={product}
                        trackClick={() => handleProductClick(product)}
                    />
                ))}
            </div>
        </div>
    );
}
