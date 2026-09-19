"use client";

import { useState, useEffect } from "react";
import {
    Shield, FileText, Building2, Lock, RefreshCw,
    CheckCircle, AlertCircle, ChevronRight,
} from "lucide-react";
import api from "@/lib/axios";
import { useAuth } from "@/components/providers/AuthContext";
import FileUploader from "@/components/verification/FileUploader";
import VideoUploader from "@/components/verification/VideoUploader";
import { StatusBadge, RejectionAlert, ApprovedBanner, PendingNotice } from "@/components/verification/StatusAtoms";

// ─── Constants ────────────────────────────────────────────────────────────────
const POI_TYPES = [
    { value: "NIN_SLIP",       label: "NIN Slip" },
    { value: "NATIONAL_ID",    label: "National ID Card" },
    { value: "PASSPORT",       label: "International Passport" },
    { value: "DRIVERS_LICENSE",label: "Driver's Licence" },
    { value: "PVC",            label: "Voter's Card (PVC)" },
];
const POA_TYPES = [
    { value: "BANK_STATEMENT",        label: "Recent Bank Statement",              speed: "fast" },
    { value: "UTILITY_BILL",          label: "Recent Utility Bill",                speed: "fast" },
    { value: "TAX_RECEIPT",           label: "Recent Tax Receipt",                 speed: "fast" },
    { value: "TENANCY_AGREEMENT",     label: "Tenancy Agreement",                  speed: "slow" },
    { value: "GOVT_RESIDENCE_LETTER", label: "Government-issued Residence Letter", speed: "slow" },
];
const POI_LABEL = (v) => POI_TYPES.find(t => t.value === v)?.label || v;

