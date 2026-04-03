"use client";

import Link from "next/link";
import { useAuth } from "./providers/AuthContext";
import { useCart } from "./providers/CartContext";
import { useWishlist } from "./providers/WishlistContext";
import { useTenant } from "./providers/TenantContext";
import {
    ShoppingBag,
    User,
    LogOut,
    Package,
    ChevronDown,
    Heart,
    Menu,
    Search as SearchIcon,
    Headset
} from "lucide-react";
import { useState, useRef, useEffect } from "react";

import { useStorefront } from "./providers/StorefrontProvider";
import api from "@/lib/axios";
import WidgetRenderer from "./widgets/WidgetRenderer";
import { SearchBar } from "./ui/SearchBar";

import { useRandomizationContext } from "@/lib/contexts/RandomizationContext";
import { cn } from "@/lib/utils";

export default function Header({ menuItems = [] }) {
    const { config, theme } = useStorefront();
    const tenant = useTenant();
    const { seedPlan } = useRandomizationContext();
    const { isAuthenticated, user, logout } = useAuth();
    const { setIsOpen, cartCount } = useCart();
    const { wishlist } = useWishlist();
    const [showAccountMenu, setShowAccountMenu] = useState(false);
    const [widgets, setWidgets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isScrolled, setIsScrolled] = useState(false);
    const menuRef = useRef(null);

    // Track scroll for header transition — uses hysteresis to prevent feedback loop
    useEffect(() => {
        const handleScroll = () => {
            const y = window.scrollY;
            setIsScrolled(prev => {
                if (!prev && y > 60) return true;   // hide top bar after 60px
                if (prev && y < 30) return false;   // re-show only when back under 30px
                return prev;                         // dead zone: 30–60px, no change
            });
        };
        window.addEventListener("scroll", handleScroll, { passive: true });
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    // Fetch Header Widgets
    useEffect(() => {
        if (tenant?.id) {
            api.get('/page-builder/widgets?page=header', {
                headers: { "X-Tenant-ID": tenant.id }
            })
                .then(res => {
                    if (res.data.success) {
                        if (res.data.randomizationPlan) {
                            seedPlan(res.data.randomizationPlan);
                        }
                        if (res.data.widgets.length > 0) {
                            setWidgets(res.data.widgets);
                        }
                    }
                })
                .catch(err => console.error("Failed to fetch header widgets", err))
                .finally(() => setLoading(false));
        }
    }, [tenant?.id, seedPlan]);

    useEffect(() => {
        function handleClickOutside(event) {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setShowAccountMenu(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleLogout = () => {
        logout();
        setShowAccountMenu(false);
    };

    if (!config.showHeader) return null;

    // Common Action Icons Wrapper
    const ActionIcons = () => (
        <div className="flex items-center gap-2 sm:gap-4">
            {/* Account */}
            {isAuthenticated ? (
                <div className="relative" ref={menuRef}>
                    <button
                        onClick={() => setShowAccountMenu(!showAccountMenu)}
                        className="flex items-center gap-2 p-2 hover:bg-gray-100 rounded-xl transition-colors group"
                    >
                        <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-xs ring-2 ring-transparent group-hover:ring-blue-100 transition-all">
                            {user?.email?.[0]?.toUpperCase() || 'U'}
                        </div>
                        <div className="hidden lg:flex flex-col items-start leading-none">
                            <span className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">Account</span>
                            <span className="text-sm font-bold text-gray-900">{user?.first_name || 'My Profile'}</span>
                        </div>
                        <ChevronDown className={cn("w-4 h-4 text-gray-400 transition-transform", showAccountMenu && "rotate-180")} />
                    </button>

                    {showAccountMenu && (
                        <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-2xl border border-gray-100 py-2 z-[60] animate-in fade-in zoom-in-95 duration-200">
                            <div className="px-4 py-2 border-b border-gray-50 mb-1">
                                <p className="text-xs text-gray-400 font-medium">Logged in as</p>
                                <p className="text-sm font-bold text-gray-900 truncate">{user?.email}</p>
                            </div>
                            <Link href="/account" className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-blue-50 hover:text-blue-600 tracking-tight transition-colors" onClick={() => setShowAccountMenu(false)}>
                                <User className="w-4 h-4" /> My Account
                            </Link>
                            <Link href="/account/orders" className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-blue-50 hover:text-blue-600 tracking-tight transition-colors" onClick={() => setShowAccountMenu(false)}>
                                <Package className="w-4 h-4" /> My Orders
                            </Link>
                            <div className="h-px bg-gray-100 my-1 mx-2" />
                            <button onClick={handleLogout} className="flex items-center gap-3 px-4 py-2.5 text-sm font-bold text-red-600 hover:bg-red-50 w-full text-left transition-colors">
                                <LogOut className="w-4 h-4" /> Logout
                            </button>
                        </div>
                    )}
                </div>
            ) : (
                <Link href="/login" className="flex items-center gap-2 p-2 hover:bg-gray-100 rounded-xl transition-colors group">
                    <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-gray-500 group-hover:bg-blue-600 group-hover:text-white transition-all">
                        <User className="w-5 h-5" />
                    </div>
                    <div className="hidden lg:flex flex-col items-start leading-none">
                        <span className="text-[10px] text-gray-500 uppercase font-bold tracking-wider">Hello, Sign in</span>
                        <span className="text-sm font-bold text-gray-900">My Account</span>
                    </div>
                </Link>
            )}

            {/* Wishlist */}
            <Link href="/wishlist" className="p-2 text-gray-600 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all relative group">
                <Heart className="w-6 h-6 group-hover:fill-current" />
                {wishlist.length > 0 && (
                    <span className="absolute top-1.5 right-1.5 bg-red-500 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center ring-2 ring-white">
                        {wishlist.length}
                    </span>
                )}
            </Link>

            {/* Cart */}
            <button
                onClick={() => setIsOpen(true)}
                className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all relative group"
            >
                <ShoppingBag className="w-6 h-6" />
                {cartCount > 0 && (
                    <span className="absolute top-1.5 right-1.5 bg-blue-600 text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center ring-2 ring-white">
                        {cartCount}
                    </span>
                )}
            </button>
        </div>
    );

    // If widgets exist, we still provide the base structure but allow widgets to fill content
    if (widgets.length > 0) {
        const announcementBars = widgets.filter(w => w.widget_type === 'announcement_bar');
        const headerContentWidgets = widgets.filter(w => w.widget_type !== 'announcement_bar');

        return (
            <>
                {announcementBars.map(widget => (
                    <WidgetRenderer key={widget.id} widget={widget} />
                ))}

                <header className={cn(
                    "bg-white sticky top-0 z-50 transition-all duration-300 border-b border-gray-100",
                    isScrolled ? "shadow-md py-1" : "py-2"
                )}>
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
                        {headerContentWidgets.map(widget => (
                            <WidgetRenderer key={widget.id} widget={widget} />
                        ))}
                    </div>
                </header>
            </>
        );
    }

    return (
        <header className="z-50 sticky top-0">
            {/* Top Bar — inside sticky so it never shifts page layout */}
            <div className={cn(
                "bg-gray-900 text-white overflow-hidden transition-all duration-300 hidden sm:block",
                isScrolled ? "max-h-0 py-0" : "max-h-[40px] py-2"
            )}>
                <div className="px-4 max-w-7xl mx-auto flex justify-between items-center text-[11px] font-bold uppercase tracking-[0.1em]">
                    <div className="flex items-center gap-4">
                        <span className="flex items-center gap-1"><Headset className="w-3 h-3" /> Support 24/7</span>
                        <span className="text-gray-500">|</span>
                        <span>Free Shipping on orders over $50</span>
                    </div>
                    <div className="flex items-center gap-6">
                        <Link href="/track" className="hover:text-blue-400 transition-colors">Track Order</Link>
                        <Link href="/stores" className="hover:text-blue-400 transition-colors">Store Locator</Link>
                        <span className="text-blue-400">⚡ New Arrivals Just In</span>
                    </div>
                </div>
            </div>

            <div className={cn(
                "bg-white transition-all duration-300 border-b border-gray-100 shadow-sm",
                isScrolled ? "py-1" : "py-4 md:py-6"
            )}>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    {/* Main Bar */}
                    <div className="flex items-center justify-between gap-8 h-12">
                        {/* Logo */}
                        <Link href="/" className="flex-shrink-0 flex items-center gap-2 group">
                            <Menu className="w-6 h-6 lg:hidden text-gray-600 mr-2" />
                            {theme?.variables?.logo ? (
                                <img
                                    src={theme.variables.logo}
                                    alt={tenant?.name || 'Store'}
                                    className="h-8 md:h-10 w-auto object-contain transition-transform group-hover:scale-105 duration-300"
                                />
                            ) : (
                                <span className="text-2xl font-black text-gray-900 tracking-tighter">
                                    {tenant?.name?.toUpperCase() || 'STORE'}
                                    <span className="text-blue-600">.</span>
                                </span>
                            )}
                        </Link>

                        {/* Search Bar - Hidden on Mobile */}
                        <div className="hidden lg:flex flex-1 max-w-2xl px-4">
                            <SearchBar />
                        </div>

                        {/* Mobile Search Toggle */}
                        <button className="lg:hidden p-2 text-gray-600 hover:text-blue-600 transition-colors">
                            <SearchIcon className="w-6 h-6" />
                        </button>

                        <ActionIcons />
                    </div>

                    {/* Bottom Bar: Navigation */}
                    <div className={cn(
                        "hidden lg:block overflow-hidden transition-all duration-300 ease-in-out",
                        isScrolled ? "max-h-0 opacity-0 mt-0 pt-0 border-t-0" : "max-h-[100px] opacity-100 mt-6 border-t border-gray-50 pt-4"
                    )}>
                        <nav className="flex items-center gap-10">
                            {menuItems.length > 0 ? (
                                menuItems.map((item) => (
                                    <Link
                                        key={item.id}
                                        href={item.url || '#'}
                                        className="text-sm font-bold text-gray-600 hover:text-blue-600 transition-all uppercase tracking-wider relative group"
                                    >
                                        {item.label}
                                        <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-blue-600 transition-all group-hover:w-full" />
                                    </Link>
                                ))
                            ) : (
                                <>
                                    <Link href="/products" className="text-sm font-bold text-gray-900 hover:text-blue-600 transition-all uppercase tracking-widest relative group">
                                        Shop All
                                        <span className="absolute -bottom-1 left-0 w-full h-0.5 bg-blue-600" />
                                    </Link>
                                    <Link href="/categories/electronics" className="text-sm font-bold text-gray-600 hover:text-blue-600 transition-all uppercase tracking-widest relative group">
                                        Electronics
                                        <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-blue-600 transition-all group-hover:w-full" />
                                    </Link>
                                    <Link href="/categories/fashion" className="text-sm font-bold text-gray-600 hover:text-blue-600 transition-all uppercase tracking-widest relative group">
                                        Fashion
                                        <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-blue-600 transition-all group-hover:w-full" />
                                    </Link>
                                    <Link href="/categories/home" className="text-sm font-bold text-gray-600 hover:text-blue-600 transition-all uppercase tracking-widest relative group">
                                        Home & Living
                                        <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-blue-600 transition-all group-hover:w-full" />
                                    </Link>
                                    <Link href="/deals" className="text-sm font-bold text-red-600 hover:text-red-700 transition-all uppercase tracking-widest relative group">
                                        Clearance
                                        <span className="absolute -bottom-1 left-0 w-0 h-px bg-red-600 transition-all group-hover:w-full" />
                                    </Link>
                                </>
                            )}
                        </nav>
                    </div>
                </div>
            </div>
        </header>
    );
}

