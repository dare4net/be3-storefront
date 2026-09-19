// Removed Google Font import due to Turbopack compatibility issue
// Using system fonts instead
import "./globals.css";
import NextTopLoader from 'nextjs-toploader';
import { Toaster } from 'react-hot-toast';
import { headers } from "next/headers";
import { TenantProvider } from "@/components/providers/TenantContext";
import { CartProvider } from "@/components/providers/CartContext";
import { AuthProvider } from '@/components/providers/AuthContext';
import { AxiosTenantProvider } from "@/components/providers/AxiosTenantProvider";
import { SearchProvider } from "@/components/providers/SearchContext";
import CartDrawer from "@/components/cart/CartDrawer";
import AppShell from "@/components/AppShell";
import { generateThemeVariables } from '@/lib/theme';
import { StorefrontProvider } from "@/components/providers/StorefrontProvider";
import { WishlistProvider } from "@/components/providers/WishlistContext";
import { RandomizationProvider } from "@/lib/contexts/RandomizationContext";
import { ChatProvider } from "@/components/providers/ChatContext";
import { SocketProvider } from "@/components/providers/SocketContext";

import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";

import { getTenantAndTheme } from "@/lib/context";

export async function generateViewport() {
    const { theme } = await getTenantAndTheme();
    return {
        width: 'device-width',
        initialScale: 1,
        maximumScale: 1,
        userScalable: false,
        themeColor: theme?.variables?.primary || '#2563eb'
    };
}

/** Helper: build the tenant's canonical base URL */
function getTenantBaseUrl(tenant) {
    const platformDomain = process.env.NEXT_PUBLIC_PLATFORM_DOMAIN || 'be3.shop';
    if (tenant?.custom_domain) return `https://${tenant.custom_domain}`;
    if (tenant?.subdomain) return `https://${tenant.subdomain}.${platformDomain}`;
    return process.env.NEXT_PUBLIC_APP_URL || `https://${platformDomain}`;
}

export async function generateMetadata() {
    const { tenant, theme } = await getTenantAndTheme();
    const logoUrl = theme?.variables?.logo || tenant?.settings?.logo_url;
    const storeName = tenant?.name || "Be3 Storefront";
    const storeDescription = tenant?.description ||
        `Discover a premium shopping experience powered by ${storeName}. ` +
        `Browse quality products, secure checkout, and fast delivery.`;

    // Tenant-aware canonical — each store gets its own unique canonical domain
    const baseUrl = getTenantBaseUrl(tenant);

    return {
        title: {
            default: storeName,
            template: `%s | ${storeName}`
        },
        description: storeDescription,
        metadataBase: new URL(baseUrl),
        alternates: {
            canonical: baseUrl,
        },
        openGraph: {
            title: storeName,
            description: storeDescription,
            url: baseUrl,
            siteName: storeName,
            images: logoUrl ? [
                {
                    url: logoUrl,
                    width: 800,
                    height: 600,
                    alt: storeName,
                },
            ] : [],
            locale: 'en_US',
            type: 'website',
        },
        twitter: {
            card: 'summary_large_image',
            title: storeName,
            description: storeDescription,
            images: logoUrl ? [logoUrl] : [],
        },
        icons: logoUrl ? {
            icon: logoUrl,
            shortcut: logoUrl,
            apple: logoUrl,
        } : {
            icon: '/favicon.ico',
        },
        keywords: [
            "online shopping",
            storeName,
            tenant?.settings?.industry || "eCommerce",
            ...(tenant?.settings?.keywords || [])
        ],
        authors: [{ name: storeName }],
        creator: storeName,
        publisher: storeName,
        robots: {
            index: true,
            follow: true,
            googleBot: {
                index: true,
                follow: true,
                'max-video-preview': -1,
                'max-image-preview': 'large',
                'max-snippet': -1,
            },
        },
    };
}

async function getMenu(location, tenantId) {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:3000';
    try {
        const res = await fetch(`${apiUrl}/api/storefront/menus/${location}`, {
            headers: { 'x-tenant-id': tenantId },
            cache: 'no-store'
        });
        if (res.ok) {
            const data = await res.json();
            return data.tree || data.items || [];
        }
    } catch (e) {
        console.error(`[Layout] Failed to fetch menu ${location}:`, e);
    }
    return [];
}

import { Inter, Roboto, Open_Sans, Lato, Raleway, Montserrat, Manrope } from 'next/font/google';

// Font configurations
const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' });
const roboto = Roboto({ weight: ['400', '500', '700'], subsets: ['latin'], variable: '--font-roboto', display: 'swap' });
const openSans = Open_Sans({ subsets: ['latin'], variable: '--font-open-sans', display: 'swap' });
const lato = Lato({ weight: ['400', '700'], subsets: ['latin'], variable: '--font-lato', display: 'swap' });
const raleway = Raleway({ subsets: ['latin'], variable: '--font-raleway', display: 'swap' });
const montserrat = Montserrat({ subsets: ['latin'], variable: '--font-montserrat', display: 'swap' });
const manrope = Manrope({ subsets: ['latin'], variable: '--font-manrope', display: 'swap' });

