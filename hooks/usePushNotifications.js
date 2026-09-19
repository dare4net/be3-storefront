"use client";

import { useEffect, useRef } from "react";
import { useAuth } from "@/components/providers/AuthContext";
import { useTenant } from "@/components/providers/TenantContext";
import { requestFCMToken, onForegroundMessage } from "@/lib/firebase";
import api from "@/lib/axios";
import toast from "react-hot-toast";

/**
 * usePushNotifications
 *
 * After login, requests browser notification permission, gets the FCM token,
 * registers it with the backend, and listens for foreground messages.
 *
 * Safe to call multiple times — guards against double-registration.
 */
export function usePushNotifications({ onNewNotification } = {}) {
    const { isAuthenticated, token } = useAuth();
    const tenant = useTenant();
    const registeredRef = useRef(false);

    useEffect(() => {
        if (!isAuthenticated || !token || !tenant?.id) return;
        if (registeredRef.current) return;
        if (!('Notification' in window) || !('serviceWorker' in navigator)) return;

        // Don't re-prompt if already denied
        if (Notification.permission === 'denied') return;

        let unsubscribeForeground = null;

        const setup = async () => {
            try {
                const fcmToken = await requestFCMToken();
                if (!fcmToken) return;

                // Register token with backend
                await api.post('/notifications/fcm/token', {
                    token: fcmToken,
                    platform: 'web',
                }, {
                    headers: {
                        Authorization: `Bearer ${token}`,
                        'X-Tenant-ID': tenant.id,
                    },
                });

                registeredRef.current = true;
                console.log('[Push] FCM token registered ✓');

                // Listen for foreground (tab open) messages
                unsubscribeForeground = onForegroundMessage((payload) => {
                    const { title, body } = payload.notification || {};
                    const data = payload.data || {};

                    // Show toast for foreground messages
                    toast.custom((t) => (
                        <div
                            onClick={() => {
                                toast.dismiss(t.id);
                                if (data.actionUrl) window.location.href = data.actionUrl;
                            }}
                            className={`${t.visible ? 'animate-in slide-in-from-top-2' : 'opacity-0'} max-w-sm w-full bg-white shadow-lg rounded-xl border border-gray-100 p-4 cursor-pointer flex items-start gap-3 transition-all`}
                        >
                            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                <span className="text-blue-600 text-base">🔔</span>
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-bold text-gray-900 leading-snug">{title}</p>
                                {body && <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{body}</p>}
                            </div>
                        </div>
                    ), { duration: 6000, position: 'top-right' });

                    // Also call optional callback (e.g. to update bell badge)
                    onNewNotification?.(payload);
                });
            } catch (err) {
                console.warn('[Push] Setup failed:', err.message);
            }
        };

        setup();

        return () => {
            if (unsubscribeForeground) unsubscribeForeground();
        };
    }, [isAuthenticated, token, tenant?.id]);
}
