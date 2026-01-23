"use client";

import Link from "next/link";
import { useAuth } from "./providers/AuthContext";
import { useCart } from "./providers/CartContext";
import { useWishlist } from "./providers/WishlistContext";
import { useTenant } from "./providers/TenantContext";
import { ShoppingBag, User, LogOut, Package, ChevronDown, Heart } from "lucide-react";
import { useState, useRef, useEffect } from "react";

import { useStorefront } from "./providers/StorefrontProvider";
import api from "@/lib/axios";
import WidgetRenderer from "./widgets/WidgetRenderer";

export default function Header({ menuItems = [] }) {
    const { config, theme } = useStorefront();
    const tenant = useTenant();
    const { isAuthenticated, user, logout } = useAuth();
    const { setIsOpen, cartCount } = useCart();
    const { wishlist } = useWishlist();
    const [showAccountMenu, setShowAccountMenu] = useState(false);
    const [widgets, setWidgets] = useState([]);
    const [loading, setLoading] = useState(true);
    const menuRef = useRef(null);

    // Fetch Header Widgets
    useEffect(() => {
        if (tenant?.id) {
            api.get('/page-builder/widgets?page=header', {
                headers: { "X-Tenant-ID": tenant.id }
            })
                .then(res => {
                    if (res.data.success && res.data.widgets.length > 0) {
                        setWidgets(res.data.widgets);
                    }
                })
                .catch(err => console.error("Failed to fetch header widgets", err))
                .finally(() => setLoading(false));
        }
    }, [tenant?.id]);

    // Close menu when clicking outside
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

    // Render Custom Widgets if available
    if (widgets.length > 0) {
        const announcementBars = widgets.filter(w => w.widget_type === 'announcement_bar');
        const headerContentWidgets = widgets.filter(w => w.widget_type !== 'announcement_bar');

        return (
            <>
                {/* Announcement Bars render outside the sticky header container */}
                {announcementBars.map(widget => (
                    <WidgetRenderer key={widget.id} widget={widget} />
                ))}

                <header className="bg-white shadow-sm sticky top-0 z-50">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
                        {headerContentWidgets.map(widget => (
                            <WidgetRenderer key={widget.id} widget={widget} />
                        ))}
                    </div>
                </header>
            </>
        );
    }

    // Default Legacy Layout
    return (
        <header className="bg-white shadow-sm sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
                <div className="flex items-center gap-8">
                    <Link href="/" className="flex items-center">
                        {theme?.variables?.logo ? (
                            <img
                                src={theme.variables.logo}
                                alt={tenant?.name || 'Store'}
                                className="h-8 w-auto object-contain"
                            />
                        ) : (
                            <span className="text-xl font-bold text-gray-900 hover:text-gray-700">
                                {tenant?.name || 'Store'}
                            </span>
                        )}
                    </Link>
                    <nav className="hidden md:flex gap-6">
                        {menuItems.length > 0 ? (
                            menuItems.map((item) => (
                                <Link
                                    key={item.id}
                                    href={item.url || '#'}
                                    className="text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
                                >
                                    {item.label}
                                </Link>
                            ))
                        ) : (
                            <Link href="/products" className="text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors">
                                Products
                            </Link>
                        )}
                    </nav>
                </div>

                <div className="flex items-center gap-4">
                    {/* Account Menu */}
                    {isAuthenticated ? (
                        <div className="relative" ref={menuRef}>
                            <button
                                onClick={() => setShowAccountMenu(!showAccountMenu)}
                                className="flex items-center gap-2 px-3 py-2 text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition"
                            >
                                <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-medium text-sm">
                                    {user?.email?.[0]?.toUpperCase() || 'U'}
                                </div>
                                <span className="hidden sm:block font-medium">{user?.first_name || 'Account'}</span>
                                <ChevronDown className={`w-4 h-4 transition-transform ${showAccountMenu ? 'rotate-180' : ''}`} />
                            </button>

                            {/* Dropdown Menu */}
                            {showAccountMenu && (
                                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2">
                                    <Link
                                        href="/account"
                                        className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-50"
                                        onClick={() => setShowAccountMenu(false)}
                                    >
                                        <User className="w-4 h-4" />
                                        My Account
                                    </Link>
                                    <Link
                                        href="/account/orders"
                                        className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-50"
                                        onClick={() => setShowAccountMenu(false)}
                                    >
                                        <Package className="w-4 h-4" />
                                        My Orders
                                    </Link>
                                    <hr className="my-2" />
                                    <button
                                        onClick={handleLogout}
                                        className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 w-full"
                                    >
                                        <LogOut className="w-4 h-4" />
                                        Logout
                                    </button>
                                </div>
                            )}
                        </div>
                    ) : (
                        <Link
                            href="/login"
                            className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition font-medium"
                        >
                            <User className="w-5 h-5" />
                            <span className="hidden sm:block">Login</span>
                        </Link>
                    )}

                    {/* Wishlist Button */}
                    <Link
                        href="/wishlist"
                        className="p-2 text-gray-600 hover:text-gray-900 relative"
                        title="My Wishlist"
                    >
                        <Heart className="w-6 h-6" />
                        {wishlist.length > 0 && (
                            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                                {wishlist.length}
                            </span>
                        )}
                    </Link>

                    {/* Cart Button */}
                    <button
                        onClick={() => setIsOpen(true)}
                        className="p-2 text-gray-600 hover:text-gray-900 relative"
                    >
                        <ShoppingBag className="w-6 h-6" />
                        {cartCount > 0 && (
                            <span className="absolute -top-1 -right-1 bg-blue-600 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                                {cartCount}
                            </span>
                        )}
                    </button>
                </div>
            </div>
        </header>
    );
}
