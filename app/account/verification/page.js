"use client";

import { useState, useEffect } from "react";
import { CheckCircle, Clock, Lock, Upload, AlertCircle, RefreshCw, ChevronRight, Shield, FileText, Building2, X } from "lucide-react";
import api from "@/lib/axios";
import { useAuth } from "@/components/providers/AuthContext";

const TIER_CONFIG = [
    {
        tier: 1,
        title: "Email Verification",
        description: "Verify your email address to access platform features",
        icon: Shield,
        color: "blue",
    },
    {
        tier: 2,
        title: "Identity Verification (KYC)",
        description: "Upload a government-issued ID and complete a liveness check to unlock vendor applications",
        icon: FileText,
        color: "purple",
        requiredFor: "Apply to become a vendor",
    },
    {
        tier: 3,
        title: "Business Verification (KYB)",
        description: "Upload your business registration documents to get a verified store badge",
        icon: Building2,
        color: "emerald",
        requiredFor: "Verified store badge & lifted restrictions",
        requiresTier2: true,
    },
];

function TierStatusBadge({ status, verified }) {
    if (verified || status === "approved") {
        return (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-green-50 text-green-700 border border-green-100">
                <CheckCircle className="w-3.5 h-3.5" /> Verified
            </span>
        );
    }
    if (status === "submitted") {
        return (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-100">
                <Clock className="w-3.5 h-3.5" /> Under Review
            </span>
        );
    }
    if (status === "rejected") {
        return (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-red-50 text-red-700 border border-red-100">
                <X className="w-3.5 h-3.5" /> Rejected
            </span>
        );
    }
    return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-gray-50 text-gray-500 border border-gray-100">
            <AlertCircle className="w-3.5 h-3.5" /> Not Started
        </span>
    );
}

