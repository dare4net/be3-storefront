"use client";

import { MapPin, Truck, ShieldCheck, Star, Store, RefreshCw, ChevronRight, Clock, Award, Package, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import api from '@/lib/axios';
import { useTenant } from '@/components/providers/TenantContext';
import { useAuth } from '@/components/providers/AuthContext';

export default function ProductInfoSidebar({ product }) {
    const tenant = useTenant();
    const activeVendorId = product?.created_by || product?.vendorId || product?.vendor_id;
    const [topology, setTopology] = useState({ countries: [], states: [], landmarks: [] });
    const [destinationIds, setDestinationIds] = useState({ country_id: "", state_id: "", landmark_id: "" });
    const [shippingData, setShippingData] = useState(null);
    const [calculatingShipping, setCalculatingShipping] = useState(false);
    const [shippingError, setShippingError] = useState("");
    const [unconfigured, setUnconfigured] = useState(false);
    const { user, token } = useAuth();
    const [useManualLocation, setUseManualLocation] = useState(false);
    const [userAddresses, setUserAddresses] = useState([]);
    const [selectedAddress, setSelectedAddress] = useState(null);
    const [showAddressDropdown, setShowAddressDropdown] = useState(false);

    useEffect(() => {
        if (!token || !user) { setUseManualLocation(true); return; }
        const fetchAddrs = async () => {
            try {
                const res = await api.get('/auth/me/addresses', { headers: { 'X-Tenant-ID': tenant?.id, 'Authorization': `Bearer ${token}` } });
                const addrs = res.data.addresses || [];
                setUserAddresses(addrs);
                if (addrs.length > 0) {
                    const def = addrs.find(a => a.is_default) || addrs[0];
                    const cId = String(def.country_id || "");
                    const sId = String(def.state_id || "");
                    const lId = String(def.landmark_id || "");

                    setSelectedAddress(def);
                    setDestinationIds({ country_id: cId, state_id: sId, landmark_id: lId });
                    setUseManualLocation(false);
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
                if (res.data.unconfigured) setUnconfigured(true);
                else setUnconfigured(false);

                let cId = destinationIds.country_id;
                if (countries.length > 0 && (!cId || !countries.find(c => String(c.id) === cId))) {
                    cId = String(countries[0].id);
                    setDestinationIds(prev => ({ ...prev, country_id: cId, state_id: "", landmark_id: "" }));
                }

                if (cId) {
                    const sRes = await api.get(`/shipping/topology/states?country_id=${cId}&vendor_id=${activeVendorId || ''}`, { headers: { 'X-Tenant-ID': tenant?.id } });
                    const states = sRes.data.states || [];
                    setTopology(prev => ({ ...prev, states }));

                    let sId = destinationIds.state_id;
                    if (states.length > 0 && (!sId || !states.find(s => String(s.id) === sId))) {
                        sId = String(states[0].id);
                        setDestinationIds(prev => ({ ...prev, state_id: sId, landmark_id: "" }));
                    }

                    if (sId) {
                        const lRes = await api.get(`/shipping/topology/landmarks?state_id=${sId}&vendor_id=${activeVendorId || ''}`, { headers: { 'X-Tenant-ID': tenant?.id } });
                        const landmarks = lRes.data.landmarks || [];
                        setTopology(prev => ({ ...prev, landmarks }));

                        let lId = destinationIds.landmark_id;
                        if (landmarks.length > 0 && (!lId || !landmarks.find(l => String(l.id) === lId))) {
                            setDestinationIds(prev => ({ ...prev, landmark_id: String(landmarks[0].id) }));
                        }
                    }
                }
            } catch (e) {
                console.error("Topology fetch error:", e);
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

            const activeVendorId = product?.created_by || product?.vendorId || product?.vendor_id;
            if (!activeVendorId) return;

            if (unconfigured) {
                setShippingData({
                    success: true,
                    breakdowns: {
                        [activeVendorId]: {
                            fee: 1500,
                            delivery_days_min: 2,
                            delivery_days_max: 5
                        }
                    }
                });
                setShippingError("");
                return;
            }

            setCalculatingShipping(true);
            try {
                const payload = {
                    vendor_id: activeVendorId,
                    cart_items: [{
                        product_id: product.id,
                        quantity: 1,
                        vendor_id: activeVendorId
                    }],
                    destination: {
                        country_id: destinationIds.country_id ? parseInt(destinationIds.country_id) : null,
                        state_id: destinationIds.state_id ? parseInt(destinationIds.state_id) : null,
                        landmark_id: destinationIds.landmark_id ? parseInt(destinationIds.landmark_id) : null
                    }
                };
                const res = await api.post("/shipping/calculate", payload, { headers: { 'X-Tenant-ID': tenant?.id } });

                if (res.data.success) {
                    setShippingData(res.data);
                    setShippingError("");
                }
            } catch (e) {
                console.error("Shipping calc error", e);
                setShippingError(e.response?.data?.error || "Error calculating delivery");
                setShippingData(null);
            } finally {
                setCalculatingShipping(false);
            }
        };

        const timer = setTimeout(calculateShipping, 500);
        return () => clearTimeout(timer);
    }, [destinationIds, product, tenant]);

    const handleCountryChange = async (e) => {
        const cId = e.target.value;
        setUseManualLocation(true);
        setDestinationIds(prev => ({ ...prev, country_id: cId, state_id: "", landmark_id: "" }));
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
        setDestinationIds(prev => ({ ...prev, state_id: sId, landmark_id: "" }));
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
        setDestinationIds(prev => ({ ...prev, landmark_id: lId }));
    };

    return (
        <div className="space-y-4">

            {/* Delivery Info */}
            <div className="border border-gray-200 rounded-2xl overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-3">
                    <Truck className="w-5 h-5 text-blue-600" />
                    <span className="font-semibold text-gray-900 text-sm">Delivery & Shipping</span>
                </div>
                <div className="px-5 py-4 space-y-4">
                    <div className="flex items-start gap-3">
                        <div className="w-full">
                            <div className="flex items-center justify-start mb-3">
                                {product?.delivery_type === 'express' ? (
                                    <div className="inline-flex overflow-hidden rounded flex-shrink-0 shadow-sm text-[11px]">
                                        <span className="bg-gray-900 px-2 py-1 flex items-center justify-center">
                                            <span className="animate-rumble inline-block leading-none relative top-[-0.5px]">⚡</span>
                                        </span>
                                        <span className="bg-[#ff4e00] text-white px-2 py-1 font-bold uppercase tracking-wider inline-flex items-center">
                                            Express Delivery
                                        </span>
                                    </div>
                                ) : product?.delivery_type === 'shipped_from_abroad' ? (
                                    <div className="inline-flex overflow-hidden rounded flex-shrink-0 shadow-sm text-[11px]">
                                        <span className="bg-gray-900 px-2 py-1 flex items-center justify-center">
                                            <span className="animate-fly inline-block leading-none relative top-[-0.5px]">✈️</span>
                                        </span>
                                        <span className="bg-[#0052ff] text-white px-2 py-1 font-bold uppercase tracking-wider inline-flex items-center">
                                            International Delivery
                                        </span>
                                    </div>
                                ) : (
                                    <div className="inline-flex overflow-hidden rounded flex-shrink-0 shadow-sm text-[11px]">
                                        <span className="bg-gray-200 px-2 py-1 flex items-center justify-center">
                                            <span className="inline-block leading-none">📦</span>
                                        </span>
                                        <span className="bg-gray-100 text-gray-700 px-2 py-1 font-bold uppercase tracking-wider inline-flex items-center">
                                            Standard Delivery
                                        </span>
                                    </div>
                                )}
                            </div>

                            {/* Dropdowns for Location Selection */}
                            <div className="mt-4 pt-4 border-t border-gray-100/50 space-y-2">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-xs font-semibold text-gray-500">Destination</span>
                                    {token && user && (
                                        <button onClick={() => setUseManualLocation(!useManualLocation)} className="text-[11px] font-semibold text-blue-600 hover:text-blue-700">
                                            {useManualLocation ? "Use My Saved Address" : "Use Different Location"}
                                        </button>
                                    )}
                                </div>

                                {(!useManualLocation && destinationIds.country_id) ? (
                                    <div className="relative">
                                        <div
                                            onClick={() => userAddresses.length > 1 && setShowAddressDropdown(true)}
                                            className={`bg-gray-50 p-2.5 rounded-lg border mb-2 flex items-center justify-between ${userAddresses.length > 1 ? 'cursor-pointer hover:bg-gray-100 hover:border-gray-300 border-gray-200/60' : 'border-gray-200/60'}`}
                                        >
                                            <div>
                                                <p className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
                                                    <MapPin className="w-3.5 h-3.5 text-blue-600" /> {selectedAddress?.is_default ? 'Default Address' : 'Saved Address'}
                                                </p>
                                                <p className="text-[11px] text-gray-500 mt-0.5 ml-5">
                                                    {selectedAddress?.street_address}, {[selectedAddress?.landmark_name, selectedAddress?.state_name].filter(Boolean).join(", ")}
                                                </p>
                                            </div>
                                            {userAddresses.length > 1 && (
                                                <div className="text-[10px] font-bold text-blue-600 uppercase tracking-widest pl-2">Change</div>
                                            )}
                                        </div>

                                        {showAddressDropdown && userAddresses.length > 1 && (
                                            <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
                                                <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden flex flex-col max-h-[80vh]">
                                                    <div className="flex items-center justify-between p-4 border-b border-gray-100">
                                                        <h3 className="font-bold text-gray-900 text-sm">Select Address</h3>
                                                        <button
                                                            onClick={() => setShowAddressDropdown(false)}
                                                            className="text-gray-400 hover:text-gray-600 transition-colors p-1"
                                                        >
                                                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                                                        </button>
                                                    </div>
                                                    <div className="overflow-y-auto p-2">
                                                        {userAddresses.map(addr => (
                                                            <div
                                                                key={addr.id}
                                                                onClick={() => {
                                                                    setSelectedAddress(addr);
                                                                    setDestinationIds({ country_id: String(addr.country_id), state_id: String(addr.state_id), landmark_id: String(addr.landmark_id) });
                                                                    setShowAddressDropdown(false);
                                                                }}
                                                                className={`p-4 text-left rounded-xl mb-2 last:mb-0 cursor-pointer transition-colors border ${selectedAddress?.id === addr.id ? 'border-blue-500 bg-blue-50/50' : 'border-gray-100 hover:border-gray-300 bg-white shadow-sm hover:shadow'}`}
                                                            >
                                                                <div className="flex items-start gap-3">
                                                                    <div className={`mt-0.5 w-4 h-4 rounded-full border flex-shrink-0 flex items-center justify-center ${selectedAddress?.id === addr.id ? 'border-blue-500 bg-blue-500' : 'border-gray-300'}`}>
                                                                        {selectedAddress?.id === addr.id && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                                                                    </div>
                                                                    <div>
                                                                        <p className="text-sm font-bold text-gray-900">{addr.first_name} {addr.last_name}</p>
                                                                        <p className="text-xs text-gray-500 mt-1 leading-snug">{addr.street_address}, {[addr.landmark_name, addr.state_name].filter(Boolean).join(", ")}</p>
                                                                        {addr.phone && <p className="text-[11px] text-gray-400 mt-1">{addr.phone}</p>}
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <>
                                        <div className="grid grid-cols-2 gap-2 text-xs">
                                            <select
                                                value={destinationIds.country_id}
                                                onChange={handleCountryChange}
                                                className="w-full bg-gray-50 border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:border-blue-400"
                                            >
                                                <option value="">Select Country...</option>
                                                {topology.countries.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                            </select>
                                            <select
                                                value={destinationIds.state_id}
                                                onChange={handleStateChange}
                                                disabled={!destinationIds.country_id}
                                                className="w-full bg-gray-50 border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:border-blue-400 disabled:opacity-50"
                                            >
                                                <option value="">Select State...</option>
                                                {topology.states.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                            </select>
                                        </div>
                                        <select
                                            value={destinationIds.landmark_id}
                                            onChange={handleLandmarkChange}
                                            disabled={!destinationIds.state_id}
                                            className="w-full bg-gray-50 border border-gray-200 rounded-lg px-2 py-1.5 focus:outline-none focus:border-blue-400 text-xs disabled:opacity-50"
                                        >
                                            <option value="">Select Region/Landmark...</option>
                                            {topology.landmarks.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                                        </select>
                                    </>
                                )}
                            </div>

                            {/* Calculation Results */}
                            <div className="mt-3 p-3 bg-gray-50 rounded-xl border border-gray-100 relative">
                                {calculatingShipping && (
                                    <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] flex items-center justify-center rounded-xl z-10 transition-all">
                                        <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                                    </div>
                                )}

                                {shippingError ? (
                                    <div className="flex flex-col items-center justify-center p-2 mb-1 text-center bg-red-50/60 border border-red-100 rounded-lg">
                                        <p className="text-[9px] font-bold text-red-600 uppercase tracking-wider mb-0.5">
                                            {shippingError.includes('does not deliver') ? 'Out of Delivery Range' : 'Estimation Unavailable'}
                                        </p>
                                        <p className="text-[10px] text-red-500 leading-[1.15]">
                                            {shippingError.includes('does not deliver')
                                                ? 'This vendor has not configured shipping logistics to your currently selected destination.'
                                                : shippingError}
                                        </p>
                                    </div>
                                ) : shippingData && activeVendorId && shippingData.breakdowns?.[activeVendorId] ? (
                                    <div className="flex flex-col relative gap-2">
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <p className="text-[10px] text-gray-500 uppercase tracking-wider font-bold">Estimated Fee</p>
                                                <p className="font-bold text-gray-900 mt-0.5">
                                                    {shippingData.breakdowns[activeVendorId].fee === 0 ? <span className="text-green-600">Free</span> : `₦${parseFloat(shippingData.breakdowns[activeVendorId].fee).toLocaleString("en-NG", { minimumFractionDigits: 2 })}`}
                                                </p>
                                                <p className="text-[10px] text-gray-600 font-medium mt-1 inline-flex items-center gap-1">
                                                    <Clock className="w-3 h-3 text-blue-600" />
                                                    Arrives in <span className="text-blue-600 font-bold">{shippingData.breakdowns[activeVendorId].delivery_days_min} - {shippingData.breakdowns[activeVendorId].delivery_days_max} days</span>
                                                </p>
                                            </div>
                                            {unconfigured && (
                                                <div className="bg-orange-100 text-orange-600 text-[10px] uppercase font-bold px-1.5 py-0.5 rounded border border-orange-200">
                                                    Platform Default
                                                </div>
                                            )}
                                        </div>
                                        {unconfigured && (
                                            <div className="bg-orange-50/80 p-2 rounded border border-orange-100">
                                                <p className="text-[10px] text-orange-700 leading-snug">
                                                    <span className="font-bold mb-0.5 block">Notice:</span>
                                                    This vendor has not configured shipping logistics to this location. A generic platform default has been mapped.
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                ) : (
                                    <p className="text-[10px] text-gray-400 text-center py-1">Select destination for estimates.</p>
                                )}
                            </div>
                        </div>
                    </div>
                    {product?.delivery_type === 'express' && (
                        <div className="flex items-center gap-2 text-[10px] text-orange-600 bg-orange-50 rounded-xl px-3 py-2 font-bold uppercase tracking-widest">
                            ⚡ Powered by Platform Fulfillment
                        </div>
                    )}
                </div>
            </div>

            {/* Returns & Buyer Protection */}
            <div className="border border-gray-200 rounded-2xl overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-3">
                    <ShieldCheck className="w-5 h-5 text-blue-600" />
                    <span className="font-semibold text-gray-900 text-sm">Buyer Protection</span>
                </div>
                <div className="px-5 py-4 space-y-3">
                    <div className="flex items-start gap-3">
                        <RefreshCw className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />
                        <div>
                            <p className="text-sm font-semibold text-gray-900">30-Day Free Returns</p>
                            <p className="text-xs text-gray-500 mt-0.5">Return for any reason within 30 days of receiving your order.</p>
                        </div>
                    </div>
                    <div className="flex items-start gap-3">
                        <Package className="w-4 h-4 text-gray-500 mt-0.5 flex-shrink-0" />
                        <div>
                            <p className="text-sm font-semibold text-gray-900">Purchase Protection</p>
                            <p className="text-xs text-gray-500 mt-0.5">Full refund if the item doesn't arrive or doesn't match the description.</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Seller Info */}
            <div className="border border-gray-200 rounded-2xl overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-3">
                    <Store className="w-5 h-5 text-blue-600" />
                    <span className="font-semibold text-gray-900 text-sm">Sold by</span>
                </div>
                <div className="px-5 py-4">
                    <div className="flex items-center gap-3 mb-4">
                        {product?.store_collection?.image_url ? (
                            <img src={product.store_collection.image_url} alt={product.vendor} className="w-12 h-12 rounded-xl object-cover border border-gray-200 flex-shrink-0" />
                        ) : (
                            <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 font-bold text-lg flex-shrink-0">
                                {product?.vendor?.charAt(0)?.toUpperCase() || 'S'}
                            </div>
                        )}
                        <div>
                            <p className="font-bold text-gray-900 text-sm leading-snug">
                                {product?.vendor_verified ? (() => {
                                    // Wrap last word + badge in nowrap so badge never orphans on its own line
                                    const parts = (product?.vendor || 'Official Store').split(' ');
                                    const lastWord = parts.pop();
                                    return (
                                        <>
                                            {parts.length > 0 && parts.join(' ') + ' '}
                                            <span className="whitespace-nowrap">
                                                {lastWord}
                                                <img
                                                    src="/verified.svg"
                                                    alt="Verified Business"
                                                    title="Verified Business"
                                                    className="w-4 h-4 object-contain inline-block align-middle ml-1"
                                                />
                                            </span>
                                        </>
                                    );
                                })() : (product?.vendor || 'Official Store')}
                            </p>
                            <div className="flex items-center gap-1 mt-0.5">
                                <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
                                <span className="text-xs font-semibold text-gray-700">{product?.vendor_stats?.rating_score || '4.8'}</span>
                                <span className="text-xs text-gray-400">({product?.vendor_stats?.total_ratings || 0} ratings)</span>
                            </div>
                        </div>
                        {product?.store_collection?.slug && (
                            <Link href={`/collections/${product.store_collection.slug}`} className="ml-auto self-start flex items-center gap-1 text-xs text-blue-600 font-semibold border border-blue-200 rounded-lg px-3 py-1.5 hover:bg-blue-50 transition-colors whitespace-nowrap">
                                Visit Store <ChevronRight className="w-3 h-3" />
                            </Link>
                        )}
                    </div>
                    <div className="grid grid-cols-3 gap-3 border-t border-gray-100 pt-4">
                        <div className="text-center">
                            <p className="text-lg font-bold text-gray-900">{product?.vendor_stats?.positive_ratings || 0}%</p>
                            <p className="text-[11px] text-gray-500 mt-0.5">Positive ratings</p>
                        </div>
                        <div className="text-center border-x border-gray-100">
                            <p className="text-lg font-bold text-gray-900">
                                {product?.vendor_stats?.items_sold >= 1000
                                    ? (product.vendor_stats.items_sold / 1000).toFixed(1) + 'K+'
                                    : (product?.vendor_stats?.items_sold || 0)}
                            </p>
                            <p className="text-[11px] text-gray-500 mt-0.5">Items sold</p>
                        </div>
                        <div className="text-center">
                            <p className="text-lg font-bold text-gray-900">{product?.vendor_stats?.years_on_platform || 0} yrs</p>
                            <p className="text-[11px] text-gray-500 mt-0.5">On platform</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Coupons & Offers */}
            <div className="border border-dashed border-blue-300 bg-blue-50/50 rounded-2xl overflow-hidden">
                <div className="px-5 py-4 border-b border-blue-100 flex items-center gap-3">
                    <Award className="w-5 h-5 text-blue-600" />
                    <span className="font-semibold text-blue-900 text-sm">Available Coupons</span>
                </div>
                <div className="px-5 py-4 space-y-3">
                    <div className="flex items-center justify-between">
                        <div>
                            <span className="text-xs font-bold text-blue-700 border border-blue-300 rounded px-2 py-0.5 bg-white">SAVE10</span>
                            <p className="text-xs text-gray-600 mt-1.5">10% off on your first order</p>
                        </div>
                        <button className="text-xs text-blue-600 font-bold ml-4">Claim</button>
                    </div>
                    <div className="flex items-center justify-between">
                        <div>
                            <span className="text-xs font-bold text-blue-700 border border-blue-300 rounded px-2 py-0.5 bg-white">FREESHIP</span>
                            <p className="text-xs text-gray-600 mt-1.5">Free shipping on orders $50+</p>
                        </div>
                        <button className="text-xs text-blue-600 font-bold ml-4">Claim</button>
                    </div>
                </div>
            </div>

            {/* Safe Checkout */}
            <div className="border border-gray-200 rounded-2xl px-5 py-4 flex items-center gap-4">
                <ShieldCheck className="w-8 h-8 text-green-600 flex-shrink-0" />
                <div>
                    <p className="text-sm font-semibold text-gray-900">Guaranteed Safe Checkout</p>
                    <p className="text-xs text-gray-500 mt-0.5">Encrypted payments via Stripe & PayPal. Your data is never stored.</p>
                </div>
            </div>

        </div >
    );
}
