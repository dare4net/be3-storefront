"use client";

import { useState, useEffect } from "react";
import { useCart } from "@/components/providers/CartContext";
import { useTenant } from "@/components/providers/TenantContext";
import { useAuth } from "@/components/providers/AuthContext";
import api from "@/lib/axios";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Lock, CheckCircle } from "lucide-react";
import EntityAnalytics from "@/components/analytics/EntityAnalytics";
import { useAnalytics } from "@/lib/hooks/useAnalytics";
import { useSearchParams } from "next/navigation";

export default function CheckoutPage() {
    const { cart, items: allItems, vendorGroups, loading: cartLoading } = useCart();
    const tenant = useTenant();
    const { user, token } = useAuth();
    const router = useRouter();
    const searchParams = useSearchParams();
    const { trackClick } = useAnalytics();
    const vendorId = searchParams.get('vendor_id');

    // Filter items to the specific vendor group being checked out
    const vendorGroup = vendorId ? vendorGroups.find(g => g.vendorId === vendorId) : null;
    const items = vendorGroup ? vendorGroup.items : allItems;

    const [step, setStep] = useState(1); // 1: Info, 2: Payment
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        email: "",
        firstName: "",
        lastName: "",
        address: "",
        city: "",
        state: "",
        zip: "",
        country: "USA",
        cardNumber: "",
        expiry: "",
        cvc: ""
    });

    // Pre-fill form if user is logged in
    useEffect(() => {
        if (user) {
            setFormData(prev => ({
                ...prev,
                email: user.email || "",
                firstName: user.first_name || "",
                lastName: user.last_name || ""
            }));
        }
    }, [user]);

    // Calc totals for the filtered vendor group only
    const subtotal = items.reduce((sum, item) => sum + (parseFloat(item.price) * item.quantity), 0);
    const shipping = 15.00;
    const tax = subtotal * 0.1;
    const total = subtotal + shipping + tax;

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (step === 1) {
            setStep(2);
            return;
        }

        // === PAYSTACK FLOW ===
        setLoading(true);
        try {
            const res = await api.post("/payments/paystack/initialize", {
                cartId: cart.id,
                vendorId: vendorId || null,
                email: formData.email,
                shippingAddress: {
                    firstName: formData.firstName,
                    lastName: formData.lastName,
                    address: formData.address,
                    city: formData.city,
                    state: formData.state,
                    zip: formData.zip,
                    country: formData.country,
                },
            }, {
                headers: {
                    'X-Tenant-ID': tenant.id,
                    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
                }
            });

            if (res.data.success && res.data.authorization_url) {
                // Redirect user to Paystack hosted payment page.
                // We do NOT handle payment completion here — the webhook does that.
                window.location.href = res.data.authorization_url;
            } else {
                throw new Error('Could not get payment URL from gateway.');
            }
        } catch (err) {
            console.error("Payment initialization failed", err);
            alert(err.response?.data?.message || "Could not connect to payment gateway. Please try again.");
            setLoading(false);
        }
        // Note: setLoading(false) is intentionally NOT called on success
        // because the page is redirecting. Keeping the spinner active prevents
        // double-clicks during the redirect delay.
    };

    if (cartLoading) return <div className="p-12 text-center">Loading checkout...</div>;

    if (items.length === 0) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center p-4">
                <h1 className="text-2xl font-bold mb-4">Your cart is empty</h1>
                <Link href="/" className="text-blue-600 hover:underline">
                    Return to Store
                </Link>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 pb-12">
            <EntityAnalytics type="checkout" entity={{ id: vendorId || 'general', name: 'Checkout Page' }} />
            {/* Header */}
            <div className="bg-white border-b sticky top-0 z-10">
                <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
                    <Link href="/" className="font-bold text-xl text-gray-900">
                        {tenant?.name || 'Store Checkout'}
                    </Link>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Lock className="w-4 h-4" />
                        Secure Checkout
                    </div>
                </div>
            </div>

            <main className="max-w-7xl mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Form Section */}
                <div className="lg:col-span-7">
                    <form onSubmit={handleSubmit} className="space-y-8">
                        {/* Steps Indicator */}
                        <div className="flex items-center gap-4 text-sm font-medium">
                            <span className={step >= 1 ? "text-blue-600" : "text-gray-400"}>1. Information</span>
                            <span className="text-gray-300">/</span>
                            <span className={step >= 2 ? "text-blue-600" : "text-gray-400"}>2. Payment</span>
                        </div>

                        {step === 1 ? (
                            <div className="bg-white rounded-lg shadow p-6 space-y-6">
                                <h2 className="text-xl font-bold">Contact Information</h2>
                                <div className="grid grid-cols-1 gap-4">
                                    <input
                                        type="email"
                                        name="email"
                                        placeholder="Email address"
                                        required
                                        className="w-full border rounded-lg px-4 py-2"
                                        value={formData.email}
                                        onChange={handleChange}
                                    />
                                </div>

                                <h2 className="text-xl font-bold pt-4">Shipping Address</h2>
                                <div className="grid grid-cols-2 gap-4">
                                    <input
                                        type="text"
                                        name="firstName"
                                        placeholder="First name"
                                        required
                                        className="w-full border rounded-lg px-4 py-2"
                                        value={formData.firstName}
                                        onChange={handleChange}
                                    />
                                    <input
                                        type="text"
                                        name="lastName"
                                        placeholder="Last name"
                                        required
                                        className="w-full border rounded-lg px-4 py-2"
                                        value={formData.lastName}
                                        onChange={handleChange}
                                    />
                                    <input
                                        type="text"
                                        name="address"
                                        placeholder="Address"
                                        required
                                        className="col-span-2 w-full border rounded-lg px-4 py-2"
                                        value={formData.address}
                                        onChange={handleChange}
                                    />
                                    <input
                                        type="text"
                                        name="city"
                                        placeholder="City"
                                        required
                                        className="w-full border rounded-lg px-4 py-2"
                                        value={formData.city}
                                        onChange={handleChange}
                                    />
                                    <input
                                        type="text"
                                        name="state"
                                        placeholder="State"
                                        required
                                        className="w-full border rounded-lg px-4 py-2"
                                        value={formData.state}
                                        onChange={handleChange}
                                    />
                                    <input
                                        type="text"
                                        name="zip"
                                        placeholder="ZIP Code"
                                        required
                                        className="w-full border rounded-lg px-4 py-2"
                                        value={formData.zip}
                                        onChange={handleChange}
                                    />
                                    <input
                                        type="text"
                                        name="country"
                                        placeholder="Country"
                                        readOnly
                                        className="w-full border rounded-lg px-4 py-2 bg-gray-50"
                                        value={formData.country}
                                    />
                                </div>

                                <button
                                    type="submit"
                                    className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 mt-4"
                                >
                                    Continue to Payment
                                </button>
                            </div>
                        ) : (
                            <div className="bg-white rounded-lg shadow p-6 space-y-6">
                                <button
                                    type="button"
                                    onClick={() => setStep(1)}
                                    className="flex items-center text-sm text-gray-500 hover:text-gray-900"
                                >
                                    <ArrowLeft className="w-4 h-4 mr-1" />
                                    Back to Information
                                </button>

                                <h2 className="text-xl font-bold">Confirm & Pay</h2>

                                <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-2 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">Email</span>
                                        <span className="font-medium">{formData.email}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">Shipping to</span>
                                        <span className="font-medium text-right">{formData.address}, {formData.city}</span>
                                    </div>
                                    <div className="flex justify-between font-bold text-base pt-2 border-t">
                                        <span>Total</span>
                                        <span>₦{total.toLocaleString('en-NG', { minimumFractionDigits: 2 })}</span>
                                    </div>
                                </div>

                                <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex items-start gap-3 text-sm text-blue-800">
                                    <Lock className="w-4 h-4 mt-0.5 flex-shrink-0 text-blue-500" />
                                    <p>You will be securely redirected to <strong>Paystack</strong> to complete your payment. Your card details are never shared with us.</p>
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 mt-4 disabled:opacity-60 flex items-center justify-center gap-2 transition-all"
                                >
                                    {loading ? (
                                        <>
                                            <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                                            </svg>
                                            Redirecting to Paystack...
                                        </>
                                    ) : (
                                        <>
                                            <Lock className="w-4 h-4" />
                                            Pay ₦{total.toLocaleString('en-NG', { minimumFractionDigits: 2 })} securely
                                        </>
                                    )}
                                </button>
                            </div>
                        )}
                    </form>
                </div>

                {/* Order Summary */}
                <div className="lg:col-span-5">
                    <div className="bg-white rounded-lg shadow p-6 sticky top-24">
                        <h2 className="text-lg font-bold mb-4">Order Summary</h2>
                        <div className="space-y-4 max-h-80 overflow-y-auto mb-4 pr-2">
                            {items.map((item) => (
                                <div key={item.id} className="flex gap-4">
                                    <div className="w-16 h-16 bg-gray-100 rounded-md relative flex-shrink-0">
                                        {item.image_url || item.image ? (
                                            <img src={item.image_url || item.image} alt={item.product_name || `Product`} className="w-full h-full object-cover rounded-md" />
                                        ) : null}
                                        <span className="absolute -top-2 -right-2 bg-gray-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                                            {item.quantity}
                                        </span>
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="text-sm font-medium text-gray-900">{item.product_name || `Product ${item.id?.substring(0, 6)}`}</h3>
                                    </div>
                                    <p className="text-sm font-medium text-gray-900">
                                        ${(parseFloat(item.price) * item.quantity).toFixed(2)}
                                    </p>
                                </div>
                            ))}
                        </div>

                        <div className="space-y-2 border-t pt-4 text-sm">
                            <div className="flex justify-between">
                                <span className="text-gray-500">Subtotal</span>
                                <span className="font-medium">${subtotal.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-500">Shipping</span>
                                <span className="font-medium">${shipping.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-500">Taxes</span>
                                <span className="font-medium">${tax.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between pt-4 border-t text-base font-bold">
                                <span>Total</span>
                                <span>${total.toFixed(2)}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}
