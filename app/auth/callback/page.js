"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/components/providers/AuthContext";
import { useStorefront } from "@/components/providers/StorefrontProvider";
import { useTenant } from "@/components/providers/TenantContext";

export default function AuthCallbackPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { syncSession } = useAuth();
    const { theme } = useStorefront();
    const tenant = useTenant();
    const [status, setStatus] = useState("Authenticating...");

    useEffect(() => {
        const handleCallback = async () => {
            const success = searchParams.get("success");
            const payloadB64 = searchParams.get("payload");

            if (success !== "true") {
                setStatus("Authentication failed. Redirecting to login...");
                setTimeout(() => router.push("/login"), 3000);
                return;
            }

            // Fast path: backend sent token+user in the redirect URL (no cross-domain cookie needed)
            if (payloadB64) {
                try {
                    const decoded = JSON.parse(
                        atob(payloadB64.replace(/-/g, '+').replace(/_/g, '/'))
                    );
                    const { accessToken, refreshToken, user: userData } = decoded;

                    if (accessToken && userData) {
                        // Store exactly like the normal email/password login does
                        localStorage.setItem('auth_token', accessToken);
                        if (refreshToken) localStorage.setItem('auth_refresh_token', refreshToken);
                        localStorage.setItem('auth_user', JSON.stringify(userData));

                        setStatus("Redirecting...");
                        const redirectTo = localStorage.getItem("oauth_redirect_to") || "/account";
                        localStorage.removeItem("oauth_redirect_to");
                        router.push(redirectTo);
                        return;
                    }
                } catch (e) {
                    console.error("[AuthCallback] Failed to decode payload:", e);
                }
            }

            // Fallback path: try cookie-based session sync
            setStatus("Syncing session...");
            const syncResult = await syncSession();
            if (syncResult.success) {
                setStatus("Redirecting...");
                const redirectTo = localStorage.getItem("oauth_redirect_to") || "/";
                localStorage.removeItem("oauth_redirect_to");
                router.push(redirectTo);
            } else {
                setStatus("Failed to sync session. Please try logging in again.");
                setTimeout(() => router.push("/login"), 3000);
            }
        };

        handleCallback();
    }, [searchParams, syncSession, router]);

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50/50 p-4">
            <div className="w-full max-w-[400px] space-y-6 text-center">
                <div className="flex flex-col items-center text-center space-y-2">
                    {theme?.variables?.logo ? (
                        <img src={theme.variables.logo} alt={tenant.name} className="h-12 w-auto mb-4 object-contain" />
                    ) : (
                        <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center text-white font-bold text-xl mb-4">
                            {tenant?.name?.[0] || 'S'}
                        </div>
                    )}
                </div>
                <div className="bg-white p-8 rounded-xl shadow-md border border-gray-100">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <h2 className="text-xl font-semibold text-gray-900 mb-2">{status}</h2>
                    <p className="text-sm text-gray-500">Please wait while we complete your authentication.</p>
                </div>
            </div>
        </div>
    );
}
