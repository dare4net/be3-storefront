"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/components/providers/AuthContext";
import { useTenant } from "@/components/providers/TenantContext";
import api from "@/lib/axios";
import {
    Package, CheckCircle, XCircle, Clock, AlertTriangle,
    RotateCcw, MessageCircle, ChevronLeft, Loader2,
    MapPin, CreditCard, ArrowRight, ShieldAlert
} from "lucide-react";
import { useChatContext } from "@/components/providers/ChatContext";

const STATUS_CONFIG = {
    processing:      { label: "In Progress",       color: "text-blue-600",   bg: "bg-blue-50",   border: "border-blue-100",  Icon: Clock },
    paid:            { label: "Payment Confirmed",  color: "text-green-600",  bg: "bg-green-50",  border: "border-green-100", Icon: CheckCircle },
    pending:         { label: "Verifying Payment",  color: "text-amber-600",  bg: "bg-amber-50",  border: "border-amber-100", Icon: Clock },
    pending_payment: { label: "Awaiting Payment",   color: "text-amber-600",  bg: "bg-amber-50",  border: "border-amber-100", Icon: Clock },
    failed:          { label: "Payment Failed",     color: "text-red-600",    bg: "bg-red-50",    border: "border-red-100",   Icon: XCircle },
    payment_failed:  { label: "Payment Failed",     color: "text-red-600",    bg: "bg-red-50",    border: "border-red-100",   Icon: XCircle },
    shipped:         { label: "Shipped",            color: "text-indigo-600", bg: "bg-indigo-50", border: "border-indigo-100", Icon: Package },
    completed:       { label: "Completed",          color: "text-purple-600", bg: "bg-purple-50", border: "border-purple-100", Icon: CheckCircle },
    cancelled:       { label: "Cancelled",          color: "text-gray-600",   bg: "bg-gray-50",   border: "border-gray-100",  Icon: XCircle },
};

function PaymentStatusBanner({ order, onRetry, retrying }) {
    const paymentStatus = order.payment_status;
    const orderAge = (Date.now() - new Date(order.created_at).getTime()) / 60000;
    const isTimedOut = paymentStatus === 'pending' && orderAge > 30;

    // Paid — show success
    if (paymentStatus === 'paid') {
        return (
            <div className="bg-green-50 border border-green-100 rounded-2xl p-5 flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center flex-shrink-0">
                    <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
                <div>
                    <p className="font-semibold text-green-900">Payment Confirmed</p>
                    <p className="text-sm text-green-700">
                        {order.paid_at ? `Paid on ${new Date(order.paid_at).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}` : "Your payment was received successfully."}
                    </p>
                </div>
            </div>
        );
    }

    // Failed — show retry
    if (paymentStatus === 'failed') {
        return (
            <div className="bg-red-50 border border-red-100 rounded-2xl p-5 space-y-4">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center flex-shrink-0">
                        <XCircle className="w-6 h-6 text-red-600" />
                    </div>
                    <div>
                        <p className="font-semibold text-red-900">Payment Failed</p>
                        <p className="text-sm text-red-700">Your card was not charged. You can retry below.</p>
                    </div>
                </div>
                <button
                    onClick={onRetry}
                    disabled={retrying}
                    className="w-full flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded-xl text-sm transition disabled:opacity-60"
                >
                    {retrying ? <Loader2 className="w-4 h-4 animate-spin" /> : <RotateCcw className="w-4 h-4" />}
                    {retrying ? "Initializing..." : "Retry Payment"}
                </button>
            </div>
        );
    }

    // Timed out / stuck pending > 30 min — dispute
    if (isTimedOut) {
        return (
            <div className="bg-amber-50 border border-amber-100 rounded-2xl p-5 space-y-4">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
                        <ShieldAlert className="w-6 h-6 text-amber-600" />
                    </div>
                    <div>
                        <p className="font-semibold text-amber-900">Payment Not Confirmed</p>
                        <p className="text-sm text-amber-700">
                            We couldn't confirm your payment. If you were charged, please contact support with your order number.
                        </p>
                    </div>
                </div>
                <div className="text-xs text-amber-800 bg-amber-100/60 rounded-xl p-3">
                    <strong>Reference:</strong> {order.paystack_reference || "N/A"}<br />
                    <strong>Order:</strong> {order.order_number}
                </div>
                <Link
                    href={`/messages?subject=Payment+Issue&ref=${order.paystack_reference}`}
                    className="w-full flex items-center justify-center gap-2 bg-amber-600 hover:bg-amber-700 text-white font-bold py-3 rounded-xl text-sm transition"
                >
                    <MessageCircle className="w-4 h-4" />
                    Contact Support
                </Link>
            </div>
        );
    }

    // Still pending / processing (< 30 min) — show waiting state, no retry
    return (
        <div className="bg-amber-50 border border-amber-100 rounded-2xl p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
                <Loader2 className="w-6 h-6 text-amber-600 animate-spin" />
            </div>
            <div>
                <p className="font-semibold text-amber-900">Verifying Payment</p>
                <p className="text-sm text-amber-700">
                    Your payment is being confirmed. This page will update automatically.
                </p>
            </div>
        </div>
    );
}

