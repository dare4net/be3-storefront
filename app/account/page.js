"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/components/providers/AuthContext";
import { useTenant } from "@/components/providers/TenantContext";
import api from "@/lib/axios";
import {
    Package, Heart, MessageCircle, Wallet, Mail, Calendar,
    CheckCircle, AlertCircle, Loader2, Shield, Megaphone,
    Headphones, ChevronRight, Edit3, Plus, Store,
    Settings, MapPin, CreditCard, ShieldCheck, User
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

/* ─────────── Verification Banner ─────────── */
function VerificationBanner({ user }) {
    const [status, setStatus] = useState("idle");
    const [message, setMessage] = useState("");

    if (user.email_verified === true || user.email_verified === "true") return null;

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
            "px-3 py-3 sm:p-4 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 border",
            status === "sent" ? "bg-green-50 border-green-100" : "bg-amber-50 border-amber-100"
        )}>
            <div className="flex items-center gap-2.5">
                <div className={cn("p-1.5 rounded-full flex-shrink-0", status === "sent" ? "bg-green-100 text-green-600" : "bg-amber-100 text-amber-600")}>
                    {status === "sent" ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                </div>
                <div>
                    <p className={cn("text-xs font-semibold leading-snug", status === "sent" ? "text-green-900" : "text-amber-900")}>
                        {status === "sent" ? "Verification Email Sent" : "Account Verification Required"}
                    </p>
                    <p className={cn("text-[11px] leading-snug mt-0.5", status === "sent" ? "text-green-700" : "text-amber-700")}>
                        {status === "sent" ? message : `Verify ${user.email} to secure your account.`}
                    </p>
                </div>
            </div>
            {status !== "sent" && (
                <button
                    onClick={handleResend}
                    disabled={status === "loading"}
                    className="w-full sm:w-auto flex items-center justify-center gap-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold py-2 px-4 rounded-lg transition-all disabled:opacity-50 flex-shrink-0"
                >
                    {status === "loading" ? <Loader2 className="w-3 h-3 animate-spin" /> : <Mail className="w-3 h-3" />}
                    Resend Link
                </button>
            )}
        </div>
    );
}

