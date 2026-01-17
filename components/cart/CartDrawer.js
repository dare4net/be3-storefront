"use client";

import { useCart } from "@/components/providers/CartContext";
import { X, Minus, Plus, ShoppingBag } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

export default function CartDrawer() {
    const {
        items,
        isOpen,
        setIsOpen,
        removeFromCart,
        updateQuantity,
        cartTotal
    } = useCart();

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex justify-end">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50"
                onClick={() => setIsOpen(false)}
            />

            {/* Drawer */}
            <div className="relative w-full max-w-md bg-white h-full shadow-xl flex flex-col animate-in slide-in-from-right duration-300">
                {/* Header */}
                <div className="p-4 border-b flex items-center justify-between">
                    <h2 className="text-lg font-semibold flex items-center gap-2">
                        <ShoppingBag className="w-5 h-5" />
                        Your Cart
                    </h2>
                    <button
                        onClick={() => setIsOpen(false)}
                        className="p-2 hover:bg-gray-100 rounded-full"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Items */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {items.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-gray-500">
                            <ShoppingBag className="w-12 h-12 mb-4 opacity-20" />
                            <p>Your cart is empty</p>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="mt-4 text-blue-600 font-medium hover:underline"
                            >
                                Continue Shopping
                            </button>
                        </div>
                    ) : (
                        items.map((item) => (
                            <div key={item.id} className="flex gap-4">
                                {/* Placeholder for image */}
                                <div className="w-20 h-20 bg-gray-100 rounded-md flex-shrink-0" />

                                <div className="flex-1 min-w-0">
                                    <h3 className="font-medium text-gray-900 truncate">
                                        {/* Snapshot name might be in a JSON structure or separate column, assuming separate for now based on schema */}
                                        Item #{item.product_id.substring(0, 8)}
                                    </h3>
                                    <p className="text-sm text-gray-500">${item.price}</p>

                                    <div className="flex items-center gap-3 mt-2">
                                        <div className="flex items-center border rounded-md">
                                            <button
                                                onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                                className="p-1 hover:bg-gray-100"
                                            >
                                                <Minus className="w-3 h-3" />
                                            </button>
                                            <span className="px-2 text-sm">{item.quantity}</span>
                                            <button
                                                onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                                className="p-1 hover:bg-gray-100"
                                            >
                                                <Plus className="w-3 h-3" />
                                            </button>
                                        </div>
                                        <button
                                            onClick={() => removeFromCart(item.id)}
                                            className="text-xs text-red-500 hover:text-red-700"
                                        >
                                            Remove
                                        </button>
                                    </div>
                                </div>
                                <div className="text-right font-medium">
                                    ${(parseFloat(item.price) * item.quantity).toFixed(2)}
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {/* Footer */}
                {items.length > 0 && (
                    <div className="p-4 border-t bg-gray-50">
                        <div className="flex items-center justify-between mb-4">
                            <span className="font-medium text-gray-900">Subtotal</span>
                            <span className="font-bold text-lg">${cartTotal.toFixed(2)}</span>
                        </div>
                        <p className="text-xs text-gray-500 mb-4 text-center">
                            Shipping and taxes calculated at checkout.
                        </p>
                        <Link
                            href="/checkout"
                            onClick={() => setIsOpen(false)}
                            className="block w-full bg-black text-white py-3 rounded-lg text-center font-bold hover:bg-gray-800 transition"
                        >
                            Checkout
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
}
