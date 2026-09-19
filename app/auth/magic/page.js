"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, MessageCircle, CheckCircle, XCircle, ArrowRight } from "lucide-react";
import api from "@/lib/axios";
import { useTenant } from "@/components/providers/TenantContext";

export default function MagicLinkPage() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const tenant = useTenant();
    const token = searchParams.get("token");

    const [status, setStatus] = useState("idle"); // idle | loading | success | error
    const [error, setError] = useState("");

    const handleProceed = async () => {
        if (!token) {
            setStatus("error");
            setError("No token found in link. Please request a new one from WhatsApp.");
            return;
        }

        setStatus("loading");

        try {
            const res = await api.post("/wa-auth/magic/consume", { token }, {
                headers: tenant?.id ? { "X-Tenant-ID": tenant.id } : {}
            });

            if (!res.data?.success) {
                setStatus("error");
                setError(
                    res.data?.reason === "invalid_or_expired"
                        ? "This link has expired or already been used. Please request a new one from WhatsApp."
                        : "Something went wrong. Please try again."
                );
                return;
            }

            const { jwt, user, destination = "/" } = res.data;

            localStorage.setItem("auth_token", jwt);
            if (user) localStorage.setItem("auth_user", JSON.stringify(user));
            api.defaults.headers.common["Authorization"] = `Bearer ${jwt}`;

            setStatus("success");
            setTimeout(() => router.push(destination), 1000);

        } catch (err) {
            setStatus("error");
            setError(
                err.response?.data?.reason === "invalid_or_expired"
                    ? "This link has expired or already been used."
                    : "Could not verify your link. Please try again."
            );
        }
    };

    const icon = status === "success"
        ? <CheckCircle className="w-8 h-8 text-green-500" />
        : status === "error"
            ? <XCircle className="w-8 h-8 text-red-500" />
            : <MessageCircle className="w-8 h-8 text-green-500" />;

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8 w-full max-w-sm text-center">

                <div className="w-16 h-16 rounded-2xl bg-green-50 flex items-center justify-center mx-auto mb-5">
                    {icon}
                </div>

                <h1 className="text-lg font-bold text-gray-900 mb-1">
                    {status === "success"
                        ? "You're in! ✅"
                        : status === "error"
                            ? "Link Invalid"
                            : "WhatsApp Sign-In"}
                </h1>

                <p className="text-sm text-gray-500 mb-6">
                    {status === "success"
                        ? "Redirecting you now…"
                        : status === "error"
                            ? error
                            : "Tap the button below to sign in with your linked WhatsApp number."}
                </p>

                {status === "idle" && (
                    <button
                        onClick={handleProceed}
                        className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-xl transition-colors"
                    >
                        <MessageCircle className="w-4 h-4" />
                        Proceed to Store
                        <ArrowRight className="w-4 h-4" />
                    </button>
                )}

                {status === "loading" && (
                    <Loader2 className="w-6 h-6 animate-spin text-green-500 mx-auto" />
                )}

                {status === "error" && (
                    <a
                        href="/account"
                        className="inline-flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-700"
                    >
                        Go to Account Settings
                    </a>
                )}
            </div>
        </div>
    );
}