const fonts = {
    'Inter': inter,
    'Roboto': roboto,
    'Open Sans': openSans,
    'Lato': lato,
    'Raleway': raleway,
    'Montserrat': montserrat,
    'Manrope': manrope
};

export default async function RootLayout({ children }) {
    const { tenant, theme } = await getTenantAndTheme();

    if (!tenant) {
        return (
            <html lang="en">
                <body>
                    <div className="min-h-screen flex items-center justify-center bg-gray-50">
                        <div className="text-center">
                            <h1 className="text-2xl font-bold text-gray-900">Store Not Found</h1>
                            <p className="text-gray-500 mt-2">The store you are looking for does not exist.</p>
                        </div>
                    </div>
                </body>
            </html>
        );
    }

    const themeCss = generateThemeVariables(theme);
    const headerMenu = await getMenu('header', tenant.id);

    // Select font based on settings, default to Inter
    const selectedFont = fonts[tenant.settings?.font_family] || inter;

    // Tenant-aware canonical base URL
    const baseUrl = getTenantBaseUrl(tenant);

    const logoUrl = theme?.variables?.logo || tenant?.settings?.logo_url;
    const storeName = tenant.name || 'Store';
    const storeDescription = tenant.description || `Discover quality products at ${storeName}.`;

    // Build sameAs array from tenant footer social links
    const socialLinks = tenant?.settings?.social_links || {};
    const sameAs = [
        socialLinks.facebook,
        socialLinks.instagram,
        socialLinks.twitter,
        socialLinks.tiktok,
        socialLinks.youtube,
        socialLinks.linkedin,
        socialLinks.pinterest,
        socialLinks.whatsapp,
    ].filter(Boolean);

    // Organization JSON-LD — Google Knowledge Panel
    const organizationJsonLd = {
        "@context": "https://schema.org",
        "@type": "Organization",
        "name": storeName,
        "url": baseUrl,
        "logo": logoUrl ? {
            "@type": "ImageObject",
            "url": logoUrl,
            "width": 200,
            "height": 200
        } : undefined,
        "description": storeDescription,
        ...(sameAs.length > 0 && { "sameAs": sameAs }),
        ...(tenant?.settings?.email && { "email": tenant.settings.email }),
        ...(tenant?.settings?.phone && { "telephone": tenant.settings.phone }),
    };

    // WebSite JSON-LD — enables Google Sitelinks Searchbox
    const websiteJsonLd = {
        "@context": "https://schema.org",
        "@type": "WebSite",
        "name": storeName,
        "url": baseUrl,
        "description": storeDescription,
        "potentialAction": {
            "@type": "SearchAction",
            "target": {
                "@type": "EntryPoint",
                "urlTemplate": `${baseUrl}/search?q={search_term_string}`
            },
            "query-input": "required name=search_term_string"
        }
    };

    return (
        <html lang="en">
            <head>
                {/* Preconnect to image CDN and API for faster LCP */}
                <link rel="preconnect" href="https://storage.googleapis.com" />
                <link rel="dns-prefetch" href="https://storage.googleapis.com" />
                <link rel="preconnect" href={process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'} crossOrigin="anonymous" />

                {/* Organization JSON-LD — Google Knowledge Panel */}
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
                />
                {/* WebSite JSON-LD — Google Sitelinks Searchbox */}
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
                />
            </head>
            <body className={`${selectedFont.className} ${selectedFont.variable}`} suppressHydrationWarning>
                <NextTopLoader color="#1e40af" showSpinner={false} shadow={false} height={4} zIndex={9999} />
                <Toaster position="bottom-center" />
                {themeCss && (
                    <style dangerouslySetInnerHTML={{ __html: themeCss }} />
                )}
                <TenantProvider tenant={tenant}>
                    <AxiosTenantProvider>
                        <AuthProvider>
                            <SocketProvider>
                            <ChatProvider>
                                <CartProvider>
                                    <WishlistProvider>
                                        <SearchProvider>
                                            <RandomizationProvider>
                                                <StorefrontProvider theme={theme}>
                                                    <CartDrawer />
                                                    <AppShell menuItems={headerMenu}>
                                                        <main className="overflow-x-hidden">{children}</main>
                                                    </AppShell>
                                                </StorefrontProvider>
                                            </RandomizationProvider>
                                        </SearchProvider>
                                    </WishlistProvider>
                                </CartProvider>
                            </ChatProvider>
                            </SocketProvider>
                        </AuthProvider>
                    </AxiosTenantProvider>
                </TenantProvider>
                <Analytics />
                <SpeedInsights />
            </body>
        </html>
    );
}
