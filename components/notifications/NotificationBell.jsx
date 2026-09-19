"use client";

import { useState, useEffect, useCallback } from "react";
import { Bell, X, CheckCheck, Package, CreditCard, Truck, ShoppingBag, MessageCircle, AlertCircle } from "lucide-react";
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
    'order.created':          { icon: ShoppingBag,   bg: 'bg-blue-100',    text: 'text-blue-600'   },
    'order.whatsapp.created': { icon: ShoppingBag,   bg: 'bg-emerald-100', text: 'text-emerald-600'},
    'payment.success':        { icon: CreditCard,    bg: 'bg-green-100',   text: 'text-green-600'  },
    'payment.failed':         { icon: AlertCircle,   bg: 'bg-red-100',     text: 'text-red-600'    },
    'order.shipped':          { icon: Truck,         bg: 'bg-purple-100',  text: 'text-purple-600' },
    'order.delivered':        { icon: Package,       bg: 'bg-teal-100',    text: 'text-teal-600'   },
    'order.cancelled':        { icon: X,             bg: 'bg-gray-100',    text: 'text-gray-600'   },
    'chat.message':           { icon: MessageCircle, bg: 'bg-indigo-100',  text: 'text-indigo-600' },
};

function NotifIcon({ type }) {
    const cfg = TYPE_ICONS[type] || { icon: Bell, bg: 'bg-gray-100', text: 'text-gray-400' };
    const Icon = cfg.icon;
    return (
        <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0", cfg.bg)}>
            <Icon className={cn("w-5 h-5", cfg.text)} />
        </div>
    );
}

export default function NotificationBell() {
    const { isAuthenticated, token } = useAuth();
    const tenant = useTenant();
    const socket = useSocket();

    const [isOpen, setIsOpen] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(false);

    const headers = { Authorization: `Bearer ${token}`, 'X-Tenant-ID': tenant?.id };

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
            const res = await api.get('/notifications?per_page=20', { headers });
            setNotifications(res.data.data || []);
        } catch {} finally { setLoading(false); }
    }, [token, tenant?.id]);

    // Load count on mount
    useEffect(() => { if (isAuthenticated) fetchCount(); }, [isAuthenticated, fetchCount]);

    // Fetch list when drawer opens
    useEffect(() => { if (isOpen) fetchNotifications(); }, [isOpen]);

    // Lock body scroll when drawer is open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => { document.body.style.overflow = ''; };
    }, [isOpen]);

    // Real-time via socket.io
    useEffect(() => {
        if (!socket) return;
        const handleNew = (notif) => {
            setUnreadCount(c => c + 1);
            setNotifications(prev => [{ ...notif, is_read: false }, ...prev]);
        };
        socket.on('notification.new', handleNew);
        return () => socket.off('notification.new', handleNew);
    }, [socket]);

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
        <>
            {/* Bell Button */}
            <button
                onClick={() => setIsOpen(true)}
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

            {/* Drawer Overlay */}
            {isOpen && (
                <div className="fixed inset-0 z-[200] flex justify-end">
                    {/* Backdrop */}
                    <div
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        onClick={() => setIsOpen(false)}
                    />

                    {/* Panel — full screen on mobile, max-w-md drawer on desktop */}
                    <div className="relative w-full sm:max-w-md bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">

                        {/* Header */}
                        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 flex-shrink-0">
                            <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 bg-gray-900 rounded-xl flex items-center justify-center">
                                    <Bell className="w-4 h-4 text-white" />
                                </div>
                                <div>
                                    <h2 className="text-base font-bold text-gray-900 leading-tight">Notifications</h2>
                                    {unreadCount > 0 && (
                                        <p className="text-xs text-blue-600 font-semibold">{unreadCount} unread</p>
                                    )}
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                {unreadCount > 0 && (
                                    <button
                                        onClick={markAllRead}
                                        className="flex items-center gap-1 text-[11px] text-gray-400 hover:text-blue-600 px-2 py-1 rounded-lg hover:bg-blue-50 transition-colors font-medium"
                                    >
                                        <CheckCheck className="w-3.5 h-3.5" /> Mark all read
                                    </button>
                                )}
                                <button
                                    onClick={() => setIsOpen(false)}
                                    className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition text-gray-500"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        </div>

                        {/* Body */}
                        <div className="flex-1 overflow-y-auto">
                            {loading ? (
                                <div className="flex items-center justify-center py-20">
                                    <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                                </div>
                            ) : notifications.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
                                    <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mb-4">
                                        <Bell className="w-8 h-8 text-gray-200" />
                                    </div>
                                    <p className="font-bold text-gray-900">No notifications yet</p>
                                    <p className="text-sm text-gray-400 mt-1">We'll notify you about orders, payments, and more</p>
                                </div>
                            ) : (
                                <div className="divide-y divide-gray-50">
                                    {notifications.map(n => (
                                        <button
                                            key={n.id}
                                            onClick={() => {
                                                if (!n.is_read) markRead(n.id);
                                                if (n.action_url) {
                                                    setIsOpen(false);
                                                    window.location.href = n.action_url;
                                                }
                                            }}
                                            className={cn(
                                                "w-full flex items-start gap-3 px-5 py-4 hover:bg-gray-50 transition-colors text-left",
                                                !n.is_read && "bg-blue-50/50"
                                            )}
                                        >
                                            <NotifIcon type={n.type} />
                                            <div className="flex-1 min-w-0">
                                                <p className={cn("text-sm leading-snug", n.is_read ? "text-gray-600" : "text-gray-900 font-semibold")}>
                                                    {n.title}
                                                </p>
                                                {n.message && (
                                                    <p className="text-xs text-gray-400 mt-0.5 line-clamp-2">{n.message}</p>
                                                )}
                                                <p className="text-[10px] text-gray-400 mt-1">{relativeTime(n.created_at)}</p>
                                            </div>
                                            {!n.is_read && <span className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0 mt-1.5" />}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