export default function OrderDetailPage() {
    const { id } = useParams();
    const router = useRouter();
    const { token, user } = useAuth();
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
                headers: {
                    "X-Tenant-ID": tenant.id,
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
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
        // Auto-refresh every 10 seconds if payment is still pending
        const interval = setInterval(() => {
            if (order && (order.payment_status === 'pending' || order.status === 'pending_payment')) {
                fetchOrder();
            }
        }, 10000);
        return () => clearInterval(interval);
    }, [id, tenant?.id]);

    const handleRetry = async () => {
        setRetrying(true);
        try {
            const res = await api.post(`/payments/paystack/retry/${id}`, {}, {
                headers: {
                    "X-Tenant-ID": tenant.id,
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
            });
            if (res.data.authorization_url) {
                window.location.href = res.data.authorization_url;
            }
        } catch (err) {
            const msg = err.response?.data?.message || "Could not initialize retry. Please try again.";
            alert(msg);
            setRetrying(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-24">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
        );
    }

    if (error || !order) {
        return (
            <div className="flex flex-col items-center justify-center py-24 text-center space-y-4">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
                    <Package className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-lg font-bold text-gray-900">{error || "Order not found"}</p>
                <Link href="/account/orders" className="text-sm text-blue-600 hover:underline">← Back to Orders</Link>
            </div>
        );
    }

    const cfg = STATUS_CONFIG[order.status] || STATUS_CONFIG.processing;
    const shippingAddress = order.metadata?.shipping_address;

    return (
        <div className="space-y-5">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-bold text-gray-900">{order.order_number}</h2>
                    <p className="text-xs text-gray-400 mt-0.5">
                        Placed {new Date(order.created_at).toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' })}
                    </p>
                </div>
                <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold ${cfg.bg} ${cfg.color} border ${cfg.border}`}>
                    <cfg.Icon className="w-3.5 h-3.5" />
                    {cfg.label}
                </span>
            </div>

            {/* Payment Status Banner */}
            <PaymentStatusBanner order={order} onRetry={handleRetry} retrying={retrying} />

            {/* Order Items */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-50">
                    <h3 className="font-semibold text-gray-900 text-sm">Items ({items.length})</h3>
                </div>
                <div className="divide-y divide-gray-50">
                    {items.map((item) => (
                        <div key={item.id} className="flex items-center gap-4 px-5 py-4">
                            <div className="w-14 h-14 rounded-xl bg-gray-100 flex items-center justify-center flex-shrink-0 overflow-hidden">
                                {item.image_url
                                    ? <img src={item.image_url} alt={item.product_name} className="w-full h-full object-cover" />
                                    : <Package className="w-6 h-6 text-gray-300" />
                                }
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 truncate">{item.product_name}</p>
                                <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
                            </div>
                            <div className="text-right flex-shrink-0">
                                <p className="text-sm font-bold text-gray-900">
                                    ₦{parseFloat(item.total).toLocaleString('en-NG', { minimumFractionDigits: 2 })}
                                </p>
                                <p className="text-xs text-gray-400">
                                    ₦{parseFloat(item.price).toLocaleString('en-NG', { minimumFractionDigits: 2 })} each
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Order Summary */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3">
                <h3 className="font-semibold text-gray-900 text-sm">Order Summary</h3>
                <div className="space-y-2 text-sm">
                    <div className="flex justify-between text-gray-600">
                        <span>Subtotal</span>
                        <span>₦{parseFloat(order.subtotal || 0).toLocaleString('en-NG', { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between text-gray-600">
                        <span>Shipping</span>
                        <span>₦{(parseFloat(order.total || 0) - parseFloat(order.subtotal || 0)).toLocaleString('en-NG', { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between font-bold text-gray-900 text-base pt-2 border-t border-gray-50">
                        <span>Total</span>
                        <span>₦{parseFloat(order.total).toLocaleString('en-NG', { minimumFractionDigits: 2 })}</span>
                    </div>
                </div>
            </div>

            {/* Shipping Address */}
            {shippingAddress && (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                    <h3 className="font-semibold text-gray-900 text-sm flex items-center gap-2 mb-3">
                        <MapPin className="w-4 h-4 text-gray-400" /> Shipping Address
                    </h3>
                    <p className="text-sm text-gray-600">
                        {shippingAddress.firstName} {shippingAddress.lastName}<br />
                        {shippingAddress.address}<br />
                        {shippingAddress.city}{shippingAddress.state ? `, ${shippingAddress.state}` : ''}<br />
                        {shippingAddress.country}
                    </p>
                </div>
            )}

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3">
                <button
                    onClick={() => openChat('order', order.id, `Order ${order.order_number}`)}
                    className="flex-1 flex items-center justify-center gap-2 border border-gray-200 text-gray-700 font-semibold py-3 rounded-xl text-sm hover:bg-gray-50 transition"
                >
                    <MessageCircle className="w-4 h-4" />
                    Chat about this order
                </button>
                <Link
                    href="/"
                    className="flex-1 flex items-center justify-center gap-2 bg-gray-900 text-white font-semibold py-3 rounded-xl text-sm hover:bg-gray-800 transition"
                >
                    Continue Shopping <ArrowRight className="w-4 h-4" />
                </Link>
            </div>
        </div>
    );
}
