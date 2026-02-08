"use client";

import { createContext, useContext, useState, useEffect, useCallback } from "react";
import api from "@/lib/axios";
import { useTenant } from "@/components/providers/TenantContext";
import { useAnalytics } from "@/lib/hooks/useAnalytics";


const CartContext = createContext({});

export function CartProvider({ children }) {
    const tenant = useTenant();
    const { trackClick } = useAnalytics();
    const [cart, setCart] = useState(null);
    const [items, setItems] = useState([]);
    const [vendorGroups, setVendorGroups] = useState([]);
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (tenant?.id) {
            fetchCart();
        }
    }, [tenant?.id]);

    const fetchCart = useCallback(async () => {
        try {
            // Namespace session ID by tenant to prevent cross-tenant collisions
            const storageKey = `cart_session_${tenant.id}`;
            let sessionId = localStorage.getItem(storageKey);

            if (!sessionId) {
                sessionId = `sess_${Math.random().toString(36).substring(2, 15)}`;
                localStorage.setItem(storageKey, sessionId);
            }

            console.log("🛒 fetching cart for tenant:", tenant.id, "session:", sessionId);

            // Header injected globally by AxiosTenantProvider, no manual header needed
            const res = await api.get(`/cart?session_id=${sessionId}`);

            if (res.data.success) {
                setCart(res.data.cart);
                setItems(res.data.items || []);
                setVendorGroups(res.data.vendorGroups || []);
            }
        } catch (err) {
            console.error("Failed to fetch cart", err);
            // If 403/404, maybe session is invalid? could clear it here.
        } finally {
            setLoading(false);
        }
    }, [tenant?.id]);

    const addToCart = async (product, quantity = 1, variantId = null) => {
        console.log("Adding to cart:", product, quantity);
        try {
            const storageKey = `cart_session_${tenant.id}`;
            const sessionId = localStorage.getItem(storageKey);

            const res = await api.post("/cart/items", {
                product_id: product.id,
                variant_id: variantId,
                quantity,
                price: product.price,
                session_id: sessionId
            });

            if (res.data.success) {
                // Track Analytics
                trackClick({
                    entity_type: 'product',
                    entity_id: product.id,
                    event_type: 'add_to_cart',
                    metadata: {
                        name: product.name,
                        price: product.price,
                        quantity,
                        variant_id: variantId
                    }
                });

                await fetchCart();
                setIsOpen(true); // Open drawer on add
                return true;
            }
        } catch (err) {
            console.error("Failed to add to cart details:", err.response?.data || err.message);
            console.error("Full error:", err);
            alert(`Failed to add to cart: ${err.response?.data?.message || err.message}`);
            return false;
        }
    };

    const removeFromCart = async (itemId) => {
        try {
            const item = items.find(i => i.id === itemId);
            await api.delete(`/cart/items/${itemId}`);

            if (item) {
                // Track Analytics
                trackClick({
                    entity_type: 'product',
                    entity_id: item.product_id,
                    event_type: 'remove_from_cart',
                    metadata: {
                        name: item.product_name,
                        quantity: item.quantity
                    }
                });
            }

            await fetchCart();
        } catch (err) {
            console.error("Failed to remove from cart", err);
        }
    };

    const updateQuantity = async (itemId, quantity) => {
        if (quantity < 1) return;
        try {
            await api.patch(`/cart/items/${itemId}`, { quantity });
            await fetchCart();
        } catch (err) {
            console.error("Failed to update quantity", err);
        }
    };

    const cartTotal = items.reduce((sum, item) => sum + (parseFloat(item.price) * item.quantity), 0);
    const cartCount = items.reduce((sum, item) => sum + item.quantity, 0);

    return (
        <CartContext.Provider value={{
            cart,
            items,
            vendorGroups,
            loading,
            isOpen,
            setIsOpen,
            addToCart,
            removeFromCart,
            updateQuantity,
            cartTotal,
            cartCount,
            refreshCart: fetchCart
        }}>
            {children}
        </CartContext.Provider>
    );
}

export const useCart = () => useContext(CartContext);
