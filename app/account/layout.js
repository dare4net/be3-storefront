"use client";

/**
 * Account Layout Shell
 * 
 * Desktop: Persistent 2-column layout (sidebar + content) — sidebar never disappears.
 * Mobile:  Nav grid shown first. Tapping an item slides into the content panel.
 *          A back arrow returns to the nav grid.
 */

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/components/providers/AuthContext";
import {
    Package,
    User,
    Settings,
    LogOut,
    Heart,
    CreditCard,
    MapPin,
    MessageCircle,
    ChevronRight,
    ArrowLeft,
    ShieldCheck,
    Wallet,
    Crown,
    Store,
} from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
    { label: "My Orders",       href: "/account/orders",           icon: Package,          color: "text-violet-600", bg: "bg-violet-50" },
    { label: "Wishlist",        href: "/wishlist",                 icon: Heart,            color: "text-pink-600",   bg: "bg-pink-50"   },
    { label: "Messages",        href: "/account/messages",         icon: MessageCircle,    color: "text-green-600",  bg: "bg-green-50",  badgeKey: "messages" },
    { label: "Account Details", href: "/account/profile",          icon: Settings,         color: "text-slate-600",  bg: "bg-slate-50"  },
    { label: "Addresses",       href: "/account/addresses",        icon: MapPin,           color: "text-rose-600",   bg: "bg-rose-50"   },
    { label: "Payment Methods", href: "/account/payments",         icon: CreditCard,       color: "text-amber-600",  bg: "bg-amber-50"  },
    { label: "Verification",    href: "/account/verification",     icon: ShieldCheck,      color: "text-teal-600",   bg: "bg-teal-50"   },
    { label: "Store Credits",   href: "/account/credits",          icon: Wallet,           color: "text-emerald-600",bg: "bg-emerald-50"},
    { label: "Shop",            href: "/account/apply",            icon: Store,            color: "text-orange-600", bg: "bg-orange-50" },
];

function SidebarNav({ pathname, onLogout, user }) {
    return (
        <nav className="space-y-0.5 p-2 flex-1">
            {NAV_ITEMS.map((item) => {
                const active = pathname === item.href || (item.href !== "/account" && pathname.startsWith(item.href));
                // Avoid double-highlighting: Verification shares href with Account Details
                const isVerification = item.dotKey === "verification";
                const isAccountDetails = item.label === "Account Details";
                const profileActive = pathname === "/account/profile" || pathname.startsWith("/account/profile");
                
                let isActive = active;
                if (isVerification && profileActive) isActive = false; // Account Details takes priority
                if (isAccountDetails && profileActive) isActive = true;

                return (
                    <Link
                        key={item.label}
                        href={item.href}
                        className={cn(
                            "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all",
                            isActive
                                ? `${item.bg} ${item.color} shadow-sm`
                                : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                        )}
                    >
                        <div className={cn(
                            "w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-all",
                            isActive ? `${item.bg} ${item.color}` : "bg-gray-100 text-gray-400"
                        )}>
                            <item.icon className="w-4 h-4" />
                        </div>
                        <span>{item.label}</span>

                        {/* Badge count for messages */}
                        {item.badgeKey === "messages" && (
                            <span className="ml-auto bg-blue-600 text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center">
                                2
                            </span>
                        )}

                        {/* Verification dot */}
                        {item.dotKey === "verification" && (
                            <span className={cn(
                                "ml-auto w-2.5 h-2.5 rounded-full",
                                user?.email_verified ? "bg-green-500" : "bg-amber-500"
                            )} />
                        )}

                        {isActive && !item.badgeKey && !item.dotKey && <ChevronRight className="ml-auto w-4 h-4 opacity-50" />}
                    </Link>
                );
            })}
            <button
                onClick={onLogout}
                className="w-full flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-red-500 rounded-xl hover:bg-red-50 transition-all mt-2"
            >
                <div className="w-8 h-8 rounded-lg bg-red-50 flex items-center justify-center flex-shrink-0">
                    <LogOut className="w-4 h-4 text-red-500" />
                </div>
                Logout
            </button>
        </nav>
    );
}

function Be3PlusCard() {
    return (
        <div className="mx-3 mb-3 p-4 rounded-2xl bg-gradient-to-br from-blue-700 via-blue-800 to-indigo-900 text-white">
            <div className="flex items-center gap-2 mb-2">
                <Crown className="w-4 h-4 text-yellow-400" />
                <span className="text-sm font-bold">BE3 Plus</span>
            </div>
            <p className="text-xs text-blue-100 leading-relaxed mb-3">
                Free shipping, exclusive deals & extra savings.
            </p>
            <button className="w-full bg-blue-500 hover:bg-blue-400 text-white text-xs font-bold py-2 px-3 rounded-lg transition-colors">
                Explore Benefits
            </button>
        </div>
    );
}

