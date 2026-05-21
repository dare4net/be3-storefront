"use client";

import { useState, useEffect, useMemo } from 'react';
import { Award, Clock, Store, Target, Copy, Check, Search, Zap, AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import api from '@/lib/axios';
import { useTenant } from '@/components/providers/TenantContext';

export default function CouponsHubPage() {
    const tenant = useTenant();
    const [coupons, setCoupons] = useState([]);
    const [loading, setLoading] = useState(true);

    // Filters and sorting
    const [filterSource, setFilterSource] = useState('all'); // all, platform, vendor
    const [searchQuery, setSearchQuery] = useState("");
    const [sortBy, setSortBy] = useState('newest'); // newest, ending_soon, popularity

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(25); // Responsive pagination

    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth < 1024) {
                setItemsPerPage(15); // 3 columns * 5 rows
            } else {
                setItemsPerPage(25); // 5 columns * 5 rows
            }
        };
        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    const [copiedCode, setCopiedCode] = useState(null);
    const [selectedCoupon, setSelectedCoupon] = useState(null);

    useEffect(() => {
        const fetchCoupons = async () => {
            try {
                const res = await api.get('/discounts/storefront', { headers: { 'X-Tenant-ID': tenant?.id } });
                setCoupons(res.data.data || []);
            } catch (e) {
                console.error("Failed to fetch coupons", e);
            } finally {
                setLoading(false);
            }
        };
        if (tenant?.id) fetchCoupons();
    }, [tenant?.id]);

    const handleCopy = (code, e) => {
        if (e) e.stopPropagation();
        navigator.clipboard.writeText(code);
        setCopiedCode(code);
        setTimeout(() => setCopiedCode(null), 2000);
    };

    const isNew = (date) => {
        if (!date) return false;
        return (Date.now() - new Date(date).getTime()) < 3 * 24 * 60 * 60 * 1000;
    };

    const isExpiring = (date) => {
        if (!date) return false;
        const diff = new Date(date).getTime() - Date.now();
        return diff > 0 && diff < 3 * 24 * 60 * 60 * 1000;
    };

    const isFinishing = (coupon) => {
        if (coupon.max_uses === null) return false;
        return (coupon.used_count / coupon.max_uses) > 0.8;
    };

    const getCouponState = (coupon) => {
        if (coupon.expires_at && Date.now() > new Date(coupon.expires_at).getTime()) {
            return { cardBg: 'bg-gray-100', cardBorder: 'border-gray-200', text: 'text-gray-600', label: 'EXPIRED' };
        }
        if (coupon.max_uses !== null && coupon.used_count >= coupon.max_uses) {
            return { cardBg: 'bg-gray-100', cardBorder: 'border-gray-200', text: 'text-gray-600', label: 'CLAIMED OUT' };
        }
        if (isExpiring(coupon.expires_at)) {
            return { cardBg: 'bg-red-50', cardBorder: 'border-red-200', text: 'text-red-700', label: 'EXPIRING' };
        }
        if (isFinishing(coupon)) {
            return { cardBg: 'bg-orange-50', cardBorder: 'border-orange-200', text: 'text-orange-700', label: 'ALMOST FINISHED' };
        }
        if (isNew(coupon.created_at)) {
            return { cardBg: 'bg-green-50', cardBorder: 'border-green-200', text: 'text-green-700', label: 'NEW' };
        }
        return { cardBg: 'bg-blue-50', cardBorder: 'border-blue-200', text: 'text-blue-700', label: 'ACTIVE' };
    };

    const formatCurrency = (val) => {
        return "$" + parseFloat(val).toFixed(2);
    };

    // Filter, Sort, Paginate
    const processedCoupons = useMemo(() => {
        let filtered = coupons.filter(c => {
            if (filterSource === 'platform' && c.vendor_id) return false;
            if (filterSource === 'vendor' && !c.vendor_id) return false;

            if (searchQuery) {
                const q = searchQuery.toLowerCase();
                return c.code.toLowerCase().includes(q) ||
                    (c.vendor_name && c.vendor_name.toLowerCase().includes(q)) ||
                    c.description.toLowerCase().includes(q);
            }
            return true;
        });

        filtered.sort((a, b) => {
            if (sortBy === 'newest') {
                return new Date(b.created_at) - new Date(a.created_at);
            } else if (sortBy === 'ending_soon') {
                if (!a.expires_at) return 1;
                if (!b.expires_at) return -1;
                return new Date(a.expires_at) - new Date(b.expires_at);
            } else if (sortBy === 'popularity') {
                return (b.used_count || 0) - (a.used_count || 0);
            }
            return 0;
        });

        return filtered;
    }, [coupons, filterSource, searchQuery, sortBy]);

    const totalPages = Math.ceil(processedCoupons.length / itemsPerPage);
    const paginatedCoupons = processedCoupons.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    useEffect(() => {
        setCurrentPage(1);
    }, [filterSource, searchQuery, sortBy]);

    return (
        <div className="min-h-screen bg-gray-50 pb-24 font-sans selection:bg-gray-200">
            {/* Minimalist Header */}
            <div className="bg-white border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
                    <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-10">
                        <div className="max-w-xl">
                            <h1 className="text-4xl font-extralight text-gray-900 tracking-tight">Available Coupons</h1>
                            <p className="text-gray-500 mt-2 text-sm font-medium">Verified promotions for your next order.</p>
                        </div>

                        <div className="w-full lg:w-auto flex flex-col sm:flex-row gap-3">
                            <div className="relative w-full sm:w-64">
                                <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                                <input
                                    type="text"
                                    placeholder="Search codes..."
                                    value={searchQuery}
                                    onChange={e => setSearchQuery(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2.5 bg-gray-50 hover:bg-gray-100 focus:bg-white border border-gray-200 rounded-lg text-sm transition-colors outline-none focus:border-gray-400 focus:ring-0"
                                />
                            </div>
                            <select
                                value={filterSource}
                                onChange={e => setFilterSource(e.target.value)}
                                className="w-full sm:w-40 px-3 py-2.5 bg-white border border-gray-200 hover:border-gray-300 rounded-lg text-sm text-gray-700 outline-none focus:border-gray-400 cursor-pointer"
                            >
                                <option value="all">All Sources</option>
                                <option value="platform">Platform Official</option>
                                <option value="vendor">Vendor Specific</option>
                            </select>
                            <select
                                value={sortBy}
                                onChange={e => setSortBy(e.target.value)}
                                className="w-full sm:w-40 px-3 py-2.5 bg-white border border-gray-200 hover:border-gray-300 rounded-lg text-sm text-gray-700 outline-none focus:border-gray-400 cursor-pointer"
                            >
                                <option value="newest">Newest First</option>
                                <option value="ending_soon">Ending Soon</option>
                                <option value="popularity">Most Popular</option>
                            </select>
                        </div>
                    </div>
                </div>
            </div>

            {/* Grid Content */}
            <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-12">
                {loading ? (
                    <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                        {[...Array(itemsPerPage)].map((_, i) => (
                            <div key={i} className="h-64 bg-white border border-gray-200 rounded-2xl animate-pulse"></div>
                        ))}
                    </div>
                ) : paginatedCoupons.length > 0 ? (
                    <>
                        <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                            {paginatedCoupons.map(coupon => {
                                const isPct = coupon.type === 'percentage';
                                const isFixed = coupon.type === 'fixed';
                                const stateVars = getCouponState(coupon);

                                return (
                                    <div
                                        key={coupon.id}
                                        onClick={() => setSelectedCoupon(coupon)}
                                        className={`${stateVars.cardBg} border ${stateVars.cardBorder} rounded-2xl group relative p-6 cursor-pointer flex flex-col justify-between hover:border-gray-900 transition-colors shadow-sm hover:shadow-md`}
                                    >
                                        <div>
                                            <div className="flex items-center justify-between mb-6">
                                                <div className="text-xs font-mono font-bold tracking-wider px-3 py-1.5 rounded-lg border border-gray-200 bg-white/70 max-w-max text-gray-900 shadow-sm">
                                                    {coupon.code}
                                                </div>
                                                <div className={`flex gap-2 text-[10px] font-bold uppercase tracking-widest ${stateVars.text}`}>
                                                    <span>{stateVars.label}</span>
                                                </div>
                                            </div>

                                            <div className="mb-4">
                                                <h3 className="text-3xl font-light text-gray-900 tracking-tight">
                                                    {isPct ? `${coupon.value}% OFF` : isFixed ? `${formatCurrency(coupon.value)} OFF` : 'FREE SHIPPING'}
                                                </h3>
                                                <p className="text-sm text-gray-500 mt-2 line-clamp-2 leading-relaxed">
                                                    {coupon.description}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="pt-6 mt-6 border-t border-gray-200/50 flex items-end justify-between">
                                            <div className="space-y-1.5 text-xs text-gray-500">
                                                {coupon.vendor_id ? (
                                                    <p className="flex items-center gap-1.5">
                                                        <Store className="w-3.5 h-3.5 flex-shrink-0" />
                                                        <span className="truncate max-w-[160px] text-gray-900 font-semibold">
                                                            {coupon.vendor_verified ? (() => {
                                                                const parts = (coupon.vendor_name || 'Vendor').split(' ');
                                                                const lastWord = parts.pop();
                                                                return (
                                                                    <>
                                                                        {parts.length > 0 && parts.join(' ') + ' '}
                                                                        <span className="whitespace-nowrap">
                                                                            {lastWord}
                                                                            <img
                                                                                src="/verified.svg"
                                                                                alt="Verified Business"
                                                                                title="Verified Business"
                                                                                className="w-3.5 h-3.5 object-contain inline-block align-middle ml-1"
                                                                            />
                                                                        </span>
                                                                    </>
                                                                );
                                                            })() : coupon.vendor_name}
                                                        </span>
                                                    </p>
                                                ) : (
                                                    <p className="flex items-center gap-1.5">
                                                        <Award className="w-3.5 h-3.5" />
                                                        Platform
                                                    </p>
                                                )}

                                                <p className="flex items-center gap-1.5">
                                                    <Target className="w-3.5 h-3.5" />
                                                    {coupon.applicable_to === 'all' ? 'Site-wide' : coupon.applicable_to === 'categories' ? 'Categories' : 'Products'}
                                                </p>
                                            </div>

                                            <button
                                                onClick={(e) => handleCopy(coupon.code, e)}
                                                className="w-10 h-10 flex items-center justify-center rounded-full bg-white/60 border border-gray-200 text-gray-900 hover:bg-white transition-colors shadow-sm"
                                            >
                                                {copiedCode === coupon.code ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {totalPages > 1 && (
                            <div className="flex items-center justify-center gap-4 mt-12 bg-white px-6 py-4 border border-gray-200 w-max mx-auto rounded-2xl shadow-sm">
                                <button
                                    disabled={currentPage === 1}
                                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                    className="p-1 text-gray-500 hover:text-gray-900 transition-colors disabled:opacity-30"
                                >
                                    <ChevronLeft className="w-5 h-5" />
                                </button>
                                <div className="text-xs font-semibold text-gray-500 uppercase tracking-widest px-4">
                                    Page {currentPage} of {totalPages}
                                </div>
                                <button
                                    disabled={currentPage === totalPages}
                                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                    className="p-1 text-gray-500 hover:text-gray-900 transition-colors disabled:opacity-30"
                                >
                                    <ChevronRight className="w-5 h-5" />
                                </button>
                            </div>
                        )}
                    </>
                ) : (
                    <div className="text-center py-24 bg-white border border-gray-200 rounded-2xl">
                        <AlertCircle className="w-8 h-8 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-gray-900 font-medium text-lg">No active coupons found.</h3>
                        <p className="text-gray-500 text-sm mt-1 max-w-sm mx-auto">Try adjusting your filters or search constraints.</p>
                        {(filterSource !== 'all' || searchQuery) && (
                            <button
                                onClick={() => { setFilterSource('all'); setSearchQuery(''); }}
                                className="mt-6 px-5 py-2 hover:underline text-sm font-medium text-gray-900"
                            >
                                Clear Filters
                            </button>
                        )}
                    </div>
                )}
            </div>

            {/* Click Modal overlay */}
            {selectedCoupon && (
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4 transition-all" onClick={() => setSelectedCoupon(null)}>
                    <div className="bg-white rounded-[2rem] border border-gray-200 max-w-md w-full flex flex-col shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
                        <div className="p-8 pb-6 border-b border-gray-100 flex flex-col relative text-center">
                            <button className="absolute right-6 top-6 text-gray-400 hover:text-gray-900 transition-colors bg-white border border-gray-100 rounded-full p-2 shadow-sm" onClick={() => setSelectedCoupon(null)}>
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>

                            <div className="text-xs font-mono font-bold tracking-wider px-4 py-2 border border-gray-200 rounded-xl bg-gray-50 max-w-max mx-auto mb-6 text-gray-900">
                                {selectedCoupon.code}
                            </div>

                            <h2 className="text-4xl font-light text-gray-900 tracking-tight leading-none mb-4">
                                {selectedCoupon.type === 'percentage' ? `${selectedCoupon.value}% OFF` : selectedCoupon.type === 'fixed' ? `${formatCurrency(selectedCoupon.value)} OFF` : 'Free Shipping'}
                            </h2>
                            <p className="text-sm text-gray-600 font-medium max-w-sm mx-auto leading-relaxed">
                                {selectedCoupon.description}
                            </p>
                        </div>

                        <div className="px-8 py-6 space-y-6 flex-1 overflow-y-auto">

                            <div className="grid grid-cols-2 gap-px bg-gray-100 border border-gray-100 rounded-2xl overflow-hidden">
                                <div className="bg-white p-4 text-center">
                                    <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-1">Min Spend</p>
                                    <p className="text-sm font-semibold text-gray-900">{parseFloat(selectedCoupon.min_order_value) > 0 ? formatCurrency(selectedCoupon.min_order_value) : 'None'}</p>
                                </div>
                                <div className="bg-white p-4 text-center">
                                    <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest mb-1">Uses</p>
                                    <p className="text-sm font-semibold text-gray-900">{selectedCoupon.used_count}</p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <h3 className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest border-b border-gray-100 pb-2">Constraints</h3>

                                <div className="flex gap-4">
                                    <Target className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
                                    <div className="leading-snug">
                                        <p className="text-sm text-gray-900">
                                            {selectedCoupon.applicable_to === 'all' && 'Applicable store-wide'}
                                            {selectedCoupon.applicable_to === 'categories' && 'Specific Categories'}
                                            {selectedCoupon.applicable_to === 'products' && 'Specific Products'}
                                        </p>
                                        {selectedCoupon.applicable_to === 'categories' && selectedCoupon.applicable_names && (
                                            <div className="flex flex-wrap gap-2 mt-2">
                                                {selectedCoupon.applicable_names.map(name => (
                                                    <span key={name} className="px-2 py-0.5 border border-gray-200 text-gray-600 text-xs rounded-lg">{name}</span>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {selectedCoupon.max_uses !== null && (
                                    <div className="flex gap-4">
                                        <Zap className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
                                        <div className="w-full">
                                            <p className="text-sm text-gray-900 mb-2">Usage Limit ({selectedCoupon.used_count} / {selectedCoupon.max_uses})</p>
                                            <div className="h-1 bg-gray-100 w-full overflow-hidden rounded-full">
                                                <div className="h-full bg-gray-900" style={{ width: `${Math.min(100, (selectedCoupon.used_count / selectedCoupon.max_uses) * 100)}%` }}></div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {selectedCoupon.expires_at && (
                                    <div className="flex gap-4">
                                        <Clock className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
                                        <div>
                                            <p className="text-sm text-gray-900">Valid Until</p>
                                            <p className="text-sm text-gray-500 mt-1">{new Date(selectedCoupon.expires_at).toLocaleString()}</p>
                                        </div>
                                    </div>
                                )}

                                {selectedCoupon.vendor_id && (
                                    <div className="flex gap-4">
                                        <Store className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
                                        <div>
                                            <p className="text-sm text-gray-900 leading-snug">
                                                Issued by <span className="font-semibold">
                                                    {selectedCoupon.vendor_verified ? (() => {
                                                        const parts = (selectedCoupon.vendor_name || 'Vendor').split(' ');
                                                        const lastWord = parts.pop();
                                                        return (
                                                            <>
                                                                {parts.length > 0 && parts.join(' ') + ' '}
                                                                <span className="whitespace-nowrap">
                                                                    {lastWord}
                                                                    <img
                                                                        src="/verified.svg"
                                                                        alt="Verified Business"
                                                                        title="Verified Business"
                                                                        className="w-4 h-4 object-contain inline-block align-middle ml-1"
                                                                    />
                                                                </span>
                                                            </>
                                                        );
                                                    })() : selectedCoupon.vendor_name}
                                                </span>
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="p-6 bg-gray-50 border-t border-gray-200 flex flex-col gap-3">
                            <button
                                onClick={(e) => handleCopy(selectedCoupon.code, e)}
                                className={`w-full py-4 rounded-xl text-sm font-semibold transition-colors flex items-center justify-center gap-2
                                    ${copiedCode === selectedCoupon.code
                                        ? 'bg-green-600 text-white'
                                        : 'bg-gray-900 text-white hover:bg-gray-800'
                                    }
                                `}
                            >
                                {copiedCode === selectedCoupon.code ? 'Copied' : 'Copy Code'}
                            </button>

                            {selectedCoupon.vendor_id && selectedCoupon.vendor_slug && (
                                <Link
                                    href={`/collections/${selectedCoupon.vendor_slug}`}
                                    className="w-full py-3.5 bg-white border border-gray-200 hover:border-gray-900 rounded-xl text-gray-900 text-sm font-medium transition-colors text-center"
                                >
                                    Visit Store
                                </Link>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
