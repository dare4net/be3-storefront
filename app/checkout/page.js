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
    MapPin, User, Mail, Phone, Loader2, ShieldCheck, Tag
} from "lucide-react";

const FLAT_SHIPPING_NGN = 1500;

const inputClass = "w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition bg-white placeholder:text-gray-400";
const labelClass = "block text-xs font-semibold text-gray-600 uppercase tracking-wide mb-1.5";

function CheckoutContent() {
    const { cart, items: allItems, vendorGroups, refreshCart } = useCart();
    const tenant = useTenant();
    const { user, token } = useAuth();
    const router = useRouter();
    const searchParams = useSearchParams();
    const vendorId = searchParams.get("vendor_id");
    const checkoutType = searchParams.get("checkout_type"); // 'whatsapp' | null
    const isWhatsApp = checkoutType === "whatsapp";

    const vendorGroup = vendorId ? vendorGroups?.find(g => g.vendorId === vendorId) : null;
    const items = vendorGroup ? vendorGroup.items : allItems;

    const [step, setStep] = useState(1); // 1 = details, 2 = review & pay/send
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const [formData, setFormData] = useState({
        email: "", firstName: "", lastName: "",
        phone: "", address: "", city: "", state: "", country: "Nigeria",
    });

    const [couponCode, setCouponCode] = useState("");
    const [appliedCoupon, setAppliedCoupon] = useState(null);
    const [couponError, setCouponError] = useState("");
    const [validatingCoupon, setValidatingCoupon] = useState(false);

    const [topology, setTopology] = useState({ countries: [], states: [], landmarks: [] });
    const [destinationIds, setDestinationIds] = useState({ country_id: "", state_id: "", landmark_id: "" });
    const [shippingData, setShippingData] = useState(null);
    const [calculatingShipping, setCalculatingShipping] = useState(false);
    const [shippingError, setShippingError] = useState("");

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

    const activeVendorId = vendorId || (vendorGroups?.[0]?.vendorId) || null;

    const [userAddresses, setUserAddresses] = useState([]);
    const [useManualLocation, setUseManualLocation] = useState(false);
    const [selectedAddressId, setSelectedAddressId] = useState("");
    const [saveAddress, setSaveAddress] = useState(false);

    const applySavedAddress = (addr) => {
        setSelectedAddressId(addr.id);
        const cId = String(addr.country_id || "");
        const sId = String(addr.state_id || "");
        const lId = String(addr.landmark_id || "");

        setTopology(prev => {
            const hasC = prev.countries.some(c => String(c.id) === cId);
            const hasS = prev.states.some(s => String(s.id) === sId);
            const hasL = prev.landmarks.some(l => String(l.id) === lId);
            return {
                countries: hasC ? prev.countries : [...prev.countries, { id: cId, name: addr.country_name }],
                states: hasS ? prev.states : [...prev.states, { id: sId, name: addr.state_name }],
                landmarks: hasL ? prev.landmarks : [...prev.landmarks, { id: lId, name: addr.landmark_name }]
            };
        });

        setDestinationIds({ country_id: cId, state_id: sId, landmark_id: lId });
        setFormData(prev => ({
            ...prev,
            address: addr.street_address, phone: addr.phone, firstName: addr.first_name,
            lastName: addr.last_name, country: addr.country_name, state: addr.state_name, city: addr.landmark_name
        }));
    };

    useEffect(() => {
        if (!token || !user) { setUseManualLocation(true); return; }
        const fetchAddrs = async () => {
            try {
                const res = await api.get('/auth/me/addresses', { headers: { 'X-Tenant-ID': tenant?.id, 'Authorization': `Bearer ${token}` } });
                const addrs = res.data.addresses || [];
                setUserAddresses(addrs);
                if (addrs.length > 0) {
                    setUseManualLocation(false);
                    applySavedAddress(addrs.find(a => a.is_default) || addrs[0]);
                } else {
                    setUseManualLocation(true);
                }
            } catch (e) { setUseManualLocation(true); }
        };
        fetchAddrs();
    }, [user, tenant, token]);

    useEffect(() => {
        const fetchCountries = async () => {
            if (!useManualLocation) return;
            try {
                const res = await api.get(`/shipping/topology/countries?vendor_id=${activeVendorId || ''}`, { headers: { 'X-Tenant-ID': tenant?.id } });
                const countries = res.data.countries || [];
                setTopology(prev => ({ ...prev, countries }));

                if (countries.length > 0 && !destinationIds.country_id) {
                    const cId = String(countries[0].id);
                    const cName = countries[0].name;

                    const sRes = await api.get(`/shipping/topology/states?country_id=${cId}&vendor_id=${activeVendorId || ''}`, { headers: { 'X-Tenant-ID': tenant?.id } });
                    const states = sRes.data.states || [];
                    setTopology(prev => ({ ...prev, states }));

                    if (states.length > 0) {
                        const sId = String(states[0].id);
                        const sName = states[0].name;

                        const lRes = await api.get(`/shipping/topology/landmarks?state_id=${sId}&vendor_id=${activeVendorId || ''}`, { headers: { 'X-Tenant-ID': tenant?.id } });
                        const landmarks = lRes.data.landmarks || [];
                        setTopology(prev => ({ ...prev, landmarks }));

                        if (landmarks.length > 0) {
                            setDestinationIds({ country_id: cId, state_id: sId, landmark_id: String(landmarks[0].id) });
                            setFormData(prev => ({ ...prev, country: cName, state: sName, city: landmarks[0].name }));
                        } else {
                            setDestinationIds({ country_id: cId, state_id: sId, landmark_id: "" });
                            setFormData(prev => ({ ...prev, country: cName, state: sName, city: "" }));
                        }
                    } else {
                        setDestinationIds({ country_id: cId, state_id: "", landmark_id: "" });
                        setFormData(prev => ({ ...prev, country: cName, state: "", city: "" }));
                    }
                }
            } catch (e) {
                console.error("Topology auto-select error:", e);
            }
        };
        if (tenant?.id && activeVendorId) fetchCountries();
    }, [tenant, activeVendorId, useManualLocation]);


    useEffect(() => {
        const calculateShipping = async () => {
            if (!destinationIds.country_id && !destinationIds.state_id && !destinationIds.landmark_id) {
                setShippingData(null);
                return;
            }
            if (!activeVendorId) return;

            setCalculatingShipping(true);
            try {
                const res = await api.post("/shipping/calculate", {
                    vendor_id: activeVendorId,
                    cart_items: items.map(i => ({
                        product_id: i.product_id,
                        quantity: i.quantity,
                        vendor_id: i.vendorId || i.vendor_id || activeVendorId
                    })),
                    destination: {
                        country_id: destinationIds.country_id ? parseInt(destinationIds.country_id) : null,
                        state_id: destinationIds.state_id ? parseInt(destinationIds.state_id) : null,
                        landmark_id: destinationIds.landmark_id ? parseInt(destinationIds.landmark_id) : null
                    }
                }, { headers: { 'X-Tenant-ID': tenant?.id } });

                if (res.data.success) {
                    setShippingData(res.data);
                    setShippingError("");
                }
            } catch (e) {
                console.error("Shipping calc error", e);
                setShippingError(e.response?.data?.error || "Calculating error");
                setShippingData(null);
            } finally {
                setCalculatingShipping(false);
            }
        };

        const timer = setTimeout(calculateShipping, 500);
        return () => clearTimeout(timer);
    }, [destinationIds, activeVendorId, items, tenant]);

    const handleCountryChange = async (e) => {
        const cId = e.target.value;
        const cName = topology.countries.find(c => c.id == cId)?.name || "";
        setDestinationIds(prev => ({ ...prev, country_id: cId, state_id: "", landmark_id: "" }));
        setFormData(prev => ({ ...prev, country: cName, state: "", city: "" }));
        setTopology(prev => ({ ...prev, states: [], landmarks: [] }));
        if (cId) {
            try {
                const res = await api.get(`/shipping/topology/states?country_id=${cId}&vendor_id=${activeVendorId || ''}`, { headers: { 'X-Tenant-ID': tenant?.id } });
                setTopology(prev => ({ ...prev, states: res.data.states || [] }));
            } catch (e) { }
        }
    };

    const handleStateChange = async (e) => {
        const sId = e.target.value;
        const sName = topology.states.find(s => s.id == sId)?.name || "";
        setDestinationIds(prev => ({ ...prev, state_id: sId, landmark_id: "" }));
        setFormData(prev => ({ ...prev, state: sName, city: "" }));
        setTopology(prev => ({ ...prev, landmarks: [] }));
        if (sId) {
            try {
                const res = await api.get(`/shipping/topology/landmarks?state_id=${sId}&vendor_id=${activeVendorId || ''}`, { headers: { 'X-Tenant-ID': tenant?.id } });
                setTopology(prev => ({ ...prev, landmarks: res.data.landmarks || [] }));
            } catch (e) { }
        }
    };

    const handleLandmarkChange = (e) => {
        const lId = e.target.value;
        const lName = topology.landmarks.find(l => l.id == lId)?.name || "";
        setDestinationIds(prev => ({ ...prev, landmark_id: lId }));
        setFormData(prev => ({ ...prev, city: lName }));
    };

    const subtotal = items.reduce((sum, item) => sum + (parseFloat(item.price) * item.quantity), 0);
    const shippingBase = shippingData ? parseFloat(shippingData.total_fee) : FLAT_SHIPPING_NGN;
    const shipping = appliedCoupon?.type === 'free_shipping' ? 0 : shippingBase;
    const discount = appliedCoupon ? appliedCoupon.discount_amount : 0;
    const total = Math.max(0, subtotal + shipping - discount);

    const getDiscountedItemPrice = (item) => {
        if (!appliedCoupon || !appliedCoupon.eligible_product_ids?.includes(item.product_id)) {
            return null;
        }
        const itemTotal = parseFloat(item.price) * item.quantity;

        if (appliedCoupon.type === 'percentage') {
            const discountVal = (itemTotal * parseFloat(appliedCoupon.value)) / 100;
            return itemTotal - discountVal;
        } else if (appliedCoupon.type === 'fixed') {
            const eligibleSubtotal = items
                .filter(i => appliedCoupon.eligible_product_ids.includes(i.product_id))
                .reduce((sum, i) => sum + (parseFloat(i.price) * i.quantity), 0);

            if (eligibleSubtotal === 0) return null;

            const weight = itemTotal / eligibleSubtotal;
            const discountShare = appliedCoupon.discount_amount * weight;
            return itemTotal - discountShare;
        }
        return null;
    };

    const handleApplyCoupon = async () => {
        if (!couponCode.trim()) return;
        setValidatingCoupon(true);
        setCouponError("");
        try {
            const res = await api.post('/discounts/validate', {
                code: couponCode,
                items: items.map(i => ({ product_id: i.product_id, price: i.price, quantity: i.quantity })),
                vendor_id: vendorId || null
            }, { headers: { 'X-Tenant-ID': tenant?.id } });

            if (res.data.success && res.data.valid) {
                setAppliedCoupon({
                    ...res.data.coupon,
                    discount_amount: res.data.discount_amount,
                    eligible_product_ids: res.data.eligible_product_ids
                });
                setCouponCode("");
            }
        } catch (err) {
            setCouponError(err.response?.data?.error || "Invalid coupon code");
            setAppliedCoupon(null);
        } finally {
            setValidatingCoupon(false);
        }
    };

    const removeCoupon = () => {
        setAppliedCoupon(null);
        setCouponError("");
    };

    const set = (field) => (e) => setFormData(prev => ({ ...prev, [field]: e.target.value }));

    const handleProceed = async (e) => {
        e.preventDefault();
        if (!formData.email || !formData.firstName || !formData.address || !formData.city) {
            setError("Please fill in all required fields.");
            return;
        }
        setError("");

        if (saveAddress && user && useManualLocation) {
            try {
                await api.post(`/auth/me/addresses`, {
                    first_name: formData.firstName,
                    last_name: formData.lastName,
                    phone: formData.phone,
                    street_address: formData.address,
                    country_id: destinationIds.country_id ? parseInt(destinationIds.country_id) : null,
                    state_id: destinationIds.state_id ? parseInt(destinationIds.state_id) : null,
                    landmark_id: destinationIds.landmark_id ? parseInt(destinationIds.landmark_id) : null,
                    is_default: false
                }, { headers: { 'X-Tenant-ID': tenant?.id, 'Authorization': `Bearer ${token}` } });
            } catch (err) {
                console.error("Failed to save address", err);
            }
        }

        setStep(2);
    };

    const handlePay = async () => {
        if (!cart?.id || !tenant?.id) return;
        setLoading(true);
        setError("");

        const shippingAddress = {
            firstName: formData.firstName,
            lastName: formData.lastName,
            phone: formData.phone,
            address: formData.address,
            city: formData.city,
            state: formData.state,
            country: formData.country,
        };

        try {
            if (isWhatsApp) {
                // ── WhatsApp order flow ──────────────────────────────
                const groupTotal = items.reduce((s, i) => s + parseFloat(i.price) * i.quantity, 0);
                const res = await api.post("/orders/whatsapp", {
                    cartId: cart.id,
                    vendorId: vendorId || null,
                    items,
                    total: groupTotal,
                    customerName: `${formData.firstName} ${formData.lastName}`.trim(),
                    customerEmail: formData.email,
                    shippingAddress,
                    session_id: cart.session_id || null,
                    couponCode: appliedCoupon?.code || null,
                }, {
                    headers: {
                        "X-Tenant-ID": tenant.id,
                        ...(token ? { Authorization: `Bearer ${token}` } : {}),
                    },
                });

                if (res.data.success) {
                    const order = res.data.order;
                    const itemsList = items
                        .map(i => `- ${i.product_name} x${i.quantity} (\u20a6${(parseFloat(i.price) * i.quantity).toLocaleString("en-NG")})`)
                        .join("%0A");
                    const waMessage = `Hello! I'd like to order:%0A%0A${itemsList}%0A%0ATotal: \u20a6${groupTotal.toLocaleString("en-NG")}%0AOrder Ref: ${order.order_number}%0AName: ${formData.firstName} ${formData.lastName}%0APhone: ${formData.phone}%0AAddress: ${formData.address}, ${formData.city}`;
                    const phone = vendorGroup?.whatsappPhone?.replace(/[^0-9]/g, "");

                    await refreshCart();
                    if (phone) window.open(`https://wa.me/${phone}?text=${waMessage}`, "_blank");
                    router.push(`/account/orders/${order.id}`);
                }
            } else {
                // ── Platform (Paystack) flow ─────────────────────────
                const res = await api.post("/payments/paystack/initialize", {
                    cartId: cart.id,
                    email: formData.email,
                    customerName: `${formData.firstName} ${formData.lastName}`.trim(),
                    customerPhone: formData.phone,
                    vendorId: vendorId || null,
                    shippingAddress,
                    couponCode: appliedCoupon?.code || null,
                }, {
                    headers: {
                        "X-Tenant-ID": tenant.id,
                        ...(token ? { Authorization: `Bearer ${token}` } : {}),
                    },
                });

                if (res.data.authorization_url) {
                    await refreshCart();
                    window.location.href = res.data.authorization_url;
                }
            }
        } catch (err) {
            setError(err.response?.data?.message || (isWhatsApp ? "Failed to create order. Please try again." : "Payment initialization failed. Please try again."));
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
                                    <div className="flex items-center justify-between">
                                        <h2 className="font-bold text-gray-900 flex items-center gap-2">
                                            <MapPin className="w-4 h-4 text-gray-400" /> Delivery Destination
                                        </h2>
                                        {userAddresses.length > 0 && (
                                            <button type="button" onClick={() => setUseManualLocation(!useManualLocation)} className="text-xs font-semibold text-blue-600 hover:text-blue-700">
                                                {useManualLocation ? "Use Address Book" : "+ Ship to a different location"}
                                            </button>
                                        )}
                                    </div>

                                    {!useManualLocation && userAddresses.length > 0 ? (
                                        <div className="space-y-3">
                                            {userAddresses.map(addr => (
                                                <div key={addr.id} onClick={() => applySavedAddress(addr)} className={`border rounded-xl p-3 cursor-pointer transition-all ${selectedAddressId === addr.id ? 'border-blue-500 bg-blue-50/20' : 'border-gray-100 hover:border-gray-300 bg-white'}`}>
                                                    <div className="flex items-start gap-3">
                                                        <input type="radio" checked={selectedAddressId === addr.id} readOnly className="mt-1 w-4 h-4 text-blue-600 focus:ring-blue-500" />
                                                        <div>
                                                            <p className="text-sm font-bold text-gray-900">{addr.first_name} {addr.last_name} <span className="text-gray-400 font-normal">({addr.phone})</span></p>
                                                            <p className="text-xs text-gray-500 mt-0.5">{addr.street_address}, {[addr.landmark_name, addr.state_name].filter(Boolean).join(", ")}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                <div>
                                                    <label className={labelClass}>Country *</label>
                                                    <select className={inputClass} value={destinationIds.country_id} onChange={handleCountryChange} required>
                                                        <option value="">Select Country</option>
                                                        {topology.countries.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                                    </select>
                                                </div>
                                                <div>
                                                    <label className={labelClass}>State *</label>
                                                    <select className={inputClass} value={destinationIds.state_id} onChange={handleStateChange} required disabled={!destinationIds.country_id}>
                                                        <option value="">Select State</option>
                                                        {topology.states.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                                    </select>
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                <div>
                                                    <label className={labelClass}>City / Landmark *</label>
                                                    <select className={inputClass} value={destinationIds.landmark_id} onChange={handleLandmarkChange} required disabled={!destinationIds.state_id}>
                                                        <option value="">Select Landmark</option>
                                                        {topology.landmarks.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                                                    </select>
                                                </div>
                                                <div>
                                                    <label className={labelClass}>Street Address *</label>
                                                    <input type="text" className={inputClass} value={formData.address} onChange={set("address")} placeholder="123 Main Street" required />
                                                </div>
                                            </div>
                                            {user && (
                                                <div className="pt-2">
                                                    <label className="flex items-center gap-2 cursor-pointer w-max">
                                                        <input type="checkbox" checked={saveAddress} onChange={e => setSaveAddress(e.target.checked)} className="w-4 h-4 rounded text-blue-600 border-gray-300 focus:ring-blue-500" />
                                                        <span className="text-xs font-semibold text-gray-700">Save this address to my profile</span>
                                                    </label>
                                                </div>
                                            )}
                                        </>
                                    )}
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
                                        {items.map(item => {
                                            const discountedPrice = getDiscountedItemPrice(item);
                                            const originalPrice = parseFloat(item.price) * item.quantity;
                                            return (
                                                <div key={item.id} className="flex items-center gap-3">
                                                    <div className="w-12 h-12 rounded-xl bg-gray-100 overflow-hidden flex-shrink-0">
                                                        {item.image_url
                                                            ? <img src={item.image_url} alt={item.product_name || item.name} className="w-full h-full object-cover" />
                                                            : <Package className="w-6 h-6 text-gray-300 m-auto mt-3" />
                                                        }
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2">
                                                            <p className="text-sm font-medium text-gray-900 truncate">{item.product_name || item.name}</p>
                                                            {discountedPrice !== null && (
                                                                <span className="text-[10px] uppercase font-bold text-green-600 bg-green-50 px-1.5 py-0.5 rounded border border-green-200">Eligible</span>
                                                            )}
                                                        </div>
                                                        <p className="text-xs text-gray-400">Qty: {item.quantity}</p>
                                                    </div>
                                                    <div className="text-right flex-shrink-0">
                                                        {discountedPrice !== null ? (
                                                            <>
                                                                <p className="text-xs text-gray-400 line-through">
                                                                    ₦{originalPrice.toLocaleString("en-NG", { minimumFractionDigits: 2 })}
                                                                </p>
                                                                <p className="text-sm font-bold text-gray-900">
                                                                    ₦{discountedPrice.toLocaleString("en-NG", { minimumFractionDigits: 2 })}
                                                                </p>
                                                            </>
                                                        ) : (
                                                            <p className="text-sm font-bold text-gray-900">
                                                                ₦{originalPrice.toLocaleString("en-NG", { minimumFractionDigits: 2 })}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            )
                                        })}
                                    </div>
                                </div>

                                {error && <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-3">{error}</p>}

                                <button
                                    onClick={handlePay}
                                    disabled={loading || !!shippingError}
                                    className={`w-full disabled:opacity-60 text-white font-bold py-4 rounded-2xl text-sm transition flex items-center justify-center gap-2 shadow-lg ${isWhatsApp
                                        ? "bg-[#25D366] hover:bg-[#1ebe5d] shadow-green-200"
                                        : "bg-blue-600 hover:bg-blue-700 shadow-blue-200"
                                        }`}
                                >
                                    {loading
                                        ? <><Loader2 className="w-4 h-4 animate-spin" /> {isWhatsApp ? "Creating Order..." : "Initializing..."}</>
                                        : isWhatsApp
                                            ? <><svg viewBox="0 0 24 24" className="w-4 h-4 fill-current" xmlns="http://www.w3.org/2000/svg"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" /><path d="M12 0C5.373 0 0 5.373 0 12c0 2.124.558 4.117 1.534 5.845L0 24l6.335-1.505A11.945 11.945 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.818a9.818 9.818 0 01-5.006-1.371l-.36-.214-3.727.886.936-3.618-.235-.372A9.818 9.818 0 1112 21.818z" /></svg> Send WhatsApp Order</>
                                            : <><Lock className="w-4 h-4" /> Pay ₦{total.toLocaleString("en-NG", { minimumFractionDigits: 2 })}</>
                                    }
                                </button>

                                {!isWhatsApp && (
                                    <div className="flex items-center justify-center gap-2 text-xs text-gray-400">
                                        <ShieldCheck className="w-3.5 h-3.5 text-green-500" />
                                        Secured by Paystack
                                    </div>
                                )}
                                {isWhatsApp && (
                                    <p className="text-xs text-center text-gray-400">
                                        Your order will be sent to the vendor. Payment is arranged directly with them.
                                    </p>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Right — Order Summary */}
                    <div className="lg:col-span-2">
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 sticky top-24 space-y-4">
                            <h2 className="font-bold text-gray-900">Order Summary</h2>
                            <div className="space-y-2 text-sm">
                                {items.map(item => {
                                    const discountedPrice = getDiscountedItemPrice(item);
                                    const originalPrice = parseFloat(item.price) * item.quantity;
                                    return (
                                        <div key={item.id} className="flex justify-between text-gray-600">
                                            <div className="truncate mr-2">
                                                {item.product_name || item.name} × {item.quantity}
                                                {discountedPrice !== null && (
                                                    <span className="ml-2 text-[10px] uppercase font-bold text-green-600 bg-green-50 px-1.5 py-0.5 rounded border border-green-200">Eligible</span>
                                                )}
                                            </div>
                                            <div className="flex-shrink-0 text-right">
                                                {discountedPrice !== null ? (
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-gray-400 line-through text-xs">
                                                            ₦{originalPrice.toLocaleString("en-NG", { minimumFractionDigits: 2 })}
                                                        </span>
                                                        <span className="font-bold text-gray-900">
                                                            ₦{discountedPrice.toLocaleString("en-NG", { minimumFractionDigits: 2 })}
                                                        </span>
                                                    </div>
                                                ) : (
                                                    <span className="font-medium text-gray-900">
                                                        ₦{originalPrice.toLocaleString("en-NG", { minimumFractionDigits: 2 })}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                            <div className="border-t border-gray-50 pt-4 space-y-3 text-sm">
                                {/* Coupon Input */}
                                <div className="space-y-2 pb-2">
                                    {appliedCoupon ? (
                                        <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-xl px-3 py-2 text-sm">
                                            <div className="flex items-center gap-2 text-green-700">
                                                <Tag className="w-4 h-4" />
                                                <span className="font-bold">{appliedCoupon.code}</span>
                                            </div>
                                            <button onClick={removeCoupon} className="text-green-600 hover:text-green-800 font-semibold text-xs">Remove</button>
                                        </div>
                                    ) : (
                                        <div className="flex gap-2">
                                            <input
                                                type="text"
                                                value={couponCode}
                                                onChange={e => { setCouponCode(e.target.value.toUpperCase()); setCouponError(""); }}
                                                placeholder="Discount code"
                                                className="flex-1 px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 uppercase"
                                                disabled={validatingCoupon}
                                            />
                                            <button
                                                type="button"
                                                onClick={handleApplyCoupon}
                                                disabled={validatingCoupon || !couponCode.trim()}
                                                className="px-4 py-2 bg-gray-900 text-white rounded-xl text-sm font-semibold hover:bg-gray-800 disabled:opacity-50 transition"
                                            >
                                                Apply
                                            </button>
                                        </div>
                                    )}
                                    {couponError && <p className="text-xs text-red-500 font-medium px-1">{couponError}</p>}
                                </div>

                                <div className="flex justify-between text-gray-500">
                                    <span>Subtotal</span>
                                    <span>₦{subtotal.toLocaleString("en-NG", { minimumFractionDigits: 2 })}</span>
                                </div>
                                {appliedCoupon && (
                                    <div className="flex justify-between text-green-600 font-medium">
                                        <span>Discount ({appliedCoupon.code})</span>
                                        <span>− ₦{appliedCoupon.discount_amount.toLocaleString("en-NG", { minimumFractionDigits: 2 })}</span>
                                    </div>
                                )}
                                {!isWhatsApp && (
                                    <div className="flex justify-between items-center text-gray-500">
                                        <div>
                                            <span className="flex items-center gap-2">Shipping {calculatingShipping && <Loader2 className="w-3 h-3 animate-spin" />}</span>
                                            {shippingData?.breakdowns?.[activeVendorId] && (
                                                <p className="text-[10px] text-blue-500 font-medium mt-0.5">
                                                    Est. {shippingData.breakdowns[activeVendorId].delivery_days_min} - {shippingData.breakdowns[activeVendorId].delivery_days_max} days
                                                </p>
                                            )}
                                        </div>
                                        <span>
                                            {shippingError ? (
                                                <span className="text-red-500 font-medium text-right text-xs max-w-[140px] block">{shippingError}</span>
                                            ) : (
                                                shipping === 0 ? <span className="text-green-600 font-medium">Free</span> : `₦${shipping.toLocaleString("en-NG", { minimumFractionDigits: 2 })}`
                                            )}
                                        </span>
                                    </div>
                                )}
                                <div className="flex justify-between font-bold text-gray-900 text-base pt-2 border-t border-gray-50">
                                    <span>Total</span>
                                    <span>₦{(isWhatsApp ? Math.max(0, subtotal - discount) : total).toLocaleString("en-NG", { minimumFractionDigits: 2 })}</span>
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
