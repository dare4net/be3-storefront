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
    CalendarDays, Hash, ShoppingBag, CheckCircle2, Download
} from "lucide-react";
import { cn } from "@/lib/utils";

// Order status — operational
const STATUS_CONFIG = {
    pending:    { label: "Pending",    color: "text-amber-700",  bg: "bg-amber-50",   border: "border-amber-200",  dot: "bg-amber-500",  Icon: Clock        },
    processing: { label: "Processing", color: "text-blue-700",   bg: "bg-blue-50",    border: "border-blue-200",   dot: "bg-blue-500",  Icon: Clock        },
    shipped:    { label: "Shipped",    color: "text-indigo-700", bg: "bg-indigo-50",  border: "border-indigo-200", dot: "bg-indigo-500", Icon: Truck        },
    delivered:  { label: "Delivered",  color: "text-green-700",  bg: "bg-green-50",   border: "border-green-200",  dot: "bg-green-500",  Icon: CheckCircle2 },
    returned:   { label: "Returned",   color: "text-orange-700", bg: "bg-orange-50",  border: "border-orange-200", dot: "bg-orange-500", Icon: RotateCcw    },
    cancelled:  { label: "Cancelled",  color: "text-gray-600",   bg: "bg-gray-50",    border: "border-gray-200",   dot: "bg-gray-400",  Icon: XCircle      },
};

