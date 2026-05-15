"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/components/providers/AuthContext";
import api from "@/lib/axios";
import { useTenant } from "@/components/providers/TenantContext";
import { useChatContext } from "@/components/providers/ChatContext";
import {
    Package, Loader2, MessageCircle, ShoppingBag,
    Search, CalendarDays, ArrowRight, CreditCard
} from "lucide-react";
import { cn } from "@/lib/utils";


// Order status — operational/fulfillment lifecycle
const ORDER_STATUS_CONFIG = {
    pending:    { label: "Pending",    dot: "bg-amber-400",   text: "text-amber-600",   accent: "border-l-amber-400"   },
    processing: { label: "Processing", dot: "bg-blue-500",    text: "text-blue-600",    accent: "border-l-blue-500"    },
    shipped:    { label: "Shipped",    dot: "bg-indigo-500",  text: "text-indigo-600",  accent: "border-l-indigo-500"  },
    delivered:  { label: "Delivered",  dot: "bg-green-500",   text: "text-green-600",   accent: "border-l-green-500"   },
    returned:   { label: "Returned",   dot: "bg-orange-400",  text: "text-orange-600",  accent: "border-l-orange-400"  },
    cancelled:  { label: "Cancelled",  dot: "bg-red-400",     text: "text-red-500",     accent: "border-l-red-400"     },
};

// Payment status — financial lifecycle
const PAYMENT_STATUS_CONFIG = {
    unpaid:     { label: "Unpaid",      dot: "bg-red-400",     text: "text-red-500"      },
    processing: { label: "Verifying",   dot: "bg-amber-400",   text: "text-amber-600"    },
    paid:       { label: "Paid",         dot: "bg-green-500",   text: "text-green-600"    },
    failed:     { label: "Pay Failed",   dot: "bg-red-500",     text: "text-red-600"      },
    fulfilled:  { label: "Paid (DM)",    dot: "bg-teal-500",    text: "text-teal-600"     },
    refunded:   { label: "Refunded",     dot: "bg-orange-400",  text: "text-orange-600"   },
};

const FILTERS = ["All", "Pending", "Processing", "Shipped", "Delivered", "Cancelled"];


function OrderStatusPill({ status }) {
    const cfg = ORDER_STATUS_CONFIG[status] || { label: status, dot: "bg-gray-400", text: "text-gray-500" };
    return (
        <span className={cn("inline-flex items-center gap-1.5 text-xs font-semibold", cfg.text)}>
            <span className={cn("w-2 h-2 rounded-full flex-shrink-0", cfg.dot)} />
            {cfg.label}
        </span>
    );
}

function PaymentStatusPill({ status }) {
    const cfg = PAYMENT_STATUS_CONFIG[status] || { label: status, dot: "bg-gray-400", text: "text-gray-500" };
    return (
        <span className={cn("inline-flex items-center gap-1.5 text-xs font-medium px-2 py-0.5 rounded-full bg-gray-50 border border-gray-100", cfg.text)}>
            <span className={cn("w-1.5 h-1.5 rounded-full flex-shrink-0", cfg.dot)} />
            {cfg.label}
        </span>
    );
}

