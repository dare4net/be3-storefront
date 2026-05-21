"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/components/providers/AuthContext";
import { useTenant } from "@/components/providers/TenantContext";
import api from "@/lib/axios";
import { MapPin, Plus, Trash2, Edit2, Loader2, CheckCircle, Home } from "lucide-react";
import { Button } from "@/components/ui/Button";

export default function AddressesPage() {
    const { user, token } = useAuth();
    const tenant = useTenant();

    const [addresses, setAddresses] = useState([]);
    const [loading, setLoading] = useState(true);

    const [showModal, setShowModal] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [isSaving, setIsSaving] = useState(false);

    // Modal Form State
    const [formData, setFormData] = useState({
        first_name: "",
        last_name: "",
        phone: "",
        street_address: "",
        country_id: "",
        state_id: "",
        landmark_id: "",
        is_default: false
    });

    const [topology, setTopology] = useState({ countries: [], states: [], landmarks: [] });

    const fetchAddresses = async () => {
        if (!token || !user || !tenant?.id) return;
        setLoading(true);
        try {
            const res = await api.get('/auth/me/addresses', {
                headers: { 'X-Tenant-ID': tenant.id, 'Authorization': `Bearer ${token}` }
            });
            setAddresses(res.data.addresses || []);
        } catch (e) {
            console.error("Failed to load addresses", e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchAddresses(); }, [token, tenant, user]);

    useEffect(() => {
        if (!showModal) return;
        const loadInitialTopology = async () => {
            try {
                const res = await api.get("/shipping/topology/countries", { headers: { 'X-Tenant-ID': tenant?.id } });
                const countries = res.data.countries || [];
                setTopology(prev => ({ ...prev, countries }));

                if (formData.country_id) {
                    const sRes = await api.get(`/shipping/topology/states?country_id=${formData.country_id}`, { headers: { 'X-Tenant-ID': tenant?.id } });
                    setTopology(prev => ({ ...prev, states: sRes.data.states || [] }));
                }
                if (formData.state_id) {
                    const lRes = await api.get(`/shipping/topology/landmarks?state_id=${formData.state_id}`, { headers: { 'X-Tenant-ID': tenant?.id } });
                    setTopology(prev => ({ ...prev, landmarks: lRes.data.landmarks || [] }));
                }
            } catch (e) {
                console.error("Topology UI error", e);
            }
        };
        loadInitialTopology();
    }, [showModal, tenant]);

    const handleCountryChange = async (e) => {
        const cId = e.target.value;
        setFormData(prev => ({ ...prev, country_id: cId, state_id: "", landmark_id: "" }));
        setTopology(prev => ({ ...prev, states: [], landmarks: [] }));
        if (cId) {
            try {
                const res = await api.get(`/shipping/topology/states?country_id=${cId}`, { headers: { 'X-Tenant-ID': tenant?.id } });
                setTopology(prev => ({ ...prev, states: res.data.states || [] }));
            } catch (err) { }
        }
    };

    const handleStateChange = async (e) => {
        const sId = e.target.value;
        setFormData(prev => ({ ...prev, state_id: sId, landmark_id: "" }));
        setTopology(prev => ({ ...prev, landmarks: [] }));
        if (sId) {
            try {
                const res = await api.get(`/shipping/topology/landmarks?state_id=${sId}`, { headers: { 'X-Tenant-ID': tenant?.id } });
                setTopology(prev => ({ ...prev, landmarks: res.data.landmarks || [] }));
            } catch (err) { }
        }
    };

    const openCreateModal = () => {
        setFormData({ first_name: user?.first_name || "", last_name: user?.last_name || "", phone: "", street_address: "", country_id: "", state_id: "", landmark_id: "", is_default: false });
        setEditingId(null);
        setShowModal(true);
    };

    const openEditModal = (addr) => {
        setFormData({
            first_name: addr.first_name,
            last_name: addr.last_name,
            phone: addr.phone,
            street_address: addr.street_address,
            country_id: addr.country_id || "",
            state_id: addr.state_id || "",
            landmark_id: addr.landmark_id || "",
            is_default: addr.is_default
        });
        setEditingId(addr.id);
        setShowModal(true);
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const payload = {
                ...formData,
                country_id: formData.country_id ? parseInt(formData.country_id) : null,
                state_id: formData.state_id ? parseInt(formData.state_id) : null,
                landmark_id: formData.landmark_id ? parseInt(formData.landmark_id) : null,
            };
            if (editingId) {
                await api.put(`/auth/me/addresses/${editingId}`, payload, { headers: { 'Authorization': `Bearer ${token}`, 'X-Tenant-ID': tenant?.id } });
            } else {
                await api.post(`/auth/me/addresses`, payload, { headers: { 'Authorization': `Bearer ${token}`, 'X-Tenant-ID': tenant?.id } });
            }
            setShowModal(false);
            fetchAddresses();
        } catch (e) {
            console.error("Save error", e);
            alert("Failed to save address.");
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm("Are you sure you want to delete this address?")) return;
        try {
            await api.delete(`/auth/me/addresses/${id}`, { headers: { 'Authorization': `Bearer ${token}`, 'X-Tenant-ID': tenant?.id } });
            fetchAddresses();
        } catch (e) {
            console.error("Delete error", e);
        }
    };

    const setAsDefault = async (id) => {
        try {
            await api.put(`/auth/me/addresses/${id}/set-default`, {}, { headers: { 'Authorization': `Bearer ${token}`, 'X-Tenant-ID': tenant?.id } });
            fetchAddresses();
        } catch (e) {
            console.error("Set default error", e);
        }
    };

    if (!user) return null;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-bold text-gray-900">Saved Addresses</h1>
                    <p className="text-sm text-gray-500">Manage your shipping and delivery addresses</p>
                </div>
                <Button onClick={openCreateModal} className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white">
                    <Plus className="w-4 h-4" /> Add Address
                </Button>
            </div>

            {loading ? (
                <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-gray-400" /></div>
            ) : addresses.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-xl border border-gray-100 flex flex-col items-center justify-center">
                    <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mb-3">
                        <MapPin className="w-5 h-5 text-gray-400" />
                    </div>
                    <p className="text-gray-500 text-sm font-medium">You haven't saved any addresses yet.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {addresses.map(addr => (
                        <div key={addr.id} className={`bg-white border rounded-xl overflow-hidden ${addr.is_default ? 'border-blue-200 shadow-sm' : 'border-gray-100'}`}>
                            {addr.is_default && (
                                <div className="bg-blue-50 text-blue-700 text-[10px] font-bold uppercase tracking-wider px-4 py-1.5 flex items-center gap-1.5 border-b border-blue-100">
                                    <CheckCircle className="w-3.5 h-3.5" /> Default Address
                                </div>
                            )}
                            <div className="p-5">
                                <div className="flex items-start justify-between">
                                    <div className="flex items-start gap-3">
                                        <div className={`mt-0.5 w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${addr.is_default ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-500'}`}>
                                            <Home className="w-4 h-4" />
                                        </div>
                                        <div>
                                            <p className="font-bold text-gray-900 leading-tight">{addr.first_name} {addr.last_name}</p>
                                            <p className="text-sm font-medium text-gray-600 mt-0.5">{addr.phone}</p>
                                            <div className="mt-2 text-sm text-gray-500 leading-relaxed">
                                                <p>{addr.street_address}</p>
                                                <p>{[addr.landmark_name, addr.state_name, addr.country_name].filter(Boolean).join(", ")}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-5 pt-4 border-t border-gray-50 flex items-center justify-between">
                                    {!addr.is_default ? (
                                        <button onClick={() => setAsDefault(addr.id)} className="text-xs font-semibold text-blue-600 hover:text-blue-700">Set as Default</button>
                                    ) : (
                                        <span className="text-xs text-gray-400">Default Address</span>
                                    )}
                                    <div className="flex items-center gap-3">
                                        <button onClick={() => openEditModal(addr)} className="text-gray-400 hover:text-gray-600 transition-colors">
                                            <Edit2 className="w-4 h-4" />
                                        </button>
                                        <button onClick={() => handleDelete(addr.id)} className="text-gray-400 hover:text-red-500 transition-colors">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Address Modal */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setShowModal(false)} />
                    <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl relative overflow-hidden flex flex-col max-h-[90vh]">
                        <div className="p-5 border-b border-gray-100 flex items-center justify-between bg-white z-10">
                            <h3 className="text-lg font-bold text-gray-900">{editingId ? 'Edit Address' : 'Add New Address'}</h3>
                            <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">×</button>
                        </div>

                        <div className="p-5 overflow-y-auto space-y-4 bg-gray-50 flex-1">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase">First Name</label>
                                    <input type="text" value={formData.first_name} onChange={e => setFormData(p => ({ ...p, first_name: e.target.value }))} className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-100 outline-none" />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase">Last Name</label>
                                    <input type="text" value={formData.last_name} onChange={e => setFormData(p => ({ ...p, last_name: e.target.value }))} className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-100 outline-none" />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase">Phone Number</label>
                                <input type="tel" value={formData.phone} onChange={e => setFormData(p => ({ ...p, phone: e.target.value }))} className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-100 outline-none" />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase">Country</label>
                                <select value={formData.country_id} onChange={handleCountryChange} className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-100 outline-none disabled:bg-gray-100">
                                    <option value="">Select Country</option>
                                    {topology.countries.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase">State / Region</label>
                                    <select disabled={!formData.country_id} value={formData.state_id} onChange={handleStateChange} className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-100 outline-none disabled:bg-gray-100">
                                        <option value="">Select State</option>
                                        {topology.states.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase">City / LGA</label>
                                    <select disabled={!formData.state_id} value={formData.landmark_id} onChange={e => setFormData(p => ({ ...p, landmark_id: e.target.value }))} className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-100 outline-none disabled:bg-gray-100">
                                        <option value="">Select City</option>
                                        {topology.landmarks.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase">Street Address</label>
                                <textarea rows="2" value={formData.street_address} onChange={e => setFormData(p => ({ ...p, street_address: e.target.value }))} className="w-full bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-100 outline-none resize-none" placeholder="123 Example Street, Apt 4B..."></textarea>
                            </div>

                            <div className="pt-2">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input type="checkbox" checked={formData.is_default} onChange={e => setFormData(p => ({ ...p, is_default: e.target.checked }))} className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500" />
                                    <span className="text-sm font-semibold text-gray-700">Set as my default address</span>
                                </label>
                            </div>
                        </div>

                        <div className="p-5 border-t border-gray-100 bg-white flex justify-end gap-3 rounded-b-2xl">
                            <Button variant="outline" onClick={() => setShowModal(false)} disabled={isSaving}>Cancel</Button>
                            <Button className="bg-blue-600 hover:bg-blue-700 text-white" disabled={isSaving || !formData.first_name || !formData.phone || !formData.street_address} onClick={handleSave}>
                                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Address"}
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
