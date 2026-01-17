// Removed Google Font import due to Turbopack compatibility issue
// Using system fonts instead
import "./globals.css";
import { headers } from "next/headers";
import { TenantProvider } from "@/components/providers/TenantContext";
import { CartProvider } from "@/components/providers/CartContext";
import { AuthProvider } from '@/components/providers/AuthContext';
import { AxiosTenantProvider } from "@/components/providers/AxiosTenantProvider";
import CartDrawer from "@/components/cart/CartDrawer";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { generateThemeVariables } from '@/lib/theme';
import { StorefrontProvider } from "@/components/providers/StorefrontProvider";

export const metadata = {
    title: "Storefront",
    description: "Multi-tenant eCommerce Store",
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

    return (
        <html lang="en">
            <body>
                {themeCss && (
                    <style dangerouslySetInnerHTML={{ __html: themeCss }} />
                )}
                <TenantProvider tenant={tenant}>
                    <AxiosTenantProvider>
                        <AuthProvider>
                            <CartProvider>
                                <StorefrontProvider theme={theme}>
                                    <Header menuItems={headerMenu} />
                                    <CartDrawer />
                                    <main>{children}</main>
                                    <Footer />
                                </StorefrontProvider>
                            </CartProvider>
                        </AuthProvider>
                    </AxiosTenantProvider>
                </TenantProvider>
            </body>
        </html>
    );
}
