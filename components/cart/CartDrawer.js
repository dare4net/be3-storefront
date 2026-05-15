"use client";

import { useState } from "react";
import { useCart } from "@/components/providers/CartContext";
import { X, Minus, Plus, ShoppingBag, Trash2, CreditCard, Package, ArrowRight, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import api from "@/lib/axios";
import { useAnalytics } from "@/lib/hooks/useAnalytics";

const FLAT_SHIPPING = 1500;

function formatNGN(amount) {
    return `₦${parseFloat(amount).toLocaleString("en-NG", { minimumFractionDigits: 2 })}`;
}

/* WhatsApp SVG icon */
function WhatsAppIcon({ className = "w-4 h-4" }) {
    return (
        <svg viewBox="0 0 24 24" fill="currentColor" className={className} xmlns="http://www.w3.org/2000/svg">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
        </svg>
    );
}

export default function CartDrawer() {
    const { trackClick } = useAnalytics();
    const router = useRouter();
    const {
        items,
        vendorGroups,
        isOpen,
        setIsOpen,
        removeFromCart,
        updateQuantity,
        cart,
        refreshCart,
    } = useCart();

    const [loadingGroup, setLoadingGroup] = useState(null);

    if (!isOpen) return null;

    const totalItems = items.reduce((s, i) => s + i.quantity, 0);
    const cartSubtotal = items.reduce((s, i) => s + parseFloat(i.price) * i.quantity, 0);
    /* ── WhatsApp checkout ─────────────────────────────────────── */
    const handleWhatsAppCheckout = (group) => {
        // Route through checkout form first so customer info is captured
        router.push(`/checkout?vendor_id=${group.vendorId}&checkout_type=whatsapp`);
        setIsOpen(false);
    };

    /* ── Platform checkout ────────────────────────────────────── */
    const handlePlatformCheckout = (group) => {
        trackClick({
            entity_type: "vendor",
            entity_id: group.vendorId,
            event_type: "checkout_initiate",
            metadata: { business_name: group.businessName, item_count: group.items.length },
        });
        setIsOpen(false);
        router.push(`/checkout?vendor_id=${group.vendorId}`);
    };

    return (
        <div className="fixed inset-0 z-[200] flex justify-end">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsOpen(false)} />

            {/* Drawer */}
            <div className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col">

                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                    <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 bg-gray-900 rounded-xl flex items-center justify-center">
                            <ShoppingBag className="w-4 h-4 text-white" />
                        </div>
                        <div>
                            <h2 className="text-base font-bold text-gray-900 leading-tight">Your Cart</h2>
                            {totalItems > 0 && (
                                <p className="text-xs text-gray-400">{totalItems} item{totalItems !== 1 ? "s" : ""}</p>
                            )}
                        </div>
                    </div>
                    <button
                        onClick={() => setIsOpen(false)}
                        className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition text-gray-500"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto">
                    {vendorGroups.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center gap-4 px-6 text-center">
                            <div className="w-20 h-20 bg-gray-50 rounded-3xl flex items-center justify-center">
                                <Package className="w-10 h-10 text-gray-200" />
                            </div>
                            <div>
                                <p className="font-bold text-gray-900">Your cart is empty</p>
                                <p className="text-sm text-gray-400 mt-1">Add items from any store to get started</p>
                            </div>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="mt-2 flex items-center gap-1.5 text-sm font-semibold text-gray-900 border border-gray-200 px-4 py-2 rounded-full hover:bg-gray-50 transition"
                            >
                                Continue Shopping <ArrowRight className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-50">
                            {vendorGroups.map((group) => {
                                // Derive live items for this group from the optimistic `items` state
                                // vendorGroups gives us structure/metadata; items gives us live qty/presence
                                const liveItems = group.items
                                    .map(gi => items.find(i => i.id === gi.id))
                                    .filter(Boolean) // removed items won't be found
                                    .sort((a, b) => new Date(a.created_at) - new Date(b.created_at));

                                if (liveItems.length === 0) return null; // group fully removed

                                const groupSubtotal = liveItems.reduce(
                                    (s, i) => s + parseFloat(i.price) * i.quantity, 0
                                );
                                const isDM = group.checkoutStyle === "whatsapp";
                                const isLoadingDM = loadingGroup === `dm-${group.vendorId}`;

                                return (
                                    <div key={group.vendorId} className="px-5 py-5 space-y-4">

                                        {/* Vendor label */}
                                        <div className="flex items-center justify-between">
                                            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                                                {group.businessName}
                                            </p>
                                            {isDM && (
                                                <span className="text-[10px] font-semibold bg-emerald-50 text-emerald-600 border border-emerald-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                                                    <WhatsAppIcon className="w-2.5 h-2.5" /> WhatsApp
                                                </span>
                                            )}
                                        </div>

                                        {/* Items */}
                                        <div className="space-y-4">
                                            {liveItems.map((item) => (
                                                <div key={item.id} className="flex gap-3">
                                                    <div className="w-16 h-16 rounded-2xl bg-gray-50 border border-gray-100 overflow-hidden flex-shrink-0 flex items-center justify-center">
                                                        {item.image_url
                                                            ? <img src={item.image_url} alt={item.product_name} className="w-full h-full object-cover" />
                                                            : <Package className="w-6 h-6 text-gray-200" />
                                                        }
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-semibold text-gray-900 leading-snug line-clamp-1">
                                                            {item.product_name}
                                                        </p>
                                                        <p className="text-xs text-gray-400 mt-0.5">{formatNGN(item.price)} each</p>
                                                        <div className="flex items-center gap-3 mt-2">
                                                            <div className="flex items-center bg-gray-100 rounded-full h-7">
                                                                <button
                                                                    onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                                                    className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-gray-200 transition"
                                                                >
                                                                    <Minus className="w-3 h-3" />
                                                                </button>
                                                                <span className="px-2 text-xs font-bold min-w-[20px] text-center">
                                                                    {item.quantity}
                                                                </span>
                                                                <button
                                                                    onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                                                    className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-gray-200 transition"
                                                                >
                                                                    <Plus className="w-3 h-3" />
                                                                </button>
                                                            </div>
                                                            <button
                                                                onClick={() => removeFromCart(item.id)}
                                                                className="text-gray-300 hover:text-red-400 transition"
                                                            >
                                                                <Trash2 className="w-3.5 h-3.5" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                    <div className="flex-shrink-0 text-right">
                                                        <p className="text-sm font-bold text-gray-900">
                                                            {formatNGN(parseFloat(item.price) * item.quantity)}
                                                        </p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        {/* Group footer */}
                                        <div className="bg-gray-50 rounded-2xl p-4 space-y-3">
                                            <div className="flex justify-between items-center text-sm">
                                                <span className="text-gray-500">Subtotal</span>
                                                <span className="font-bold text-gray-900">{formatNGN(groupSubtotal)}</span>
                                            </div>

                                            {isDM ? (
                                                /* WhatsApp vendor — two buttons */
                                                <div className="grid grid-cols-2 gap-2">
                                                    <button
                                                        onClick={() => handleWhatsAppCheckout(group)}
                                                        className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-bold bg-[#25D366] hover:bg-[#1ebe5d] text-white transition"
                                                    >
                                                        <WhatsAppIcon className="w-4 h-4" />
                                                        WhatsApp
                                                    </button>
                                                    <button
                                                        onClick={() => handlePlatformCheckout(group)}
                                                        disabled={!!loadingGroup}
                                                        className="flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-bold bg-gray-900 hover:bg-gray-800 disabled:opacity-60 text-white transition"
                                                    >
                                                        <CreditCard className="w-4 h-4" />
                                                        Pay Online
                                                    </button>
                                                </div>
                                            ) : (
                                                /* Standard vendor — single button */
                                                <button
                                                    onClick={() => handlePlatformCheckout(group)}
                                                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold bg-gray-900 hover:bg-gray-800 text-white transition"
                                                >
                                                    <CreditCard className="w-4 h-4" />
                                                    Checkout
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Footer */}
                {vendorGroups.length > 0 && (
                    <div className="border-t border-gray-100 px-5 py-4 bg-white space-y-1">
                        <div className="flex justify-between text-xs text-gray-400">
                            <span>Cart subtotal ({totalItems} item{totalItems !== 1 ? "s" : ""})</span>
                            <span>{formatNGN(cartSubtotal)}</span>
                        </div>
                        <p className="text-[10px] text-gray-300 pt-1">
                            Checkout per store above. Shipping of ₦1,500 added at checkout.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
