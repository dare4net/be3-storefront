"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/components/providers/AuthContext";
import { Package, User, Settings, LogOut, Mail, Calendar } from "lucide-react";

export default function AccountPage() {
    const router = useRouter();
    const { isAuthenticated, user, loading, logout } = useAuth();

    useEffect(() => {
        if (!loading && !isAuthenticated) {
            router.push('/login?redirect=/account');
        }
    }, [isAuthenticated, loading, router]);

    if (loading || !user) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-gray-600">Loading...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-12">
            <div className="max-w-4xl mx-auto px-4">
                {/* Welcome Section */}
                <div className="bg-white rounded-lg shadow-sm p-8 mb-8">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                            {user.email?.[0]?.toUpperCase()}
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">
                                Welcome back, {user.first_name || 'Friend'}!
                            </h1>
                            <p className="text-gray-500">Manage your account and view your orders</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                        <div className="flex items-center gap-3 text-gray-700">
                            <Mail className="w-5 h-5 text-gray-400" />
                            <span>{user.email}</span>
                        </div>
                        <div className="flex items-center gap-3 text-gray-700">
                            <Calendar className="w-5 h-5 text-gray-400" />
                            <span>Member since {new Date(user.created_at).toLocaleDateString()}</span>
                        </div>
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Link
                        href="/account/orders"
                        className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition group"
                    >
                        <div className="flex flex-col items-center text-center">
                            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mb-4 group-hover:bg-blue-600 transition">
                                <Package className="w-6 h-6 text-blue-600 group-hover:text-white" />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">My Orders</h3>
                            <p className="text-sm text-gray-500">View and track your orders</p>
                        </div>
                    </Link>

                    <Link
                        href="/account/profile"
                        className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition group"
                    >
                        <div className="flex flex-col items-center text-center">
                            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mb-4 group-hover:bg-purple-600 transition">
                                <User className="w-6 h-6 text-purple-600 group-hover:text-white" />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">Profile</h3>
                            <p className="text-sm text-gray-500">Update your information</p>
                        </div>
                    </Link>

                    <button
                        onClick={() => {
                            logout();
                            router.push('/');
                        }}
                        className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition group"
                    >
                        <div className="flex flex-col items-center text-center">
                            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4 group-hover:bg-red-600 transition">
                                <LogOut className="w-6 h-6 text-red-600 group-hover:text-white" />
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">Logout</h3>
                            <p className="text-sm text-gray-500">Sign out of your account</p>
                        </div>
                    </button>
                </div>
            </div>
        </div>
    );
}
