"use client";

import { useTenant } from "@/components/providers/TenantContext";
import { formatPrice as formatPriceUtil, getCurrencySymbol } from "@/lib/currency";

export function useCurrency() {
    let tenant = null;
    try {
        tenant = useTenant();
    } catch (e) {
        tenant = null;
    }

    const currency = tenant?.currency || "USD";
    const currencySymbol = tenant?.currency_symbol || getCurrencySymbol(currency);

    const formatPrice = (amount) => {
        return formatPriceUtil(amount, currency, currencySymbol);
    };

    return {
        currency,
        currencySymbol,
        formatPrice,
    };
}

export default useCurrency;
