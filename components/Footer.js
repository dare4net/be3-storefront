"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useTenant } from '@/components/providers/TenantContext'; // Correct path
import NewsletterWidget from './widgets/NewsletterWidget';
import SocialLinksWidget from './widgets/SocialLinksWidget';
import { useStorefront } from './providers/StorefrontProvider';
import api from '@/lib/axios';
import WidgetRenderer from './widgets/WidgetRenderer';

import { useRandomizationContext } from '@/lib/contexts/RandomizationContext';

export default function Footer() {
    const tenant = useTenant();
    const { config, theme } = useStorefront();
    const { seedPlan } = useRandomizationContext();
    const [widgets, setWidgets] = useState([]);
    const [loading, setLoading] = useState(true);

    // Fetch Footer Widgets
    useEffect(() => {
        if (tenant?.id) {
            api.get('/page-builder/widgets?page=footer', {
                headers: { "X-Tenant-ID": tenant.id }
            })
                .then(res => {
                    if (res.data.success) {
                        // Waterfall Killer: Seed initial randomization plan from server
                        if (res.data.randomizationPlan) {
                            seedPlan(res.data.randomizationPlan);
                        }

                        if (res.data.widgets.length > 0) {
                            setWidgets(res.data.widgets);
                        }
                    }
                })
                .catch(err => console.error("Failed to fetch footer widgets", err))
                .finally(() => setLoading(false));
        }
    }, [tenant?.id, seedPlan]);

    if (!config.showFooter) return null;

    // Use theme variables or fallback defaults
    const socialLinks = theme?.variables?.social || {
        facebook: 'https://facebook.com',
        twitter: 'https://twitter.com',
        instagram: 'https://instagram.com'
    };

    const copyrightText = theme?.variables?.copyright ||
        `© ${new Date().getFullYear()} ${tenant?.name || 'Company, Inc'}. All rights reserved.`;

    return (
        <footer className="bg-gray-900 border-t border-gray-800 mt-auto" aria-labelledby="footer-heading">
            <h2 id="footer-heading" className="sr-only">Footer</h2>
            <div className="mx-auto max-w-7xl px-4 pb-8 pt-16 sm:px-6 lg:px-8">

                {/* Custom Widgets Section */}
                {widgets.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
                        {widgets.map(widget => (
                            <div key={widget.id} className={widget.config?.width || 'col-span-1'}>
                                <WidgetRenderer widget={widget} />
                            </div>
                        ))}
                    </div>
                ) : (
                    /* Fallback Legacy Layout */
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
                        {/* Brand Column */}
                        <div className="space-y-8 col-span-1 lg:col-span-1 md:border-r border-gray-800 pr-4">
                            <div>
                                {theme?.variables?.logo ? (
                                    <img
                                        src={theme.variables.logo}
                                        alt={tenant?.name || 'Store'}
                                        className="h-8 w-auto object-contain mb-4 brightness-0 invert"
                                    />
                                ) : (
                                    <span className="text-xl font-bold text-white">
                                        {tenant?.name || 'Store'}
                                    </span>
                                )}
                                <p className="mt-4 text-sm text-gray-400 max-w-xs">
                                    Premium quality products for your lifestyle.
                                    Designed for excellence.
                                </p>
                                <div className="mt-6 text-sm text-gray-400">
                                    <p className="flex items-center gap-2 mb-2">
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                                        support@example.com
                                    </p>
                                </div>
                            </div>
                            <div className="invert">
                                <SocialLinksWidget config={Object.keys(socialLinks).length > 0 && Object.values(socialLinks).some(Boolean) ? socialLinks : { facebook: '#', twitter: '#', instagram: '#' }} />
                            </div>
                        </div>

                        {/* Shop & Discover */}
                        <div className="col-span-1 lg:pl-4">
                            <h3 className="text-sm font-semibold text-white tracking-wider uppercase mb-5">Shop</h3>
                            <ul className="space-y-4">
                                <li><Link href="/products" className="text-sm font-medium text-gray-400 hover:text-white transition-colors">All Products</Link></li>
                                <li><Link href="/categories" className="text-sm font-medium text-gray-400 hover:text-white transition-colors">Categories</Link></li>
                                <li><Link href="/search?q=deals" className="text-sm font-medium text-gray-400 hover:text-white transition-colors">Deals & Offers</Link></li>
                                <li><Link href="/collections/featured" className="text-sm font-medium text-gray-400 hover:text-white transition-colors">Featured Collection</Link></li>
                            </ul>
                        </div>

                        {/* Customer Service */}
                        <div className="col-span-1">
                            <h3 className="text-sm font-semibold text-white tracking-wider uppercase mb-5">Support</h3>
                            <ul className="space-y-4">
                                <li><Link href="/account/orders" className="text-sm font-medium text-gray-400 hover:text-white transition-colors">Track Order</Link></li>
                                <li><Link href="/returns" className="text-sm font-medium text-gray-400 hover:text-white transition-colors">Returns & Exchanges</Link></li>
                                <li><Link href="/faq" className="text-sm font-medium text-gray-400 hover:text-white transition-colors">FAQs</Link></li>
                                <li><Link href="/contact" className="text-sm font-medium text-gray-400 hover:text-white transition-colors">Contact Us</Link></li>
                            </ul>
                        </div>

                        {/* Newsletter */}
                        <div className="col-span-1 flex flex-col gap-5">
                            <div className="[&>section]:py-0">
                                <NewsletterWidget config={{
                                    title: 'Stay in the loop',
                                    subtitle: '',
                                    layout: 'stacked',
                                    textColor: '#ffffff',
                                    backgroundColor: 'transparent',
                                    inputStyle: {
                                        backgroundColor: '#374151',
                                        borderColor: '#4b5563',
                                        textColor: '#f9fafb',
                                        borderRadius: '8px'
                                    },
                                    buttonStyle: {
                                        backgroundColor: '#4f46e5',
                                        textColor: '#ffffff',
                                        borderRadius: '8px'
                                    }
                                }} />
                            </div>

                            {/* Trust Badges */}
                            <div className="pt-2">
                                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-3">Secure Payments</h3>
                                <div className="flex items-center gap-2">
                                    <div className="w-10 h-6 bg-white rounded border border-gray-200 flex items-center justify-center">
                                        <svg viewBox="0 0 38 24" xmlns="http://www.w3.org/2000/svg" width="20" height="auto" role="img"><path opacity=".07" d="M35 0H3C1.3 0 0 1.3 0 3v18c0 1.7 1.4 3 3 3h32c1.7 0 3-1.3 3-3V3c0-1.7-1.4-3-3-3z" /><path fill="#fff" d="M35 1c1.1 0 2 .9 2 2v18c0 1.1-.9 2-2 2H3c-1.1 0-2-.9-2-2V3c0-1.1.9-2 2-2h32" /><path d="M28.3 10.1l-1.6 7.4h-2.5l1.6-7.4h2.5zM19.1 10s-.4-.1-.8-.1c-2.4 0-4 1.2-4 2.9 0 1.3 1.1 1.9 1.9 2.3.9.4 1.1.6 1.1 1 0 .5-.7.8-1.4.8-1.5 0-2.3-.4-3.1-.8l-.4 1.9c.8.3 2 .6 3.2.6 2.6 0 4.2-1.2 4.2-3 0-1-.7-1.8-1.8-2.3-.8-.4-1.2-.6-1.2-1 0-.4.5-.7 1.3-.8 1.1-.1 1.9.2 2.6.5l.4-1.6zM13.4 10.1l-2.4 5.1-.3-1.4c-.6-2-1.7-4.1-3.2-5.4-.5-.4-2-.7-3.1-.8L4 10.3l3.3 7.2h2.7l4.3-7.4h-1zm21.4.1h-1.9c-.6 0-1 .3-1.3.8l-3.8 6.5h2.6l.5-1.4h3.2l.3 1.4h2.5L34.8 10.2zM31 11.8l.9 2.6H30l1-2.6z" fill="#2566AF" /></svg>
                                    </div>
                                    <div className="w-10 h-6 bg-white rounded border border-gray-200 flex items-center justify-center">
                                        <svg viewBox="0 0 38 24" xmlns="http://www.w3.org/2000/svg" width="20" height="auto" role="img"><path opacity=".07" d="M35 0H3C1.3 0 0 1.3 0 3v18c0 1.7 1.4 3 3 3h32c1.7 0 3-1.3 3-3V3c0-1.7-1.4-3-3-3z" /><path fill="#fff" d="M35 1c1.1 0 2 .9 2 2v18c0 1.1-.9 2-2 2H3c-1.1 0-2-.9-2-2V3c0-1.1.9-2 2-2h32" /><circle fill="#EB001B" cx="15" cy="12" r="7" /><circle fill="#F79E1B" cx="23" cy="12" r="7" /><path fill="#FF5F00" d="M22 12c0-2.4-1.2-4.5-3-5.7-1.8 1.3-3 3.4-3 5.7s1.2 4.5 3 5.7c1.8-1.2 3-3.3 3-5.7z" /></svg>
                                    </div>
                                    <div className="w-10 h-6 bg-white rounded border border-gray-200 flex items-center justify-center">
                                        <svg viewBox="0 0 38 24" xmlns="http://www.w3.org/2000/svg" width="20" height="auto" role="img"><path opacity=".07" d="M35 0H3C1.3 0 0 1.3 0 3v18c0 1.7 1.4 3 3 3h32c1.7 0 3-1.3 3-3V3c0-1.7-1.4-3-3-3z" /><path fill="#fff" d="M35 1c1.1 0 2 .9 2 2v18c0 1.1-.9 2-2 2H3c-1.1 0-2-.9-2-2V3c0-1.1.9-2 2-2h32" /><path d="M12.9 8c.3-.6.6-1.1.9-1.6l10-6.1h3l-3.3 5v5l-4-2.8-2 3c-1.3-.9-1.7-2.6-1-4.1l-1.9 1.1.7-3.9-2.9 2v4.8L9.8 11V7l-1.8 1.1-.5-3 2.1-1.3 1.2 1.3 2.1 2.9zm13 3l-3.6-5.4 3.7-2.3 8.3 5.3v2H26zM2 13h10.4l.2 1.3H10.1v1.1h1.7v1.3H10.1v1.2H12v1.3H2V13zm26.9 2v4h4V15h-4zm3.9-.9c-.1-1.1-1-2-2-2s-1.9.9-2 2h4z" fill="#006FCF" /></svg>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
                    <p className="text-xs text-gray-500">
                        {copyrightText}
                    </p>
                    <div className="flex gap-4 text-xs text-gray-500">
                        <Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link>
                        <Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link>
                    </div>
                </div>
            </div>
        </footer>
    );
}
