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
        throw new Error("useTenant must be used within a TenantProvider");
    }
    return context;
}