// ─── KYC/KYB Upload Form ──────────────────────────────────────────────────────
function VerificationUploadForm({ type, status, onSubmit, locked }) {
    const [docUrl, setDocUrl] = useState("");
    const [livenessUrl, setLivenessUrl] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!docUrl.trim()) return setError("Please provide a document URL");
        setSubmitting(true);
        setError("");
        try {
            await onSubmit({ document_url: docUrl, liveness_url: livenessUrl || undefined });
        } catch (err) {
            setError(err.message || "Submission failed. Please try again.");
        } finally {
            setSubmitting(false);
        }
    };

    if (locked) {
        return (
            <div className="flex items-center gap-2 text-sm text-gray-400 py-2">
                <Lock className="w-4 h-4" />
                Complete KYC first to unlock Business Verification
            </div>
        );
    }

    if (status === "submitted") {
        return (
            <p className="text-sm text-amber-700 bg-amber-50 border border-amber-100 rounded-xl px-4 py-3">
                Your documents are under review. We'll notify you once verified — usually within 24 hours.
            </p>
        );
    }

    if (status === "approved") return null;

    return (
        <form onSubmit={handleSubmit} className="space-y-3 pt-2">
            {error && (
                <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</p>
            )}
            <div>
                <label className="block text-xs font-bold text-gray-600 mb-1.5">
                    {type === "kyc" ? "Identity Document URL" : "Business Registration Document URL"}
                    <span className="text-red-500 ml-0.5">*</span>
                </label>
                <input
                    type="url"
                    value={docUrl}
                    onChange={e => setDocUrl(e.target.value)}
                    placeholder="https://..."
                    className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 bg-gray-50"
                />
                <p className="text-[10px] text-gray-400 mt-1">
                    {type === "kyc" ? "Upload your passport, driver's licence, or national ID to cloud storage first, then paste the URL here." : "Upload your CAC certificate or business registration document."}
                </p>
            </div>

            {type === "kyc" && (
                <div>
                    <label className="block text-xs font-bold text-gray-600 mb-1.5">Liveness Check URL <span className="text-gray-400 font-normal">(optional — will be reviewed manually)</span></label>
                    <input
                        type="url"
                        value={livenessUrl}
                        onChange={e => setLivenessUrl(e.target.value)}
                        placeholder="https://..."
                        className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400 bg-gray-50"
                    />
                </div>
            )}

            <button
                type="submit"
                disabled={submitting}
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl transition-all disabled:opacity-60 flex items-center justify-center gap-2"
            >
                {submitting ? (
                    <><RefreshCw className="w-4 h-4 animate-spin" /> Submitting...</>
                ) : (
                    <><Upload className="w-4 h-4" /> Submit for Review</>
                )}
            </button>
        </form>
    );
}

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function VerificationPage() {
    const { user, loading: authLoading } = useAuth();
    const [verification, setVerification] = useState(null);
    const [loading, setLoading] = useState(true);
    const [resending, setResending] = useState(false);
    const [successMsg, setSuccessMsg] = useState("");

    useEffect(() => {
        if (authLoading || !user) return;
        fetchVerificationStatus();
    }, [user, authLoading]);

    const fetchVerificationStatus = async () => {
        setLoading(true);
        try {
            const res = await api.get('/auth/me/verification-status');
            if (res.data.success) setVerification(res.data.verification);
        } catch (e) {
            console.error("Failed to fetch verification status", e);
        } finally {
            setLoading(false);
        }
    };

    const handleResendEmail = async () => {
        setResending(true);
        try {
            const res = await api.post('/auth/resend-verification', {});
            if (res.data.success) setSuccessMsg("Verification email sent! Check your inbox.");
            else setSuccessMsg(res.data.message || "Failed to resend. Try again.");
        } catch {
            setSuccessMsg("Failed to send email. Please try again.");
        } finally {
            setResending(false);
            setTimeout(() => setSuccessMsg(""), 5000);
        }
    };

    const handleKycSubmit = async ({ document_url, liveness_url }) => {
        const res = await api.post('/auth/me/kyc/submit', { document_url, liveness_url });
        if (!res.data.success) throw new Error(res.data.message);
        await fetchVerificationStatus();
        setSuccessMsg("KYC documents submitted successfully!");
        setTimeout(() => setSuccessMsg(""), 5000);
    };

    const handleKybSubmit = async ({ document_url }) => {
        const res = await api.post('/auth/me/kyb/submit', { document_url });
        if (!res.data.success) throw new Error(res.data.message);
        await fetchVerificationStatus();
        setSuccessMsg("KYB documents submitted successfully!");
        setTimeout(() => setSuccessMsg(""), 5000);
    };

    const COLOR_MAP = {
        blue:    { bg: "bg-blue-50",    border: "border-blue-100",    icon: "text-blue-600",   ring: "ring-blue-100" },
        purple:  { bg: "bg-purple-50",  border: "border-purple-100",  icon: "text-purple-600", ring: "ring-purple-100" },
        emerald: { bg: "bg-emerald-50", border: "border-emerald-100", icon: "text-emerald-600",ring: "ring-emerald-100" },
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-24">
                <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-black text-gray-900">Verification Centre</h1>
                <p className="text-sm text-gray-500 mt-1">Complete verifications to unlock platform features and become a vendor</p>
            </div>

            {successMsg && (
                <div className="bg-green-50 border border-green-100 rounded-xl px-4 py-3 text-sm text-green-700 font-medium flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 flex-shrink-0" /> {successMsg}
                </div>
            )}

            {/* Tier Cards */}
            <div className="space-y-4">
                {/* Tier 1 — Email */}
                {(() => {
                    const t = verification?.tier1;
                    const colors = COLOR_MAP.blue;
                    const verified = t?.verified;
                    return (
                        <div className={`bg-white rounded-2xl border ${verified ? "border-green-100" : "border-gray-100"} p-6`}>
                            <div className="flex items-start gap-4">
                                <div className={`w-12 h-12 rounded-xl ${colors.bg} ${colors.border} border flex items-center justify-center flex-shrink-0`}>
                                    <Shield className={`w-6 h-6 ${colors.icon}`} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between gap-3 flex-wrap">
                                        <div>
                                            <p className="font-bold text-gray-900 flex items-center gap-2">
                                                <span className="text-xs text-gray-400 font-black uppercase tracking-widest">Tier 1</span>
                                                Email Verification
                                            </p>
                                            <p className="text-sm text-gray-500 mt-0.5">Required for checkout and core platform actions</p>
                                        </div>
                                        <TierStatusBadge verified={verified} status={verified ? "approved" : "none"} />
                                    </div>
                                    {!verified && (
                                        <div className="mt-4">
                                            <button onClick={handleResendEmail} disabled={resending}
                                                className="px-4 py-2 text-sm font-bold border border-blue-100 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl transition-all disabled:opacity-60 flex items-center gap-2">
                                                {resending ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : null}
                                                Resend Verification Email
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })()}

                {/* Tier 2 — KYC */}
                {(() => {
                    const t = verification?.tier2;
                    const colors = COLOR_MAP.purple;
                    const status = t?.status || "none";
                    return (
                        <div className={`bg-white rounded-2xl border ${status === "approved" ? "border-green-100" : status === "rejected" ? "border-red-100" : "border-gray-100"} p-6`}>
                            <div className="flex items-start gap-4">
                                <div className={`w-12 h-12 rounded-xl ${colors.bg} ${colors.border} border flex items-center justify-center flex-shrink-0`}>
                                    <FileText className={`w-6 h-6 ${colors.icon}`} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between gap-3 flex-wrap">
                                        <div>
                                            <p className="font-bold text-gray-900 flex items-center gap-2">
                                                <span className="text-xs text-gray-400 font-black uppercase tracking-widest">Tier 2</span>
                                                Identity Verification (KYC)
                                            </p>
                                            <p className="text-sm text-gray-500 mt-0.5">Required to apply as a vendor</p>
                                        </div>
                                        <TierStatusBadge status={status} />
                                    </div>

                                    {status === "rejected" && t?.rejection_reason && (
                                        <div className="mt-3 p-3 bg-red-50 border border-red-100 rounded-xl text-sm text-red-700">
                                            <p className="font-bold text-xs uppercase tracking-wider mb-1">Rejection Reason</p>
                                            {t.rejection_reason}
                                        </div>
                                    )}

                                    {(status === "none" || status === "rejected") && (
                                        <div className="mt-4">
                                            <VerificationUploadForm
                                                type="kyc"
                                                status={status}
                                                onSubmit={handleKycSubmit}
                                                locked={false}
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })()}

                {/* Tier 3 — KYB */}
                {(() => {
                    const t = verification?.tier3;
                    const colors = COLOR_MAP.emerald;
                    const status = t?.status || "none";
                    const locked = t?.locked;
                    return (
                        <div className={`bg-white rounded-2xl border ${status === "approved" ? "border-green-100" : locked ? "border-gray-100 opacity-60" : "border-gray-100"} p-6`}>
                            <div className="flex items-start gap-4">
                                <div className={`w-12 h-12 rounded-xl ${colors.bg} ${colors.border} border flex items-center justify-center flex-shrink-0`}>
                                    {locked ? <Lock className="w-6 h-6 text-gray-400" /> : <Building2 className={`w-6 h-6 ${colors.icon}`} />}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between gap-3 flex-wrap">
                                        <div>
                                            <p className="font-bold text-gray-900 flex items-center gap-2">
                                                <span className="text-xs text-gray-400 font-black uppercase tracking-widest">Tier 3</span>
                                                Business Verification (KYB)
                                                {locked && <Lock className="w-3.5 h-3.5 text-gray-400" />}
                                            </p>
                                            <p className="text-sm text-gray-500 mt-0.5">Verified store badge and lifted selling restrictions</p>
                                        </div>
                                        {!locked && <TierStatusBadge status={status} />}
                                    </div>

                                    {status === "rejected" && t?.rejection_reason && (
                                        <div className="mt-3 p-3 bg-red-50 border border-red-100 rounded-xl text-sm text-red-700">
                                            <p className="font-bold text-xs uppercase tracking-wider mb-1">Rejection Reason</p>
                                            {t.rejection_reason}
                                        </div>
                                    )}

                                    <div className="mt-4">
                                        <VerificationUploadForm
                                            type="kyb"
                                            status={status}
                                            onSubmit={handleKybSubmit}
                                            locked={locked}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    );
                })()}
            </div>

            {/* Info box */}
            <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5 text-sm text-blue-800">
                <p className="font-bold mb-1 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" /> How Verification Works
                </p>
                <ul className="space-y-1 text-blue-700 text-xs mt-2 list-disc list-inside">
                    <li>Document uploads go to our secure review team — usually reviewed within 24 hours</li>
                    <li>KYC (identity) unlocks your ability to apply to become a vendor</li>
                    <li>KYB (business) gives your store a verified badge once approved</li>
                    <li>You'll be notified by email for every status change</li>
                </ul>
            </div>
        </div>
    );
}
