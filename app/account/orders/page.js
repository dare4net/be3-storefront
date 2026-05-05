"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/components/providers/AuthContext";
import api from "@/lib/axios";
import { Package, ChevronRight, Loader2, MessageCircle } from "lucide-react";
import { useTenant } from "@/components/providers/TenantContext";
import { useChatContext } from "@/components/providers/ChatContext";

const STATUS_STYLES = {
    paid:        "bg-green-100 text-green-800",
    processing:  "bg-blue-100 text-blue-800",
    shipped:     "bg-indigo-100 text-indigo-800",
    completed:   "bg-purple-100 text-purple-800",
    pending:     "bg-yellow-100 text-yellow-800",
    cancelled:   "bg-red-100 text-red-800",
    refunded:    "bg-gray-100 text-gray-600",
};

export default function OrdersPanel() {
    const router = useRouter();
    const { openChat } = useChatContext();
    const { isAuthenticated, loading: authLoading, token } = useAuth();
    const tenant = useTenant();

    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [pagination, setPagination] = useState({ page: 1, perPage: 10, total: 0, totalPages: 0 });

    useEffect(() => {
        if (isAuthenticated && token && tenant) {
            fetchOrders();
        }
    }, [isAuthenticated, token, tenant, pagination.page]);

    const fetchOrders = async () => {
        setLoading(true);
        try {
            const res = await api.get(`/orders/my-orders?page=${pagination.page}&per_page=${pagination.perPage}`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'X-Tenant-ID': tenant.id
                }
            });
            if (res.data.success) {
                setOrders(res.data.data);
                setPagination(prev => ({
                    ...prev,
                    total: res.data.pagination.total,
                    totalPages: res.data.pagination.totalPages
                }));
            }
        } catch (error) {
            console.error("Failed to fetch orders:", error);
        } finally {
            setLoading(false);
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
        <div className="space-y-4">
            <div className="mb-2">
                <h2 className="text-xl font-bold text-gray-900">My Orders</h2>
                <p className="text-sm text-gray-500">View and track all your purchases</p>
            </div>

            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                </div>
            ) : orders.length === 0 ? (
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Package className="w-8 h-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">No Orders Yet</h3>
                    <p className="text-gray-500 text-sm mb-6">
                        You haven&apos;t placed any orders yet. Start shopping!
                    </p>
                    <Link
                        href="/"
                        className="inline-block bg-blue-600 text-white px-6 py-2.5 rounded-xl font-medium hover:bg-blue-700 transition text-sm"
                    >
                        Start Shopping
                    </Link>
                </div>
            ) : (
                <>
                    <div className="space-y-3">
                        {orders.map((order) => (
                            <div
                                key={order.id}
                                className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow p-5"
                            >
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                                            <h3 className="text-sm font-bold text-gray-900">{order.order_number}</h3>
                                            <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${STATUS_STYLES[order.status] || 'bg-gray-100 text-gray-800'}`}>
                                                {order.status?.replace('_', ' ')}
                                            </span>
                                        </div>
                                        <p className="text-xs text-gray-500">
                                            Placed {new Date(order.created_at).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })}
                                        </p>
                                        <p className="text-sm font-semibold text-gray-900 mt-1">
                                            ₦{parseFloat(order.total).toLocaleString('en-NG', { minimumFractionDigits: 2 })}
                                        </p>
                                    </div>
                                    <div className="flex flex-col items-end gap-2 flex-shrink-0">
                                        <Link
                                            href={`/account/orders/${order.id}`}
                                            className="flex items-center gap-1 text-xs text-blue-600 font-medium hover:underline"
                                        >
                                            View <ChevronRight className="w-3.5 h-3.5" />
                                        </Link>
                                        <button
                                            onClick={() => openChat('order', order.id, `Order ${order.order_number}`)}
                                            className="flex items-center gap-1 text-xs text-gray-500 hover:text-blue-600 transition-colors"
                                        >
                                            <MessageCircle className="w-3.5 h-3.5" />
                                            Chat
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {pagination.totalPages > 1 && (
                        <div className="flex items-center justify-center gap-2 pt-4">
                            <button
                                onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
                                disabled={pagination.page === 1}
                                className="px-4 py-2 text-sm border rounded-xl hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
                            >
                                Previous
                            </button>
                            <span className="px-4 py-2 text-sm text-gray-600">
                                {pagination.page} / {pagination.totalPages}
                            </span>
                            <button
                                onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
                                disabled={pagination.page === pagination.totalPages}
                                className="px-4 py-2 text-sm border rounded-xl hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition"
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
