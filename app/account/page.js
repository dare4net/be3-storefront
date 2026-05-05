"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/components/providers/AuthContext";
import { useTenant } from "@/components/providers/TenantContext";
import {
    Package,
    User,
    Settings,
    LogOut,
    Mail,
    Calendar,
    ChevronRight,
    Clock,
    CreditCard,
    MapPin,
    Heart
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/Card";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
    { label: "Dashboard", href: "/account", icon: User, active: true },
    { label: "Orders", href: "/account/orders", icon: Package },
    { label: "Account Details", href: "/account/profile", icon: Settings },
    { label: "Addresses", href: "/account/addresses", icon: MapPin },
    { label: "Payment Methods", href: "/account/payments", icon: CreditCard },
    { label: "Wishlist", href: "/wishlist", icon: Heart },
];

export default function AccountPage() {
    const router = useRouter();
    const { isAuthenticated, user, loading, logout } = useAuth();
    const tenant = useTenant();

    useEffect(() => {
        if (!loading && !isAuthenticated) {
            router.push('/login?redirect=/account');
        }
    }, [isAuthenticated, loading, router]);

    if (loading || !user) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50/50">
                <div className="flex flex-col items-center gap-2">
                    <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-sm text-gray-500 font-medium">Loading your account...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50/50">
            <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
                <div className="flex flex-col md:flex-row gap-8">
                    {/* Sidebar Navigation */}
                    <aside className="w-full md:w-64 space-y-2">
                        <div className="px-3 mb-6">
                            <h2 className="text-lg font-semibold text-gray-900">My Account</h2>
                            <p className="text-xs text-gray-500">Manage your profile & orders</p>
                        </div>
                        <nav className="space-y-1">
                            {NAV_ITEMS.map((item) => (
                                <Link
                                    key={item.label}
                                    href={item.href}
                                    className={cn(
                                        "flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors",
                                        item.active
                                            ? "bg-white text-blue-600 shadow-sm border border-gray-100"
                                            : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                                    )}
                                >
                                    <item.icon className={cn("w-4 h-4", item.active ? "text-blue-600" : "text-gray-400")} />
                                    {item.label}
                                    {item.active && <ChevronRight className="ml-auto w-4 h-4" />}
                                </Link>
                            ))}
                            <button
                                onClick={() => {
                                    logout();
                                    router.push('/');
                                }}
                                className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium text-red-600 rounded-lg hover:bg-red-50 transition-colors mt-4"
                            >
                                <LogOut className="w-4 h-4" />
                                Logout
                            </button>
                        </nav>
                    </aside>

                    {/* Main Content */}
                    <main className="flex-1 space-y-8">
                        {/* Welcome Hero */}
                        <Card className="overflow-hidden border-none shadow-md">
                            <div className="h-24 bg-gradient-to-r from-blue-600 to-indigo-700" />
                            <CardContent className="relative pt-0 px-8 pb-8">
                                <div className="flex flex-col md:flex-row items-end gap-6 -mt-12">
                                    <div className="w-24 h-24 bg-white rounded-2xl p-1 shadow-lg ring-4 ring-white">
                                        {user.avatar_url ? (
                                            <img src={user.avatar_url} alt="Profile" className="w-full h-full rounded-xl object-cover" referrerPolicy="no-referrer" />
                                        ) : (
                                            <div className="w-full h-full bg-blue-100 rounded-xl flex items-center justify-center text-blue-700 text-3xl font-bold">
                                                {user.email?.[0]?.toUpperCase()}
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex-1 space-y-1 pb-2">
                                        <h1 className="text-2xl font-bold text-gray-900">
                                            Hello, {user.first_name || user.name || 'Friend'}!
                                        </h1>
                                        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-500">
                                            <div className="flex items-center gap-1.5">
                                                <Mail className="w-3.5 h-3.5" />
                                                {user.email}
                                            </div>
                                            {user.gender && (
                                                <div className="flex items-center gap-1.5 capitalize">
                                                    <User className="w-3.5 h-3.5" />
                                                    {user.gender}
                                                </div>
                                            )}
                                            {user.dob && (
                                                <div className="flex items-center gap-1.5">
                                                    <Calendar className="w-3.5 h-3.5" />
                                                    DOB: {new Date(user.dob).toLocaleDateString()}
                                                </div>
                                            )}
                                            <div className="flex items-center gap-1.5">
                                                <Calendar className="w-3.5 h-3.5" />
                                                Joined {new Date(user.created_at).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
                                            </div>
                                        </div>
                                    </div>
                                    <Button variant="outline" asChild className="mb-2">
                                        <Link href="/account/profile">Edit Profile</Link>
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Stats/Overview Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <Card className="border-none shadow-sm hover:shadow-md transition-shadow group cursor-pointer" onClick={() => router.push('/account/orders')}>
                                <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                                    <CardTitle className="text-sm font-medium">Recent Orders</CardTitle>
                                    <Clock className="h-4 w-4 text-gray-400 group-hover:text-blue-600 transition-colors" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold text-gray-900">View All</div>
                                    <p className="text-xs text-gray-500 mt-1">Check your order history & tracking</p>
                                </CardContent>
                            </Card>

                            <Card className="border-none shadow-sm hover:shadow-md transition-shadow group cursor-pointer" onClick={() => router.push('/wishlist')}>
                                <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                                    <CardTitle className="text-sm font-medium">Your Wishlist</CardTitle>
                                    <Heart className="h-4 w-4 text-gray-400 group-hover:text-purple-600 transition-colors" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold text-gray-900 text-purple-600">Saved</div>
                                    <p className="text-xs text-gray-500 mt-1">Items you&apos;ve bookmarked for later</p>
                                </CardContent>
                            </Card>

                            <Card className="border-none shadow-sm hover:shadow-md transition-shadow group cursor-pointer" onClick={() => router.push('/messages')}>
                                <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                                    <CardTitle className="text-sm font-medium">Messages</CardTitle>
                                    <Mail className="h-4 w-4 text-gray-400 group-hover:text-green-600 transition-colors" />
                                </CardHeader>
                                <CardContent>
                                    <div className="text-2xl font-bold text-green-600">Inbox</div>
                                    <p className="text-xs text-gray-500 mt-1">Talk to vendors and store support</p>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Recent Activity / Recommendations Placeholder */}
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            <Card className="border-none shadow-sm">
                                <CardHeader>
                                    <CardTitle>Recent Orders</CardTitle>
                                    <CardDescription>You haven&apos;t placed any orders recently.</CardDescription>
                                </CardHeader>
                                <CardContent className="h-32 flex items-center justify-center border-t border-gray-50">
                                    <Button variant="link" asChild>
                                        <Link href="/">Start Shopping</Link>
                                    </Button>
                                </CardContent>
                            </Card>

                            <Card className="border-none shadow-sm">
                                <CardHeader>
                                    <CardTitle>Store Announcements</CardTitle>
                                    <CardDescription>Stay updated with our latest news.</CardDescription>
                                </CardHeader>
                                <CardContent className="h-32 flex items-center justify-center border-t border-gray-50">
                                    <p className="text-sm text-gray-400">No new announcements today.</p>
                                </CardContent>
                            </Card>
                        </div>
                    </main>
                </div>
            </div>
        </div>
    );
}

