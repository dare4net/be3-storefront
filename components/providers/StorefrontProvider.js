"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { usePathname } from "next/navigation";

const StorefrontContext = createContext({
    config: { showHeader: true, showFooter: true },
    setConfig: () => { },
    theme: null
});

export function StorefrontProvider({ children, theme }) {
    const pathname = usePathname();
    const [config, setConfig] = useState({
        showHeader: true,
        showFooter: true
    });

    // Reset visibility when navigating to a new route
    useEffect(() => {
        // We reset to true by default on navigation. 
        // Individual pages must invoke setConfig to hide them if needed.
        setConfig({ showHeader: true, showFooter: true });
    }, [pathname]);

    return (
        <StorefrontContext.Provider value={{ config, setConfig, theme }}>
            {children}
        </StorefrontContext.Provider>
    );
}

export const useStorefront = () => useContext(StorefrontContext);