/* ── Payment Banner ── */
function PaymentStatusBanner({ order, onRetry, retrying }) {
    const ps = order.payment_status;
    const isWhatsApp = order.checkout_type === 'whatsapp';
    const isTimedOut = ps === 'unpaid' && !isWhatsApp && (Date.now() - new Date(order.created_at).getTime()) / 60000 > 30;

    // Paid via platform (Paystack webhook)
    if (ps === 'paid') return (
        <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-2xl px-5 py-4">
            <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
            <div>
                <p className="text-sm font-bold text-green-900">Payment Confirmed</p>
                <p className="text-xs text-green-700 mt-0.5">
                    {order.paid_at
                        ? `Paid on ${new Date(order.paid_at).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}`
                        : 'Your payment was received successfully.'}
                </p>
            </div>
        </div>
    );

    // Manually confirmed by vendor (bank transfer, cash, etc.)
    if (ps === 'fulfilled') return (
        <div className="flex items-center gap-3 bg-teal-50 border border-teal-200 rounded-2xl px-5 py-4">
            <CheckCircle2 className="w-5 h-5 text-teal-600 flex-shrink-0" />
            <div>
                <p className="text-sm font-bold text-teal-900">Payment Confirmed by Vendor</p>
                <p className="text-xs text-teal-700 mt-0.5">
                    {order.payment_confirmed_at
                        ? `Confirmed on ${new Date(order.payment_confirmed_at).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}`
                        : 'Your payment has been manually confirmed.'}
                </p>
            </div>
        </div>
    );

    // Refunded
    if (ps === 'refunded') return (
        <div className="flex items-center gap-3 bg-orange-50 border border-orange-200 rounded-2xl px-5 py-4">
            <RotateCcw className="w-5 h-5 text-orange-600 flex-shrink-0" />
            <div>
                <p className="text-sm font-bold text-orange-900">Refund Issued</p>
                <p className="text-xs text-orange-700 mt-0.5">A refund has been issued for this order.</p>
            </div>
        </div>
    );

    // Explicitly failed
    if (ps === 'failed') return (
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
                {retrying ? 'Initializing...' : 'Retry Payment'}
            </button>
        </div>
    );

    // Timed-out unpaid platform order (> 30 min, no Paystack activity)
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
                <strong>Ref:</strong> {order.paystack_reference || 'N/A'} · <strong>Order:</strong> {order.order_number}
            </div>
            <Link href={`/messages?subject=Payment+Issue&ref=${order.paystack_reference}`}
                className="flex items-center justify-center gap-2 bg-amber-600 hover:bg-amber-700 text-white font-bold py-2.5 rounded-xl text-sm transition">
                <MessageCircle className="w-4 h-4" /> Contact Support
            </Link>
        </div>
    );

    // Still verifying — payment_status is 'processing' (Paystack is processing)
    if (ps === 'processing') return (
        <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-2xl px-5 py-4">
            <Loader2 className="w-5 h-5 text-amber-600 animate-spin flex-shrink-0" />
            <div>
                <p className="text-sm font-bold text-amber-900">Verifying Payment</p>
                <p className="text-xs text-amber-700 mt-0.5">This page will update automatically.</p>
            </div>
        </div>
    );

    // WhatsApp order — awaiting vendor confirmation
    if (isWhatsApp) return (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl px-5 py-4 space-y-3">
            <div className="flex items-center gap-3">
                <svg viewBox="0 0 24 24" className="w-5 h-5 fill-[#25D366] flex-shrink-0" xmlns="http://www.w3.org/2000/svg">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                    <path d="M12 0C5.373 0 0 5.373 0 12c0 2.124.558 4.117 1.534 5.845L0 24l6.335-1.505A11.945 11.945 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.818 9.818 0 01-5.006-1.371l-.36-.214-3.727.886.936-3.618-.235-.372A9.818 9.818 0 1112 21.818z"/>
                </svg>
                <div>
                    <p className="text-sm font-bold text-emerald-900">WhatsApp Order — Awaiting Vendor</p>
                    <p className="text-xs text-emerald-700 mt-0.5">Payment and delivery are arranged directly with the vendor.</p>
                </div>
            </div>
            <a href={`https://wa.me/?text=Hi! Following up on my order ${order.order_number}`}
                target="_blank" rel="noreferrer"
                className="w-full flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#1ebe5d] text-white font-bold py-2.5 rounded-xl text-sm transition">
                <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current" xmlns="http://www.w3.org/2000/svg">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
                    <path d="M12 0C5.373 0 0 5.373 0 12c0 2.124.558 4.117 1.534 5.845L0 24l6.335-1.505A11.945 11.945 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.818 9.818 0 01-5.006-1.371l-.36-.214-3.727.886.936-3.618-.235-.372A9.818 9.818 0 1112 21.818z"/>
                </svg>
                Follow Up on WhatsApp
            </a>
            <button onClick={onRetry} disabled={retrying}
                className="w-full flex items-center justify-center gap-2 bg-white hover:bg-gray-50 border border-gray-200 text-gray-700 font-semibold py-2.5 rounded-xl text-sm transition">
                {retrying ? <Loader2 className="w-4 h-4 animate-spin" /> : <CreditCard className="w-4 h-4" />}
                {retrying ? 'Initializing...' : 'Pay with Paystack Instead'}
            </button>
        </div>
    );

    // unpaid platform order — hasn't gone through checkout yet
    return (
        <div className="bg-gray-50 border border-gray-200 rounded-2xl px-5 py-4 space-y-3">
            <div className="flex items-center gap-3">
                <CreditCard className="w-5 h-5 text-gray-500 flex-shrink-0" />
                <div>
                    <p className="text-sm font-bold text-gray-900">Payment Pending</p>
                    <p className="text-xs text-gray-500 mt-0.5">You haven't completed payment for this order yet.</p>
                </div>
            </div>
            <button onClick={onRetry} disabled={retrying}
                className="w-full flex items-center justify-center gap-2 bg-gray-900 hover:bg-gray-800 disabled:opacity-60 text-white font-bold py-2.5 rounded-xl text-sm transition">
                {retrying ? <Loader2 className="w-4 h-4 animate-spin" /> : <CreditCard className="w-4 h-4" />}
                {retrying ? 'Initializing...' : 'Pay Now'}
            </button>
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
        // Only poll while payment is actively being processed by Paystack
        const interval = setInterval(() => {
            if (order && order.payment_status === 'processing') fetchOrder();
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

            <div className="flex flex-col sm:flex-row gap-3 pb-4">
                <button
                    onClick={() => openChat('order', order.id, `Order ${order.order_number}`)}
                    className="flex-1 flex items-center justify-center gap-2 border border-gray-200 text-gray-700 font-semibold py-3 rounded-2xl text-sm hover:bg-gray-50 transition"
                >
                    <MessageCircle className="w-4 h-4" />
                    Chat about this order
                </button>
                <a
                    href={`${process.env.NEXT_PUBLIC_API_URL}/invoices/orders/${order.id}?tenantId=${order.tenant_id}`}
                    target="_blank" rel="noopener noreferrer"
                    className="flex-1 flex items-center justify-center gap-2 border border-blue-200 text-blue-600 font-semibold py-3 rounded-2xl text-sm hover:bg-blue-50 transition">
                    <Download className="w-4 h-4" />
                    Download Invoice
                </a>
                <Link href="/"
                    className="flex-1 flex items-center justify-center gap-2 bg-gray-900 text-white font-semibold py-3 rounded-2xl text-sm hover:bg-gray-700 transition">
                    Continue Shopping <ArrowRight className="w-4 h-4" />
                </Link>
            </div>
        </div>
    );
}
