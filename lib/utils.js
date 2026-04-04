import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs) {
    return twMerge(clsx(inputs));
}
export function formatAttributeValue(val) {
    if (val === null || val === undefined) return '';
    if (Array.isArray(val)) return val.join(', ');
    if (typeof val === 'object') {
        const { min, max } = val;
        if (min !== undefined && max !== undefined) return `${min} – ${max}`;
        if (min !== undefined) return `Min: ${min}`;
        if (max !== undefined) return `Max: ${max}`;
        return JSON.stringify(val);
    }
    if (typeof val === 'boolean') return val ? 'Yes' : 'No';
    return String(val);
}
