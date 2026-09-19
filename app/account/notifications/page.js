"use client";

import { useState, useEffect, useCallback } from "react";
import { Bell, Check, CheckCheck, Package, CreditCard, Truck, ShoppingBag, MessageCircle, AlertCircle, X, Filter, ChevronLeft } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/components/providers/AuthContext";
import { useTenant } from "@/components/providers/TenantContext";
import api from "@/lib/axios";
import { cn } from "@/lib/utils";

function relativeTime(dateStr) {
    const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000);
    if (diff < 60) return 'just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    if (diff < 2592000) return `${Math.floor(diff / 86400)}d ago`;
    return new Date(dateStr).toLocaleDateString();
}

const TYPE_CONFIG = {
    'order.created':           { label: 'Order Placed',      icon: ShoppingBag,   color: 'blue'   },
    'order.whatsapp.created':  { label: 'WhatsApp Order',    icon: ShoppingBag,   color: 'emerald'},
    'payment.success':         { label: 'Payment Confirmed', icon: CreditCard,    color: 'green'  },
    'payment.failed':          { label: 'Payment Failed',    icon: AlertCircle,   color: 'red'    },
    'order.shipped':           { label: 'Order Shipped',     icon: Truck,         color: 'purple' },
    'order.delivered':         { label: 'Order Delivered',   icon: Package,       color: 'teal'   },
    'order.cancelled':         { label: 'Order Cancelled',   icon: X,             color: 'gray'   },
    'chat.message':            { label: 'New Message',       icon: MessageCircle, color: 'indigo' },
};

const COLOR_MAP = {
    blue:    'bg-blue-100 text-blue-600 border-blue-200',
    emerald: 'bg-emerald-100 text-emerald-600 border-emerald-200',
    green:   'bg-green-100 text-green-600 border-green-200',
    red:     'bg-red-100 text-red-600 border-red-200',
    purple:  'bg-purple-100 text-purple-600 border-purple-200',
    teal:    'bg-teal-100 text-teal-600 border-teal-200',
    gray:    'bg-gray-100 text-gray-500 border-gray-200',
    indigo:  'bg-indigo-100 text-indigo-600 border-indigo-200',
};

function NotifRow({ notif, onRead }) {
    const cfg = TYPE_CONFIG[notif.type] || { label: notif.type, icon: Bell, color: 'gray' };
    const Icon = cfg.icon;
    const colors = COLOR_MAP[cfg.color] || COLOR_MAP.gray;

    return (
        <Link
            href={notif.action_url || '#'}
            onClick={() => !notif.is_read && onRead(notif.id)}
            className={cn(
                "flex items-start gap-4 p-4 sm:p-5 rounded-2xl border transition-all hover:shadow-md group",
                notif.is_read
                    ? "bg-white border-gray-100 hover:border-gray-200"
                    : "bg-blue-50/60 border-blue-100 hover:border-blue-200"
            )}
        >
            <div className={cn("w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 border", colors)}>
                <Icon className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                    <div>
                        <span className={cn(
                            "text-[10px] font-bold uppercase tracking-widest",
                            notif.is_read ? "text-gray-400" : "text-blue-500"
                        )}>{cfg.label}</span>
                        <p className={cn(
                            "text-sm mt-0.5 leading-snug",
                            notif.is_read ? "text-gray-600" : "text-gray-900 font-semibold"
                        )}>
                            {notif.title}
                        </p>
                        {notif.message && (
                            <p className="text-xs text-gray-400 mt-1">{notif.message}</p>
                        )}
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="text-[11px] text-gray-400 whitespace-nowrap">{relativeTime(notif.created_at)}</span>
                        {!notif.is_read && <span className="w-2.5 h-2.5 rounded-full bg-blue-500 flex-shrink-0" />}
                    </div>
                </div>
            </div>
        </Link>
    );
}

