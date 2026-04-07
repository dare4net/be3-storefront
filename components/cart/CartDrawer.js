"use client";

import { useCart } from "@/components/providers/CartContext";
import { X, Minus, Plus, ShoppingBag } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import api from "@/lib/axios";
import { useAnalytics } from "@/lib/hooks/useAnalytics";

export default function CartDrawer() {
    const { trackClick } = useAnalytics();
    const {
        items,
        vendorGroups,
        isOpen,
        setIsOpen,
        removeFromCart,
        updateQuantity,
        cart,
        refreshCart
    } = useCart();

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[200] flex justify-end">
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
                <div className="flex-1 overflow-y-auto p-4 space-y-8">
                    {vendorGroups.length === 0 ? (
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
                        vendorGroups.map((group) => {
                            const groupSubtotal = group.items.reduce((sum, item) => sum + (parseFloat(item.price) * item.quantity), 0);

                            const handleCheckout = async () => {
                                if (group.checkoutStyle === 'whatsapp') {
                                    try {
                                        // 1. Record order in backend
                                        const res = await api.post('/orders/whatsapp', {
                                            cartId: cart?.id,
                                            vendorId: group.vendorId,
                                            items: group.items,
                                            total: groupSubtotal
                                        });

                                        if (res.data.success) {
                                            // 2. Generate WhatsApp message
                                            const itemsList = group.items.map(i => `- ${i.product_name} x${i.quantity} ($${(parseFloat(i.price) * i.quantity).toFixed(2)})`).join('%0A'); // %0A is newline
                                            const message = `Hello ${group.businessName}! I'd like to place an order:%0A%0A${itemsList}%0A%0ATotal: $${groupSubtotal.toFixed(2)}%0A%0AOrder Ref: ${res.data.order.order_number}`;
                                            const phone = group.whatsappPhone?.replace(/[^0-9]/g, '');

                                            // 3. Clear these items from cart (frontend)
                                            // In a perfect world, we'd have a backend "clear vendor items" endpoint
                                            for (const item of group.items) {
                                                await removeFromCart(item.id);
                                            }

                                            // 4. Redirect
                                            window.open(`https://wa.me/${phone}?text=${message}`, '_blank');
                                            setIsOpen(false);
                                            refreshCart();
                                        }
                                    } catch (err) {
                                        console.error('WhatsApp checkout failed', err);
                                        alert('Failed to initiate WhatsApp checkout');
                                    }
                                } else {
                                    // Standard checkout
                                    trackClick({
                                        entity_type: 'vendor',
                                        entity_id: group.vendorId,
                                        event_type: 'checkout_initiate',
                                        metadata: {
                                            business_name: group.businessName,
                                            total: groupSubtotal,
                                            item_count: group.items.length
                                        }
                                    });
                                    setIsOpen(false);
                                    window.location.href = `/checkout?vendor_id=${group.vendorId}`;
                                }
                            };

                            return (
                                <div key={group.vendorId} className="space-y-4">
                                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider border-b pb-2 flex justify-between items-center">
                                        <span>{group.businessName}</span>
                                        <span className="text-gray-900 border border-gray-200 px-2 py-0.5 rounded text-[10px]">{group.checkoutStyle === 'whatsapp' ? 'WhatsApp' : 'In-house'}</span>
                                    </h3>

                                    <div className="space-y-4">
                                        {group.items.map((item) => (
                                            <div key={item.id} className="flex gap-4">
                                                {item.image_url ? (
                                                    <img src={item.image_url} alt={item.product_name} className="w-16 h-16 object-cover rounded-md flex-shrink-0" />
                                                ) : (
                                                    <div className="w-16 h-16 bg-gray-100 rounded-md flex-shrink-0 flex items-center justify-center text-gray-400 text-[10px]">No Img</div>
                                                )}
                                                <div className="flex-1 min-w-0">
                                                    <h4 className="font-medium text-gray-900 truncate">
                                                        {item.product_name}
                                                    </h4>
                                                    <p className="text-sm text-gray-500">${item.price}</p>
                                                    <div className="flex items-center gap-3 mt-1">
                                                        <div className="flex items-center border rounded-md h-7">
                                                            <button
                                                                onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                                                className="px-2 hover:bg-gray-100 h-full"
                                                            >
                                                                <Minus className="w-2.5 h-2.5" />
                                                            </button>
                                                            <span className="px-2 text-xs font-medium">{item.quantity}</span>
                                                            <button
                                                                onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                                                className="px-2 hover:bg-gray-100 h-full"
                                                            >
                                                                <Plus className="w-2.5 h-2.5" />
                                                            </button>
                                                        </div>
                                                        <button
                                                            onClick={() => removeFromCart(item.id)}
                                                            className="text-[10px] text-red-500 hover:text-red-700 font-medium"
                                                        >
                                                            Remove
                                                        </button>
                                                    </div>
                                                </div>
                                                <div className="text-right font-semibold text-sm">
                                                    ${(parseFloat(item.price) * item.quantity).toFixed(2)}
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="bg-gray-50 rounded-lg p-3 space-y-3">
                                        <div className="flex justify-between items-center text-sm">
                                            <span className="text-gray-500">Group Subtotal</span>
                                            <span className="font-bold text-gray-900">${groupSubtotal.toFixed(2)}</span>
                                        </div>
                                        <button
                                            onClick={handleCheckout}
                                            className={cn(
                                                "w-full py-2 rounded-md text-sm font-bold transition-all shadow-sm",
                                                group.checkoutStyle === 'whatsapp'
                                                    ? "bg-green-600 hover:bg-green-700 text-white"
                                                    : "bg-indigo-600 hover:bg-indigo-700 text-white"
                                            )}
                                        >
                                            {group.checkoutStyle === 'whatsapp' ? 'Checkout via WhatsApp' : 'Processed Checkout'}
                                        </button>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>

                {/* Footer removed from here as checkout is per vendor group */}
            </div>
        </div>
    );
}
