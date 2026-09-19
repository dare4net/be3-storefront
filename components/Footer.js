"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useTenant } from '@/components/providers/TenantContext';
import NewsletterWidget from './widgets/NewsletterWidget';
import SocialLinksWidget from './widgets/SocialLinksWidget';
import { useStorefront } from './providers/StorefrontProvider';
import api from '@/lib/axios';
import WidgetRenderer from './widgets/WidgetRenderer';
import { useRandomizationContext } from '@/lib/contexts/RandomizationContext';
import { Mail, Phone, MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function Footer() {
    const tenant = useTenant();
    const { config, theme } = useStorefront();
    const { seedPlan } = useRandomizationContext();
    const [widgets, setWidgets] = useState([]);
    const [pageSettings, setPageSettings] = useState(null);
    const [loading, setLoading] = useState(true);
    const [menuCache, setMenuCache] = useState({}); // { [menu_id]: [{ label, url }] }

    // Fetch Footer Widgets & Page Settings
    useEffect(() => {
        if (tenant?.id) {
            api.get('/page-builder/widgets?page=footer&includeInactive=true', {
                headers: { "X-Tenant-ID": tenant.id }
            })
                .then(res => {
                    if (res.data.success) {
                        if (res.data.page) setPageSettings(res.data.page);
                        if (res.data.randomizationPlan) seedPlan(res.data.randomizationPlan);
                        if (res.data.widgets) setWidgets(res.data.widgets);
                    }
                })
                .catch(err => console.error("Failed to fetch footer widgets", err))
                .finally(() => setLoading(false));
        }
    }, [tenant?.id, seedPlan]);

    // Fetch menu items for any menu-linked columns
    useEffect(() => {
        if (!tenant?.id) return;
        const footerCfg = theme?.variables?.footer || {};
        const cols = footerCfg.columns || [];
        const menuIds = [...new Set(cols.filter(c => c.type === 'menu' && c.menu_id).map(c => c.menu_id))];
        if (menuIds.length === 0) return;
        menuIds.forEach(menuId => {
            if (menuCache[menuId]) return; // already fetched
            // Use the public storefront-by-id endpoint (no JWT required)
            api.get(`/menus/storefront-by-id/${menuId}`, { headers: { "X-Tenant-ID": tenant.id } })
                .then(res => {
                    if (res.data.success && res.data.items) {
                        const links = (res.data.items || []).map(item => ({
                            label: item.label,
                            url: item.url || '#',
                        }));
                        setMenuCache(prev => ({ ...prev, [menuId]: links }));
                    }
                })
                .catch(() => {});
        });
    }, [tenant?.id, theme?.variables?.footer]);

    if (!config.showFooter) return null;

    // Pull footer settings from theme variables or page settings
    const footerCfg = theme?.variables?.footer || {};
    const socialLinks = theme?.variables?.social || {};

    const pageBg = pageSettings?.theme_overrides?.background;
    const bgColor = pageBg || footerCfg.backgroundColor || '#111827';

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

    const isDarkFooter = isDarkColor(bgColor);
    const textColor = footerCfg.textColor || (isDarkFooter ? '#9ca3af' : '#4b5563');
    const headingColor = isDarkFooter ? '#ffffff' : '#111827';
    const borderColor = isDarkFooter ? 'border-gray-800' : 'border-gray-200';
    const aboutText = footerCfg.aboutText || 'Premium quality products for your lifestyle. Designed for excellence.';
    const contactEmail = footerCfg.contactEmail || '';
    const contactPhone = footerCfg.contactPhone || '';
    const contactAddress = footerCfg.contactAddress || '';
    const showNewsletter = footerCfg.showNewsletter !== false;
    const showSocialLinks = footerCfg.showSocialLinks !== false;
    const showPaymentIcons = footerCfg.showPaymentIcons !== false;
    const copyrightText = footerCfg.copyrightText || theme?.variables?.copyright ||
        `© ${new Date().getFullYear()} ${tenant?.name || 'Company, Inc'}. All rights reserved.`;
    const bottomLinks = footerCfg.bottomLinks || [
        { label: "Privacy Policy", url: "/privacy" },
        { label: "Terms of Service", url: "/terms" },
    ];
    const columns = footerCfg.columns || [
        {
            id: "col-shop", title: "Shop",
            links: [
                { label: "All Products", url: "/products" },
                { label: "Categories", url: "/categories" },
                { label: "Deals & Offers", url: "/search?q=deals" },
                { label: "Featured", url: "/collections/featured" },
            ]
        },
        {
            id: "col-support", title: "Support",
            links: [
                { label: "Track Order", url: "/account/orders" },
                { label: "Returns & Exchanges", url: "/returns" },
                { label: "FAQs", url: "/faq" },
                { label: "Contact Us", url: "/contact" },
            ]
        },
    ];

    const renderStockFooterContent = () => (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 mb-12">
            {/* ── Brand Column ── */}
            <div className="lg:col-span-2 space-y-5">
                {/* Logo */}
                {theme?.variables?.logo ? (
                    <img
                        src={theme.variables.logo}
                        alt={tenant?.name || 'Store'}
                        className={cn("h-8 w-auto object-contain", isDarkFooter && "brightness-0 invert")}
                    />
                ) : (
                    <span className="text-xl font-bold" style={{ color: headingColor }}>
                        {tenant?.name || 'Store'}
                    </span>
                )}

                {/* About Text */}
                <p className="text-sm max-w-xs leading-relaxed" style={{ color: textColor }}>
                    {aboutText}
                </p>

                {/* Contact Info */}
                {(contactEmail || contactPhone || contactAddress) && (
                    <div className="space-y-2 text-xs" style={{ color: textColor }}>
                        {contactEmail && (
                            <a href={`mailto:${contactEmail}`} className="flex items-center gap-2 hover:text-white transition-colors">
                                <Mail className="w-3.5 h-3.5 flex-shrink-0" /> {contactEmail}
                            </a>
                        )}
                        {contactPhone && (
                            <a href={`tel:${contactPhone}`} className="flex items-center gap-2 hover:text-white transition-colors">
                                <Phone className="w-3.5 h-3.5 flex-shrink-0" /> {contactPhone}
                            </a>
                        )}
                        {contactAddress && (
                            <p className="flex items-start gap-2">
                                <MapPin className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" /> {contactAddress}
                            </p>
                        )}
                    </div>
                )}

                {/* Social Links */}
                {showSocialLinks && Object.values(socialLinks).some(v => v && v.trim() !== '' && v !== '#') && (
                    <SocialLinksWidget config={socialLinks} />
                )}
            </div>

            {/* ── Dynamic Link Columns ── */}
            {columns.map((col) => {
                // Resolve links: if menu-linked, use cached menu items
                const resolvedLinks = col.type === 'menu' && col.menu_id
                    ? (menuCache[col.menu_id] || [])
                    : (col.links || []);

                return (
                    <div key={col.id || col.title} className="col-span-1">
                        <h3 className="text-sm font-semibold tracking-wider uppercase mb-5" style={{ color: headingColor }}>
                            {col.title}
                        </h3>
                        <ul className="space-y-3">
                            {resolvedLinks.map((link, i) => (
                                <li key={i}>
                                    <Link
                                        href={link.url || '#'}
                                        className="text-sm font-medium hover:text-white transition-colors"
                                        style={{ color: textColor }}
                                    >
                                        {link.label}
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>
                );
            })}

            {/* ── Newsletter Column ── */}
            {showNewsletter && (
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
                                backgroundColor: 'var(--primary)',
                                textColor: 'var(--primary-foreground, #ffffff)',
                                borderRadius: '8px'
                            }
                        }} />
                    </div>

                    {/* Payment Icons */}
                    {showPaymentIcons && (
                        <div>
                            <h3 className="text-xs font-semibold uppercase tracking-widest mb-3" style={{ color: textColor }}>
                                Secure Payments
                            </h3>
                            <div className="flex items-center gap-2">
                                <div className="w-10 h-6 bg-white rounded border border-gray-200 flex items-center justify-center">
                                    <svg viewBox="0 0 38 24" xmlns="http://www.w3.org/2000/svg" width="20" height="auto" role="img"><path opacity=".07" d="M35 0H3C1.3 0 0 1.3 0 3v18c0 1.7 1.4 3 3 3h32c1.7 0 3-1.3 3-3V3c0-1.7-1.4-3-3-3z" /><path fill="#fff" d="M35 1c1.1 0 2 .9 2 2v18c0 1.1-.9 2-2 2H3c-1.1 0-2-.9-2-2V3c0-1.1.9-2 2-2h32" /><path d="M28.3 10.1l-1.6 7.4h-2.5l1.6-7.4h2.5zM19.1 10s-.4-.1-.8-.1c-2.4 0-4 1.2-4 2.9 0 1.3 1.1 1.9 1.9 2.3.9.4 1.1.6 1.1 1 0 .5-.7.8-1.4.8-1.5 0-2.3-.4-3.1-.8l-.4 1.9c.8.3 2 .6 3.2.6 2.6 0 4.2-1.2 4.2-3 0-1-.7-1.8-1.8-2.3-.8-.4-1.2-.6-1.2-1 0-.4.5-.7 1.3-.8 1.1-.1 1.9.2 2.6.5l.4-1.6zM13.4 10.1l-2.4 5.1-.3-1.4c-.6-2-1.7-4.1-3.2-5.4-.5-.4-2-.7-3.1-.8L4 10.3l3.3 7.2h2.7l4.3-7.4h-1zm21.4.1h-1.9c-.6 0-1 .3-1.3.8l-3.8 6.5h2.6l.5-1.4h3.2l.3 1.4h2.5L34.8 10.2zM31 11.8l.9 2.6H30l1-2.6z" fill="#2566AF" /></svg>
                                </div>
                                <div className="w-10 h-6 bg-white rounded border border-gray-200 flex items-center justify-center">
                                    <svg viewBox="0 0 38 24" xmlns="http://www.w3.org/2000/svg" width="20" height="auto" role="img"><path opacity=".07" d="M35 0H3C1.3 0 0 1.3 0 3v18c0 1.7 1.4 3 3 3h32c1.7 0 3-1.3 3-3V3c0-1.7-1.4-3-3-3z" /><path fill="#fff" d="M35 1c1.1 0 2 .9 2 2v18c0 1.1-.9 2-2 2H3c-1.1 0-2-.9-2-2V3c0-1.1.9-2 2-2h32" /><circle fill="#EB001B" cx="15" cy="12" r="7" /><circle fill="#F79E1B" cx="23" cy="12" r="7" /><path fill="#FF5F00" d="M22 12c0-2.4-1.2-4.5-3-5.7-1.8 1.3-3 3.4-3 5.7s1.2 4.5 3 5.7c1.8-1.2 3-3.3 3-5.7z" /></svg>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );

    const stockFooterWidget = widgets && widgets.find(w => w.widget_type === 'footer_stock_content' || w.widget_type === 'stock_content');

    return (
        <footer
            className={cn("border-t mt-auto transition-colors duration-300", borderColor)}
            style={{ backgroundColor: bgColor }}
            aria-labelledby="footer-heading"
        >
            <h2 id="footer-heading" className="sr-only">Footer</h2>
            <div className="mx-auto max-w-7xl px-4 pb-8 pt-12 sm:px-6 lg:px-8">

                {/* Custom Page Builder Widgets Pipeline */}
                {widgets && widgets.length > 0 ? (
                    <div className="flex flex-col gap-8 mb-12">
                        {[...widgets].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)).map(widget => {
                            if (widget.is_active === false) return null;

                            if (widget.widget_type === 'footer_stock_content' || widget.widget_type === 'stock_content') {
                                return <div key={widget.id}>{renderStockFooterContent()}</div>;
                            }

                            return <WidgetRenderer key={widget.id} widget={widget} />;
                        })}

                        {/* If widgets list does not have an explicit stock footer block, render stock footer content as fallback */}
                        {stockFooterWidget === undefined && renderStockFooterContent()}
                    </div>
                ) : (
                    renderStockFooterContent()
                )}

                {/* Bottom Bar */}
                <div className={cn("border-t pt-8 flex flex-col md:flex-row justify-between items-center gap-4", borderColor)}>
                    <p className="text-xs" style={{ color: textColor }}>
                        {copyrightText}
                    </p>
                    {bottomLinks.length > 0 && (
                        <div className="flex gap-4 text-xs" style={{ color: textColor }}>
                            {bottomLinks.map((link, i) => (
                                <Link key={i} href={link.url || '#'} className="hover:text-white transition-colors">
                                    {link.label}
                                </Link>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </footer>
    );
}