export default function NotificationsPage() {
    const { isAuthenticated, token } = useAuth();
    const tenant = useTenant();
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all'); // 'all' | 'unread'
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [unreadCount, setUnreadCount] = useState(0);
    const [markingAll, setMarkingAll] = useState(false);

    const headers = { Authorization: `Bearer ${token}`, 'X-Tenant-ID': tenant?.id };

    const fetchNotifications = useCallback(async (pg = 1) => {
        if (!isAuthenticated || !token || !tenant?.id) return;
        setLoading(true);
        try {
            const res = await api.get(`/notifications?per_page=20&page=${pg}`, { headers });
            let data = res.data.data || [];
            if (filter === 'unread') data = data.filter(n => !n.is_read);
            setNotifications(data);
            setTotalPages(res.data.pagination?.totalPages || 1);
        } catch (err) {
            console.error('[Notifications] Fetch error:', err);
        } finally { setLoading(false); }
    }, [isAuthenticated, token, tenant?.id, filter]);

    const fetchCount = useCallback(async () => {
        if (!token || !tenant?.id) return;
        try {
            const res = await api.get('/notifications/unread-count', { headers });
            setUnreadCount(res.data.count || 0);
        } catch {}
    }, [token, tenant?.id]);

    useEffect(() => { fetchNotifications(page); fetchCount(); }, [page, filter]);

    const markRead = async (id) => {
        try {
            await api.patch(`/notifications/${id}/read`, {}, { headers });
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
            setUnreadCount(c => Math.max(0, c - 1));
        } catch {}
    };

    const markAllRead = async () => {
        setMarkingAll(true);
        try {
            await api.patch('/notifications/read-all', {}, { headers });
            setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
            setUnreadCount(0);
        } catch {} finally { setMarkingAll(false); }
    };

    const filtered = filter === 'unread' ? notifications.filter(n => !n.is_read) : notifications;

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-2xl mx-auto px-4 py-8">
                {/* Header */}
                <div className="flex items-center gap-3 mb-6">
                    <Link href="/account" className="p-2 text-gray-400 hover:text-gray-700 hover:bg-white rounded-xl transition-all">
                        <ChevronLeft className="w-5 h-5" />
                    </Link>
                    <div className="flex-1">
                        <h1 className="text-2xl font-black text-gray-900 tracking-tight">Notifications</h1>
                        {unreadCount > 0 && (
                            <p className="text-sm text-blue-600 font-semibold mt-0.5">{unreadCount} unread</p>
                        )}
                    </div>
                    {unreadCount > 0 && (
                        <button
                            onClick={markAllRead}
                            disabled={markingAll}
                            className="flex items-center gap-1.5 text-sm font-semibold text-blue-600 hover:text-blue-800 disabled:opacity-50 px-3 py-2 bg-white rounded-xl border border-blue-100 hover:border-blue-200 transition-all"
                        >
                            <CheckCheck className="w-4 h-4" />
                            {markingAll ? 'Marking...' : 'Mark all read'}
                        </button>
                    )}
                </div>

                {/* Filter tabs */}
                <div className="flex gap-2 mb-6 bg-white p-1 rounded-xl border border-gray-100 w-fit">
                    {['all', 'unread'].map(f => (
                        <button
                            key={f}
                            onClick={() => { setFilter(f); setPage(1); }}
                            className={cn(
                                "px-4 py-1.5 rounded-lg text-sm font-bold capitalize transition-all",
                                filter === f
                                    ? "bg-blue-600 text-white shadow-sm"
                                    : "text-gray-500 hover:text-gray-700"
                            )}
                        >
                            {f === 'unread' && unreadCount > 0 ? `Unread (${unreadCount})` : f.charAt(0).toUpperCase() + f.slice(1)}
                        </button>
                    ))}
                </div>

                {/* Notifications list */}
                {loading ? (
                    <div className="space-y-3">
                        {[...Array(5)].map((_, i) => (
                            <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5 animate-pulse">
                                <div className="flex gap-4">
                                    <div className="w-11 h-11 bg-gray-100 rounded-xl flex-shrink-0" />
                                    <div className="flex-1 space-y-2">
                                        <div className="h-3 bg-gray-100 rounded w-1/4" />
                                        <div className="h-4 bg-gray-100 rounded w-3/4" />
                                        <div className="h-3 bg-gray-100 rounded w-1/2" />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="bg-white rounded-2xl border border-gray-100 p-16 text-center">
                        <Bell className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                        <p className="text-gray-500 font-semibold">
                            {filter === 'unread' ? 'No unread notifications' : "You're all caught up!"}
                        </p>
                        <p className="text-gray-400 text-sm mt-1">We'll notify you when something happens.</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {filtered.map(n => <NotifRow key={n.id} notif={n} onRead={markRead} />)}
                    </div>
                )}

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex justify-center items-center gap-3 mt-8">
                        <button
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            disabled={page === 1}
                            className="px-4 py-2 text-sm font-semibold text-gray-600 hover:text-gray-900 disabled:opacity-40 disabled:cursor-not-allowed bg-white border border-gray-200 rounded-xl transition-all hover:border-gray-300"
                        >← Prev</button>
                        <span className="text-sm text-gray-400">Page {page} of {totalPages}</span>
                        <button
                            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                            disabled={page === totalPages}
                            className="px-4 py-2 text-sm font-semibold text-gray-600 hover:text-gray-900 disabled:opacity-40 disabled:cursor-not-allowed bg-white border border-gray-200 rounded-xl transition-all hover:border-gray-300"
                        >Next →</button>
                    </div>
                )}
            </div>
        </div>
    );
}
