"use client";

import { usePathname } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import HeaderSpacer from "@/components/HeaderSpacer";
import ChatWidget from "@/components/chat/ChatWidget";

// Routes that should render without the storefront shell
const AUTH_ROUTES = ["/login", "/signup", "/auth"];

export default function AppShell({ children, menuItems }) {
    const pathname = usePathname();
    const isAuth = AUTH_ROUTES.some(route => pathname === route || pathname.startsWith(route + "/"));

    if (isAuth) {
        return <>{children}</>;
    }

    return (
        <>
            <Header menuItems={menuItems} />
            <HeaderSpacer />
            {children}
            <Footer />
            <ChatWidget />
        </>
    );
}
