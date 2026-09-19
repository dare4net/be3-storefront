"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import api from "@/lib/axios";
import { CheckCircle, XCircle, Loader2, ArrowRight } from "lucide-react";
import Link from "next/link";

function VerifyContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const [status, setStatus] = useState("verifying"); // verifying, success, error
    const [message, setMessage] = useState("");

    useEffect(() => {
        const verifyEmail = async () => {
            const token = searchParams.get("token");
            const tenantId = searchParams.get("tenantId");

            if (!token || !tenantId) {
                setStatus("error");
                setMessage("Missing verification token or tenant ID.");
                return;
            }

            try {
                // The backend route is /auth/verify-email/:token
                // We need to pass the tenant ID in the headers (handled by our axios interceptor or manual header)
                await api.get(`/auth/verify-email/${token}`, {
                    headers: {
                        'X-Tenant-ID': tenantId
                    }
                });
                setStatus("success");
            } catch (error) {
                setStatus("error");
                setMessage(error.response?.data?.message || "Failed to verify email. The link may be expired.");
            }
        };

        verifyEmail();
    }, [searchParams]);

    return (
        <div className="min-h-[60vh] flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
                {status === "verifying" && (
                    <div className="space-y-4">
                        <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto" />
                        <h1 className="text-2xl font-bold text-gray-900">Verifying your email...</h1>
                        <p className="text-gray-600">Please wait while we confirm your account.</p>
                    </div>
                )}

                {status === "success" && (
                    <div className="space-y-6">
                        <CheckCircle className="w-16 h-16 text-green-500 mx-auto" />
                        <div className="space-y-2">
                            <h1 className="text-2xl font-bold text-gray-900">Email Verified!</h1>
                            <p className="text-gray-600">Your account is now fully active. You can now log in to your dashboard.</p>
                        </div>
                        <Link 
                            href="/login"
                            className="inline-flex items-center justify-center w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-xl transition-all gap-2"
                        >
                            Go to Login
                            <ArrowRight className="w-5 h-5" />
                        </Link>
                    </div>
                )}

                {status === "error" && (
                    <div className="space-y-6">
                        <XCircle className="w-16 h-16 text-red-500 mx-auto" />
                        <div className="space-y-2">
                            <h1 className="text-2xl font-bold text-gray-900">Verification Failed</h1>
                            <p className="text-red-600">{message}</p>
                        </div>
                        <div className="space-y-3">
                            <Link 
                                href="/login"
                                className="inline-flex items-center justify-center w-full bg-gray-100 hover:bg-gray-200 text-gray-900 font-bold py-3 px-6 rounded-xl transition-all"
                            >
                                Back to Login
                            </Link>
                            <p className="text-sm text-gray-500">
                                Need help? <Link href="/contact" className="text-blue-600 hover:underline">Contact Support</Link>
                            </p>
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
