"use client";

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import api from '@/lib/axios';
import { useAuth } from '@/components/providers/AuthContext';

const WishlistContext = createContext(null);

export function WishlistProvider({ children }) {
    const [wishlist, setWishlist] = useState([]);
    const [isLoaded, setIsLoaded] = useState(false);
    const { user } = useAuth();

    // Initial load - merge local and backend
    useEffect(() => {
        const loadWishlist = async () => {
            let localWishlist = [];
            try {
                const saved = localStorage.getItem('wishlist');
                if (saved) {
                    localWishlist = JSON.parse(saved);
                }
            } catch (e) {
                console.error("Failed to parse local wishlist", e);
            }

            try {
                // Fetch from backend
                // Note: The api client will handle auth headers if available, or we might need to pass session ID
                // For now, we'll try to fetch. If 401/403, we rely on local.

                // Let's assume the user might be logged in.
                // We don't have direct access to auth context here easily without importing it, 
                // but typically axios interceptors handle token injection.

                // For anonymous users, we might need a session ID. 
                // Valid strategy: Generate a session ID if not exists.
                let sessionId = localStorage.getItem('wishlist_session_id');
                if (!sessionId) {
                    sessionId = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2);
                    localStorage.setItem('wishlist_session_id', sessionId);
                }

                // FIX: Use 'api' instead of 'proxyApi'
                const response = await api.get(`/wishlist?sessionId=${sessionId}`);
                if (response.data && response.data.success) {
                    if (response.data.wishlist && Array.isArray(response.data.wishlist)) {
                        const backendList = response.data.wishlist.map(item => ({
                            id: item.product_id || item.id,
                            ...item.metadata
                        }));
                        setWishlist(backendList);
                    } else {
                        setWishlist(localWishlist);
                    }
                }
            } catch (err) {
                console.error("Backend wishlist sync failed", err);
                setWishlist(localWishlist);
            } finally {
                setIsLoaded(true);
            }
        };

        loadWishlist();
    }, []);

    // Save to localStorage when wishlist changes
    // WE DO NOT WANT TO TRIGGER API CALLS HERE ON EVERY CHANGE, 
    // because `addToWishlist` and `removeFromWishlist` will do it explicitly.
    useEffect(() => {
        if (isLoaded) {
            localStorage.setItem('wishlist', JSON.stringify(wishlist));
        }
    }, [wishlist, isLoaded]);

    // On logout: generate a new wishlist session, clear state
    // On login: re-fetch wishlist for the authenticated user
    const prevUserRef = useRef(user);
    useEffect(() => {
        const wasLoggedIn = !!prevUserRef.current;
        const isLoggedIn = !!user;

        if (wasLoggedIn && !isLoggedIn) {
            // Logout: new anonymous session
            const newSessionId = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2);
            localStorage.setItem('wishlist_session_id', newSessionId);
            localStorage.removeItem('wishlist');
            setWishlist([]);
        } else if (!wasLoggedIn && isLoggedIn) {
            // Login: re-fetch from backend
            const refetch = async () => {
                try {
                    const sessionId = localStorage.getItem('wishlist_session_id');
                    const response = await api.get(`/wishlist?sessionId=${sessionId}`);
                    if (response.data?.success && Array.isArray(response.data.wishlist)) {
                        const backendList = response.data.wishlist.map(item => ({
                            id: item.product_id || item.id,
                            ...item.metadata
                        }));
                        setWishlist(backendList);
                    }
                } catch (err) {
                    console.error("Wishlist re-fetch on login failed", err);
                }
            };
            refetch();
        }

        prevUserRef.current = user;
    }, [user]);

    const addToWishlist = useCallback(async (product) => {
        // Optimistic update
        setWishlist((prev) => {
            if (prev.find(p => p.id === product.id)) return prev;
            return [...prev, product];
        });

        // API Call
        try {
            const sessionId = localStorage.getItem('wishlist_session_id');
            await api.post('/wishlist', {
                productId: product.id,
                sessionId,
                metadata: { name: product.name, price: product.price, image: product.image || product.thumbnail_url || product.image_url }
            });
        } catch (err) {
            console.error("Failed to add to backend wishlist", err);
        }
    }, []);

    const removeFromWishlist = useCallback(async (productId) => {
        // Optimistic update
        setWishlist((prev) => prev.filter(p => p.id !== productId));

        // API Call
        try {
            const sessionId = localStorage.getItem('wishlist_session_id');
            await api.delete(`/wishlist/${productId}?sessionId=${sessionId}`);
        } catch (err) {
            console.error("Failed to remove from backend wishlist", err);
        }
    }, []);

    const toggleWishlist = useCallback((product) => {
        // Check current state
        let exists = false;
        setWishlist(prev => {
            exists = !!prev.find(p => p.id === product.id);
            return prev;
        });

        // We can't use `exists` reliably inside the setter logic if we want to be atomic,
        // but `addToWishlist` and `removeFromWishlist` are separate.
        // Let's just implement toggle logic that calls the appropriate function.
        // But `addToWishlist` is async now...
        // State updates are batched.

        // Better:
        if (wishlist.find(p => p.id === product.id)) {
            removeFromWishlist(product.id);
        } else {
            addToWishlist(product);
        }
    }, [wishlist, addToWishlist, removeFromWishlist]);

    const isInWishlist = useCallback((productId) => {
        return !!wishlist.find(p => p.id === productId);
    }, [wishlist]);

    return (
        <WishlistContext.Provider value={{
            wishlist,
            addToWishlist,
            removeFromWishlist,
            toggleWishlist,
            isInWishlist
        }}>
            {children}
        </WishlistContext.Provider>
    );
}

export function useWishlist() {
    const context = useContext(WishlistContext);
    if (!context) {
        throw new Error('useWishlist must be used within a WishlistProvider');
    }
    return context;
}
