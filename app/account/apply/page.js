"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle, ChevronRight, Loader2, ArrowLeft, AlertCircle, Lock, Store, TrendingUp, Package, ExternalLink } from "lucide-react";
import api from "@/lib/axios";
import { useAuth } from "@/components/providers/AuthContext";

const STEPS = [
    { key: "eligibility", label: "Eligibility" },
    { key: "form",        label: "Application" },
    { key: "training",    label: "Training" },
    { key: "products",    label: "Test Products" },
    { key: "setup",       label: "Store Setup" },
];

const STATUS_TO_STEP = {
    draft:               "form",
    application_review:  "done_form",
    training:            "training",
    product_test:        "products",
    setup:               "setup",
    approved:            "approved",
    rejected:            "rejected",
};

// ── Training content (static) ─────────────────────────────────────────────────
const TRAINING_SLIDES = [
    { title: "Welcome, Future Vendor!", body: "This short training will walk you through everything you need to know to run a successful store on our platform. Complete all modules and pass the assessment to proceed." },
    { title: "Using the Dashboard", body: "Your vendor dashboard lets you manage products, view orders, track earnings, and update your store profile. Keep your products up-to-date and respond to orders promptly." },
    { title: "Fulfilling Orders", body: "When an order comes in, you have 24 hours to confirm and begin fulfilment. Always ship within the stated delivery window. Late or cancelled orders affect your vendor rating." },
    { title: "Quality Standards", body: "Products must match their listing photos and descriptions exactly. Do not list counterfeit, prohibited, or misleading items. Products failing quality checks will be delisted." },
    { title: "Do's and Don'ts", body: "✅ DO: Respond to buyer queries, maintain accurate stock, ship orders on time.\n❌ DON'T: Sell outside the platform, provide false product info, or engage in fraudulent activity." },
    { title: "Assessment", body: "You've completed the training modules. Now answer the following questions. You must score 100% to proceed — you can retry as many times as needed.", isQuiz: true },
];

const QUIZ_QUESTIONS = [
    { q: "How long do you have to confirm and begin fulfilment after an order?", options: ["72 hours", "24 hours", "48 hours", "1 week"], correct: 1 },
    { q: "What happens if your products fail quality checks?", options: ["Nothing", "Account suspension", "Products will be delisted", "A warning email"], correct: 2 },
    { q: "Which of these is NOT allowed?", options: ["Responding to buyer queries", "Selling outside the platform", "Maintaining accurate stock", "Shipping orders on time"], correct: 1 },
    { q: "What score do you need to pass the vendor assessment?", options: ["70%", "80%", "90%", "100%"], correct: 3 },
];

// ── Vendor Store Summary ────────────────────────────────────────────────────
function VendorStoreSummary({ user }) {
    return (
        <div className="space-y-4">
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-100 rounded-2xl p-6 flex items-center gap-4">
                <div className="w-14 h-14 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Store className="w-7 h-7 text-green-600" />
                </div>
                <div>
                    <p className="text-xs font-black uppercase tracking-widest text-green-600 mb-0.5">Active Vendor</p>
                    <h2 className="text-xl font-black text-gray-900">{user?.business_name || "Your Store"}</h2>
                    <p className="text-sm text-gray-500 mt-0.5">Your store is live on the platform</p>
                </div>
                <CheckCircle className="w-8 h-8 text-green-500 ml-auto flex-shrink-0" />
            </div>
            <div className="grid grid-cols-2 gap-4">
                <a href="/vendor/dashboard" className="bg-white border border-gray-100 rounded-xl p-5 hover:border-blue-200 hover:bg-blue-50/30 transition-all group">
                    <TrendingUp className="w-6 h-6 text-blue-600 mb-3" />
                    <p className="font-black text-sm text-gray-900">Vendor Dashboard</p>
                    <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1 group-hover:text-blue-600">
                        Manage your store <ExternalLink className="w-3 h-3" />
                    </p>
                </a>
                <a href="/vendor/products" className="bg-white border border-gray-100 rounded-xl p-5 hover:border-purple-200 hover:bg-purple-50/30 transition-all group">
                    <Package className="w-6 h-6 text-purple-600 mb-3" />
                    <p className="font-black text-sm text-gray-900">My Products</p>
                    <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1 group-hover:text-purple-600">
                        View & manage listings <ExternalLink className="w-3 h-3" />
                    </p>
                </a>
            </div>
        </div>
    );
}