// ─── Phase 1 — POI + Liveness ─────────────────────────────────────────────────
function Phase1Form({ onSubmitted }) {
    const [poiType, setPoiType] = useState("");
    const [poiUrl,  setPoiUrl]  = useState(null);
    const [liveUrl, setLiveUrl] = useState(null);
    const [step,    setStep]    = useState(1); // 1 = POI, 2 = liveness
    const [loading, setLoading] = useState(false);
    const [error,   setError]   = useState("");

    const canSubmit = poiType && poiUrl && liveUrl;

    const handleSubmit = async () => {
        setLoading(true); setError("");
        try {
            const res = await api.post("/auth/me/kyc/poi/submit", {
                poi_doc_type: poiType, poi_doc_url: poiUrl, liveness_video_url: liveUrl,
            });
            if (!res.data.success) throw new Error(res.data.message);
            onSubmitted();
        } catch (e) {
            setError(e.response?.data?.message || e.message || "Submission failed");
        } finally { setLoading(false); }
    };

    return (
        <div className="space-y-5">
            {/* Step indicators */}
            <div className="flex items-center gap-2 text-xs font-bold">
                <span className={`flex items-center gap-1 px-3 py-1 rounded-full ${step === 1 ? "bg-purple-100 text-purple-700" : "bg-green-100 text-green-700"}`}>
                    {step > 1 ? <CheckCircle className="w-3 h-3" /> : null} 1 · Identity Document
                </span>
                <ChevronRight className="w-3.5 h-3.5 text-gray-300" />
                <span className={`flex items-center gap-1 px-3 py-1 rounded-full ${step === 2 ? "bg-purple-100 text-purple-700" : "bg-gray-100 text-gray-400"}`}>
                    2 · Liveness Video
                </span>
            </div>

            {/* Step 1 */}
            {step === 1 && (
                <div className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1.5">
                            Document Type <span className="text-red-500">*</span>
                        </label>
                        <select
                            value={poiType}
                            onChange={e => setPoiType(e.target.value)}
                            className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl bg-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-400"
                        >
                            <option value="">Select document type…</option>
                            {POI_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                        </select>
                    </div>
                    <FileUploader
                        folder="kyc/poi"
                        label="Upload Document"
                        hint="Upload a clear photo of your identity document (JPG, PNG · max 5 MB)"
                        onUploaded={setPoiUrl}
                        disabled={!poiType}
                    />
                    <button
                        disabled={!poiType || !poiUrl}
                        onClick={() => setStep(2)}
                        className="w-full py-2.5 bg-purple-600 hover:bg-purple-700 text-white text-sm font-bold rounded-xl transition-all disabled:opacity-40 flex items-center justify-center gap-2"
                    >
                        Next: Liveness Video <ChevronRight className="w-4 h-4" />
                    </button>
                </div>
            )}

            {/* Step 2 */}
            {step === 2 && (
                <div className="space-y-4">
                    {/* Uploaded confirmation — not approved yet */}
                    <div className="flex items-center gap-2 px-4 py-2.5 bg-blue-50 border border-blue-100 rounded-xl text-sm text-blue-700 font-bold">
                        <CheckCircle className="w-4 h-4 flex-shrink-0" />
                        {POI_LABEL(poiType)} uploaded — now record your liveness video
                    </div>
                    <VideoUploader
                        onUploaded={setLiveUrl}
                        docTypeLabel={POI_LABEL(poiType)}
                    />
                    {error && (
                        <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</p>
                    )}
                    <div className="flex gap-2">
                        <button onClick={() => setStep(1)}
                            className="px-4 py-2.5 text-sm font-bold border border-gray-200 text-gray-600 rounded-xl hover:bg-gray-50 transition-all">
                            Back
                        </button>
                        <button
                            disabled={!canSubmit || loading}
                            onClick={handleSubmit}
                            className="flex-1 py-2.5 bg-purple-600 hover:bg-purple-700 text-white text-sm font-bold rounded-xl transition-all disabled:opacity-40 flex items-center justify-center gap-2"
                        >
                            {loading ? <><RefreshCw className="w-4 h-4 animate-spin" /> Submitting…</> : "Submit for Review"}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

// ─── Phase 2 — POA ────────────────────────────────────────────────────────────
function Phase2Form({ poiDocType, onSubmitted }) {
    const [poaType, setPoaType] = useState("");
    const [poaUrl,  setPoaUrl]  = useState(null);
    const [loading, setLoading] = useState(false);
    const [error,   setError]   = useState("");

    const handleSubmit = async () => {
        setLoading(true); setError("");
        try {
            const res = await api.post("/auth/me/kyc/poa/submit", {
                poa_doc_type: poaType, poa_doc_url: poaUrl,
            });
            if (!res.data.success) throw new Error(res.data.message);
            onSubmitted();
        } catch (e) {
            setError(e.response?.data?.message || e.message || "Submission failed");
        } finally { setLoading(false); }
    };

    return (
        <div className="space-y-4">
            <ApprovedBanner label={`POI (${POI_LABEL(poiDocType)})`} />
            <div className="p-3 bg-blue-50 border border-blue-100 rounded-xl text-xs text-blue-700">
                <AlertCircle className="w-3.5 h-3.5 inline mr-1" />
                The name on this document must match your identity document.
            </div>
            <div>
                <label className="block text-xs font-bold text-gray-700 mb-1.5">
                    Document Type <span className="text-red-500">*</span>
                </label>
                <select
                    value={poaType}
                    onChange={e => setPoaType(e.target.value)}
                    className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl bg-gray-50 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-400"
                >
                    <option value="">Select document type…</option>
                    {POA_TYPES.map(t => (
                        <option key={t.value} value={t.value}>
                            {t.label} {t.speed === "fast" ? "🟢" : "🟡"}
                        </option>
                    ))}
                </select>
                <p className="text-[10px] text-gray-400 mt-1">🟢 Fast review  🟡 May take longer</p>
            </div>
            <FileUploader
                folder="kyc/poa"
                label="Upload Address Document"
                hint="Upload a clear image of your address document (JPG, PNG · max 5 MB)"
                onUploaded={setPoaUrl}
                disabled={!poaType}
            />
            {error && (
                <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</p>
            )}
            <button
                disabled={!poaType || !poaUrl || loading}
                onClick={handleSubmit}
                className="w-full py-2.5 bg-purple-600 hover:bg-purple-700 text-white text-sm font-bold rounded-xl transition-all disabled:opacity-40 flex items-center justify-center gap-2"
            >
                {loading ? <><RefreshCw className="w-4 h-4 animate-spin" /> Submitting…</> : "Submit Proof of Address"}
            </button>
        </div>
    );
}

// ─── Liveness-Only Re-submit Form ──────────────────────────────────────────────
// Shown when POI is already approved but liveness was rejected.
// User does NOT re-upload their identity document — only the video.
function LivenessOnlyForm({ poiDocType, onSubmitted }) {
    const [liveUrl, setLiveUrl] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error,   setError]   = useState("");
    const docLabel = POI_TYPES.find(t => t.value === poiDocType)?.label || poiDocType || "your identity document";

    const handleSubmit = async () => {
        setLoading(true); setError("");
        try {
            const res = await api.post("/auth/me/kyc/liveness/resubmit", { liveness_video_url: liveUrl });
            if (!res.data.success) throw new Error(res.data.message);
            onSubmitted();
        } catch (e) {
            setError(e.response?.data?.message || e.message || "Submission failed");
        } finally { setLoading(false); }
    };

    return (
        <div className="space-y-4">
            {/* POI stays approved — make this very clear to the user */}
            <div className="flex items-center gap-2 px-4 py-2.5 bg-green-50 border border-green-100 rounded-xl text-sm text-green-700 font-bold">
                <CheckCircle className="w-4 h-4 flex-shrink-0" />
                {docLabel} — Identity document approved ✓
            </div>
            <div className="px-4 py-3 bg-amber-50 border border-amber-100 rounded-xl text-xs text-amber-800">
                <AlertCircle className="w-3.5 h-3.5 inline mr-1" />
                Only your liveness video was rejected. You do <strong>not</strong> need to re-upload your identity document.
            </div>
            <VideoUploader
                onUploaded={setLiveUrl}
                docTypeLabel={docLabel}
            />
            {error && (
                <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</p>
            )}
            <button
                disabled={!liveUrl || loading}
                onClick={handleSubmit}
                className="w-full py-2.5 bg-purple-600 hover:bg-purple-700 text-white text-sm font-bold rounded-xl transition-all disabled:opacity-40 flex items-center justify-center gap-2"
            >
                {loading ? <><RefreshCw className="w-4 h-4 animate-spin" /> Submitting…</> : "Resubmit Liveness Video"}
            </button>
        </div>
    );
}

// ─── KYB Form ─────────────────────────────────────────────────────────────────
function KybForm({ onSubmitted }) {
    const [cacUrl,  setCacUrl]  = useState(null);
    const [loading, setLoading] = useState(false);
    const [error,   setError]   = useState("");

    const handleSubmit = async () => {
        setLoading(true); setError("");
        try {
            const res = await api.post("/auth/me/kyb/submit", { cac_url: cacUrl });
            if (!res.data.success) throw new Error(res.data.message);
            onSubmitted();
        } catch (e) {
            setError(e.response?.data?.message || e.message || "Submission failed");
        } finally { setLoading(false); }
    };

    return (
        <div className="space-y-4">
            <FileUploader
                folder="kyb/cac"
                label="CAC Certificate / Business Registration Document"
                hint="Upload your CAC certificate or business registration document (JPG, PNG · max 5 MB)"
                onUploaded={setCacUrl}
            />
            {error && (
                <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">{error}</p>
            )}
            <button
                disabled={!cacUrl || loading}
                onClick={handleSubmit}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-bold rounded-xl transition-all disabled:opacity-40 flex items-center justify-center gap-2"
            >
                {loading ? <><RefreshCw className="w-4 h-4 animate-spin" /> Submitting…</> : "Submit Business Documents"}
            </button>
        </div>
    );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function VerificationPage() {
    const { user, loading: authLoading } = useAuth();
    const [verification, setVerification] = useState(null);
    const [loading, setLoading] = useState(true);
    const [resending, setResending] = useState(false);
    const [toast, setToast] = useState("");

    useEffect(() => {
        if (!authLoading && user) fetchStatus();
    }, [user, authLoading]);

    const fetchStatus = async () => {
        setLoading(true);
        try {
            const res = await api.get("/auth/me/verification-status");
            if (res.data.success) setVerification(res.data.verification);
        } catch { /* silent */ }
        finally { setLoading(false); }
    };

    const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(""), 5000); };

    const handleResend = async () => {
        setResending(true);
        try {
            const res = await api.post("/auth/resend-verification", {});
            showToast(res.data.success ? "Verification email sent! Check your inbox." : "Failed to resend.");
        } catch { showToast("Failed to send email."); }
        finally { setResending(false); }
    };

    if (loading) return (
        <div className="flex items-center justify-center py-24">
            <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
        </div>
    );

    const t1 = verification?.tier1;
    const t2 = verification?.tier2;
    const t3 = verification?.tier3;
    const poi = t2?.poi;
    const poa = t2?.poa;
    const live = t2?.liveness;

    const poiStatus  = poi?.status  || "none";
    const poaStatus  = poa?.status  || "none";
    const liveStatus = live?.status || "none";
    const kycLocked  = !t1?.verified;

    // Phase 1 (POI + liveness) is fully complete only when BOTH are approved
    const phase1Done    = poiStatus === "approved" && liveStatus === "approved";
    // Phase 1 is pending if either is still under review and neither is rejected
    const phase1Pending = !phase1Done && (poiStatus === "submitted" || liveStatus === "submitted")
                          && poiStatus !== "rejected" && liveStatus !== "rejected";
    // Phase 1 needs a FULL re-submit when POI itself is none/rejected
    const showFullPhase1Form = !kycLocked && !phase1Done && !phase1Pending
                               && (poiStatus === "none" || poiStatus === "rejected");
    // Phase 1 only needs liveness when POI is already approved but liveness was rejected
    const showLivenessOnlyForm = !kycLocked && poiStatus === "approved" && liveStatus === "rejected";
    // Backward-compat alias used in JSX
    const showPhase1Form = showFullPhase1Form;
    const showPhase1Pending = !kycLocked && phase1Pending;

    // Phase 2 (POA) only unlocks once Phase 1 is fully complete
    const showPhase2Form    = phase1Done && (poaStatus === "none" || poaStatus === "rejected");
    const showPhase2Pending = phase1Done && poaStatus === "submitted";

    const kycStatus    = t2?.status || "none";
    const kycFullyDone = kycStatus === "approved";

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-2xl font-black text-gray-900">Verification Centre</h1>
                <p className="text-sm text-gray-500 mt-1">Complete verifications to unlock platform features and become a vendor</p>
            </div>

            {toast && (
                <div className="bg-green-50 border border-green-100 rounded-xl px-4 py-3 text-sm text-green-700 font-medium flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 flex-shrink-0" /> {toast}
                </div>
            )}

            <div className="space-y-4">
                {/* ── Tier 1 — Email ── */}
                <div className={`bg-white rounded-2xl border ${t1?.verified ? "border-green-100" : "border-gray-100"} p-6`}>
                    <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center flex-shrink-0">
                            <Shield className="w-6 h-6 text-blue-600" />
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
                                <StatusBadge status={t1?.verified ? "approved" : "none"} />
                            </div>
                            {!t1?.verified && (
                                <div className="mt-4">
                                    <button onClick={handleResend} disabled={resending}
                                        className="px-4 py-2 text-sm font-bold border border-blue-100 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl transition-all disabled:opacity-60 flex items-center gap-2">
                                        {resending && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                                        Resend Verification Email
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* ── Tier 2 — KYC ── */}
                <div className={`bg-white rounded-2xl border ${kycFullyDone ? "border-green-100" : (t2?.status === "rejected") ? "border-red-100" : "border-gray-100"} p-6`}>
                    <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center flex-shrink-0">
                            {kycLocked ? <Lock className="w-6 h-6 text-gray-400" /> : <FileText className="w-6 h-6 text-purple-600" />}
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-3 flex-wrap mb-4">
                                <div>
                                    <p className="font-bold text-gray-900 flex items-center gap-2">
                                        <span className="text-xs text-gray-400 font-black uppercase tracking-widest">Tier 2</span>
                                        Identity Verification (KYC)
                                    </p>
                                    <p className="text-sm text-gray-500 mt-0.5">Required to apply as a vendor</p>
                                </div>
                                <StatusBadge status={kycFullyDone ? "approved" : (t2?.status || "none")} />
                            </div>

                            {kycLocked && (
                                <p className="text-sm text-gray-400 flex items-center gap-1.5">
                                    <Lock className="w-4 h-4" /> Verify your email first to unlock
                                </p>
                            )}

                            {!kycLocked && !kycFullyDone && (
                                <div className="space-y-4">
                                    {/* Phase 1 block */}
                                    <div className="border border-gray-100 rounded-xl p-4 space-y-3">
                                        <div className="flex items-center justify-between">
                                            <p className="text-xs font-black uppercase tracking-widest text-gray-500">
                                                Phase 1 — Proof of Identity + Liveness
                                            </p>
                                            {/* Show individual sub-statuses so user knows exactly which part is pending */}
                                            <div className="flex items-center gap-1.5">
                                                <StatusBadge status={poiStatus} />
                                                <StatusBadge status={liveStatus} />
                                            </div>
                                        </div>
                                        <RejectionAlert reason={poi?.rejection_reason} />
                                        {liveStatus === "rejected" && (
                                            <RejectionAlert reason={live?.rejection_reason} />
                                        )}
                                        {showPhase1Form && (
                                            <Phase1Form onSubmitted={() => { showToast("Phase 1 submitted!"); fetchStatus(); }} />
                                        )}
                                        {showLivenessOnlyForm && (
                                            <LivenessOnlyForm
                                                poiDocType={poi?.doc_type}
                                                onSubmitted={() => { showToast("Liveness video resubmitted!"); fetchStatus(); }}
                                            />
                                        )}
                                        {showPhase1Pending && (
                                            <PendingNotice message="Your POI & liveness video are under review. We'll notify you once both are approved." />
                                        )}
                                    </div>

                                    {/* Phase 2 block — locked until phase1Done */}
                                    <div className={`border rounded-xl p-4 space-y-3 ${phase1Done ? "border-gray-100" : "border-gray-100 opacity-50"}`}>
                                        <div className="flex items-center justify-between">
                                            <p className="text-xs font-black uppercase tracking-widest text-gray-500 flex items-center gap-1.5">
                                                {!phase1Done && <Lock className="w-3.5 h-3.5" />}
                                                Phase 2 — Proof of Address
                                            </p>
                                            <StatusBadge status={poaStatus} />
                                        </div>
                                        {!phase1Done && (
                                            <p className="text-xs text-gray-400 flex items-center gap-1.5">
                                                <Lock className="w-3.5 h-3.5" /> Unlocks after both POI and liveness are approved
                                            </p>
                                        )}
                                        <RejectionAlert reason={poa?.rejection_reason} />
                                        {showPhase2Form && (
                                            <Phase2Form
                                                poiDocType={poi?.doc_type}
                                                onSubmitted={() => { showToast("Proof of Address submitted!"); fetchStatus(); }}
                                            />
                                        )}
                                        {showPhase2Pending && (
                                            <PendingNotice message="Your Proof of Address is under review." />
                                        )}
                                    </div>
                                </div>
                            )}

                            {kycFullyDone && (
                                <div className="mt-2">
                                    <ApprovedBanner label="Full KYC" />
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* ── Tier 3 — KYB ── */}
                <div className={`bg-white rounded-2xl border ${t3?.status === "approved" ? "border-green-100" : t3?.locked ? "border-gray-100 opacity-60" : "border-gray-100"} p-6`}>
                    <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center flex-shrink-0">
                            {t3?.locked ? <Lock className="w-6 h-6 text-gray-400" /> : <Building2 className="w-6 h-6 text-emerald-600" />}
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-3 flex-wrap mb-4">
                                <div>
                                    <p className="font-bold text-gray-900 flex items-center gap-2">
                                        <span className="text-xs text-gray-400 font-black uppercase tracking-widest">Tier 3</span>
                                        Business Verification (KYB)
                                        {t3?.locked && <Lock className="w-3.5 h-3.5 text-gray-400" />}
                                    </p>
                                    <p className="text-sm text-gray-500 mt-0.5">Verified store badge and lifted selling restrictions</p>
                                </div>
                                {!t3?.locked && <StatusBadge status={t3?.status || "none"} />}
                            </div>

                            {t3?.locked && (
                                <p className="text-sm text-gray-400 flex items-center gap-1.5">
                                    <Lock className="w-4 h-4" /> Complete KYC first to unlock
                                </p>
                            )}

                            {!t3?.locked && t3?.status === "submitted" && (
                                <PendingNotice message="Your business documents are under review. Usually verified within 24 hours." />
                            )}

                            {!t3?.locked && t3?.status === "approved" && (
                                <ApprovedBanner label="Business Verification (KYB)" />
                            )}

                            {!t3?.locked && (t3?.status === "none" || t3?.status === "rejected") && (
                                <>
                                    <RejectionAlert reason={t3?.rejection_reason} />
                                    <div className="mt-3">
                                        <KybForm onSubmitted={() => { showToast("Business documents submitted!"); fetchStatus(); }} />
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Info box */}
            <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5 text-sm text-blue-800">
                <p className="font-bold mb-1 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4" /> How Verification Works
                </p>
                <ul className="space-y-1 text-blue-700 text-xs mt-2 list-disc list-inside">
                    <li>Phase 1: Upload your identity document + a 5–10s liveness video holding it</li>
                    <li>Phase 2 unlocks once your POI is approved — upload a proof of address</li>
                    <li>POA name must match your identity document</li>
                    <li>KYB (business) gives your store a verified badge once approved</li>
                    <li>You'll be notified by email for every status change</li>
                </ul>
            </div>
        </div>
    );
}
