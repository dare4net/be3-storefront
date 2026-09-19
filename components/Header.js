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
    X,
} from "lucide-react";
import { useState, useRef, useEffect } from "react";

import { useStorefront } from "./providers/StorefrontProvider";
import api from "@/lib/axios";
import WidgetRenderer from "./widgets/WidgetRenderer";
import { SearchBar } from "./ui/SearchBar";

import { useRandomizationContext } from "@/lib/contexts/RandomizationContext";
import { cn } from "@/lib/utils";
import NotificationBell from "@/components/notifications/NotificationBell";

export default function Header({ menuItems = [] }) {
    const { config, theme } = useStorefront();
    const tenant = useTenant();
    const { seedPlan } = useRandomizationContext();
    const { isAuthenticated, user, logout } = useAuth();
    const { setIsOpen, cartCount } = useCart();
    const { wishlist } = useWishlist();
    const [showAccountMenu, setShowAccountMenu] = useState(false);
    const [widgets, setWidgets] = useState([]);
    const [pageSettings, setPageSettings] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isScrolled, setIsScrolled] = useState(false);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [expandedMobileMenus, setExpandedMobileMenus] = useState({});
    const [activeDropdown, setActiveDropdown] = useState(null);
    const menuRef = useRef(null);

    // Track scroll for header transition
    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 60);
        };
        window.addEventListener("scroll", handleScroll, { passive: true });
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);

    // Fetch Header Widgets & Page Settings
    useEffect(() => {
        if (tenant?.id) {
            api.get('/page-builder/widgets?page=header&includeInactive=true', {
                headers: { "X-Tenant-ID": tenant.id }
            })
                .then(res => {
                    if (res.data.success) {
                        if (res.data.page) {
                            setPageSettings(res.data.page);
                        }
                        if (res.data.randomizationPlan) {
                            seedPlan(res.data.randomizationPlan);
                        }
                        if (res.data.widgets) {
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

    const toggleMobileSubmenu = (id) => {
        setExpandedMobileMenus(prev => ({
            ...prev,
            [id]: !prev[id]
        }));
    };

    if (!config.showHeader) return null;

    // Stock Header Bar Content Renderer
    const headerCfg = theme?.variables?.header || {};
    const pageBg = pageSettings?.theme_overrides?.background;
    const headerBg = pageBg || headerCfg.backgroundColor || '#ffffff';

    const isDarkColor = (color) => {
        if (!color || color === 'transparent') return false;
        if (typeof color !== 'string' || color.startsWith('var(')) return false;
        const hex = color.replace('#', '');
        if (hex.length === 3) {
            const r = parseInt(hex[0] + hex[0], 16);
            const g = parseInt(hex[1] + hex[1], 16);
            const b = parseInt(hex[2] + hex[2], 16);
            return (r * 0.299 + g * 0.587 + b * 0.114) < 150;
        }
        if (hex.length === 6) {
            const r = parseInt(hex.substring(0, 2), 16);
            const g = parseInt(hex.substring(2, 4), 16);
            const b = parseInt(hex.substring(4, 6), 16);
            return (r * 0.299 + g * 0.587 + b * 0.114) < 150;
        }
        return false;
    };

    const isDarkHeader = isDarkColor(headerBg);
    const pageTextColor = pageSettings?.theme_overrides?.textColor || pageSettings?.theme_overrides?.text;
    const headerTextColor = pageTextColor || headerCfg.textColor || (isDarkHeader ? '#ffffff' : '#111827');
    const headerBorder = headerCfg.borderColor || (isDarkHeader ? 'rgba(255,255,255,0.12)' : '#f3f4f6');

    // Common Action Icons Wrapper
    const ActionIcons = () => (
        <div className="flex items-center gap-1 sm:gap-4">
            {/* Account - Only on Desktop, Mobile has it in Drawer */}
            <div className="hidden lg:block">
                {isAuthenticated ? (
                    <div className="relative" ref={menuRef}>
                        <button
                            onClick={() => setShowAccountMenu(!showAccountMenu)}
                            className="flex items-center gap-2 p-2 rounded-xl transition-colors group hover:bg-black/5 dark:hover:bg-white/10"
                            style={{ color: headerTextColor }}
                        >
                            <div 
                                className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs ring-2 ring-transparent transition-all"
                                style={{ backgroundColor: 'var(--primary)', color: 'var(--primary-foreground, #ffffff)' }}
                            >
                                {user?.email?.[0]?.toUpperCase() || 'U'}
                            </div>
                            <div className="hidden lg:flex flex-col items-start leading-none">
                                <span className="text-[10px] uppercase font-bold tracking-wider opacity-70" style={{ color: headerTextColor }}>Account</span>
                                <span className="text-sm font-bold" style={{ color: headerTextColor }}>{user?.first_name || 'My Profile'}</span>
                            </div>
                            <ChevronDown className={cn("w-4 h-4 transition-transform opacity-70", showAccountMenu && "rotate-180")} style={{ color: headerTextColor }} />
                        </button>

                        {showAccountMenu && (
                            <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-2xl border border-gray-100 py-2 z-[60] animate-in fade-in zoom-in-95 duration-200">
                                <div className="px-4 py-2 border-b border-gray-50 mb-1">
                                    <p className="text-xs text-gray-400 font-medium">Logged in as</p>
                                    <p className="text-sm font-bold text-gray-900 truncate">{user?.email}</p>
                                </div>
                                <Link 
                                    href="/account" 
                                    className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 tracking-tight transition-colors" 
                                    onClick={() => setShowAccountMenu(false)}
                                >
                                    <User className="w-4 h-4" /> My Account
                                </Link>
                                <Link 
                                    href="/account/orders" 
                                    className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 tracking-tight transition-colors" 
                                    onClick={() => setShowAccountMenu(false)}
                                >
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
                    <Link href="/login" className="flex items-center gap-2 p-2 rounded-xl transition-colors group hover:bg-black/5 dark:hover:bg-white/10" style={{ color: headerTextColor }}>
                        <div 
                            className={cn(
                                "w-10 h-10 rounded-full flex items-center justify-center transition-all",
                                isDarkHeader ? "bg-white/15 text-white group-hover:bg-white/25" : "bg-gray-100 text-gray-500 group-hover:text-white"
                            )}
                            onMouseEnter={(e) => { if (!isDarkHeader) e.currentTarget.style.backgroundColor = 'var(--primary)'; }}
                            onMouseLeave={(e) => { if (!isDarkHeader) e.currentTarget.style.backgroundColor = ''; }}
                        >
                            <User className="w-5 h-5" />
                        </div>
                        <div className="hidden lg:flex flex-col items-start leading-none">
                            <span className="text-[10px] uppercase font-bold tracking-wider opacity-70" style={{ color: headerTextColor }}>Hello, Sign in</span>
                            <span className="text-sm font-bold" style={{ color: headerTextColor }}>My Account</span>
                        </div>
                    </Link>
                )}
            </div>

            {/* Notifications — only when logged in */}
            <NotificationBell />

            {/* Wishlist */}
            <Link href="/wishlist" className="hidden sm:block p-1.5 sm:p-2 rounded-xl transition-all relative group hover:bg-black/5 dark:hover:bg-white/10" style={{ color: headerTextColor }}>
                <Heart className="w-5 h-5 sm:w-6 sm:h-6 group-hover:fill-current" />
                {wishlist.length > 0 && (
                    <span className="absolute top-1 sm:top-1.5 right-1 sm:right-1.5 bg-red-500 text-white text-[9px] sm:text-[10px] font-bold rounded-full min-w-[16px] sm:min-w-[18px] h-[16px] sm:h-[18px] flex items-center justify-center ring-2 ring-white">
                        {wishlist.length}
                    </span>
                )}
            </Link>

            {/* Cart */}
            <button
                onClick={() => setIsOpen(true)}
                className="p-1.5 sm:p-2 rounded-xl transition-all relative group hover:bg-black/5 dark:hover:bg-white/10"
                style={{ color: headerTextColor }}
            >
                <ShoppingBag className="w-5 h-5 sm:w-6 sm:h-6" />
                {cartCount > 0 && (
                    <span 
                        className="absolute top-1 sm:top-1.5 right-1 sm:right-1.5 text-white text-[9px] sm:text-[10px] font-bold rounded-full min-w-[16px] sm:min-w-[18px] h-[16px] sm:h-[18px] flex items-center justify-center ring-2 ring-white"
                        style={{ backgroundColor: 'var(--primary)', color: 'var(--primary-foreground, #ffffff)' }}
                    >
                        {cartCount}
                    </span>
                )}
            </button>
        </div>
    );

    const renderStockHeaderContent = (key = 'stock_header') => (
        <header key={key} className="w-full transition-all duration-300 shadow-sm"
            style={{ backgroundColor: headerBg, borderBottom: `1px solid ${headerBorder}` }}
        >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Main Bar */}
                <div className={cn("flex items-center justify-between gap-2 md:gap-8 transition-all duration-300", isScrolled ? "py-2 h-14" : "py-4 md:py-5 h-16 md:h-20")}>
                    {/* Hamburger Button */}
                    <button
                        onClick={() => setIsMenuOpen(true)}
                        className="lg:hidden p-2 -ml-2 rounded-lg transition-colors hover:bg-black/5 dark:hover:bg-white/10"
                        style={{ color: headerTextColor }}
                        aria-label="Toggle Menu"
                    >
                        <Menu className="w-6 h-6" />
                    </button>

                    {/* Logo */}
                    <Link href="/" className="flex-shrink-0 flex items-center gap-2 group mr-auto lg:mr-0">
                        {theme?.variables?.logo ? (
                            <img
                                src={theme.variables.logo}
                                alt={tenant?.name || 'Store'}
                                className={cn("h-8 md:h-10 w-auto object-contain transition-transform group-hover:scale-105 duration-300", isDarkHeader && "brightness-0 invert")}
                            />
                        ) : (
                            <span className="text-2xl font-black tracking-tighter" style={{ color: headerTextColor }}>
                                {tenant?.name?.toUpperCase() || 'STORE'}
                                <span style={{ color: 'var(--primary)' }}>.</span>
                            </span>
                        )}
                    </Link>

                    {/* Search Bar - Hidden on Mobile */}
                    <div className="hidden lg:flex flex-1 max-w-2xl px-4">
                        <SearchBar />
                    </div>

                    {/* Mobile Search Toggle */}
                    <button
                        onClick={() => setIsSearchOpen(!isSearchOpen)}
                        className="lg:hidden p-2 rounded-xl transition-all hover:bg-black/5 dark:hover:bg-white/10"
                        style={{ color: headerTextColor }}
                    >
                        {isSearchOpen ? <X className="w-6 h-6" /> : <SearchIcon className="w-6 h-6" />}
                    </button>

                    <ActionIcons />
                </div>

                {/* Mobile Search Bar Expansion */}
                {isSearchOpen && (
                    <div className="lg:hidden py-3 animate-in slide-in-from-top-2 duration-200">
                        <SearchBar />
                    </div>
                )}

                {/* Bottom Bar: Navigation */}
                <div className={cn(
                    "hidden lg:block transition-all duration-300 ease-in-out",
                    isScrolled ? "max-h-0 opacity-0 mt-0 pt-0 pb-0 overflow-hidden border-t-0 pointer-events-none" : "max-h-[100px] opacity-100 py-3 overflow-visible",
                    isDarkHeader ? "border-t border-white/10" : "border-t border-gray-50"
                )}>
                    <nav className="flex items-center gap-8">
                        {menuItems.length > 0 ? (
                            menuItems.map((item) => {
                                const hasChildren = item.children && item.children.length > 0;
                                const isDynamic = item.type === 'dynamic_category' || item.type === 'category';
                                const subCats = hasChildren ? item.children.filter(c => !c.is_clause) : [];
                                const clauses = hasChildren ? item.children.filter(c => c.is_clause) : [];
                                const isMegaMenu = isDynamic && (subCats.length > 0 || clauses.length > 0);

                                return (
                                    <div 
                                        key={item.id}
                                        className="relative group"
                                        onMouseEnter={() => setActiveDropdown(item.id)}
                                        onMouseLeave={() => setActiveDropdown(null)}
                                    >
                                        <Link
                                            href={item.url || '#'}
                                            target={item.target || '_self'}
                                            className="text-sm font-extrabold transition-all uppercase tracking-wider flex items-center gap-1.5 py-1 relative hover:opacity-80"
                                            style={{ color: item.color || headerTextColor, fontWeight: 800 }}
                                        >
                                            {item.label}
                                            {hasChildren && (
                                                <ChevronDown className="w-3.5 h-3.5 group-hover:rotate-180 transition-transform duration-200 opacity-70" style={{ color: item.color || headerTextColor }} />
                                            )}
                                            <span 
                                                className="absolute -bottom-1 left-0 w-0 h-0.5 transition-all group-hover:w-full" 
                                                style={{ backgroundColor: item.color || 'var(--primary)' }}
                                            />
                                        </Link>

                                        {/* Premium Mega-Menu Dropdown for Categories with Subcategories & Clauses */}
                                        {hasChildren && isMegaMenu && (
                                            <div className={cn(
                                                "absolute top-full left-1/2 -translate-x-1/2 mt-3 bg-white rounded-2xl shadow-2xl border border-gray-100/80 z-[70] transition-all duration-200 overflow-hidden",
                                                (subCats.length > 4 || clauses.length > 4) ? "min-w-[560px]" : "min-w-[320px]",
                                                activeDropdown === item.id ? "opacity-100 visible translate-y-0" : "opacity-0 invisible -translate-y-3 pointer-events-none"
                                            )}>
                                                {/* Arrow notch */}
                                                <div className="absolute -top-1.5 left-1/2 -translate-x-1/2 w-3 h-3 bg-white border-l border-t border-gray-100 rotate-45" />

                                                {subCats.length > 0 && (
                                                    <div className={cn("p-4", clauses.length > 0 ? "border-b border-gray-100" : "")}>
                                                        {clauses.length > 0 && (
                                                            <p className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-3">Browse Categories</p>
                                                        )}
                                                        <div className={cn(
                                                            "grid gap-2",
                                                            subCats.length > 3 ? "grid-cols-2" : "grid-cols-1"
                                                        )}>
                                                            {subCats.map((subItem) => (
                                                                <Link
                                                                    key={subItem.id}
                                                                    href={subItem.url || '#'}
                                                                    target={subItem.target || '_self'}
                                                                    className="flex items-center gap-3 p-2 rounded-xl hover:bg-gray-50 transition-all group/sub"
                                                                >
                                                                    {subItem.image_url ? (
                                                                        <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100 border border-gray-100">
                                                                            <img
                                                                                src={subItem.image_url}
                                                                                alt={subItem.label}
                                                                                className="w-full h-full object-cover group-hover/sub:scale-105 transition-transform duration-300"
                                                                            />
                                                                        </div>
                                                                    ) : (
                                                                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-gray-100 to-gray-200 flex-shrink-0 flex items-center justify-center">
                                                                            <span className="text-gray-400 text-sm">🏷</span>
                                                                        </div>
                                                                    )}
                                                                    <span 
                                                                        className="text-sm font-semibold text-gray-800 group-hover/sub:text-gray-900 leading-tight"
                                                                        style={{ color: subItem.color || undefined }}
                                                                    >
                                                                        {subItem.label}
                                                                    </span>
                                                                </Link>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}

                                                {clauses.length > 0 && (
                                                    <div className="p-4">
                                                        <p className="text-[9px] font-black uppercase tracking-widest text-gray-400 mb-3">Shop by Feature</p>
                                                        <div className={cn(
                                                            "grid gap-2",
                                                            clauses.length > 3 ? "grid-cols-2" : "grid-cols-1"
                                                        )}>
                                                            {clauses.map((subItem) => (
                                                                <Link
                                                                    key={subItem.id}
                                                                    href={subItem.filter_url || subItem.url || '#'}
                                                                    target={subItem.target || '_self'}
                                                                    className="flex items-center gap-3 p-2 rounded-xl hover:bg-amber-50/80 transition-all group/clause"
                                                                >
                                                                    {subItem.image_url ? (
                                                                        <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100 border border-amber-100 relative">
                                                                            <img
                                                                                src={subItem.image_url}
                                                                                alt={subItem.label}
                                                                                className="w-full h-full object-cover opacity-80 group-hover/clause:opacity-100 group-hover/clause:scale-105 transition-all duration-300"
                                                                            />
                                                                            <div className="absolute inset-0 bg-amber-400/20 group-hover/clause:bg-transparent transition-colors" />
                                                                        </div>
                                                                    ) : (
                                                                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-50 to-amber-100 flex-shrink-0 flex items-center justify-center border border-amber-100">
                                                                            <span className="text-amber-500 text-sm">⚡</span>
                                                                        </div>
                                                                    )}
                                                                    <span 
                                                                        className="text-sm font-semibold text-gray-800 group-hover/clause:text-amber-700 leading-tight"
                                                                        style={{ color: subItem.color || undefined }}
                                                                    >
                                                                        {subItem.label}
                                                                    </span>
                                                                </Link>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Footer: View All */}
                                                <div className="border-t border-gray-100 px-4 py-2.5 bg-gray-50/80">
                                                    <Link
                                                        href={item.url || '#'}
                                                        className="text-xs font-bold flex items-center gap-1 hover:gap-2 transition-all"
                                                        style={{ color: 'var(--primary)' }}
                                                    >
                                                        View all {item.label} →
                                                    </Link>
                                                </div>
                                            </div>
                                        )}

                                        {/* Standard Dropdown (non-dynamic children) */}
                                        {hasChildren && !isMegaMenu && (
                                            <div className={cn(
                                                "absolute top-full left-0 mt-3 min-w-[220px] bg-white rounded-2xl shadow-2xl border border-gray-100 py-2 z-[70] transition-all duration-200 overflow-hidden",
                                                activeDropdown === item.id ? "opacity-100 visible translate-y-0" : "opacity-0 invisible -translate-y-3 pointer-events-none"
                                            )}>
                                                {/* Arrow notch */}
                                                <div className="absolute -top-1.5 left-6 w-3 h-3 bg-white border-l border-t border-gray-100 rotate-45" />
                                                {item.children.map((subItem) => (
                                                    <Link
                                                        key={subItem.id}
                                                        href={subItem.filter_url || subItem.url || '#'}
                                                        target={subItem.target || '_self'}
                                                        className={cn(
                                                            "flex items-center gap-3 px-4 py-2.5 text-sm font-semibold transition-all group/std",
                                                            subItem.is_clause
                                                                ? "text-gray-700 hover:bg-amber-50 hover:text-amber-700"
                                                                : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
                                                        )}
                                                        style={{ color: subItem.color || undefined }}
                                                    >
                                                        {subItem.image_url ? (
                                                            <div className="w-8 h-8 rounded-lg overflow-hidden flex-shrink-0">
                                                                <img src={subItem.image_url} alt={subItem.label} className="w-full h-full object-cover" />
                                                            </div>
                                                        ) : (
                                                            subItem.is_clause
                                                                ? <span className="text-amber-400 text-xs">⚡</span>
                                                                : <span className="w-1.5 h-1.5 rounded-full bg-gray-300 group-hover/std:bg-gray-500 flex-shrink-0" />
                                                        )}
                                                        {subItem.label}
                                                    </Link>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                );
                            })
                        ) : (
                            <>
                                <Link 
                                    href="/" 
                                    className="text-sm font-bold transition-all uppercase tracking-wider relative group py-1 hover:opacity-80"
                                    style={{ color: headerTextColor }}
                                >
                                    Home
                                    <span 
                                        className="absolute -bottom-1 left-0 w-full h-0.5" 
                                        style={{ backgroundColor: 'var(--primary)' }}
                                    />
                                </Link>
                                <Link 
                                    href="/products" 
                                    className="text-sm font-bold transition-all uppercase tracking-wider relative group py-1 hover:opacity-80"
                                    style={{ color: headerTextColor }}
                                >
                                    Shop All
                                    <span 
                                        className="absolute -bottom-1 left-0 w-0 h-0.5 transition-all group-hover:w-full" 
                                        style={{ backgroundColor: 'var(--primary)' }}
                                    />
                                </Link>
                                <Link 
                                    href="/categories" 
                                    className="text-sm font-bold transition-all uppercase tracking-wider relative group py-1 hover:opacity-80"
                                    style={{ color: headerTextColor }}
                                >
                                    Categories
                                    <span 
                                        className="absolute -bottom-1 left-0 w-0 h-0.5 transition-all group-hover:w-full" 
                                        style={{ backgroundColor: 'var(--primary)' }}
                                    />
                                </Link>
                            </>
                        )}
                    </nav>
                </div>
            </div>
        </header>
    );

    // Mobile Drawer Component
    const renderMobileDrawer = () => (
        <>
            {isMenuOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-[100] animate-in fade-in duration-300"
                    onClick={() => setIsMenuOpen(false)}
                />
            )}

            <div className={cn(
                "fixed top-0 left-0 bottom-0 w-[280px] bg-white z-[101] shadow-2xl transition-transform duration-300 ease-out flex flex-col lg:hidden",
                isMenuOpen ? "translate-x-0" : "-translate-x-full"
            )}>
                {/* Drawer Header */}
                <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50">
                    <span className="text-sm font-black text-gray-900 tracking-tighter">
                        {tenant?.name?.toUpperCase() || 'MENU'}
                    </span>
                    <button onClick={() => setIsMenuOpen(false)} className="p-2 text-gray-400 hover:text-gray-900">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Account Section in Drawer */}
                <div className="p-4 border-b border-gray-100">
                    {isAuthenticated ? (
                        <div className="flex flex-col gap-3">
                            <div className="flex items-center gap-3 mb-2">
                                <div 
                                    className="w-10 h-10 rounded-full flex items-center justify-center font-bold"
                                    style={{ backgroundColor: 'var(--primary)', color: 'var(--primary-foreground, #ffffff)' }}
                                >
                                    {user?.email?.[0]?.toUpperCase() || 'U'}
                                </div>
                                <div className="flex flex-col">
                                    <span className="text-sm font-bold text-gray-900">{user?.first_name || 'My Profile'}</span>
                                    <span className="text-xs text-gray-500 truncate max-w-[180px]">{user?.email}</span>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-xs font-bold uppercase tracking-wider">
                                <Link href="/account" className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg text-gray-600" onClick={() => setIsMenuOpen(false)}>
                                    <User className="w-3.5 h-3.5" /> Account
                                </Link>
                                <Link href="/account/orders" className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg text-gray-600" onClick={() => setIsMenuOpen(false)}>
                                    <Package className="w-3.5 h-3.5" /> Orders
                                </Link>
                            </div>
                            <button onClick={handleLogout} className="text-sm font-bold text-red-600 text-left pt-1">
                                Sign Out
                            </button>
                        </div>
                    ) : (
                        <Link 
                            href="/login" 
                            className="flex items-center gap-3 p-3 rounded-xl font-bold" 
                            style={{ backgroundColor: 'var(--primary)', color: 'var(--primary-foreground, #ffffff)' }}
                            onClick={() => setIsMenuOpen(false)}
                        >
                            <User className="w-5 h-5" /> Sign In / Register
                        </Link>
                    )}
                </div>

                {/* Nav Links in Drawer */}
                <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-1">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 px-2">Navigation</p>
                    {menuItems.length > 0 ? (
                        menuItems.map((item) => {
                            const hasChildren = item.children && item.children.length > 0;
                            const isExpanded = !!expandedMobileMenus[item.id];
                            const isDynamic = item.type === 'dynamic_category' || item.type === 'category';
                            const subCats = hasChildren ? item.children.filter(c => !c.is_clause) : [];
                            const clauseItems = hasChildren ? item.children.filter(c => c.is_clause) : [];

                            return (
                                <div key={item.id} className="flex flex-col">
                                    <div className="flex items-center justify-between">
                                        <Link
                                            href={item.url || '#'}
                                            target={item.target || '_self'}
                                            className="flex-1 px-3 py-3 text-sm font-bold text-gray-700 hover:text-gray-900 rounded-lg transition-colors"
                                            style={{ color: item.color || undefined }}
                                            onClick={() => !hasChildren && setIsMenuOpen(false)}
                                        >
                                            {item.label}
                                        </Link>
                                        {hasChildren && (
                                            <button 
                                                onClick={() => toggleMobileSubmenu(item.id)}
                                                className="p-3 text-gray-400 hover:text-gray-600"
                                                style={{ color: item.color || undefined }}
                                            >
                                                <ChevronDown className={cn("w-4 h-4 transition-transform", isExpanded && "rotate-180")} />
                                            </button>
                                        )}
                                    </div>

                                    {/* Submenu Accordion */}
                                    {hasChildren && isExpanded && (
                                        <div className="pl-2 pr-2 py-1 flex flex-col gap-0.5 mb-1">
                                            {subCats.length > 0 && (
                                                <>
                                                    {isDynamic && clauseItems.length > 0 && (
                                                        <p className="text-[9px] font-black uppercase tracking-widest text-gray-400 px-3 pt-2 pb-1">Browse</p>
                                                    )}
                                                    {subCats.map(subItem => (
                                                        <Link
                                                            key={subItem.id}
                                                            href={subItem.url || '#'}
                                                            target={subItem.target || '_self'}
                                                            className="flex items-center gap-3 px-3 py-2 text-xs font-semibold text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-xl transition-colors"
                                                            style={{ color: subItem.color || undefined }}
                                                            onClick={() => setIsMenuOpen(false)}
                                                        >
                                                            {subItem.image_url ? (
                                                                <div className="w-8 h-8 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100">
                                                                    <img src={subItem.image_url} alt={subItem.label} className="w-full h-full object-cover" />
                                                                </div>
                                                            ) : (
                                                                <span className="w-1.5 h-1.5 rounded-full bg-gray-300" />
                                                            )}
                                                            {subItem.label}
                                                        </Link>
                                                    ))}
                                                </>
                                            )}
                                            {clauseItems.length > 0 && (
                                                <>
                                                    {isDynamic && (
                                                        <p className="text-[9px] font-black uppercase tracking-widest text-gray-400 px-3 pt-2 pb-1">Shop by Feature</p>
                                                    )}
                                                    {clauseItems.map(subItem => (
                                                        <Link
                                                            key={subItem.id}
                                                            href={subItem.filter_url || subItem.url || '#'}
                                                            target={subItem.target || '_self'}
                                                            className="flex items-center gap-3 px-3 py-2 text-xs font-semibold text-gray-600 hover:text-amber-700 hover:bg-amber-50 rounded-xl transition-colors"
                                                            style={{ color: subItem.color || undefined }}
                                                            onClick={() => setIsMenuOpen(false)}
                                                        >
                                                            {subItem.image_url ? (
                                                                <div className="w-8 h-8 rounded-lg overflow-hidden flex-shrink-0 bg-gray-100 relative">
                                                                    <img src={subItem.image_url} alt={subItem.label} className="w-full h-full object-cover opacity-80" />
                                                                    <div className="absolute inset-0 bg-amber-400/20" />
                                                                </div>
                                                            ) : (
                                                                <span className="text-amber-400 text-[10px]">⚡</span>
                                                            )}
                                                            {subItem.label}
                                                        </Link>
                                                    ))}
                                                </>
                                            )}
                                        </div>
                                    )}
                                </div>
                            );
                        })
                    ) : (
                        <>
                            <Link href="/" className="px-3 py-3 text-sm font-bold text-gray-700 hover:bg-gray-50 rounded-lg flex items-center justify-between" onClick={() => setIsMenuOpen(false)}>
                                Home <ChevronDown className="w-4 h-4 -rotate-90 text-gray-300" />
                            </Link>
                            <Link href="/products" className="px-3 py-3 text-sm font-bold text-gray-700 hover:bg-gray-50 rounded-lg flex items-center justify-between" onClick={() => setIsMenuOpen(false)}>
                                Shop All <ChevronDown className="w-4 h-4 -rotate-90 text-gray-300" />
                            </Link>
                            <Link href="/categories" className="px-3 py-3 text-sm font-bold text-gray-700 hover:bg-gray-50 rounded-lg flex items-center justify-between" onClick={() => setIsMenuOpen(false)}>
                                Categories <ChevronDown className="w-4 h-4 -rotate-90 text-gray-300" />
                            </Link>
                        </>
                    )}
                </div>

                {/* Footer Drawer */}
                <div className="p-4 border-t border-gray-100 bg-gray-50 text-center">
                    <p className="text-[10px] text-gray-400 font-medium">Customer Support</p>
                </div>
            </div>
        </>
    );

    // If widgets exist on the Header page, render in exact defined sequence
    if (widgets && widgets.length > 0) {
        const sortedWidgets = [...widgets].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
        const stockWidget = sortedWidgets.find(w => w.widget_type === 'header_stock_content' || w.widget_type === 'stock_content');

        return (
            <div id="header-region" className="sticky top-0 z-[100] w-full" style={{ backgroundColor: headerBg }}>
                {stockWidget !== undefined ? (
                    // Exact sequential rendering matching admin page builder order
                    sortedWidgets.map(widget => {
                        if (widget.is_active === false) return null;
                        if (widget.widget_type === 'header_stock_content' || widget.widget_type === 'stock_content') {
                            return renderStockHeaderContent(widget.id);
                        }
                        return <WidgetRenderer key={widget.id} widget={widget} />;
                    })
                ) : (
                    // Fallback when no explicit stock content block in DB: announcement bars on top, then default header, then custom widgets
                    <>
                        {sortedWidgets.filter(w => w.is_active !== false && w.widget_type === 'announcement_bar').map(widget => (
                            <WidgetRenderer key={widget.id} widget={widget} />
                        ))}
                        {renderStockHeaderContent('default_stock_header')}
                        {sortedWidgets.filter(w => w.is_active !== false && w.widget_type !== 'announcement_bar').map(widget => (
                            <WidgetRenderer key={widget.id} widget={widget} />
                        ))}
                    </>
                )}

                {/* Mobile Navigation Drawer */}
                {renderMobileDrawer()}
            </div>
        );
    }

    // Default Fallback Header
    return (
        <div id="header-region" className="sticky top-0 z-[100] w-full" style={{ backgroundColor: headerBg }}>
            {renderStockHeaderContent('default_stock_header')}
            {renderMobileDrawer()}
        </div>
    );
}
