"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useTenant } from '@/components/providers/TenantContext';
import { proxyApi as api } from '@/lib/axios';

export default function MenuWidget({ config }) {
    const { menuLocation = 'footer_1', title, orientation = 'vertical' } = config;
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const tenant = useTenant();

    useEffect(() => {
        if (tenant) {
            fetchMenu();
        }
    }, [tenant, menuLocation]);

    const fetchMenu = async () => {
        try {
            // Using the client-side proxy via AxiosTenantProvider
            const res = await api.get(`/api/storefront/menus/${menuLocation}`);
            setItems(res.data.items || []);
        } catch (error) {
            console.error('Failed to fetch menu widget:', error);
        } finally {
            setLoading(false);
        }
    };

    if (items.length === 0 && !loading) return null;

    return (
        <div className="w-full">
            {title && (
                <h3 className="text-sm font-semibold text-gray-900 tracking-wider uppercase mb-4">
                    {title}
                </h3>
            )}
            <ul className={`flex ${orientation === 'horizontal' ? 'flex-row gap-6' : 'flex-col gap-3'}`}>
                {items.map((item) => (
                    <li key={item.id}>
                        <Link
                            href={item.url || '#'}
                            className="text-base text-gray-500 hover:text-gray-900 transition-colors"
                        >
                            {item.label}
                        </Link>
                    </li>
                ))}
            </ul>
        </div>
    );
}
