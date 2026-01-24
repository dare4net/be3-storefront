// Removed Google Font import due to Turbopack compatibility issue
// Using system fonts instead
import "./globals.css";
import { headers } from "next/headers";
import { TenantProvider } from "@/components/providers/TenantContext";
import { CartProvider } from "@/components/providers/CartContext";
import { AuthProvider } from '@/components/providers/AuthContext';
import { AxiosTenantProvider } from "@/components/providers/AxiosTenantProvider";
import { SearchProvider } from "@/components/providers/SearchContext";
import CartDrawer from "@/components/cart/CartDrawer";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { generateThemeVariables } from '@/lib/theme';
import { StorefrontProvider } from "@/components/providers/StorefrontProvider";
import { WishlistProvider } from "@/components/providers/WishlistContext";
import { RandomizationProvider } from "@/lib/contexts/RandomizationContext";

export const metadata = {
    title: "Storefront",
    description: "Multi-tenant eCommerce Store",
    viewport: 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=0'
};

import { getTenantAndTheme } from "@/lib/context";

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

import { Inter, Roboto, Open_Sans, Lato, Raleway, Montserrat } from 'next/font/google';

// Font configurations
const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' });
const roboto = Roboto({ weight: ['400', '500', '700'], subsets: ['latin'], variable: '--font-roboto', display: 'swap' });
const openSans = Open_Sans({ subsets: ['latin'], variable: '--font-open-sans', display: 'swap' });
const lato = Lato({ weight: ['400', '700'], subsets: ['latin'], variable: '--font-lato', display: 'swap' });
const raleway = Raleway({ subsets: ['latin'], variable: '--font-raleway', display: 'swap' });
const montserrat = Montserrat({ subsets: ['latin'], variable: '--font-montserrat', display: 'swap' });

const fonts = {
    'Inter': inter,
    'Roboto': roboto,
    'Open Sans': openSans,
    'Lato': lato,
    'Raleway': raleway,
    'Montserrat': montserrat
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

    return (
        <html lang="en">
            <body className={`${selectedFont.className} ${selectedFont.variable}`}>
                {themeCss && (
                    <style dangerouslySetInnerHTML={{ __html: themeCss }} />
                )}
                <TenantProvider tenant={tenant}>
                    <AxiosTenantProvider>
                        <AuthProvider>
                            <CartProvider>
                                <WishlistProvider>
                                    <SearchProvider>
                                        <RandomizationProvider>
                                            <StorefrontProvider theme={theme}>
                                                <Header menuItems={headerMenu} />
                                                <CartDrawer />
                                                <main className="overflow-x-hidden">{children}</main>
                                                <Footer />
                                            </StorefrontProvider>
                                        </RandomizationProvider>
                                    </SearchProvider>
                                </WishlistProvider>
                            </CartProvider>
                        </AuthProvider>
                    </AxiosTenantProvider>
                </TenantProvider>
            </body>
        </html>
    );
}
