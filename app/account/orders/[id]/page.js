"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/components/providers/AuthContext";
import { useTenant } from "@/components/providers/TenantContext";
import api from "@/lib/axios";
import { useChatContext } from "@/components/providers/ChatContext";
import {
    Package, CheckCircle, XCircle, Clock, Truck,
    RotateCcw, MessageCircle, ChevronLeft, Loader2,
    MapPin, CreditCard, ArrowRight, ShieldAlert,
    CalendarDays, Hash, ShoppingBag, CheckCircle2
} from "lucide-react";
import { cn } from "@/lib/utils";

const STATUS_CONFIG = {
    processing:      { label: "Processing",         color: "text-blue-700",   bg: "bg-blue-50",    border: "border-blue-200",   dot: "bg-blue-500",    Icon: Clock        },
    paid:            { label: "Payment Confirmed",   color: "text-green-700",  bg: "bg-green-50",   border: "border-green-200",  dot: "bg-green-500",   Icon: CheckCircle2 },
    pending:         { label: "Verifying Payment",   color: "text-amber-700",  bg: "bg-amber-50",   border: "border-amber-200",  dot: "bg-amber-500",   Icon: Clock        },
    pending_payment: { label: "Awaiting Payment",    color: "text-amber-700",  bg: "bg-amber-50",   border: "border-amber-200",  dot: "bg-amber-500",   Icon: Clock        },
    failed:          { label: "Payment Failed",      color: "text-red-700",    bg: "bg-red-50",     border: "border-red-200",    dot: "bg-red-500",     Icon: XCircle      },
    payment_failed:  { label: "Payment Failed",      color: "text-red-700",    bg: "bg-red-50",     border: "border-red-200",    dot: "bg-red-500",     Icon: XCircle      },
    shipped:         { label: "Shipped",             color: "text-indigo-700", bg: "bg-indigo-50",  border: "border-indigo-200", dot: "bg-indigo-500",  Icon: Truck        },
    delivered:       { label: "Delivered",           color: "text-green-700",  bg: "bg-green-50",   border: "border-green-200",  dot: "bg-green-500",   Icon: CheckCircle2 },
    completed:       { label: "Completed",           color: "text-violet-700", bg: "bg-violet-50",  border: "border-violet-200", dot: "bg-violet-500",  Icon: CheckCircle2 },
    cancelled:       { label: "Cancelled",           color: "text-gray-600",   bg: "bg-gray-50",    border: "border-gray-200",   dot: "bg-gray-400",    Icon: XCircle      },
    refunded:        { label: "Refunded",            color: "text-gray-600",   bg: "bg-gray-50",    border: "border-gray-200",   dot: "bg-gray-400",    Icon: RotateCcw    },
};

/* ── Payment Banner ── */
function PaymentStatusBanner({ order, onRetry, retrying }) {
    const status = order.payment_status;
    const isTimedOut = status === 'pending' && (Date.now() - new Date(order.created_at).getTime()) / 60000 > 30;

    if (status === 'paid') return (
        <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-2xl px-5 py-4">
            <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
            <div>
                <p className="text-sm font-bold text-green-900">Payment Confirmed</p>
                <p className="text-xs text-green-700 mt-0.5">
                    {order.paid_at ? `Paid on ${new Date(order.paid_at).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}` : "Your payment was received successfully."}
                </p>
            </div>
        </div>
    );

    if (status === 'failed') return (
        <div className="bg-red-50 border border-red-200 rounded-2xl px-5 py-4 space-y-3">
            <div className="flex items-center gap-3">
                <XCircle className="w-5 h-5 text-red-600 flex-shrink-0" />
                <div>
                    <p className="text-sm font-bold text-red-900">Payment Failed</p>
                    <p className="text-xs text-red-700 mt-0.5">Your card was not charged. You can retry below.</p>
                </div>
            </div>
            <button onClick={onRetry} disabled={retrying}
                className="w-full flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white font-bold py-2.5 rounded-xl text-sm transition">
                {retrying ? <Loader2 className="w-4 h-4 animate-spin" /> : <RotateCcw className="w-4 h-4" />}
                {retrying ? "Initializing..." : "Retry Payment"}
            </button>
        </div>
    );

    if (isTimedOut) return (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl px-5 py-4 space-y-3">
            <div className="flex items-center gap-3">
                <ShieldAlert className="w-5 h-5 text-amber-600 flex-shrink-0" />
                <div>
                    <p className="text-sm font-bold text-amber-900">Payment Not Confirmed</p>
                    <p className="text-xs text-amber-700 mt-0.5">If you were charged, contact support with your order number.</p>
                </div>
            </div>
            <div className="text-xs text-amber-800 bg-amber-100/60 rounded-xl px-3 py-2">
                <strong>Ref:</strong> {order.paystack_reference || "N/A"} · <strong>Order:</strong> {order.order_number}
            </div>
            <Link href={`/messages?subject=Payment+Issue&ref=${order.paystack_reference}`}
                className="flex items-center justify-center gap-2 bg-amber-600 hover:bg-amber-700 text-white font-bold py-2.5 rounded-xl text-sm transition">
                <MessageCircle className="w-4 h-4" /> Contact Support
            </Link>
        </div>
    );

    return (
        <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-2xl px-5 py-4">
            <Loader2 className="w-5 h-5 text-amber-600 animate-spin flex-shrink-0" />
            <div>
                <p className="text-sm font-bold text-amber-900">Verifying Payment</p>
                <p className="text-xs text-amber-700 mt-0.5">This page will update automatically.</p>
            </div>
        </div>
    );
}