function OrderCard({ order, openChat, onMakePayment }) {
    const orderCfg = ORDER_STATUS_CONFIG[order.status] || { accent: "border-l-gray-300" };
    const date = new Date(order.created_at).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
    const amount = parseFloat(order.total).toLocaleString('en-NG', { minimumFractionDigits: 2 });
    const canPay = ['unpaid', 'failed'].includes(order.payment_status);
    const isWhatsApp = order.checkout_type === 'whatsapp';

    return (
        <div className={cn(
            "bg-white rounded-2xl border-l-4 border border-gray-100 px-5 py-4 flex flex-col gap-3",
            orderCfg.accent
        )}>
            {/* Top row: thumbnail + info */}
            <div className="flex items-center gap-4">
                {/* Thumbnail */}
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl overflow-hidden bg-gray-100 flex items-center justify-center flex-shrink-0 border border-gray-100">
                    {order.thumbnail ? (
                        <img src={order.thumbnail} alt="" className="w-full h-full object-cover" />
                    ) : (
                        <Package className="w-5 h-5 text-gray-300" />
                    )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <p className="text-sm font-bold text-gray-900 truncate">{order.order_number}</p>
                        {isWhatsApp && (
                            <span className="text-xs bg-emerald-50 text-emerald-600 border border-emerald-200 px-2 py-0.5 rounded-full font-medium flex items-center gap-1"><svg viewBox="0 0 24 24" className="w-3 h-3 fill-current" xmlns="http://www.w3.org/2000/svg"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.124.558 4.117 1.534 5.845L0 24l6.335-1.505A11.945 11.945 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.818 9.818 0 01-5.006-1.371l-.36-.214-3.727.886.936-3.618-.235-.372A9.818 9.818 0 1112 21.818z"/></svg> WhatsApp Order</span>
                        )}
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                        <OrderStatusPill status={order.status} />
                        <span className="w-1 h-1 rounded-full bg-gray-200 flex-shrink-0" />
                        <PaymentStatusPill status={order.payment_status} />
                    </div>
                    <div className="flex items-center gap-3 text-xs text-gray-400 mt-1.5 flex-wrap">
                        <span className="flex items-center gap-1">
                            <CalendarDays className="w-3 h-3" />
                            {date}
                        </span>
                        <span className="font-semibold text-gray-700">₦{amount}</span>
                        {order.item_count > 0 && <span>{order.item_count} item{order.item_count !== 1 ? 's' : ''}</span>}
                    </div>
                </div>
            </div>

            {/* Actions row */}
            <div className="flex items-center gap-2">
                {/* Make Payment — shown when payment is unpaid or failed */}
                {canPay && (
                    <button
                        onClick={() => onMakePayment(order)}
                        className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold transition-all"
                    >
                        <CreditCard className="w-3.5 h-3.5" />
                        Make Payment
                    </button>
                )}

                <button
                    onClick={() => openChat('order', order.id, `Order ${order.order_number}`)}
                    title="Chat about this order"
                    className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200 text-gray-500 hover:text-blue-600 hover:border-blue-200 transition-all text-xs font-medium"
                >
                    <MessageCircle className="w-4 h-4 flex-shrink-0" />
                    Chat
                </button>
                <Link
                    href={`/account/orders/${order.id}`}
                    className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2 bg-gray-900 hover:bg-gray-700 text-white text-xs font-semibold rounded-xl transition-all"
                >
                    View
                    <ArrowRight className="w-3.5 h-3.5" />
                </Link>
            </div>
        </div>
    );
}

export default function OrdersPanel() {
    const { openChat } = useChatContext();
    const { isAuthenticated, loading: authLoading, token } = useAuth();
    const tenant = useTenant();

    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [pagination, setPagination] = useState({ page: 1, perPage: 10, total: 0, totalPages: 0 });
    const [activeFilter, setActiveFilter] = useState("All");
    const [search, setSearch] = useState("");

    useEffect(() => {
        if (isAuthenticated && token && tenant) fetchOrders();
    }, [isAuthenticated, token, tenant, pagination.page]);

    const fetchOrders = async () => {
        setLoading(true);
        try {
            const res = await api.get(`/orders/my-orders?page=${pagination.page}&per_page=${pagination.perPage}`, {
                headers: { 'Authorization': `Bearer ${token}`, 'X-Tenant-ID': tenant.id }
            });
            if (res.data.success) {
                setOrders(res.data.data);
                setPagination(prev => ({ ...prev, total: res.data.pagination.total, totalPages: res.data.pagination.totalPages }));
            }
        } catch (error) {
            console.error("Failed to fetch orders:", error);
        } finally {
            setLoading(false);
        }
    };

    const filtered = orders.filter(o => {
        const matchFilter = activeFilter === "All" || o.status?.toLowerCase() === activeFilter.toLowerCase();
        const matchSearch = !search || o.order_number?.toLowerCase().includes(search.toLowerCase());
        return matchFilter && matchSearch;
    });

    const handleMakePayment = async (order) => {
        try {
            const res = await api.post(`/payments/paystack/retry/${order.id}`, {}, {
                headers: { 'Authorization': `Bearer ${token}`, 'X-Tenant-ID': tenant.id }
            });
            if (res.data.authorization_url) {
                window.location.href = res.data.authorization_url;
            }
        } catch (err) {
            alert(err.response?.data?.message || 'Could not initialize payment. Please try again.');
        }
    };

    if (authLoading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
        );
    }

    return (
        <div className="space-y-5 px-4 md:px-0 py-2">

            {/* Header */}
            <div>
                <h2 className="text-xl font-bold text-gray-900">My Orders</h2>
                <p className="text-sm text-gray-400 mt-0.5">
                    {loading ? "Loading..." : `${pagination.total} order${pagination.total !== 1 ? 's' : ''} total`}
                </p>
            </div>

            {/* Search */}
            <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                <input
                    type="text"
                    placeholder="Search by order number..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 transition-all"
                />
            </div>

            {/* Filter pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
                {FILTERS.map(f => (
                    <button
                        key={f}
                        onClick={() => setActiveFilter(f)}
                        className={cn(
                            "flex-shrink-0 px-4 py-1.5 rounded-full text-xs font-semibold border transition-all",
                            activeFilter === f
                                ? "bg-gray-900 text-white border-gray-900"
                                : "bg-white text-gray-500 border-gray-200 hover:border-gray-400 hover:text-gray-700"
                        )}
                    >
                        {f}
                    </button>
                ))}
            </div>

            {/* List */}
            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                </div>
            ) : filtered.length === 0 ? (
                <div className="bg-white rounded-2xl border border-gray-100 p-14 text-center">
                    <div className="w-14 h-14 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <ShoppingBag className="w-7 h-7 text-gray-400" />
                    </div>
                    <h3 className="text-base font-bold text-gray-900 mb-1">
                        {search || activeFilter !== "All" ? "No matching orders" : "No Orders Yet"}
                    </h3>
                    <p className="text-sm text-gray-400 mb-6">
                        {search || activeFilter !== "All"
                            ? "Try adjusting your search or filter."
                            : "You haven't placed any orders yet."}
                    </p>
                    {activeFilter === "All" && !search && (
                        <Link href="/" className="inline-block bg-gray-900 text-white px-6 py-2.5 rounded-xl font-semibold text-sm hover:bg-gray-700 transition">
                            Start Shopping
                        </Link>
                    )}
                </div>
            ) : (
                <>
                    <div className="space-y-3">
                        {filtered.map(order => (
                            <OrderCard key={order.id} order={order} openChat={openChat} onMakePayment={handleMakePayment} />
                        ))}
                    </div>

                    {pagination.totalPages > 1 && (
                        <div className="flex items-center justify-center gap-2 pt-2">
                            <button
                                onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                                disabled={pagination.page === 1}
                                className="px-4 py-2 text-sm font-medium border border-gray-200 rounded-xl hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
                            >
                                Previous
                            </button>
                            <span className="px-4 py-2 text-sm text-gray-500 font-medium">
                                Page {pagination.page} of {pagination.totalPages}
                            </span>
                            <button
                                onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                                disabled={pagination.page === pagination.totalPages}
                                className="px-4 py-2 text-sm font-medium border border-gray-200 rounded-xl hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
                            >
                                Next
                            </button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
