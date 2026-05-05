"use client";

import { useState, useEffect, Suspense } from "react";
import { useCart } from "@/components/providers/CartContext";
import { useTenant } from "@/components/providers/TenantContext";
import { useAuth } from "@/components/providers/AuthContext";
import api from "@/lib/axios";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
    ArrowLeft, Lock, ChevronRight, Package,
    MapPin, User, Mail, Phone, Loader2, ShieldCheck
} from "lucide-react";

const FLAT_SHIPPING_NGN = 1500;

const inputClass = "w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition bg-white placeholder:text-gray-400";
const labelClass = "block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5";

function CheckoutContent() {
    const { cart, items: allItems, vendorGroups } = useCart();
    const tenant = useTenant();
    const { user, token } = useAuth();
    const router = useRouter();
    const searchParams = useSearchParams();
    const vendorId = searchParams.get("vendor_id");

    const vendorGroup = vendorId ? vendorGroups?.find(g => g.vendorId === vendorId) : null;
    const items = vendorGroup ? vendorGroup.items : allItems;

    const [step, setStep] = useState(1); // 1 = details, 2 = review & pay
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const [formData, setFormData] = useState({
        email: "", firstName: "", lastName: "",
        phone: "", address: "", city: "", state: "", country: "Nigeria",
    });

    useEffect(() => {
        if (user) {
            setFormData(prev => ({
                ...prev,
                email: user.email || "",
                firstName: user.first_name || "",
                lastName: user.last_name || "",
            }));
        }
    }, [user]);

    const subtotal = items.reduce((sum, item) => sum + (parseFloat(item.price) * item.quantity), 0);
    const shipping = FLAT_SHIPPING_NGN;
    const total = subtotal + shipping;

    const set = (field) => (e) => setFormData(prev => ({ ...prev, [field]: e.target.value }));

    const handleProceed = (e) => {
        e.preventDefault();
        if (!formData.email || !formData.firstName || !formData.address || !formData.city) {
            setError("Please fill in all required fields.");
            return;
        }
        setError("");
        setStep(2);
    };

    const handlePay = async () => {
        if (!cart?.id || !tenant?.id) return;
        setLoading(true);
        setError("");

        try {
            const res = await api.post("/payments/paystack/initialize", {
                cartId: cart.id,
                email: formData.email,
                vendorId: vendorId || null,
                shippingAddress: {
                    firstName: formData.firstName,
                    lastName: formData.lastName,
                    phone: formData.phone,
                    address: formData.address,
                    city: formData.city,
                    state: formData.state,
                    country: formData.country,
                },
            }, {
                headers: {
                    "X-Tenant-ID": tenant.id,
                    ...(token ? { Authorization: `Bearer ${token}` } : {}),
                },
            });

            if (res.data.authorization_url) {
                window.location.href = res.data.authorization_url;
            }
        } catch (err) {
            setError(err.response?.data?.message || "Payment initialization failed. Please try again.");
            setLoading(false);
        }
    };

    if (!items || items.length === 0) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
                <div className="text-center space-y-4">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto">
                        <Package className="w-8 h-8 text-gray-400" />
                    </div>
                    <p className="font-bold text-gray-900">Your cart is empty</p>
                    <Link href="/" className="text-sm text-blue-600 hover:underline">Continue Shopping</Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50/70">
            {/* Top bar */}
            <div className="bg-white border-b border-gray-100 sticky top-0 z-10">
                <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
                    <Link href="/cart" className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition">
                        <ArrowLeft className="w-4 h-4" /> Cart
                    </Link>
                    <div className="flex items-center gap-1.5 text-xs font-medium text-gray-400">
                        <Lock className="w-3.5 h-3.5" /> Secure Checkout
                    </div>
                </div>
            </div>

            <div className="max-w-5xl mx-auto px-4 py-8">
                {/* Step indicators */}
                <div className="flex items-center gap-3 mb-8 justify-center">
                    <div className={`flex items-center gap-2 text-sm font-semibold ${step >= 1 ? "text-blue-600" : "text-gray-400"}`}>
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${step >= 1 ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-500"}`}>1</div>
                        Details
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-300" />
                    <div className={`flex items-center gap-2 text-sm font-semibold ${step >= 2 ? "text-blue-600" : "text-gray-400"}`}>
                        <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${step >= 2 ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-500"}`}>2</div>
                        Review & Pay
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                    {/* Left — Form or Review */}
                    <div className="lg:col-span-3 space-y-4">

                        {/* STEP 1 — Contact & Delivery */}
                        {step === 1 && (
                            <form onSubmit={handleProceed} className="space-y-4">
                                {/* Contact */}
                                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
                                    <h2 className="font-bold text-gray-900 flex items-center gap-2">
                                        <User className="w-4 h-4 text-gray-400" /> Contact Information
                                    </h2>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className={labelClass}>First Name *</label>
                                            <input type="text" className={inputClass} value={formData.firstName} onChange={set("firstName")} placeholder="Jane" required />
                                        </div>
                                        <div>
                                            <label className={labelClass}>Last Name *</label>
                                            <input type="text" className={inputClass} value={formData.lastName} onChange={set("lastName")} placeholder="Doe" required />
                                        </div>
                                    </div>
                                    <div>
                                        <label className={labelClass}>Email Address *</label>
                                        <input type="email" className={inputClass} value={formData.email} onChange={set("email")} placeholder="jane@example.com" required disabled={!!user} />
                                        {user && <p className="text-xs text-gray-400 mt-1">Using your account email</p>}
                                    </div>
                                    <div>
                                        <label className={labelClass}>Phone Number</label>
                                        <input type="tel" className={inputClass} value={formData.phone} onChange={set("phone")} placeholder="+234 800 000 0000" />
                                    </div>
                                </div>

                                {/* Delivery */}
                                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
                                    <h2 className="font-bold text-gray-900 flex items-center gap-2">
                                        <MapPin className="w-4 h-4 text-gray-400" /> Delivery Address
                                    </h2>
                                    <div>
                                        <label className={labelClass}>Street Address *</label>
                                        <input type="text" className={inputClass} value={formData.address} onChange={set("address")} placeholder="123 Main Street" required />
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className={labelClass}>City *</label>
                                            <input type="text" className={inputClass} value={formData.city} onChange={set("city")} placeholder="Lagos" required />
                                        </div>
                                        <div>
                                            <label className={labelClass}>State</label>
                                            <input type="text" className={inputClass} value={formData.state} onChange={set("state")} placeholder="Lagos State" />
                                        </div>
                                    </div>
                                    <div>
                                        <label className={labelClass}>Country</label>
                                        <select className={inputClass} value={formData.country} onChange={set("country")}>
                                            <option value="Nigeria">Nigeria</option>
                                            <option value="Ghana">Ghana</option>
                                            <option value="Kenya">Kenya</option>
                                            <option value="South Africa">South Africa</option>
                                        </select>
                                    </div>
                                </div>

                                {error && <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-3">{error}</p>}

                                <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-2xl text-sm transition flex items-center justify-center gap-2 shadow-lg shadow-blue-200">
                                    Continue to Review <ChevronRight className="w-4 h-4" />
                                </button>
                            </form>
                        )}

                        {/* STEP 2 — Review */}
                        {step === 2 && (
                            <div className="space-y-4">
                                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
                                    <div className="flex items-center justify-between">
                                        <h2 className="font-bold text-gray-900">Delivery Details</h2>
                                        <button onClick={() => setStep(1)} className="text-xs text-blue-600 font-semibold hover:underline">Edit</button>
                                    </div>
                                    <div className="text-sm text-gray-600 space-y-1">
                                        <p className="font-medium text-gray-900">{formData.firstName} {formData.lastName}</p>
                                        <p>{formData.email}</p>
                                        {formData.phone && <p>{formData.phone}</p>}
                                        <p className="mt-1">{formData.address}, {formData.city}{formData.state ? `, ${formData.state}` : ""}</p>
                                        <p>{formData.country}</p>
                                    </div>
                                </div>

                                {/* Order items recap */}
                                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                                    <h2 className="font-bold text-gray-900 mb-4">Order Items</h2>
                                    <div className="space-y-3">
                                        {items.map(item => (
                                            <div key={item.id} className="flex items-center gap-3">
                                                <div className="w-12 h-12 rounded-xl bg-gray-100 overflow-hidden flex-shrink-0">
                                                    {item.image_url
                                                        ? <img src={item.image_url} alt={item.product_name || item.name} className="w-full h-full object-cover" />
                                                        : <Package className="w-6 h-6 text-gray-300 m-auto mt-3" />
                                                    }
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-medium text-gray-900 truncate">{item.product_name || item.name}</p>
                                                    <p className="text-xs text-gray-400">Qty: {item.quantity}</p>
                                                </div>
                                                <p className="text-sm font-bold text-gray-900 flex-shrink-0">
                                                    ₦{(parseFloat(item.price) * item.quantity).toLocaleString("en-NG", { minimumFractionDigits: 2 })}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {error && <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-3">{error}</p>}

                                <button
                                    onClick={handlePay}
                                    disabled={loading}
                                    className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-bold py-4 rounded-2xl text-sm transition flex items-center justify-center gap-2 shadow-lg shadow-blue-200"
                                >
                                    {loading
                                        ? <><Loader2 className="w-4 h-4 animate-spin" /> Initializing...</>
                                        : <><Lock className="w-4 h-4" /> Pay ₦{total.toLocaleString("en-NG", { minimumFractionDigits: 2 })}</>
                                    }
                                </button>

                                <div className="flex items-center justify-center gap-2 text-xs text-gray-400">
                                    <ShieldCheck className="w-3.5 h-3.5 text-green-500" />
                                    Secured by Paystack
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Right — Order Summary */}
                    <div className="lg:col-span-2">
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 sticky top-24 space-y-4">
                            <h2 className="font-bold text-gray-900">Order Summary</h2>
                            <div className="space-y-2 text-sm">
                                {items.map(item => (
                                    <div key={item.id} className="flex justify-between text-gray-600">
                                        <span className="truncate mr-2">{item.product_name || item.name} × {item.quantity}</span>
                                        <span className="flex-shrink-0 font-medium text-gray-900">
                                            ₦{(parseFloat(item.price) * item.quantity).toLocaleString("en-NG", { minimumFractionDigits: 2 })}
                                        </span>
                                    </div>
                                ))}
                            </div>
                            <div className="border-t border-gray-50 pt-3 space-y-2 text-sm">
                                <div className="flex justify-between text-gray-500">
                                    <span>Subtotal</span>
                                    <span>₦{subtotal.toLocaleString("en-NG", { minimumFractionDigits: 2 })}</span>
                                </div>
                                <div className="flex justify-between text-gray-500">
                                    <span>Shipping</span>
                                    <span>₦{shipping.toLocaleString("en-NG", { minimumFractionDigits: 2 })}</span>
                                </div>
                                <div className="flex justify-between font-bold text-gray-900 text-base pt-2 border-t border-gray-50">
                                    <span>Total</span>
                                    <span>₦{total.toLocaleString("en-NG", { minimumFractionDigits: 2 })}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default function CheckoutPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
            </div>
        }>
            <CheckoutContent />
        </Suspense>
    );
}
