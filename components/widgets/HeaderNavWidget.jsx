"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useTenant } from '@/components/providers/TenantContext';
import { proxyApi as api } from '@/lib/axios';

export default function HeaderNavWidget({ config }) {
    const { menuLocation = 'header', align = 'center' } = config;
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const tenant = useTenant();

    useEffect(() => {
        if (tenant) fetchMenu();
    }, [tenant, menuLocation]);

    const fetchMenu = async () => {
        try {
            const res = await api.get(`/api/storefront/menus/${menuLocation}`);
            setItems(res.data.items || []);
        } catch (error) {
            console.error('Failed to fetch header menu:', error);
        } finally {
            setLoading(false);
        }
    };

    if (items.length === 0 && !loading) return null;

    const alignClass = {
        left: 'justify-start',
        center: 'justify-center',
        right: 'justify-end'
    }[align] || 'justify-center';

    return (
        <nav className={`hidden md:flex flex-1 ${alignClass} gap-6`}>
            {items.map((item) => (
                <Link
                    key={item.id}
                    href={item.url || '#'}
                    className="text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
                >
                    {item.label}
                </Link>
            ))}
        </nav>
    );
}
