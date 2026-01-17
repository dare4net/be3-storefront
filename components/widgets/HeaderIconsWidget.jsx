"use client";

import Link from "next/link";
import { useAuth } from "@/components/providers/AuthContext";
import { useCart } from "@/components/providers/CartContext";
import { ShoppingBag, User, LogOut, Package, ChevronDown } from "lucide-react";
import { useState, useRef, useEffect } from "react";

export default function HeaderIconsWidget({ config }) {
    const { showCart = true, showAccount = true } = config;
    const { isAuthenticated, user, logout } = useAuth();
    const { setIsOpen, cartCount } = useCart();
    const [showAccountMenu, setShowAccountMenu] = useState(false);
    const menuRef = useRef(null);

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

    return (
        <div className="flex items-center gap-4">
            {/* Account Menu */}
            {showAccount && (
                isAuthenticated ? (
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
                            <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50">
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
                )
            )}

            {/* Cart Button */}
            {showCart && (
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
            )}
        </div>
    );
}