export default function ApplyPage() {
    const router = useRouter();
    const { user, loading: authLoading } = useAuth();
    const [application, setApplication] = useState(null);
    const [isVendor, setIsVendor] = useState(false);
    const [loading, setLoading] = useState(true);
    const [step, setStep] = useState("eligibility");
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");

    // Form state
    const [form, setForm] = useState({ store_name: "", store_description: "", primary_category: "" });
    // Training state
    const [slide, setSlide] = useState(0);
    const [answers, setAnswers] = useState({});
    const [quizResult, setQuizResult] = useState(null);
    // Products state
    const [products, setProducts] = useState([{ title: "", price: "", description: "", images: "" }]);
    // Setup state
    const [setup, setSetup] = useState({ account_name: "", account_number: "", bank_name: "", phone: "" });

    const fetchApplication = useCallback(async () => {
        try {
            const res = await api.get('/vendor/application');
            setIsVendor(!!res.data.is_vendor);
            if (res.data.application) {
                setApplication(res.data.application);
                const mapped = STATUS_TO_STEP[res.data.application.status];
                if (mapped && mapped !== "done_form") setStep(mapped);
                else if (mapped === "done_form") setStep("training_wait");
            } else {
                setStep("eligibility");
            }
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    }, []);

    useEffect(() => {
        if (authLoading || !user) return;
        fetchApplication();
    }, [fetchApplication, user, authLoading]);

    const apiPost = async (endpoint, body = {}) => {
        const method = endpoint === "/form" ? "put" : "post";
        const res = await api[method](`/vendor/application${endpoint}`, body);
        if (!res.data.success) throw new Error(res.data.message || "Request failed");
        return res.data;
    };

    const handleStart = async () => {
        setSubmitting(true); setError("");
        try { await apiPost("/start"); await fetchApplication(); setStep("form"); }
        catch (e) { setError(e.message); }
        finally { setSubmitting(false); }
    };

    const handleFormSubmit = async () => {
        if (!form.store_name || !form.primary_category) return setError("Store name and category are required");
        setSubmitting(true); setError("");
        try { await apiPost("/form", form); await fetchApplication(); setStep("training_wait"); }
        catch (e) { setError(e.message); }
        finally { setSubmitting(false); }
    };

    const handleTrainingStart = async () => {
        try { await apiPost("/training/start"); setStep("training"); setSlide(0); } catch {}
    };

    const handleQuizSubmit = async () => {
        const score = QUIZ_QUESTIONS.reduce((acc, q, i) => acc + (answers[i] === q.correct ? 1 : 0), 0);
        const pct = Math.round((score / QUIZ_QUESTIONS.length) * 100);
        setSubmitting(true);
        try {
            const data = await apiPost("/training/submit", { score: pct });
            setQuizResult({ passed: data.passed, score: pct, attempts: data.attempts });
            if (data.passed) { await fetchApplication(); setStep("products"); }
        } catch (e) { setError(e.message); }
        finally { setSubmitting(false); }
    };

    const handleProductsSubmit = async () => {
        const mapped = products.map(p => ({
            title: p.title, price: parseFloat(p.price) || 0, description: p.description,
            images: p.images ? [{ url: p.images, alt: p.title }] : [],
        }));
        if (mapped.some(p => !p.title || !p.price)) return setError("Each product needs a title and price");
        setSubmitting(true); setError("");
        try { await apiPost("/test-products", { products: mapped }); await fetchApplication(); setStep("products_wait"); }
        catch (e) { setError(e.message); }
        finally { setSubmitting(false); }
    };

    const handleSetupSubmit = async () => {
        if (!setup.account_name || !setup.account_number || !setup.bank_name) return setError("All bank fields are required");
        setSubmitting(true); setError("");
        try {
            await apiPost("/setup", {
                bank_details: { account_name: setup.account_name, account_number: setup.account_number, bank_name: setup.bank_name },
                contact_info: { phone: setup.phone },
            });
            await fetchApplication(); setStep("setup_done");
        } catch (e) { setError(e.message); }
        finally { setSubmitting(false); }
    };

    // ─── Step indicator ──────────────────────────────────────────────────────
    const StepBar = () => {
        const activeIdx = STEPS.findIndex(s => step.startsWith(s.key));
        return (
            <div className="flex items-center gap-0 mb-8">
                {STEPS.map((s, i) => (
                    <div key={s.key} className="flex items-center flex-1">
                        <div className={`flex flex-col items-center flex-shrink-0`}>
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black border-2 transition-all ${i < activeIdx ? "bg-green-500 border-green-500 text-white" : i === activeIdx ? "bg-blue-600 border-blue-600 text-white" : "bg-white border-gray-200 text-gray-400"}`}>
                                {i < activeIdx ? <CheckCircle className="w-4 h-4" /> : i + 1}
                            </div>
                            <p className="text-[9px] font-black uppercase tracking-wider mt-1 text-center max-w-[52px] leading-tight text-gray-500">{s.label}</p>
                        </div>
                        {i < STEPS.length - 1 && <div className={`h-0.5 flex-1 mx-1 mt-[-14px] ${i < activeIdx ? "bg-green-400" : "bg-gray-100"}`} />}
                    </div>
                ))}
            </div>
        );
    };

    if (loading) return <div className="flex justify-center py-24"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>;

    // ── Vendor already: show store summary instead of wizard ──────────────────
    if (isVendor) return (
        <div className="space-y-4 max-w-2xl">
            <div>
                <h1 className="text-2xl font-black text-gray-900">My Store</h1>
                <p className="text-sm text-gray-500 mt-1">You're an active vendor on the platform</p>
            </div>
            <VendorStoreSummary user={user} />
        </div>
    );

    const cardClass = "bg-white rounded-2xl border border-gray-100 p-7";

    // ─── Approved ────────────────────────────────────────────────────────────
    if (step === "approved" || application?.status === "approved") return (
        <div className={`${cardClass} text-center`}>
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-black text-gray-900 mb-2">You're a Vendor! 🎉</h2>
            <p className="text-gray-500 mb-6">Your store is live. Start adding products and building your collection.</p>
            <button onClick={() => router.push("/account")} className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-all">
                Go to Dashboard
            </button>
        </div>
    );

    // ─── Rejected ────────────────────────────────────────────────────────────
    if (step === "rejected" || application?.status === "rejected") return (
        <div className={`${cardClass} text-center`}>
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-black text-gray-900 mb-2">Application Rejected</h2>
            {application?.rejection_reason && <p className="text-gray-500 mb-2">{application.rejection_reason}</p>}
            <p className="text-sm text-gray-400">Please contact support if you have questions.</p>
        </div>
    );

    return (
        <div className="space-y-6 max-w-2xl">
            <div>
                <h1 className="text-2xl font-black text-gray-900">Become a Vendor</h1>
                <p className="text-sm text-gray-500 mt-1">Complete the steps below to open your store on the platform</p>
            </div>

            <StepBar />

            {error && <div className="bg-red-50 border border-red-100 rounded-xl px-4 py-3 text-sm text-red-700 flex items-center gap-2"><AlertCircle className="w-4 h-4 flex-shrink-0" />{error}</div>}

            {/* ── Step 1: Eligibility ─────────────────────────────────────── */}
            {step === "eligibility" && (() => {
                const emailOk = !!user?.email_verified;
                const kycOk   = user?.kyc_status === 'approved';
                const noApp   = !application;
                const canStart = emailOk && kycOk && noApp;
                const checks = [
                    { label: "Email verified",             ok: emailOk, fix: "/account/verification",  fixLabel: "Verify now" },
                    { label: "Identity (KYC) approved",    ok: kycOk,   fix: "/account/verification",  fixLabel: "Submit KYC" },
                    { label: "No existing application",    ok: noApp,   fix: null,                     fixLabel: null },
                ];
                return (
                    <div className={cardClass}>
                        <h2 className="text-lg font-black text-gray-900 mb-1">Eligibility Check</h2>
                        <p className="text-sm text-gray-500 mb-6">Before you begin, confirm you meet the requirements:</p>
                        <ul className="space-y-3 mb-6">
                            {checks.map(c => (
                                <li key={c.label} className="flex items-center justify-between gap-3">
                                    <span className="flex items-center gap-3 text-sm">
                                        {c.ok
                                            ? <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                                            : <AlertCircle className="w-4 h-4 text-amber-400 flex-shrink-0" />}
                                        <span className={c.ok ? "text-gray-700" : "text-amber-700 font-medium"}>{c.label}</span>
                                    </span>
                                    {!c.ok && c.fix && (
                                        <a href={c.fix} className="text-[10px] font-black uppercase tracking-widest text-blue-600 hover:underline flex-shrink-0">{c.fixLabel} →</a>
                                    )}
                                </li>
                            ))}
                        </ul>
                        <button onClick={handleStart} disabled={submitting || !canStart}
                            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                            {canStart ? "Start Application" : "Complete Requirements First"}
                        </button>
                    </div>
                );
            })()}

            {/* ── Step 2: Form ─────────────────────────────────────────────── */}
            {step === "form" && (
                <div className={cardClass}>
                    <h2 className="text-lg font-black text-gray-900 mb-1">Application Details</h2>
                    <p className="text-sm text-gray-500 mb-6">Tell us about your store</p>
                    <div className="space-y-4">
                        {[
                            { label: "Store Name *", key: "store_name", placeholder: "e.g. Adaeze's Boutique" },
                            { label: "Primary Category *", key: "primary_category", placeholder: "e.g. Fashion, Electronics, Food..." },
                        ].map(f => (
                            <div key={f.key}>
                                <label className="block text-xs font-bold text-gray-600 mb-1.5">{f.label}</label>
                                <input value={form[f.key]} onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                                    placeholder={f.placeholder}
                                    className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-blue-400 bg-gray-50" />
                            </div>
                        ))}
                        <div>
                            <label className="block text-xs font-bold text-gray-600 mb-1.5">Store Description</label>
                            <textarea value={form.store_description} onChange={e => setForm(p => ({ ...p, store_description: e.target.value }))}
                                rows={3} placeholder="What will you sell? What makes your store unique?"
                                className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-blue-400 bg-gray-50 resize-none" />
                        </div>
                        <button onClick={handleFormSubmit} disabled={submitting}
                            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-xl transition-all disabled:opacity-60 flex items-center justify-center gap-2">
                            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                            Submit Application <ChevronRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            )}

            {/* ── Waiting for admin to advance to training ─────────────────── */}
            {step === "training_wait" && (
                <div className={`${cardClass} text-center`}>
                    <div className="w-14 h-14 bg-amber-50 border border-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Loader2 className="w-7 h-7 text-amber-600 animate-spin" />
                    </div>
                    <h2 className="text-lg font-black text-gray-900 mb-2">Application Under Review</h2>
                    <p className="text-sm text-gray-500">Our team is reviewing your application. You'll be notified when it's time to proceed to training — usually within 24 hours.</p>
                </div>
            )}

            {/* ── Step 3: Training ─────────────────────────────────────────── */}
            {step === "training" && (
                <div className={cardClass}>
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-lg font-black text-gray-900">Vendor Training</h2>
                        <span className="text-xs text-gray-400 font-bold">{slide + 1} / {TRAINING_SLIDES.length}</span>
                    </div>

                    {/* Progress bar */}
                    <div className="w-full h-1.5 bg-gray-100 rounded-full mb-6">
                        <div className="h-1.5 bg-blue-500 rounded-full transition-all" style={{ width: `${((slide + 1) / TRAINING_SLIDES.length) * 100}%` }} />
                    </div>

                    {!TRAINING_SLIDES[slide].isQuiz ? (
                        <div>
                            <h3 className="text-base font-black text-gray-900 mb-3">{TRAINING_SLIDES[slide].title}</h3>
                            <p className="text-sm text-gray-600 whitespace-pre-line leading-relaxed">{TRAINING_SLIDES[slide].body}</p>
                            <div className="flex gap-3 mt-8">
                                {slide > 0 && <button onClick={() => setSlide(s => s - 1)} className="px-4 py-2.5 border border-gray-100 rounded-xl text-sm font-bold text-gray-500 hover:bg-gray-50"><ArrowLeft className="w-4 h-4" /></button>}
                                <button onClick={() => setSlide(s => s + 1)} className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-xl transition-all text-sm flex items-center justify-center gap-2">
                                    Next <ChevronRight className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div>
                            <h3 className="text-base font-black text-gray-900 mb-5">Assessment</h3>
                            {quizResult && !quizResult.passed && (
                                <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-xl text-sm text-red-700">
                                    Score: {quizResult.score}% — You need 100% to pass. Review the slides and try again.
                                </div>
                            )}
                            <div className="space-y-6">
                                {QUIZ_QUESTIONS.map((q, i) => (
                                    <div key={i}>
                                        <p className="text-sm font-bold text-gray-900 mb-2">{i + 1}. {q.q}</p>
                                        <div className="space-y-2">
                                            {q.options.map((opt, j) => (
                                                <label key={j} className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all text-sm ${answers[i] === j ? "border-blue-400 bg-blue-50 text-blue-700 font-bold" : "border-gray-100 hover:border-gray-200"}`}>
                                                    <input type="radio" name={`q${i}`} checked={answers[i] === j}
                                                        onChange={() => setAnswers(a => ({ ...a, [i]: j }))} className="accent-blue-600" />
                                                    {opt}
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <button onClick={handleQuizSubmit} disabled={submitting || Object.keys(answers).length < QUIZ_QUESTIONS.length}
                                className="w-full mt-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-xl transition-all disabled:opacity-60 flex items-center justify-center gap-2">
                                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null} Submit Assessment
                            </button>
                        </div>
                    )}
                </div>
            )}

            {/* ── Step 4: Products ─────────────────────────────────────────── */}
            {step === "products" && (
                <div className={cardClass}>
                    <h2 className="text-lg font-black text-gray-900 mb-1">Upload Test Products</h2>
                    <p className="text-sm text-gray-500 mb-6">Submit 1–5 products for admin review. These will be deleted after the review.</p>
                    <div className="space-y-4">
                        {products.map((p, i) => (
                            <div key={i} className="p-4 bg-gray-50 rounded-xl border border-gray-100 space-y-3">
                                <p className="text-xs font-black uppercase tracking-widest text-gray-400">Product {i + 1}</p>
                                {[["Title *", "title", "Product name"], ["Price *", "price", "0.00"], ["Description", "description", "Brief description..."], ["Image URL", "images", "https://..."]].map(([lbl, key, ph]) => (
                                    <div key={key}>
                                        <label className="block text-xs font-bold text-gray-600 mb-1">{lbl}</label>
                                        <input value={p[key]} onChange={e => {
                                            const up = [...products]; up[i] = { ...up[i], [key]: e.target.value }; setProducts(up);
                                        }} placeholder={ph} type={key === "price" ? "number" : "text"}
                                            className="w-full px-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:border-blue-400 bg-white" />
                                    </div>
                                ))}
                                {products.length > 1 && <button onClick={() => setProducts(ps => ps.filter((_, pi) => pi !== i))} className="text-xs text-red-500 hover:underline">Remove</button>}
                            </div>
                        ))}
                        {products.length < 5 && (
                            <button onClick={() => setProducts(ps => [...ps, { title: "", price: "", description: "", images: "" }])}
                                className="w-full py-2.5 border border-dashed border-gray-200 rounded-xl text-sm text-gray-400 hover:border-blue-300 hover:text-blue-600 transition-all">
                                + Add Another Product
                            </button>
                        )}
                        <button onClick={handleProductsSubmit} disabled={submitting}
                            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-xl transition-all disabled:opacity-60 flex items-center justify-center gap-2">
                            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : null} Submit for Review
                        </button>
                    </div>
                </div>
            )}

            {/* ── Waiting for product review ────────────────────────────────── */}
            {step === "products_wait" && (
                <div className={`${cardClass} text-center`}>
                    <Loader2 className="w-10 h-10 text-blue-600 animate-spin mx-auto mb-4" />
                    <h2 className="text-lg font-black text-gray-900 mb-2">Products Under Review</h2>
                    <p className="text-sm text-gray-500">Our team is reviewing your test products. You'll be notified when it's time for the next step.</p>
                </div>
            )}

            {/* ── Step 5: Setup ─────────────────────────────────────────────── */}
            {step === "setup" && (
                <div className={cardClass}>
                    <h2 className="text-lg font-black text-gray-900 mb-1">Store Setup</h2>
                    <p className="text-sm text-gray-500 mb-6">Final step — provide your payout and contact details</p>
                    <div className="space-y-4">
                        <p className="text-xs font-black uppercase tracking-widest text-gray-400">Bank Details</p>
                        {[["Account Name *", "account_name", "Full name on account"], ["Account Number *", "account_number", "10-digit number"], ["Bank Name *", "bank_name", "e.g. Access Bank"]].map(([lbl, key, ph]) => (
                            <div key={key}>
                                <label className="block text-xs font-bold text-gray-600 mb-1.5">{lbl}</label>
                                <input value={setup[key]} onChange={e => setSetup(s => ({ ...s, [key]: e.target.value }))}
                                    placeholder={ph} className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-blue-400 bg-gray-50" />
                            </div>
                        ))}
                        <div>
                            <label className="block text-xs font-bold text-gray-600 mb-1.5">Phone Number</label>
                            <input value={setup.phone} onChange={e => setSetup(s => ({ ...s, phone: e.target.value }))}
                                placeholder="+234..." className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-blue-400 bg-gray-50" />
                        </div>
                        <button onClick={handleSetupSubmit} disabled={submitting}
                            className="w-full py-3 bg-green-600 hover:bg-green-700 text-white font-black rounded-xl transition-all disabled:opacity-60 flex items-center justify-center gap-2">
                            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                            Complete Setup
                        </button>
                    </div>
                </div>
            )}

            {/* ── Setup submitted ───────────────────────────────────────────── */}
            {step === "setup_done" && (
                <div className={`${cardClass} text-center`}>
                    <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
                    <h2 className="text-lg font-black text-gray-900 mb-2">All Done!</h2>
                    <p className="text-sm text-gray-500">Your application is complete. Our team will do a final review and activate your store shortly.</p>
                </div>
            )}
        </div>
    );
}
