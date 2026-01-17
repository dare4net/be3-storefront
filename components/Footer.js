"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useTenant } from '@/components/providers/TenantContext'; // Correct path
import MenuWidget from './widgets/MenuWidget'; // Relative path from components/Footer.js
import NewsletterWidget from './widgets/NewsletterWidget';
import SocialLinksWidget from './widgets/SocialLinksWidget';
import { useStorefront } from './providers/StorefrontProvider';
import api from '@/lib/axios';
import WidgetRenderer from './widgets/WidgetRenderer';

export default function Footer() {
    const tenant = useTenant();
    const { config, theme } = useStorefront();
    const [widgets, setWidgets] = useState([]);
    const [loading, setLoading] = useState(true);

    // Fetch Footer Widgets
    useEffect(() => {
        if (tenant?.id) {
            api.get('/page-builder/widgets?page=footer', {
                headers: { "X-Tenant-ID": tenant.id }
            })
                .then(res => {
                    if (res.data.success && res.data.widgets.length > 0) {
                        setWidgets(res.data.widgets);
                    }
                })
                .catch(err => console.error("Failed to fetch footer widgets", err))
                .finally(() => setLoading(false));
        }
    }, [tenant?.id]);

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
        <footer className="bg-white border-t border-gray-200 mt-auto" aria-labelledby="footer-heading">
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
                        <div className="space-y-8 col-span-1 lg:col-span-1">
                            <div>
                                {theme?.variables?.logo ? (
                                    <img
                                        src={theme.variables.logo}
                                        alt={tenant?.name || 'Store'}
                                        className="h-8 w-auto object-contain mb-4"
                                    />
                                ) : (
                                    <span className="text-xl font-bold text-gray-900">
                                        {tenant?.name || 'Store'}
                                    </span>
                                )}
                                <p className="mt-4 text-sm text-gray-500 max-w-xs">
                                    Premium quality products for your lifestyle.
                                    Designed for excellence.
                                </p>
                            </div>
                            <SocialLinksWidget config={socialLinks} />
                        </div>

                        {/* Shop Menu */}
                        <div className="space-y-8 col-span-1">
                            <MenuWidget config={{ title: 'Shop', menuLocation: 'footer_1' }} />
                        </div>

                        {/* Company Menu */}
                        <div className="space-y-8 col-span-1">
                            <MenuWidget config={{ title: 'Company', menuLocation: 'footer_2' }} />
                        </div>

                        {/* Newsletter */}
                        <div className="space-y-8 col-span-1">
                            <NewsletterWidget config={{ title: 'Stay in the loop' }} />
                        </div>
                    </div>
                )}

                <div className="border-t border-gray-200 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
                    <p className="text-xs text-gray-400">
                        {copyrightText}
                    </p>
                    <div className="flex gap-4 text-xs text-gray-400">
                        <Link href="/privacy" className="hover:text-gray-900">Privacy Policy</Link>
                        <Link href="/terms" className="hover:text-gray-900">Terms of Service</Link>
                    </div>
                </div>
            </div>
        </footer>
    );
}
