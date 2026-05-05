"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/components/providers/AuthContext";
import {
    Package, User, Settings, Mail, Calendar,
    Clock, CreditCard, MapPin, Heart,
    CheckCircle, AlertCircle, Loader2
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { cn } from "@/lib/utils";
import api from "@/lib/axios";

function VerificationBanner({ user }) {
    const [status, setStatus] = useState("idle");
    const [message, setMessage] = useState("");

    if (user.email_verified) return null;

    const handleResend = async () => {
        setStatus("loading");
        try {
            await api.post('/auth/resend-verification', { email: user.email });
            setStatus("sent");
            setMessage("A new verification link has been sent to your inbox.");
        } catch (error) {
            setStatus("error");
            setMessage(error.response?.data?.message || "Failed to resend link. Please try again later.");
        }
    };

    return (
        <div className={cn(
            "p-4 rounded-xl mb-6 flex flex-col sm:flex-row items-center justify-between gap-4 border",
            status === "sent" ? "bg-green-50 border-green-100" : "bg-amber-50 border-amber-100"
        )}>
            <div className="flex items-center gap-3">
                <div className={cn("p-2 rounded-full", status === "sent" ? "bg-green-100 text-green-600" : "bg-amber-100 text-amber-600")}>
                    {status === "sent" ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                </div>
                <div>
                    <p className={cn("text-sm font-semibold", status === "sent" ? "text-green-900" : "text-amber-900")}>
                        {status === "sent" ? "Verification Email Sent" : "Account Verification Required"}
                    </p>
                    <p className={cn("text-xs", status === "sent" ? "text-green-700" : "text-amber-700")}>
                        {status === "sent" ? message : `Please verify your email address (${user.email}) to secure your account.`}
                    </p>
                </div>
            </div>
            {status !== "sent" && (
                <button
                    onClick={handleResend}
                    disabled={status === "loading"}
                    className="flex items-center gap-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold py-2 px-4 rounded-lg transition-all disabled:opacity-50"
                >
                    {status === "loading" ? <Loader2 className="w-3 h-3 animate-spin" /> : <Mail className="w-3 h-3" />}
                    Resend Verification Link
                </button>
            )}
        </div>
    );
}

export default function AccountDashboard() {
    const router = useRouter();
    const { user } = useAuth();

    // The layout shell handles auth redirect + loading state.
    // If we somehow render before user is ready, return nothing.
    if (!user) return null;

    return (
        <div className="space-y-6">
            <VerificationBanner user={user} />

            {/* Welcome Hero Card */}
            <Card className="overflow-hidden border-none shadow-md">
                <div className="h-24 bg-gradient-to-r from-blue-600 to-indigo-700" />
                <CardContent className="relative pt-0 px-6 pb-6">
                    <div className="flex flex-col sm:flex-row items-end gap-4 -mt-10">
                        <div className="w-20 h-20 bg-white rounded-2xl p-1 shadow-lg ring-4 ring-white flex-shrink-0">
                            {user.avatar_url ? (
                                <img src={user.avatar_url} alt="Profile" className="w-full h-full rounded-xl object-cover" referrerPolicy="no-referrer" />
                            ) : (
                                <div className="w-full h-full bg-blue-100 rounded-xl flex items-center justify-center text-blue-700 text-2xl font-bold">
                                    {user.email?.[0]?.toUpperCase()}
                                </div>
                            )}
                        </div>
                        <div className="flex-1 space-y-1 pb-1">
                            <h1 className="text-xl font-bold text-gray-900">
                                Hello, {user.first_name || 'Friend'}!
                            </h1>
                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500">
                                <div className="flex items-center gap-1.5">
                                    <Mail className="w-3 h-3" />
                                    {user.email}
                                </div>
                                {user.dob && (
                                    <div className="flex items-center gap-1.5">
                                        <Calendar className="w-3 h-3" />
                                        DOB: {new Date(user.dob).toLocaleDateString()}
                                    </div>
                                )}
                                <div className="flex items-center gap-1.5">
                                    <Calendar className="w-3 h-3" />
                                    Joined {new Date(user.created_at).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
                                </div>
                            </div>
                        </div>
                        <Button variant="outline" asChild className="mb-1 flex-shrink-0">
                            <Link href="/account/profile">Edit Profile</Link>
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Quick Links Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Card className="border-none shadow-sm hover:shadow-md transition-shadow group cursor-pointer" onClick={() => router.push('/account/orders')}>
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                        <CardTitle className="text-sm font-medium">My Orders</CardTitle>
                        <Clock className="h-4 w-4 text-gray-400 group-hover:text-blue-600 transition-colors" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-xl font-bold text-gray-900">View All</div>
                        <p className="text-xs text-gray-500 mt-1">Track your order history</p>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-sm hover:shadow-md transition-shadow group cursor-pointer" onClick={() => router.push('/wishlist')}>
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                        <CardTitle className="text-sm font-medium">Wishlist</CardTitle>
                        <Heart className="h-4 w-4 text-gray-400 group-hover:text-pink-600 transition-colors" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-xl font-bold text-gray-900">Saved</div>
                        <p className="text-xs text-gray-500 mt-1">Items bookmarked for later</p>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-sm hover:shadow-md transition-shadow group cursor-pointer" onClick={() => router.push('/messages')}>
                    <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                        <CardTitle className="text-sm font-medium">Messages</CardTitle>
                        <Mail className="h-4 w-4 text-gray-400 group-hover:text-green-600 transition-colors" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-xl font-bold text-green-600">Inbox</div>
                        <p className="text-xs text-gray-500 mt-1">Chat with vendors & support</p>
                    </CardContent>
                </Card>
            </div>

            {/* Recent Activity placeholders */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="border-none shadow-sm">
                    <CardHeader>
                        <CardTitle>Recent Orders</CardTitle>
                        <CardDescription>Your most recent purchases</CardDescription>
                    </CardHeader>
                    <CardContent className="h-32 flex items-center justify-center border-t border-gray-50">
                        <Button variant="link" asChild>
                            <Link href="/account/orders">View Orders</Link>
                        </Button>
                    </CardContent>
                </Card>

                <Card className="border-none shadow-sm">
                    <CardHeader>
                        <CardTitle>Store Announcements</CardTitle>
                        <CardDescription>Stay updated with the latest news.</CardDescription>
                    </CardHeader>
                    <CardContent className="h-32 flex items-center justify-center border-t border-gray-50">
                        <p className="text-sm text-gray-400">No new announcements today.</p>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
