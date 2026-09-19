"use client";

import { useState } from 'react';
import { ShoppingCart, Plus, Minus, Loader2 } from 'lucide-react';
import { useCart } from '@/components/providers/CartContext';

export default function AddToCartButton({ product }) {
    const { addToCart } = useCart();
    const [quantity, setQuantity] = useState(1);
    const [adding, setAdding] = useState(false);

    const handleIncrement = () => setQuantity(q => q + 1);
    const handleDecrement = () => setQuantity(q => (q > 1 ? q - 1 : 1));

    const handleAddToCart = async () => {
        setAdding(true);
        // Simulate small network delay for feedback
        await new Promise(resolve => setTimeout(resolve, 500));

        addToCart(product, quantity);
        setAdding(false);
        // Could trigger toast here
    };

    return (
        <div className="flex flex-row gap-3">
            {/* Quantity Selector */}
            <div className="flex items-center h-12 border rounded-lg bg-gray-50">
                <button
                    onClick={handleDecrement}
                    className="w-12 h-full flex items-center justify-center hover:bg-gray-200 rounded-l-lg transition-colors"
                >
                    <Minus className="w-4 h-4" />
                </button>
                <div className="w-12 h-full flex items-center justify-center font-bold text-lg">
                    {quantity}
                </div>
                <button
                    onClick={handleIncrement}
                    className="w-12 h-full flex items-center justify-center hover:bg-gray-200 rounded-r-lg transition-colors"
                >
                    <Plus className="w-4 h-4" />
                </button>
            </div>

            {/* Add Button */}
            <button
                onClick={handleAddToCart}
                disabled={adding}
                className="flex-1 h-12 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg flex items-center justify-center gap-2 transition-all shadow hover:shadow-lg disabled:opacity-75 disabled:cursor-not-allowed"
            >
                {adding ? (
                    <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Adding...
                    </>
                ) : (
                    <>
                        <ShoppingCart className="w-5 h-5" />
                        Add to Cart
                    </>
                )}
            </button>
        </div>
    );
}