/* ─────────── Welcome Hero ─────────── */
function WelcomeHero({ user }) {
    return (
        <div className="relative overflow-hidden rounded-2xl" style={{ background: '#1a56e8' }}>

            {/* Dot pattern overlay */}
            <div className="absolute inset-0 opacity-[0.12]" style={{
                backgroundImage: 'radial-gradient(circle, #ffffff 1px, transparent 1px)',
                backgroundSize: '20px 20px'
            }} />

            {/* Decorative blobs */}
            <div className="absolute -top-8 -right-8 w-40 h-40 rounded-full bg-white/10" />
            <div className="absolute bottom-0 right-24 w-20 h-20 rounded-full bg-white/5" />

            {/* Content */}
            <div className="relative flex flex-col sm:flex-row items-start sm:items-center gap-4 px-6 py-5">
                {/* Avatar */}
                <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm border border-white/30 flex-shrink-0 overflow-hidden flex items-center justify-center text-white text-xl font-bold">
                    {user.avatar_url ? (
                        <img src={user.avatar_url} alt="Profile" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    ) : (
                        user.email?.[0]?.toUpperCase()
                    )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                    <h1 className="text-lg font-bold text-white leading-snug">
                        Hello, {user.first_name || 'Friend'}! 👋
                    </h1>
                    <p className="text-sm text-blue-100/80">Welcome back to your BE3 account</p>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-blue-200/70 mt-1">
                        <div className="flex items-center gap-1.5">
                            <Mail className="w-3 h-3" />
                            {user.email}
                        </div>
                        <div className="flex items-center gap-1.5">
                            <Calendar className="w-3 h-3" />
                            Joined {new Date(user.created_at).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
                        </div>
                    </div>
                </div>

                {/* Edit Profile */}
                <Link
                    href="/account/profile"
                    className="flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white/15 hover:bg-white/25 border border-white/25 text-white text-xs font-semibold transition-all backdrop-blur-sm"
                >
                    <Edit3 className="w-3.5 h-3.5" />
                    Edit Profile
                </Link>
            </div>
        </div>
    );
}

/* ─────────── Stat Card ─────────── */
function StatCard({ icon: Icon, iconColor, iconBg, label, value, subtitle, linkText, linkHref }) {
    return (
        <div className="rounded-xl bg-white border border-gray-100 p-5">
            <div className="flex items-center gap-2 mb-3">
                <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", iconBg)}>
                    <Icon className={cn("w-4 h-4", iconColor)} />
                </div>
                <span className="text-sm font-medium text-gray-600">{label}</span>
            </div>
            <p className="text-2xl font-bold text-gray-900 mb-0.5">{value}</p>
            <p className="text-xs text-gray-400 mb-3">{subtitle}</p>
            <Link
                href={linkHref}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors"
            >
                {linkText}
                <ChevronRight className="w-3.5 h-3.5" />
            </Link>
        </div>
    );
}

/* ─────────── Status Badge ─────────── */
const STATUS_CONFIG = {
    paid:               { label: "Paid",        bg: "bg-green-100",  text: "text-green-700"  },
    delivered:          { label: "Delivered",    bg: "bg-green-100",  text: "text-green-700"  },
    completed:          { label: "Completed",   bg: "bg-green-100",  text: "text-green-700"  },
    shipped:            { label: "Shipped",     bg: "bg-blue-100",   text: "text-blue-700"   },
    processing:         { label: "Processing",  bg: "bg-amber-100",  text: "text-amber-700"  },
    pending:            { label: "Pending",     bg: "bg-yellow-100", text: "text-yellow-700" },
    pending_whatsapp:   { label: "WhatsApp",    bg: "bg-emerald-100",text: "text-emerald-700"},
    cancelled:          { label: "Cancelled",   bg: "bg-red-100",    text: "text-red-700"    },
    refunded:           { label: "Refunded",    bg: "bg-gray-100",   text: "text-gray-600"   },
};

function StatusBadge({ status }) {
    const config = STATUS_CONFIG[status] || { label: status, bg: "bg-gray-100", text: "text-gray-700" };
    return (
        <span className={cn("px-2.5 py-1 rounded-full text-[11px] font-semibold whitespace-nowrap", config.bg, config.text)}>
            {config.label}
        </span>
    );
}

/* ─────────── Recent Orders Panel ─────────── */
function RecentOrdersPanel({ orders, loading }) {
    return (
        <div className="rounded-xl bg-white border border-gray-100">
            <div className="flex items-center justify-between px-5 pt-5 pb-3">
                <h3 className="text-base font-bold text-gray-900">Recent Orders</h3>
                <Link href="/account/orders" className="text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors">
                    View All Orders
                </Link>
            </div>
            <div className="px-5 pb-5">
                {loading ? (
                    <div className="flex items-center justify-center py-8">
                        <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
                    </div>
                ) : orders.length === 0 ? (
                    <div className="text-center py-8">
                        <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                            <Package className="w-5 h-5 text-gray-400" />
                        </div>
                        <p className="text-sm text-gray-500 mb-3">No orders yet</p>
                        <Button asChild size="sm">
                            <Link href="/">Start Shopping</Link>
                        </Button>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-50">
                        {orders.slice(0, 3).map((order) => (
                            <Link
                                key={order.id}
                                href={`/account/orders/${order.id}`}
                                className="flex items-center gap-4 py-3.5 hover:bg-gray-50/50 -mx-2 px-2 rounded-lg transition-colors group"
                            >
                                {/* Order thumbnail placeholder */}
                                <div className="w-10 h-10 bg-gray-100 rounded-xl flex items-center justify-center flex-shrink-0">
                                    <Package className="w-4 h-4 text-gray-400" />
                                </div>

                                {/* Order info */}
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold text-gray-900 truncate">
                                        Order #{order.order_number}
                                    </p>
                                    <p className="text-xs text-gray-400">
                                        {new Date(order.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                    </p>
                                </div>

                                {/* Status badge */}
                                <StatusBadge status={order.status} />

                                {/* Amount */}
                                <span className="text-sm font-bold text-gray-900 tabular-nums">
                                    ${parseFloat(order.total).toFixed(2)}
                                </span>

                                <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-gray-500 transition-colors flex-shrink-0" />
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}

/* ─────────── Account Security Panel ─────────── */
function AccountSecurityPanel({ user }) {
    return (
        <div className="rounded-xl bg-white border border-gray-100 p-5">
            <div className="flex items-start gap-3">
                <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                        <Shield className="w-4 h-4 text-blue-600" />
                        <h3 className="text-sm font-bold text-gray-900">Account Security</h3>
                    </div>
                    <p className="text-xs text-gray-400 mb-2">Keep your account safe</p>
                    <p className={cn(
                        "text-xs font-medium",
                        user.email_verified ? "text-green-600" : "text-amber-600"
                    )}>
                        {user.email_verified
                            ? "Your account is verified ✓"
                            : "Your account is not verified."}
                    </p>
                    {!user.email_verified && (
                        <Link href="/account/profile" className="text-xs font-semibold text-blue-600 hover:text-blue-700 mt-1 inline-block">
                            Verify Now
                        </Link>
                    )}
                </div>
                <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Shield className="w-5 h-5 text-blue-600" />
                </div>
            </div>
        </div>
    );
}

/* ─────────── Store Announcements Panel ─────────── */
function AnnouncementsPanel() {
    return (
        <div className="rounded-xl bg-white border border-gray-100 p-5">
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <Megaphone className="w-4 h-4 text-orange-500" />
                    <h3 className="text-sm font-bold text-gray-900">Store Announcements</h3>
                </div>
                <span className="text-[11px] text-blue-600 font-semibold cursor-pointer hover:text-blue-700">View All</span>
            </div>

            {/* Sample announcement */}
            <div className="border-l-3 border-blue-500 bg-blue-50/50 rounded-r-lg p-3 flex items-start gap-3" style={{ borderLeftWidth: '3px' }}>
                <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-blue-700 mb-0.5">Big Summer Sale is Live!</p>
                    <p className="text-[11px] text-gray-500 leading-relaxed">
                        Up to 60% off on select categories. Shop now and save big!
                    </p>
                </div>
                <div className="w-7 h-7 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0">
                    <Plus className="w-3.5 h-3.5 text-white" />
                </div>
            </div>
        </div>
    );
}

/* ─────────── Need Help Panel ─────────── */
function NeedHelpPanel() {
    return (
        <div className="rounded-xl bg-white border border-gray-100 p-5">
            <div className="flex items-start gap-3">
                <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                        <Headphones className="w-4 h-4 text-purple-600" />
                        <h3 className="text-sm font-bold text-gray-900">Need Help?</h3>
                    </div>
                    <p className="text-xs text-gray-400 mb-2">We're here for you</p>
                    <Link href="/contact" className="text-xs font-semibold text-blue-600 hover:text-blue-700">
                        Contact Support
                    </Link>
                </div>
                <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Headphones className="w-5 h-5 text-purple-600" />
                </div>
            </div>
        </div>
    );
}

/* ─────────── Become a Vendor CTA ─────────── */
function VendorCTA({ user }) {
    const [isVendor, setIsVendor] = useState(null); // null = loading
    const kycApproved = user?.kyc_status === 'approved';

    useEffect(() => {
        api.get('/vendor/application')
            .then(res => setIsVendor(!!res.data.is_vendor))
            .catch(() => setIsVendor(false));
    }, []);

    // Still loading or confirmed vendor — show nothing
    if (isVendor === null || isVendor) return null;

    return (
        <div className="rounded-xl border border-orange-100 bg-gradient-to-br from-orange-50 to-amber-50 p-5">
            <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center flex-shrink-0">
                    <Store className="w-5 h-5 text-orange-600" />
                </div>
                <div className="flex-1">
                    <h3 className="text-sm font-black text-gray-900 mb-0.5">Open Your Store</h3>
                    <p className="text-xs text-gray-500 leading-relaxed mb-3">
                        {kycApproved
                            ? "You're verified! Apply to become a vendor and start selling today."
                            : "Verify your identity first, then apply to become a vendor and start selling."}
                    </p>
                    <Link
                        href={kycApproved ? "/account/apply" : "/account/verification"}
                        className="inline-flex items-center gap-1.5 text-xs font-black text-orange-700 hover:text-orange-800 bg-white border border-orange-200 hover:border-orange-300 px-3 py-1.5 rounded-lg transition-all"
                    >
                        {kycApproved ? "Apply Now" : "Get Verified"}
                        <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                </div>
            </div>
        </div>
    );
}

/* ═══════════════════════════════════════════════════════
   MAIN DASHBOARD
   ═══════════════════════════════════════════════════════ */
export default function AccountDashboard() {
    const router = useRouter();
    const { user, token } = useAuth();
    const tenant = useTenant();

    const [orders, setOrders] = useState([]);
    const [ordersTotal, setOrdersTotal] = useState(null);
    const [wishlistCount, setWishlistCount] = useState(null);
    const [loadingOrders, setLoadingOrders] = useState(true);
    const [loadingWishlist, setLoadingWishlist] = useState(true);

    // Fetch orders for Recent Orders + total count
    useEffect(() => {
        if (!token || !tenant || !user) return;

        const fetchOrders = async () => {
            setLoadingOrders(true);
            try {
                const res = await api.get('/orders/my-orders?page=1&per_page=3', {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'X-Tenant-ID': tenant.id
                    }
                });
                if (res.data.success) {
                    setOrders(res.data.data || []);
                    setOrdersTotal(res.data.pagination?.total ?? 0);
                }
            } catch (err) {
                console.error('[Dashboard] Failed to fetch orders:', err);
            } finally {
                setLoadingOrders(false);
            }
        };
        fetchOrders();
    }, [token, tenant, user]);

    // Fetch wishlist count
    useEffect(() => {
        if (!token || !tenant || !user) return;

        const fetchWishlist = async () => {
            setLoadingWishlist(true);
            try {
                const res = await api.get('/wishlist', {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'X-Tenant-ID': tenant.id
                    }
                });
                if (res.data.success) {
                    setWishlistCount(res.data.wishlist?.length ?? 0);
                }
            } catch (err) {
                console.error('[Dashboard] Failed to fetch wishlist:', err);
            } finally {
                setLoadingWishlist(false);
            }
        };
        fetchWishlist();
    }, [token, tenant, user]);

    // The layout shell handles auth redirect + loading state.
    // If we somehow render before user is ready, return nothing.
    if (!user) return null;

    const fmtCount = (val, loading) => {
        if (loading) return "—";
        return val ?? "—";
    };

    return (
        <div className="space-y-6">
            <WelcomeHero user={user} />
            <VerificationBanner user={user} />

            {/* Stats Row — 4 columns */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    icon={Package}
                    iconColor="text-blue-600"
                    iconBg="bg-blue-50"
                    label="My Orders"
                    value={fmtCount(ordersTotal, loadingOrders)}
                    subtitle="Total Orders"
                    linkText="View All Orders"
                    linkHref="/account/orders"
                />
                <StatCard
                    icon={Heart}
                    iconColor="text-pink-600"
                    iconBg="bg-pink-50"
                    label="Wishlist"
                    value={fmtCount(wishlistCount, loadingWishlist)}
                    subtitle="Saved Items"
                    linkText="View Wishlist"
                    linkHref="/wishlist"
                />
                <StatCard
                    icon={MessageCircle}
                    iconColor="text-green-600"
                    iconBg="bg-green-50"
                    label="Messages"
                    value="—"
                    subtitle="Unread Messages"
                    linkText="Go to Inbox"
                    linkHref="/messages"
                />
                <StatCard
                    icon={Wallet}
                    iconColor="text-emerald-600"
                    iconBg="bg-emerald-50"
                    label="Store Credits"
                    value="$0.00"
                    subtitle="Available Balance"
                    linkText="View Credits"
                    linkHref="/account/credits"
                />
            </div>

            {/* Mobile-only quick nav — shown right after stats */}
            <div className="md:hidden grid grid-cols-3 gap-3">
                {[
                    { label: "My Orders",       href: "/account/orders",       icon: Package,     color: "text-violet-600", bg: "bg-violet-50" },
                    { label: "Wishlist",        href: "/wishlist",             icon: Heart,       color: "text-pink-600",   bg: "bg-pink-50"   },
                    { label: "Messages",        href: "/messages",             icon: MessageCircle,color: "text-green-600", bg: "bg-green-50"   },
                    { label: "Account Details", href: "/account/profile",      icon: Settings,    color: "text-slate-600",  bg: "bg-slate-50"  },
                    { label: "Addresses",       href: "/account/addresses",    icon: MapPin,      color: "text-rose-600",   bg: "bg-rose-50"   },
                    { label: "Payment Methods", href: "/account/payments",     icon: CreditCard,  color: "text-amber-600",  bg: "bg-amber-50"  },
                    { label: "Verification",    href: "/account/verification", icon: ShieldCheck, color: "text-teal-600",   bg: "bg-teal-50"   },
                    { label: "Store Credits",   href: "/account/credits",      icon: Wallet,      color: "text-emerald-600",bg: "bg-emerald-50"},
                    { label: "Shop",            href: "/account/apply",        icon: Store,       color: "text-orange-600", bg: "bg-orange-50" },
                ].map((item) => (
                    <Link
                        key={item.label}
                        href={item.href}
                        className="flex flex-col items-center justify-center gap-2 p-4 rounded-2xl bg-white border border-gray-100 transition-all active:scale-95"
                    >
                        <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", item.bg, item.color)}>
                            <item.icon className="w-5 h-5" />
                        </div>
                        <span className="text-xs font-medium text-gray-700 text-center leading-tight">{item.label}</span>
                    </Link>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                {/* Recent Orders — spans 3 cols */}
                <div className="lg:col-span-3">
                    <RecentOrdersPanel orders={orders} loading={loadingOrders} />
                </div>

                {/* Right column — spans 2 cols */}
                <div className="lg:col-span-2 space-y-4">
                    <VendorCTA user={user} />
                    <AccountSecurityPanel user={user} />
                    <AnnouncementsPanel />
                    <NeedHelpPanel />
                </div>
            </div>
        </div>
    );
}
