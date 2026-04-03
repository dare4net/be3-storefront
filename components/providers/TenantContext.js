"use client";

import { createContext, useContext } from "react";

const TenantContext = createContext(null);

export function TenantProvider({ tenant, children }) {
    return (
        <TenantContext.Provider value={tenant}>
            {children}
        </TenantContext.Provider>
    );
}

export function useTenant() {
    const context = useContext(TenantContext);
    if (!context) {
        if (typeof window === "undefined") return null;
        throw new Error("useTenant must be used within a TenantProvider");
    }
    return context;
}
