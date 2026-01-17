"use client";

import { useState, useEffect } from "react";
import { useCart } from "@/components/providers/CartContext";
import { useTenant } from "@/components/providers/TenantContext";
import { useAuth } from "@/components/providers/AuthContext";
import api from "@/lib/axios";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Lock, CheckCircle } from "lucide-react";

export default function CheckoutPage() {
    const { cart, items, cartTotal, loading: cartLoading } = useCart();
    const tenant = useTenant();
    const { user, token } = useAuth();
    const router = useRouter();

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

    // Calc totals
    const subtotal = cartTotal;
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

        // Process Payment
        setLoading(true);
        try {
            const res = await api.post("/checkout/process", {
                cartId: cart.id,
                email: formData.email,
                paymentMethod: "credit_card",
                shippingAddress: {
                    firstName: formData.firstName,
                    lastName: formData.lastName,
                    address: formData.address,
                    city: formData.city,
                    state: formData.state,
                    zip: formData.zip,
                    country: formData.country,
                },
                billingAddress: {
                    // Same for now
                    firstName: formData.firstName,
                    lastName: formData.lastName,
                    address: formData.address,
                    city: formData.city,
                    state: formData.state,
                    zip: formData.zip,
                    country: formData.country,
                }
            }, {
                headers: {
                    'X-Tenant-ID': tenant.id,
                    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
                }
            });

            if (res.data.success) {
                router.push(`/checkout/success?orderId=${res.data.transactionId}`);
            }
        } catch (err) {
            console.error("Checkout failed", err);
            alert("Checkout failed. Please try again.");
        } finally {
            setLoading(false);
        }
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

                                <h2 className="text-xl font-bold">Payment Details</h2>
                                <div className="bg-yellow-50 border border-yellow-200 rounded p-4 text-sm text-yellow-800 mb-4">
                                    Mock Payment: Enter any dummy details.
                                </div>

                                <div className="space-y-4">
                                    <input
                                        type="text"
                                        name="cardNumber"
                                        placeholder="Card number"
                                        required
                                        className="w-full border rounded-lg px-4 py-2"
                                        value={formData.cardNumber}
                                        onChange={handleChange}
                                    />
                                    <div className="grid grid-cols-2 gap-4">
                                        <input
                                            type="text"
                                            name="expiry"
                                            placeholder="MM / YY"
                                            required
                                            className="w-full border rounded-lg px-4 py-2"
                                            value={formData.expiry}
                                            onChange={handleChange}
                                        />
                                        <input
                                            type="text"
                                            name="cvc"
                                            placeholder="CVC"
                                            required
                                            className="w-full border rounded-lg px-4 py-2"
                                            value={formData.cvc}
                                            onChange={handleChange}
                                        />
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 mt-4 disabled:opacity-50"
                                >
                                    {loading ? 'Processing...' : `Pay $${total.toFixed(2)}`}
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
                                        <span className="absolute -top-2 -right-2 bg-gray-500 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                                            {item.quantity}
                                        </span>
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="text-sm font-medium text-gray-900"> Product {item.id.substring(0, 6)}</h3>
                                        <p className="text-xs text-gray-500">{item.product_name}</p>
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
