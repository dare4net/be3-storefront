"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Bell, X, CheckCheck, Package, CreditCard, Truck, ShoppingBag, MessageCircle, AlertCircle } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/components/providers/AuthContext";
import { useTenant } from "@/components/providers/TenantContext";
import { useSocket } from "@/components/providers/SocketContext";
import api from "@/lib/axios";
import { cn } from "@/lib/utils";

function relativeTime(dateStr) {
    const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000);
    if (diff < 60) return 'just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
}

const TYPE_ICONS = {
    'order.created':           { icon: ShoppingBag,    bg: 'bg-blue-100',    text: 'text-blue-600'   },
    'order.whatsapp.created':  { icon: ShoppingBag,    bg: 'bg-emerald-100', text: 'text-emerald-600'},
    'payment.success':         { icon: CreditCard,     bg: 'bg-green-100',   text: 'text-green-600'  },
    'payment.failed':          { icon: AlertCircle,    bg: 'bg-red-100',     text: 'text-red-600'    },
    'order.shipped':           { icon: Truck,          bg: 'bg-purple-100',  text: 'text-purple-600' },
    'order.delivered':         { icon: Package,        bg: 'bg-teal-100',    text: 'text-teal-600'   },
    'order.cancelled':         { icon: X,              bg: 'bg-gray-100',    text: 'text-gray-600'   },
    'chat.message':            { icon: MessageCircle,  bg: 'bg-indigo-100',  text: 'text-indigo-600' },
};

function NotifIcon({ type }) {
    const cfg = TYPE_ICONS[type] || { icon: Bell, bg: 'bg-gray-100', text: 'text-gray-400' };
    const Icon = cfg.icon;
    return (
        <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0", cfg.bg)}>
            <Icon className={cn("w-4 h-4", cfg.text)} />
        </div>
    );
}

export default function NotificationBell() {
    const { isAuthenticated, token } = useAuth();
    const tenant = useTenant();
    const socket = useSocket();

    const [open, setOpen] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(false);
    const panelRef = useRef(null);

    const headers = { Authorization: `Bearer ${token}`, 'X-Tenant-ID': tenant?.id };

    // Initial fetch of count and list
    const fetchCount = useCallback(async () => {
        if (!token || !tenant?.id) return;
        try {
            const res = await api.get('/notifications/unread-count', { headers });
            setUnreadCount(res.data.count || 0);
        } catch {}
    }, [token, tenant?.id]);

    const fetchNotifications = useCallback(async () => {
        if (!token || !tenant?.id) return;
        setLoading(true);
        try {
            const res = await api.get('/notifications?per_page=15', { headers });
            setNotifications(res.data.data || []);
        } catch {} finally { setLoading(false); }
    }, [token, tenant?.id]);

    // Load count on mount
    useEffect(() => { if (isAuthenticated) fetchCount(); }, [isAuthenticated, fetchCount]);

    // Fetch list when panel opens
    useEffect(() => { if (open) fetchNotifications(); }, [open]);

    // ── Real-time via socket.io ──────────────────────────────
    useEffect(() => {
        if (!socket) return;

        const handleNew = (notif) => {
            // Bump badge
            setUnreadCount(c => c + 1);
            // Prepend to list if panel is open
            setNotifications(prev => [{ ...notif, is_read: false }, ...prev]);
        };

        socket.on('notification.new', handleNew);
        return () => socket.off('notification.new', handleNew);
    }, [socket]);

    // Click outside to close
    useEffect(() => {
        const handler = (e) => { if (panelRef.current && !panelRef.current.contains(e.target)) setOpen(false); };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const markRead = async (id) => {
        try {
            await api.patch(`/notifications/${id}/read`, {}, { headers });
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
            setUnreadCount(c => Math.max(0, c - 1));
        } catch {}
    };

    const markAllRead = async () => {
        try {
            await api.patch('/notifications/read-all', {}, { headers });
            setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
            setUnreadCount(0);
        } catch {}
    };

    if (!isAuthenticated) return null;

    return (
        <div className="relative" ref={panelRef}>
            {/* Bell button */}
            <button
                onClick={() => setOpen(o => !o)}
                className="p-1.5 sm:p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all relative"
                aria-label="Notifications"
            >
                <Bell className="w-5 h-5 sm:w-6 sm:h-6" />
                {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 bg-red-500 text-white text-[9px] font-bold rounded-full min-w-[16px] h-[16px] flex items-center justify-center ring-2 ring-white">
                        {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                )}
            </button>

            {/* Dropdown panel */}
            {open && (
                <div className="absolute right-0 top-full mt-2 w-[360px] bg-white rounded-2xl shadow-2xl border border-gray-100 z-[200] overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                    {/* Header */}
                    <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                        <div>
                            <p className="text-sm font-bold text-gray-900">Notifications</p>
                            {unreadCount > 0 && (
                                <p className="text-[10px] text-blue-600 font-semibold">{unreadCount} unread</p>
                            )}
                        </div>
                        <div className="flex items-center gap-1">
                            {unreadCount > 0 && (
                                <button
                                    onClick={markAllRead}
                                    className="flex items-center gap-1 text-[11px] text-gray-400 hover:text-blue-600 px-2 py-1 rounded-lg hover:bg-blue-50 transition-colors font-medium"
                                >
                                    <CheckCheck className="w-3 h-3" /> Mark all read
                                </button>
                            )}
                            <button onClick={() => setOpen(false)} className="p-1 text-gray-400 hover:text-gray-700 rounded-lg">
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    {/* List */}
                    <div className="max-h-[380px] overflow-y-auto divide-y divide-gray-50">
                        {loading ? (
                            <div className="py-10 text-center">
                                <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
                            </div>
                        ) : notifications.length === 0 ? (
                            <div className="py-12 text-center">
                                <Bell className="w-8 h-8 text-gray-200 mx-auto mb-2" />
                                <p className="text-sm text-gray-400 font-medium">No notifications yet</p>
                            </div>
                        ) : (
                            notifications.map(n => (
                                <Link
                                    key={n.id}
                                    href={n.action_url || '/account/notifications'}
                                    onClick={() => !n.is_read && markRead(n.id)}
                                    className={cn(
                                        "flex items-start gap-3 px-4 py-3 hover:bg-gray-50 transition-colors",
                                        !n.is_read && "bg-blue-50/50"
                                    )}
                                >
                                    <NotifIcon type={n.type} />
                                    <div className="flex-1 min-w-0">
                                        <p className={cn("text-sm leading-snug", n.is_read ? "text-gray-600" : "text-gray-900 font-semibold")}>
                                            {n.title}
                                        </p>
                                        {n.message && (
                                            <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{n.message}</p>
                                        )}
                                        <p className="text-[10px] text-gray-400 mt-1">{relativeTime(n.created_at)}</p>
                                    </div>
                                    {!n.is_read && <span className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0 mt-1.5" />}
                                </Link>
                            ))
                        )}
                    </div>

                    {/* Footer */}
                    <div className="border-t border-gray-100">
                        <Link
                            href="/account/notifications"
                            onClick={() => setOpen(false)}
                            className="block text-center py-3 text-xs font-bold text-blue-600 hover:bg-blue-50 transition-colors"
                        >
                            View all notifications
                        </Link>
                    </div>
                </div>
            )}
        </div>
    );
}
