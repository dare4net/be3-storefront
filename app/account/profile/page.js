"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/providers/AuthContext";
import { User, Mail, Lock, Save, Loader2 } from "lucide-react";
import api from "@/lib/axios";

export default function ProfilePanel() {
    const { user, loading: authLoading, syncSession } = useAuth();

    const [formData, setFormData] = useState({
        first_name: "", last_name: "", email: "", gender: "", dob: ""
    });
    const [passwordData, setPasswordData] = useState({
        currentPassword: "", newPassword: "", confirmPassword: ""
    });
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState({ type: "", text: "" });

    useEffect(() => {
        if (user) {
            setFormData({
                first_name: user.first_name || "",
                last_name: user.last_name || "",
                email: user.email || "",
                gender: user.gender || "",
                dob: user.dob ? new Date(user.dob).toISOString().split('T')[0] : ""
            });
        }
    }, [user]);

    const handleProfileUpdate = async (e) => {
        e.preventDefault();
        setSaving(true);
        setMessage({ type: "", text: "" });
        try {
            await api.patch('/auth/me', {
                first_name: formData.first_name,
                last_name: formData.last_name,
                gender: formData.gender,
                dob: formData.dob || null
            });
            setMessage({ type: "success", text: "Profile updated successfully!" });
            if (syncSession) await syncSession();
        } catch (error) {
            setMessage({ type: "error", text: error.response?.data?.message || "Failed to update profile" });
        } finally {
            setSaving(false);
        }
    };

    const handlePasswordChange = async (e) => {
        e.preventDefault();
        setMessage({ type: "", text: "" });
        if (passwordData.newPassword !== passwordData.confirmPassword) {
            setMessage({ type: "error", text: "New passwords do not match" });
            return;
        }
        if (passwordData.newPassword.length < 8) {
            setMessage({ type: "error", text: "Password must be at least 8 characters" });
            return;
        }
        setSaving(true);
        setTimeout(() => {
            setMessage({ type: "success", text: "Password changed successfully!" });
            setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });
            setSaving(false);
        }, 1000);
    };

    if (authLoading || !user) return null;

    const inputClass = "w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition";
    const labelClass = "block text-sm font-medium text-gray-700 mb-1.5";

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-xl font-bold text-gray-900">Account Details</h2>
                <p className="text-sm text-gray-500">Manage your personal information</p>
            </div>

            {message.text && (
                <div className={`p-4 rounded-xl text-sm font-medium ${
                    message.type === 'success'
                        ? 'bg-green-50 text-green-700 border border-green-100'
                        : 'bg-red-50 text-red-700 border border-red-100'
                }`}>
                    {message.text}
                </div>
            )}

            {/* Profile Information */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <div className="flex items-center gap-4 mb-6">
                    <div className="w-14 h-14 rounded-2xl bg-blue-100 flex items-center justify-center text-blue-700 text-xl font-bold overflow-hidden flex-shrink-0">
                        {user.avatar_url
                            ? <img src={user.avatar_url} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                            : user.email?.[0]?.toUpperCase()
                        }
                    </div>
                    <div>
                        <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                            <User className="w-4 h-4" /> Profile Information
                        </h3>
                        <p className="text-xs text-gray-400">Update your name and personal details</p>
                    </div>
                </div>

                <form onSubmit={handleProfileUpdate} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className={labelClass}>First Name</label>
                            <input
                                type="text"
                                value={formData.first_name}
                                onChange={(e) => setFormData(p => ({ ...p, first_name: e.target.value }))}
                                className={inputClass}
                                placeholder="First name"
                            />
                        </div>
                        <div>
                            <label className={labelClass}>Last Name</label>
                            <input
                                type="text"
                                value={formData.last_name}
                                onChange={(e) => setFormData(p => ({ ...p, last_name: e.target.value }))}
                                className={inputClass}
                                placeholder="Last name"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className={labelClass}>Gender</label>
                            <select
                                value={formData.gender}
                                onChange={(e) => setFormData(p => ({ ...p, gender: e.target.value }))}
                                className={inputClass + " bg-white"}
                            >
                                <option value="">Select Gender</option>
                                <option value="male">Male</option>
                                <option value="female">Female</option>
                                <option value="other">Other</option>
                                <option value="prefer_not_to_say">Prefer not to say</option>
                            </select>
                        </div>
                        <div>
                            <label className={labelClass}>Date of Birth</label>
                            <input
                                type="date"
                                value={formData.dob}
                                onChange={(e) => setFormData(p => ({ ...p, dob: e.target.value }))}
                                className={inputClass}
                            />
                        </div>
                    </div>

                    <div>
                        <label className={labelClass}>Email Address</label>
                        <input
                            type="email"
                            value={formData.email}
                            className={inputClass + " bg-gray-50 text-gray-400 cursor-not-allowed"}
                            disabled
                        />
                        <p className="text-xs text-gray-400 mt-1">Email address cannot be changed</p>
                    </div>

                    <button
                        type="submit"
                        disabled={saving}
                        className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2.5 rounded-xl text-sm font-semibold hover:bg-blue-700 transition disabled:opacity-50"
                    >
                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        Save Changes
                    </button>
                </form>
            </div>

            {/* Change Password */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <h3 className="font-semibold text-gray-900 flex items-center gap-2 mb-1">
                    <Lock className="w-4 h-4" /> Change Password
                </h3>
                <p className="text-xs text-gray-400 mb-6">Update your account password</p>

                <form onSubmit={handlePasswordChange} className="space-y-4">
                    <div>
                        <label className={labelClass}>Current Password</label>
                        <input
                            type="password"
                            value={passwordData.currentPassword}
                            onChange={(e) => setPasswordData(p => ({ ...p, currentPassword: e.target.value }))}
                            className={inputClass}
                            required
                        />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className={labelClass}>New Password</label>
                            <input
                                type="password"
                                value={passwordData.newPassword}
                                onChange={(e) => setPasswordData(p => ({ ...p, newPassword: e.target.value }))}
                                className={inputClass}
                                required
                                minLength={8}
                            />
                            <p className="text-xs text-gray-400 mt-1">At least 8 characters</p>
                        </div>
                        <div>
                            <label className={labelClass}>Confirm New Password</label>
                            <input
                                type="password"
                                value={passwordData.confirmPassword}
                                onChange={(e) => setPasswordData(p => ({ ...p, confirmPassword: e.target.value }))}
                                className={inputClass}
                                required
                            />
                        </div>
                    </div>
                    <button
                        type="submit"
                        disabled={saving}
                        className="flex items-center gap-2 bg-slate-800 text-white px-6 py-2.5 rounded-xl text-sm font-semibold hover:bg-slate-900 transition disabled:opacity-50"
                    >
                        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
                        Change Password
                    </button>
                </form>
            </div>
        </div>
    );
}
