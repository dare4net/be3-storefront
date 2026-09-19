/**
 * Currency Formatting Utility
 */

const CURRENCY_SYMBOLS = {
    USD: '$',
    NGN: '₦',
    XOF: 'CFA',
    EUR: '€',
    GBP: '£',
    CAD: 'CA$',
    AUD: 'A$',
    KES: 'KSh',
    GHS: 'GH₵',
    ZAR: 'R',
    INR: '₹',
    JPY: '¥',
};

/**
 * Format a numeric price into a localized currency string
 * @param {number|string} amount
 * @param {string} currencyCode (e.g. 'USD', 'NGN', 'EUR')
 * @param {string} explicitSymbol (e.g. '$', '₦')
 * @returns {string} Formatted string, e.g. "$120.00" or "₦15,000.00"
 */
export function formatPrice(amount, currencyCode = 'USD', explicitSymbol = null) {
    if (amount === null || amount === undefined || amount === '') {
        return `${explicitSymbol || CURRENCY_SYMBOLS[currencyCode] || '$'}0.00`;
    }

    const num = typeof amount === 'string' ? parseFloat(amount) : Number(amount);
    if (isNaN(num)) {
        return `${explicitSymbol || CURRENCY_SYMBOLS[currencyCode] || '$'}0.00`;
    }

    const code = (currencyCode || 'USD').toUpperCase();
    const symbol = explicitSymbol || CURRENCY_SYMBOLS[code] || '$';

    try {
        // Format number with commas and 2 decimals
        const formattedNumber = num.toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        });

        return `${symbol}${formattedNumber}`;
    } catch (e) {
        return `${symbol}${num.toFixed(2)}`;
    }
}

export function getCurrencySymbol(currencyCode = 'USD') {
    const code = (currencyCode || 'USD').toUpperCase();
    return CURRENCY_SYMBOLS[code] || '$';
}
