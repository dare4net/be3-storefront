"use client";

/**
 * /checkout/verify
 * Handles Paystack callback. Polls our backend for payment status.
 * Socket.io listens for instant push.
 * Always navigates to /account/orders/[orderId] — never back to homepage.
 */

import { useEffect, useRef, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import api from "@/lib/axios";
import { useTenant } from "@/components/providers/TenantContext";
import { CheckCircle, XCircle, Loader2, AlertTriangle, ArrowRight } from "lucide-react";

const MAX_POLLS = 15;
const POLL_INTERVAL_MS = 2000;

function VerifyContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const tenant = useTenant();

    const reference = searchParams.get("reference") || searchParams.get("trxref");

    const [status, setStatus] = useState("verifying"); // verifying | success | failed | timed_out
    const [orderId, setOrderId] = useState(null);
    const [orderNumber, setOrderNumber] = useState(null);
    const [pollCount, setPollCount] = useState(0);
    const pollRef = useRef(null);

    const stopPolling = () => {
        if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
    };

    const navigateToOrder = (oid) => {
        stopPolling();
        setTimeout(() => router.push(`/account/orders/${oid}`), 1800);
    };

    const checkStatus = async () => {
        if (!reference || !tenant?.id) return;
        try {
            const res = await api.get(`/payments/paystack/status/${reference}`, {
                headers: { "X-Tenant-ID": tenant.id }
            });
            const { status: s, orderId: oid, orderNumber: oNum } = res.data;

            // Always capture orderId whenever the backend gives us one
            if (oid) { setOrderId(oid); }
            if (oNum) { setOrderNumber(oNum); }

            if (s === "succeeded") {
                setStatus("success");
                navigateToOrder(oid);
            } else if (s === "failed") {
                setStatus("failed");
                stopPolling();
                setTimeout(() => router.push(`/account/orders/${oid}`), 2500);
            } else if (s === "timed_out") {
                setStatus("timed_out");
                stopPolling();
            }
            // s === "processing" → keep polling
        } catch (err) {
            console.error("[Verify] Poll error:", err.message);
        }
    };

    useEffect(() => {
        if (!reference) { setStatus("failed"); return; }

        // Socket.io — instant push
        let socket = null;
        try {
            const io = require("socket.io-client");
            socket = io(process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000", { transports: ["websocket"] });
            socket.emit("join:payment", reference);
            socket.on("payment.confirmed", (data) => {
                if (data.reference === reference) {
                    setOrderId(data.orderId); setStatus("success");
                    navigateToOrder(data.orderId);
                }
            });
            socket.on("payment.failed", (data) => {
                if (data.reference === reference) {
                    setOrderId(data.orderId); setStatus("failed");
                    stopPolling();
                    setTimeout(() => router.push(`/account/orders/${data.orderId}`), 2500);
                }
            });
        } catch (e) { }

        // Polling fallback
        checkStatus();
        let count = 1;
        pollRef.current = setInterval(() => {
            count++; setPollCount(count);
            if (count >= MAX_POLLS) {
                stopPolling();
                setStatus(prev => prev === "verifying" ? "timed_out" : prev);
                return;
            }
            checkStatus();
        }, POLL_INTERVAL_MS);

        return () => { stopPolling(); if (socket) socket.disconnect(); };
    }, [reference, tenant?.id]);

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
            <div className="w-full max-w-sm bg-white rounded-3xl shadow-xl p-8 text-center">

                {status === "verifying" && (
                    <div className="space-y-5">
                        <div className="relative w-20 h-20 mx-auto">
                            <div className="absolute inset-0 rounded-full border-4 border-blue-100" />
                            <div className="absolute inset-0 rounded-full border-4 border-blue-600 border-t-transparent animate-spin" />
                            <Loader2 className="absolute inset-0 m-auto w-8 h-8 text-blue-400" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-gray-900">Verifying payment</h1>
                            <p className="text-sm text-gray-500 mt-1">Please keep this tab open</p>
                        </div>
                        <div className="flex justify-center gap-1.5">
                            {[0, 1, 2, 3, 4].map(i => (
                                <div key={i} className={`h-1 w-8 rounded-full transition-all duration-500 ${i < Math.floor((pollCount / MAX_POLLS) * 5) ? "bg-blue-600" : "bg-gray-100"}`} />
                            ))}
                        </div>
                        {orderId && (
                            <button
                                onClick={() => router.push(`/account/orders/${orderId}`)}
                                className="w-full text-sm text-gray-400 hover:text-gray-700 py-2 transition"
                            >
                                Skip → View Order
                            </button>
                        )}
                    </div>
                )}

                {status === "success" && (
                    <div className="space-y-4">
                        <div className="w-20 h-20 mx-auto bg-green-50 rounded-full flex items-center justify-center">
                            <CheckCircle className="w-11 h-11 text-green-500" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-gray-900">Payment Confirmed!</h1>
                            {orderNumber && <p className="text-sm text-gray-500 mt-1">Order {orderNumber}</p>}
                            <p className="text-xs text-gray-400 mt-2">Taking you to your order...</p>
                        </div>
                    </div>
                )}

                {status === "failed" && (
                    <div className="space-y-4">
                        <div className="w-20 h-20 mx-auto bg-red-50 rounded-full flex items-center justify-center">
                            <XCircle className="w-11 h-11 text-red-500" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-gray-900">Payment Failed</h1>
                            <p className="text-sm text-gray-500 mt-1">You were not charged. Taking you to your order...</p>
                        </div>
                    </div>
                )}

                {status === "timed_out" && (
                    <div className="space-y-5">
                        <div className="w-20 h-20 mx-auto bg-amber-50 rounded-full flex items-center justify-center">
                            <AlertTriangle className="w-10 h-10 text-amber-500" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-gray-900">Still Verifying</h1>
                            <p className="text-sm text-gray-500 mt-1">
                                Payment verification is taking longer than usual. <strong>You have not been charged twice.</strong>
                            </p>
                            <p className="text-xs text-gray-400 mt-2">Your order page will reflect the status once confirmed.</p>
                        </div>
                        <button
                            onClick={() => router.push(orderId ? `/account/orders/${orderId}` : `/account/orders`)}
                            className="w-full flex items-center justify-center gap-2 bg-gray-900 text-white py-3 rounded-2xl font-semibold text-sm hover:bg-gray-800 transition"
                        >
                            View Order <ArrowRight className="w-4 h-4" />
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

export default function VerifyPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
            </div>
        }>
            <VerifyContent />
        </Suspense>
    );
}
