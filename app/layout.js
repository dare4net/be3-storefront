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
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import HeaderSpacer from "@/components/HeaderSpacer";
import { generateThemeVariables } from '@/lib/theme';
import { StorefrontProvider } from "@/components/providers/StorefrontProvider";
import { WishlistProvider } from "@/components/providers/WishlistContext";
import { RandomizationProvider } from "@/lib/contexts/RandomizationContext";
import { ChatProvider } from "@/components/providers/ChatContext";
import ChatWidget from "@/components/chat/ChatWidget";
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

export async function generateMetadata() {
    const { tenant, theme } = await getTenantAndTheme();
    const logoUrl = theme?.variables?.logo || tenant?.settings?.logo_url;
    const storeName = tenant?.name || "Be3 Storefront";
    const storeDescription = tenant?.description ||
        `Scale your business with Be3, the AI-powered multi-vendor marketplace. ` +
        `Secure vendor dashboards, unified checkout, and optimized SEO for global sellers. ` +
        `Discover a premium shopping experience powered by ${storeName}.`;

    // Enforce primary canonical domain
    const baseUrl = 'https://be3.shop';

    return {
        title: {
            default: storeName,
            template: `%s | ${storeName}`
        },
        description: storeDescription,
        metadataBase: new URL(baseUrl),
        alternates: {
            canonical: '/',
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
        keywords: ["eCommerce", "SaaS", "Be3 Protocol", storeName, "Online Shopping", "Multi-tenant"],
        authors: [{ name: storeName }],
        creator: "Be3 Protocol",
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
            next: { revalidate: 60 }
        });
        if (res.ok) {
            const data = await res.json();
            return data.items || [];
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

    // Enforce primary canonical domain
    const baseUrl = 'https://be3.shop';

    const jsonLd = {
        "@context": "https://schema.org",
        "@type": "Organization",
        "name": tenant.name,
        "url": baseUrl,
        "logo": theme?.variables?.logo || tenant?.settings?.logo_url,
        "description": tenant.description || `Scale your business with Be3, the AI-powered multi-vendor marketplace. Secure vendor dashboards, unified checkout, and optimized SEO for global sellers.`
    };

    return (
        <html lang="en">
            <head>
                <script
                    type="application/ld+json"
                    dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
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
                            <ChatProvider>
                                <CartProvider>
                                    <WishlistProvider>
                                        <SearchProvider>
                                            <RandomizationProvider>
                                                <StorefrontProvider theme={theme}>
                                                    <Header menuItems={headerMenu} />
                                                    <HeaderSpacer />
                                                    <CartDrawer />
                                                    <main className="overflow-x-hidden">{children}</main>
                                                    <Footer />
                                                    <ChatWidget />
                                                </StorefrontProvider>
                                            </RandomizationProvider>
                                        </SearchProvider>
                                    </WishlistProvider>
                                </CartProvider>
                            </ChatProvider>
                        </AuthProvider>
                    </AxiosTenantProvider>
                </TenantProvider>
                <Analytics />
                <SpeedInsights />
            </body>
        </html>
    );
}
