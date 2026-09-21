"use client";

import { useState } from 'react';
import { ShoppingCart, Plus, Minus, Loader2, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { useCart } from '@/components/providers/CartContext';

export default function AddToCartButton({ product }) {
    const { addToCart } = useCart();
    const [quantity, setQuantity] = useState(1);
    const [adding, setAdding] = useState(false);

    // Inventory state logic
    const trackInventory = Boolean(product?.track_inventory);
    const stockQty = Number(product?.inventory_quantity ?? 0);
    const threshold = product?.low_stock_threshold ? Number(product.low_stock_threshold) : 5;

    const isOutOfStock = trackInventory && stockQty <= 0;
    const isLowStock = trackInventory && stockQty > 0 && stockQty <= threshold;
    const maxQty = trackInventory ? Math.max(1, stockQty) : 999;

    const handleIncrement = () => setQuantity(q => (q < maxQty ? q + 1 : q));
    const handleDecrement = () => setQuantity(q => (q > 1 ? q - 1 : 1));

    const handleAddToCart = async () => {
        if (isOutOfStock) return;
        setAdding(true);
        // Simulate small network delay for feedback
        await new Promise(resolve => setTimeout(resolve, 500));

        addToCart(product, quantity);
        setAdding(false);
    };

    return (
        <div className="space-y-2">
            {/* Stock Status Badge */}
            <div className="flex items-center gap-1.5 text-xs font-semibold">
                {isOutOfStock ? (
                    <span className="inline-flex items-center gap-1 text-red-600 bg-red-50 border border-red-200 px-2.5 py-1 rounded-full text-xs font-bold">
                        <XCircle className="w-3.5 h-3.5" /> Out of Stock
                    </span>
                ) : isLowStock ? (
                    <span className="inline-flex items-center gap-1 text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-full text-xs font-bold animate-pulse">
                        <AlertTriangle className="w-3.5 h-3.5" /> Only {stockQty} left in stock - order soon!
                    </span>
                ) : (
                    <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full text-xs font-bold">
                        <CheckCircle className="w-3.5 h-3.5" /> In Stock
                    </span>
                )}
            </div>

            <div className="flex flex-row gap-3">
                {/* Quantity Selector */}
                <div className={`flex items-center h-12 border rounded-lg ${isOutOfStock ? 'bg-gray-100 opacity-60 cursor-not-allowed' : 'bg-gray-50'}`}>
                    <button
                        onClick={handleDecrement}
                        disabled={isOutOfStock || quantity <= 1}
                        className="w-12 h-full flex items-center justify-center hover:bg-gray-200 rounded-l-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                        <Minus className="w-4 h-4" />
                    </button>
                    <div className="w-12 h-full flex items-center justify-center font-bold text-lg">
                        {isOutOfStock ? 0 : quantity}
                    </div>
                    <button
                        onClick={handleIncrement}
                        disabled={isOutOfStock || quantity >= maxQty}
                        className="w-12 h-full flex items-center justify-center hover:bg-gray-200 rounded-r-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                        <Plus className="w-4 h-4" />
                    </button>
                </div>

                {/* Add Button */}
                <button
                    onClick={handleAddToCart}
                    disabled={adding || isOutOfStock}
                    style={{
                        backgroundColor: isOutOfStock ? '#9ca3af' : 'var(--btn-primary-bg, var(--primary, #2563eb))',
                        color: 'var(--btn-primary-text, var(--primary-foreground, #ffffff))',
                        borderRadius: 'var(--btn-radius, 0.5rem)'
                    }}
                    className={`flex-1 h-12 font-bold flex items-center justify-center gap-2 transition-all shadow ${
                        isOutOfStock ? 'cursor-not-allowed opacity-60' : 'hover:brightness-95 active:scale-[0.98]'
                    } disabled:cursor-not-allowed`}
                >
                    {adding ? (
                        <>
                            <Loader2 className="w-5 h-5 animate-spin" />
                            Adding...
                        </>
                    ) : isOutOfStock ? (
                        <>
                            <XCircle className="w-5 h-5" />
                            Out of Stock
                        </>
                    ) : (
                        <>
                            <ShoppingCart className="w-5 h-5" />
                            Add to Cart
                        </>
                    )}
                </button>
            </div>
        </div>
    );
}