/* ── Main ── */
export default function OrderDetailPage() {
    const { id } = useParams();
    const { token } = useAuth();
    const tenant = useTenant();
    const { openChat } = useChatContext();

    const [order, setOrder] = useState(null);
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [retrying, setRetrying] = useState(false);
    const [error, setError] = useState(null);

    const fetchOrder = async () => {
        if (!tenant?.id) return;
        try {
            const res = await api.get(`/orders/${id}`, {
                headers: { "X-Tenant-ID": tenant.id, ...(token ? { Authorization: `Bearer ${token}` } : {}) },
            });
            setOrder(res.data.order);
            setItems(res.data.items || []);
        } catch (err) {
            setError(err.response?.data?.error === "Order not found" ? "Order not found" : "Failed to load order");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOrder();
        const interval = setInterval(() => {
            if (order && (order.payment_status === 'pending' || order.status === 'pending_payment')) fetchOrder();
        }, 10000);
        return () => clearInterval(interval);
    }, [id, tenant?.id]);

    const handleRetry = async () => {
        setRetrying(true);
        try {
            const res = await api.post(`/payments/paystack/retry/${id}`, {}, {
                headers: { "X-Tenant-ID": tenant.id, ...(token ? { Authorization: `Bearer ${token}` } : {}) },
            });
            if (res.data.authorization_url) window.location.href = res.data.authorization_url;
        } catch (err) {
            alert(err.response?.data?.message || "Could not initialize retry. Please try again.");
            setRetrying(false);
        }
    };

    if (loading) return (
        <div className="flex items-center justify-center py-24">
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
    );

    if (error || !order) return (
        <div className="flex flex-col items-center justify-center py-24 text-center space-y-4 px-4">
            <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center">
                <Package className="w-7 h-7 text-gray-400" />
            </div>
            <p className="text-base font-bold text-gray-900">{error || "Order not found"}</p>
            <Link href="/account/orders" className="text-sm text-blue-600 hover:underline">← Back to Orders</Link>
        </div>
    );

    const cfg = STATUS_CONFIG[order.status] || STATUS_CONFIG.processing;
    const shippingAddress = order.metadata?.shipping_address;
    const subtotal = parseFloat(order.subtotal || 0);
    const total = parseFloat(order.total || 0);
    const shipping = total - subtotal;

    return (
        <div className="space-y-4 px-4 md:px-0 py-2">

            {/* Back + Header */}
            <div>
                <Link href="/account/orders" className="inline-flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-700 transition mb-4">
                    <ChevronLeft className="w-3.5 h-3.5" /> Back to Orders
                </Link>
                <div className="flex items-start justify-between gap-3">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">{order.order_number}</h2>
                        <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
                            <CalendarDays className="w-3 h-3" />
                            {new Date(order.created_at).toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' })}
                        </p>
                    </div>
                    <span className={cn("inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border flex-shrink-0", cfg.bg, cfg.color, cfg.border)}>
                        <span className={cn("w-1.5 h-1.5 rounded-full", cfg.dot)} />
                        {cfg.label}
                    </span>
                </div>
            </div>

            {/* Payment Banner */}
            <PaymentStatusBanner order={order} onRetry={handleRetry} retrying={retrying} />

            {/* Items */}
            <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50">
                    <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                        <ShoppingBag className="w-4 h-4 text-gray-400" />
                        Items <span className="text-gray-400 font-normal">({items.length})</span>
                    </h3>
                </div>
                <div className="divide-y divide-gray-50">
                    {items.map((item) => (
                        <div key={item.id} className="flex items-center gap-4 px-5 py-4">
                            {/* Thumbnail */}
                            <div className="w-14 h-14 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center flex-shrink-0 overflow-hidden">
                                {item.image_url
                                    ? <img src={item.image_url} alt={item.product_name} className="w-full h-full object-cover" />
                                    : <Package className="w-6 h-6 text-gray-300" />
                                }
                            </div>
                            {/* Info */}
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-gray-900 leading-snug line-clamp-2">{item.product_name}</p>
                                {item.variant_title && (
                                    <p className="text-xs text-gray-400 mt-0.5">{item.variant_title}</p>
                                )}
                                <p className="text-xs text-gray-400 mt-0.5">Qty: {item.quantity}</p>
                            </div>
                            {/* Price */}
                            <div className="text-right flex-shrink-0">
                                <p className="text-sm font-bold text-gray-900">
                                    ₦{parseFloat(item.total ?? item.price * item.quantity).toLocaleString('en-NG', { minimumFractionDigits: 2 })}
                                </p>
                                <p className="text-xs text-gray-400 mt-0.5">
                                    ₦{parseFloat(item.price).toLocaleString('en-NG', { minimumFractionDigits: 2 })} ea.
                                </p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Summary — inside the card, below items */}
                <div className="px-5 py-4 border-t border-gray-100 bg-gray-50/50 space-y-2">
                    <div className="flex justify-between text-sm text-gray-500">
                        <span>Subtotal</span>
                        <span>₦{subtotal.toLocaleString('en-NG', { minimumFractionDigits: 2 })}</span>
                    </div>
                    {shipping > 0 && (
                        <div className="flex justify-between text-sm text-gray-500">
                            <span>Shipping</span>
                            <span>₦{shipping.toLocaleString('en-NG', { minimumFractionDigits: 2 })}</span>
                        </div>
                    )}
                    <div className="flex justify-between font-bold text-gray-900 text-base pt-2 border-t border-gray-200">
                        <span>Total</span>
                        <span>₦{total.toLocaleString('en-NG', { minimumFractionDigits: 2 })}</span>
                    </div>
                </div>
            </div>

            {/* Shipping Address */}
            {shippingAddress && (
                <div className="bg-white rounded-2xl border border-gray-100 px-5 py-4">
                    <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2 mb-3">
                        <MapPin className="w-4 h-4 text-gray-400" /> Delivery Address
                    </h3>
                    <p className="text-sm text-gray-600 leading-relaxed">
                        {shippingAddress.firstName} {shippingAddress.lastName}<br />
                        {shippingAddress.address}<br />
                        {shippingAddress.city}{shippingAddress.state ? `, ${shippingAddress.state}` : ''}<br />
                        {shippingAddress.country}
                    </p>
                </div>
            )}

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3 pb-4">
                <button
                    onClick={() => openChat('order', order.id, `Order ${order.order_number}`)}
                    className="flex-1 flex items-center justify-center gap-2 border border-gray-200 text-gray-700 font-semibold py-3 rounded-2xl text-sm hover:bg-gray-50 transition"
                >
                    <MessageCircle className="w-4 h-4" />
                    Chat about this order
                </button>
                <Link href="/"
                    className="flex-1 flex items-center justify-center gap-2 bg-gray-900 text-white font-semibold py-3 rounded-2xl text-sm hover:bg-gray-700 transition">
                    Continue Shopping <ArrowRight className="w-4 h-4" />
                </Link>
            </div>
        </div>
    );
}
