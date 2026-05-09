"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@/components/providers/AuthContext";
import api from "@/lib/axios";
import { useTenant } from "@/components/providers/TenantContext";
import { useChatContext } from "@/components/providers/ChatContext";
import {
    Package, ChevronRight, Loader2, MessageCircle,
    ShoppingBag, Clock, CheckCircle2, XCircle,
    Truck, RotateCcw, Search, CalendarDays, ArrowRight
} from "lucide-react";
import { cn } from "@/lib/utils";

const STATUS_CONFIG = {
    paid:               { label: "Paid",        dot: "bg-green-500",   text: "text-green-600",   accent: "border-l-green-500"   },
    processing:         { label: "Processing",  dot: "bg-blue-500",    text: "text-blue-600",    accent: "border-l-blue-500"    },
    shipped:            { label: "Shipped",      dot: "bg-indigo-500",  text: "text-indigo-600",  accent: "border-l-indigo-500"  },
    completed:          { label: "Completed",   dot: "bg-violet-500",  text: "text-violet-600",  accent: "border-l-violet-500"  },
    delivered:          { label: "Delivered",   dot: "bg-green-500",   text: "text-green-600",   accent: "border-l-green-500"   },
    pending:            { label: "Pending",     dot: "bg-amber-500",   text: "text-amber-600",   accent: "border-l-amber-500"   },
    pending_whatsapp:   { label: "WhatsApp",    dot: "bg-emerald-500", text: "text-emerald-600", accent: "border-l-emerald-500" },
    cancelled:          { label: "Cancelled",   dot: "bg-red-400",     text: "text-red-500",     accent: "border-l-red-400"     },
    refunded:           { label: "Refunded",    dot: "bg-gray-400",    text: "text-gray-500",    accent: "border-l-gray-400"    },
};

const FILTERS = ["All", "Processing", "Shipped", "Completed", "Cancelled"];

function StatusPill({ status }) {
    const cfg = STATUS_CONFIG[status] || { label: status, dot: "bg-gray-400", text: "text-gray-500" };
    return (
        <span className={cn("inline-flex items-center gap-1.5 text-xs font-semibold", cfg.text)}>
            <span className={cn("w-2 h-2 rounded-full flex-shrink-0", cfg.dot)} />
            {cfg.label}
        </span>
    );
}

function OrderCard({ order, openChat }) {
    const cfg = STATUS_CONFIG[order.status] || { accent: "border-l-gray-300", text: "text-gray-500", dot: "bg-gray-400", label: order.status };
    const date = new Date(order.created_at).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
    const amount = parseFloat(order.total).toLocaleString('en-NG', { minimumFractionDigits: 2 });

    return (
        <div className={cn(
            "bg-white rounded-2xl border-l-4 border border-gray-100 px-5 py-4 flex flex-col sm:flex-row sm:items-center gap-3",
            cfg.accent
        )}>
            {/* Top row: thumbnail + info */}
            <div className="flex items-center gap-4 flex-1 min-w-0">
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
                        <StatusPill status={order.status} />
                    </div>
                    <div className="flex items-center gap-3 text-xs text-gray-400 flex-wrap">
                        <span className="flex items-center gap-1">
                            <CalendarDays className="w-3 h-3" />
                            {date}
                        </span>
                        <span className="w-1 h-1 rounded-full bg-gray-200" />
                        <span className="font-semibold text-gray-700">₦{amount}</span>
                    </div>
                </div>
            </div>

            {/* Actions — below on mobile, inline on sm+ */}
            <div className="flex items-center gap-2 sm:flex-shrink-0">
                <button
                    onClick={() => openChat('order', order.id, `Order ${order.order_number}`)}
                    title="Chat about this order"
                    className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200 text-gray-500 hover:text-blue-600 hover:border-blue-200 transition-all text-xs font-medium"
                >
                    <MessageCircle className="w-4 h-4 flex-shrink-0" />
                    <span className="sm:hidden">Chat</span>
                    <span className="hidden sm:inline">Chat</span>
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
                            <OrderCard key={order.id} order={order} openChat={openChat} />
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