function MobileNavGrid({ onNavigate, user }) {
    return (
        <div className="flex-1 px-4 py-6">
            {/* User pill */}
            <div className="flex items-center gap-3 mb-8 px-1">
                <div className="w-12 h-12 rounded-2xl bg-blue-100 flex items-center justify-center text-blue-700 text-xl font-bold flex-shrink-0 overflow-hidden">
                    {user?.avatar_url
                        ? <img src={user.avatar_url} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        : user?.email?.[0]?.toUpperCase()
                    }
                </div>
                <div>
                    <p className="font-bold text-gray-900 text-base leading-tight">
                        {user?.first_name ? `${user.first_name} ${user.last_name || ''}` : user?.email}
                    </p>
                    <p className="text-xs text-gray-400 truncate max-w-[200px]">{user?.email}</p>
                </div>
            </div>

            {/* Nav grid */}
            <div className="grid grid-cols-3 gap-3">
                {NAV_ITEMS.map((item) => (
                    <button
                        key={item.label}
                        onClick={() => onNavigate(item.href)}
                        className={cn(
                            "flex flex-col items-center justify-center gap-2 p-4 rounded-2xl border border-gray-100 bg-white shadow-sm",
                            "hover:shadow-md hover:-translate-y-0.5 transition-all active:scale-95 cursor-pointer"
                        )}
                    >
                        <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center relative", item.bg, item.color)}>
                            <item.icon className="w-5 h-5" />
                            {item.badgeKey === "messages" && (
                                <span className="absolute -top-1 -right-1 bg-blue-600 text-white text-[8px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                                    2
                                </span>
                            )}
                            {item.dotKey === "verification" && (
                                <span className={cn(
                                    "absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white",
                                    user?.email_verified ? "bg-green-500" : "bg-amber-500"
                                )} />
                            )}
                        </div>
                        <span className="text-xs font-medium text-gray-700 text-center leading-tight">{item.label}</span>
                    </button>
                ))}
            </div>
        </div>
    );
}

export default function AccountLayout({ children }) {
    const router = useRouter();
    const pathname = usePathname();
    const { isAuthenticated, user, loading, logout } = useAuth();

    // Mobile state: null = show nav grid, string = show content (the path)
    const [mobileView, setMobileView] = useState(null);

    // When pathname changes (e.g. user navigates via browser back), sync mobile view
    useEffect(() => {
        if (pathname !== "/account") {
            setMobileView(pathname);
        } else {
            setMobileView(null);
        }
    }, [pathname]);

    useEffect(() => {
        if (!loading && !isAuthenticated) {
            router.push("/login?redirect=/account");
        }
    }, [isAuthenticated, loading, router]);

    if (loading || !user) {
        return (
            <div className="flex items-center justify-center py-32 bg-gray-50">
                <div className="flex flex-col items-center gap-3">
                    <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
                    <p className="text-sm text-gray-400 font-medium">Loading your account...</p>
                </div>
            </div>
        );
    }

    const handleLogout = () => {
        logout();
        router.push("/");
    };

    const handleMobileNavigate = (href) => {
        setMobileView(href);
        router.push(href);
    };

    const memberSince = new Date(user.created_at).toLocaleDateString(undefined, { month: 'short', year: 'numeric' });

    return (
        <div className="bg-gray-50/60">
            {/* ================================================================
                DESKTOP LAYOUT — Always 2 columns
            ================================================================ */}
            <div className="hidden md:block max-w-7xl mx-auto px-4 pt-4 pb-8 sm:px-6 lg:px-8">

                <div className="flex gap-8 items-start">
                    {/* Sidebar */}
                    <aside className="w-64 flex-shrink-0 bg-white rounded-2xl border border-gray-100 sticky top-24 overflow-hidden flex flex-col">
                        {/* Profile strip — dark blue gradient */}
                        <div className="px-4 py-5 bg-gradient-to-br from-blue-700 via-blue-800 to-indigo-900 rounded-t-2xl">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center text-white font-bold text-lg overflow-hidden flex-shrink-0">
                                    {user.avatar_url
                                        ? <img src={user.avatar_url} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                                        : user.email?.[0]?.toUpperCase()
                                    }
                                </div>
                                <div className="min-w-0">
                                    <p className="text-sm font-semibold text-white truncate">
                                        {user.first_name ? `${user.first_name} ${user.last_name || ''}` : 'My Account'}
                                    </p>
                                    <p className="text-xs text-blue-200 truncate">{user.email}</p>
                                </div>
                            </div>
                            <div className="mt-2">
                                <span className="inline-flex items-center gap-1 bg-white/15 text-blue-100 text-[10px] font-medium px-2 py-0.5 rounded-full">
                                    Member since {memberSince}
                                </span>
                            </div>
                        </div>

                        <SidebarNav pathname={pathname} onLogout={handleLogout} user={user} />

                        {/* BE3 Plus promo */}
                        <Be3PlusCard />
                    </aside>

                    {/* Main Content — renders children (sub-pages) inline */}
                    <main className="flex-1 min-w-0">
                        {children}
                    </main>
                </div>
            </div>

            {/* ================================================================
                MOBILE LAYOUT — Nav grid OR content panel (never both)
            ================================================================ */}
            <div className="md:hidden flex flex-col min-h-screen">
                {/* Mobile Header */}
                <div className="sticky top-0 z-20 bg-white border-b border-gray-100 px-4 h-14 flex items-center justify-between">
                    {mobileView && mobileView !== "/account" ? (
                        <button
                            onClick={() => {
                                setMobileView(null);
                                router.push("/account");
                            }}
                            className="flex items-center gap-2 text-sm font-medium text-gray-700"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            My Account
                        </button>
                    ) : (
                        <span className="text-sm font-bold text-gray-900">My Account</span>
                    )}
                    <button onClick={handleLogout} className="text-xs text-red-500 font-medium">
                        Sign Out
                    </button>
                </div>

                {/* At /account: children contains dashboard + inline nav grid. Elsewhere: content only */}
                {!mobileView || mobileView === "/account" ? (
                    <div className="flex-1 overflow-auto px-4 py-4">
                        {children}
                    </div>
                ) : (
                    <div className="flex-1 overflow-auto px-4 py-4">
                        {children}
                    </div>
                )}
            </div>
        </div>
    );
}
