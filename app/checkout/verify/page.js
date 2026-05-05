"use client";

/**
 * /checkout/verify
 *
 * Paystack redirects the user back to this page after payment.
 * URL: /checkout/verify?reference=be3_xxxx&trxref=be3_xxxx
 *
 * ARCHITECTURE:
 *   - This page does NOT trust the URL params as proof of payment.
 *   - It polls our own backend (which trusts only the webhook) for status.
 *   - It ALSO listens for a Socket.io push from the server for instant confirmation.
 *   - If polling times out, we show a safe holding message — never a false result.
 */

import { useEffect, useRef, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import api from "@/lib/axios";
import { useTenant } from "@/components/providers/TenantContext";
import { CheckCircle, XCircle, Loader2, RefreshCw, ArrowRight } from "lucide-react";

const MAX_POLLS = 15;       // 15 attempts
const POLL_INTERVAL_MS = 2000; // Every 2 seconds = 30 seconds max wait

function VerifyContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const tenant = useTenant();

    const reference = searchParams.get("reference") || searchParams.get("trxref");

    const [status, setStatus] = useState("verifying"); // verifying | success | failed | timeout
    const [orderId, setOrderId] = useState(null);
    const [orderNumber, setOrderNumber] = useState(null);
    const [pollCount, setPollCount] = useState(0);

    const pollRef = useRef(null);

    const stopPolling = () => {
        if (pollRef.current) {
            clearInterval(pollRef.current);
            pollRef.current = null;
        }
    };

    const checkStatus = async () => {
        if (!reference || !tenant?.id) return;

        try {
            const res = await api.get(`/payments/paystack/status/${reference}`, {
                headers: { "X-Tenant-ID": tenant.id }
            });

            const { status: paymentStatus, orderId: oid, orderNumber: oNum } = res.data;

            if (paymentStatus === "succeeded") {
                stopPolling();
                setOrderId(oid);
                setOrderNumber(oNum);
                setStatus("success");
                // Redirect to success page after brief delay so user sees the confirmation
                setTimeout(() => {
                    router.push(`/checkout/success?orderId=${oid}`);
                }, 2500);
            } else if (paymentStatus === "failed") {
                stopPolling();
                setStatus("failed");
            }
            // If still 'processing', keep polling
        } catch (err) {
            console.error("[Verify] Poll error:", err.message);
            // Don't stop polling on network errors — could be a transient blip
        }
    };

    useEffect(() => {
        if (!reference) {
            setStatus("failed");
            return;
        }

        // === Socket.io: Listen for instant server push ===
        // This fires as soon as the webhook is processed, before polling catches up.
        let socket = null;
        try {
            const io = require("socket.io-client");
            socket = io(process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000", {
                transports: ["websocket"],
            });
            socket.emit("join:payment", reference);
            socket.on("payment.confirmed", (data) => {
                if (data.reference === reference && data.status === "succeeded") {
                    stopPolling();
                    setOrderId(data.orderId);
                    setStatus("success");
                    setTimeout(() => router.push(`/checkout/success?orderId=${data.orderId}`), 2500);
                }
            });
            socket.on("payment.failed", (data) => {
                if (data.reference === reference) {
                    stopPolling();
                    setStatus("failed");
                }
            });
        } catch (e) {
            // Socket.io not available — polling will handle it
        }

        // === Polling: Fallback for when Socket.io isn't instant ===
        // Start immediately, then poll on interval
        checkStatus();
        let count = 1;
        pollRef.current = setInterval(() => {
            count++;
            setPollCount(count);
            if (count >= MAX_POLLS) {
                stopPolling();
                setStatus(prev => prev === "verifying" ? "timeout" : prev);
                return;
            }
            checkStatus();
        }, POLL_INTERVAL_MS);

        return () => {
            stopPolling();
            if (socket) socket.disconnect();
        };
    }, [reference, tenant?.id]);

    if (!reference) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center p-4">
                <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center space-y-4">
                    <XCircle className="w-16 h-16 text-red-500 mx-auto" />
                    <h1 className="text-2xl font-bold text-gray-900">Invalid Link</h1>
                    <p className="text-gray-600">No payment reference found in this URL.</p>
                    <Link href="/checkout" className="inline-flex items-center justify-center w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-xl transition-all">
                        Return to Checkout
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-[60vh] flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">

                {/* === VERIFYING === */}
                {status === "verifying" && (
                    <div className="space-y-6">
                        <div className="relative w-20 h-20 mx-auto">
                            <div className="absolute inset-0 rounded-full border-4 border-blue-100" />
                            <div className="absolute inset-0 rounded-full border-4 border-blue-600 border-t-transparent animate-spin" />
                            <Loader2 className="absolute inset-0 m-auto w-8 h-8 text-blue-600" />
                        </div>
                        <div className="space-y-2">
                            <h1 className="text-2xl font-bold text-gray-900">Verifying your payment</h1>
                            <p className="text-gray-500 text-sm">
                                This usually takes a few seconds. Please don't close this tab.
                            </p>
                        </div>
                        <div className="flex justify-center gap-1.5 pt-2">
                            {Array.from({ length: Math.min(MAX_POLLS, 5) }).map((_, i) => (
                                <div
                                    key={i}
                                    className={`h-1.5 w-6 rounded-full transition-all ${
                                        i < Math.floor((pollCount / MAX_POLLS) * 5)
                                            ? "bg-blue-600"
                                            : "bg-gray-200"
                                    }`}
                                />
                            ))}
                        </div>
                    </div>
                )}

                {/* === SUCCESS === */}
                {status === "success" && (
                    <div className="space-y-6">
                        <div className="w-20 h-20 mx-auto bg-green-50 rounded-full flex items-center justify-center">
                            <CheckCircle className="w-12 h-12 text-green-500" />
                        </div>
                        <div className="space-y-2">
                            <h1 className="text-2xl font-bold text-gray-900">Payment Confirmed!</h1>
                            {orderNumber && (
                                <p className="text-gray-600 text-sm">
                                    Order <span className="font-bold text-gray-800">{orderNumber}</span> has been placed.
                                </p>
                            )}
                            <p className="text-gray-500 text-sm">Redirecting you to your order summary...</p>
                        </div>
                        <div className="w-full bg-gray-100 rounded-full h-1.5">
                            <div className="bg-green-500 h-1.5 rounded-full animate-pulse w-3/4" />
                        </div>
                    </div>
                )}

                {/* === FAILED === */}
                {status === "failed" && (
                    <div className="space-y-6">
                        <div className="w-20 h-20 mx-auto bg-red-50 rounded-full flex items-center justify-center">
                            <XCircle className="w-12 h-12 text-red-500" />
                        </div>
                        <div className="space-y-2">
                            <h1 className="text-2xl font-bold text-gray-900">Payment Failed</h1>
                            <p className="text-gray-600">Your payment could not be processed. You have not been charged.</p>
                        </div>
                        <div className="space-y-3">
                            <Link
                                href="/checkout"
                                className="inline-flex items-center justify-center w-full gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-xl transition-all"
                            >
                                <RefreshCw className="w-4 h-4" />
                                Try Again
                            </Link>
                            <Link href="/" className="block text-sm text-gray-500 hover:text-gray-700">
                                Return to Store
                            </Link>
                        </div>
                    </div>
                )}

                {/* === TIMEOUT — Webhook likely hasn't arrived yet, but WILL arrive === */}
                {status === "timeout" && (
                    <div className="space-y-6">
                        <div className="w-20 h-20 mx-auto bg-amber-50 rounded-full flex items-center justify-center">
                            <Loader2 className="w-12 h-12 text-amber-500" />
                        </div>
                        <div className="space-y-2">
                            <h1 className="text-2xl font-bold text-gray-900">Still Processing...</h1>
                            <p className="text-gray-600 text-sm">
                                Your payment is being verified in the background. <strong>You have not been charged twice.</strong>
                            </p>
                            <p className="text-gray-500 text-sm">
                                We will send an email confirmation to your inbox once your order is confirmed. You can also check your orders page shortly.
                            </p>
                        </div>
                        <div className="space-y-3">
                            <Link
                                href="/account/orders"
                                className="inline-flex items-center justify-center w-full gap-2 bg-gray-900 hover:bg-gray-800 text-white font-bold py-3 px-6 rounded-xl transition-all"
                            >
                                Check My Orders
                                <ArrowRight className="w-4 h-4" />
                            </Link>
                            <Link href="/" className="block text-sm text-gray-500 hover:text-gray-700">
                                Continue Shopping
                            </Link>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default function VerifyPage() {
    return (
        <Suspense fallback={
            <div className="min-h-[60vh] flex items-center justify-center">
                <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
            </div>
        }>
            <VerifyContent />
        </Suspense>
    );
}
