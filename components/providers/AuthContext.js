"use client";

import { createContext, useContext, useState, useEffect, useCallback } from "react";
import api from "@/lib/axios";
import { useTenant } from "./TenantContext";

const AuthContext = createContext();

export function AuthProvider({ children }) {
    const tenant = useTenant();
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [token, setToken] = useState(null);



    // Load user from localStorage on mount
    useEffect(() => {
        // Wait for tenant to be loaded
        if (!tenant) return;

        const storedToken = localStorage.getItem('auth_token');
        const storedUser = localStorage.getItem('auth_user');

        if (storedToken && storedUser) {
            try {
                const parsedUser = JSON.parse(storedUser);

                // Double check (redundant but safe)
                if (parsedUser.tenant_id !== tenant.id) {
                    // Already cleared by sync check, but ensure state is null
                    setUser(null);
                    setToken(null);
                } else {
                    // Session is valid for this tenant
                    setToken(storedToken);
                    setUser(parsedUser);
                    // Set default auth header
                    api.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
                }
            } catch (e) {
                console.error('[Auth] Failed to parse stored user:', e);
                localStorage.removeItem('auth_user');
            }
        } else {
            // No session? Ensure clear
            delete api.defaults.headers.common['Authorization'];
        }
        setLoading(false);
    }, [tenant]);



    const login = useCallback(async (email, password) => {
        try {
            if (!tenant || !tenant.id) {
                return { success: false, message: 'Store information not available. Please refresh the page.' };
            }

            const res = await api.post('/auth/login', {
                email,
                password
            }, {
                headers: {
                    'X-Tenant-ID': tenant.id
                }
            });

            if (res.data.success) {
                const { token: accessToken, refreshToken, user: userData } = res.data;

                // Store in state
                setToken(accessToken);
                setUser(userData);

                // Persist in localStorage
                localStorage.setItem('auth_token', accessToken);
                if (refreshToken) {
                    localStorage.setItem('auth_refresh_token', refreshToken);
                }
                localStorage.setItem('auth_user', JSON.stringify(userData));

                // Set default auth header
                api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;

                return { success: true };
            }

            return { success: false, message: 'Login failed' };
        } catch (error) {
            console.error('Login error:', error);
            return {
                success: false,
                message: error.response?.data?.message || 'Login failed. Please try again.'
            };
        }
    }, [tenant?.id]);

    const register = useCallback(async (name, email, password) => {
        try {
            if (!tenant || !tenant.id) {
                return { success: false, message: 'Store information not available. Please refresh the page.' };
            }

            const res = await api.post('/auth/register', {
                first_name: name,
                email,
                password
            }, {
                headers: {
                    'X-Tenant-ID': tenant.id
                }
            });

            if (res.data.success) {
                // Auto-login after registration
                return await login(email, password);
            }

            return { success: false, message: 'Registration failed' };
        } catch (error) {
            console.error('Registration error:', error);
            console.error('Error response:', error.response?.data);
            return {
                success: false,
                message: error.response?.data?.message || 'Registration failed. Please try again.'
            };
        }
    }, [tenant?.id, login]);

    const logout = useCallback(() => {
        setUser(null);
        setToken(null);
        localStorage.removeItem('auth_token');
        localStorage.removeItem('auth_refresh_token');
        localStorage.removeItem('auth_user');
        delete api.defaults.headers.common['Authorization'];
    }, []);

    const syncSession = useCallback(async () => {
        try {
            if (!tenant || !tenant.id) return { success: false };

            const res = await api.get('/auth/me', {
                headers: { 'X-Tenant-ID': tenant.id }
            });

            if (res.data.success && res.data.user) {
                const userData = res.data.user;
                setUser(userData);
                localStorage.setItem('auth_user', JSON.stringify(userData));
                // Note: we don't have the token to set in state since it's HTTP-Only, but the browser will send it.
                return { success: true };
            }
            return { success: false };
        } catch (error) {
            console.error('Session sync error:', error);
            // If we get a 401 here, we shouldn't necessarily logout yet, 
            // the interceptor will handle token refresh if possible.
            return { success: false };
        }
    }, [tenant?.id]);

    // Axios interceptor for 401 Token Expired — with concurrency queue
    // Module-level state (outside component) to survive across concurrent requests
    useEffect(() => {
        let isRefreshing = false;
        let failedQueue = [];

        const processQueue = (error, token = null) => {
            failedQueue.forEach((prom) => {
                if (error) {
                    prom.reject(error);
                } else {
                    prom.resolve(token);
                }
            });
            failedQueue = [];
        };

        const interceptor = api.interceptors.response.use(
            (response) => response,
            async (error) => {
                const originalRequest = error.config;

                // Only handle 401 TokenExpired errors, and only once per request
                if (
                    error.response?.status === 401 &&
                    error.response?.data?.error === 'TokenExpired' &&
                    !originalRequest._retry
                ) {
                    // If a refresh is already in flight, queue this request
                    if (isRefreshing) {
                        return new Promise((resolve, reject) => {
                            failedQueue.push({ resolve, reject });
                        })
                            .then((token) => {
                                originalRequest.headers['Authorization'] = `Bearer ${token}`;
                                return api(originalRequest);
                            })
                            .catch((err) => Promise.reject(err));
                    }

                    originalRequest._retry = true;
                    isRefreshing = true;

                    const storedRefreshToken = localStorage.getItem('auth_refresh_token');

                    if (!storedRefreshToken) {
                        isRefreshing = false;
                        processQueue(new Error('No refresh token'), null);
                        logout();
                        return Promise.reject(error);
                    }

                    try {
                        // Use a plain axios call to bypass interceptors and avoid loops
                        const axios = (await import('axios')).default;

                        // Robust Tenant ID fallback: Check API defaults -> LocalStorage User -> Subdomain Env Var -> Hardcoded Demo
                        const getTenantId = () => {
                            if (api.defaults.headers.common['X-Tenant-ID']) return api.defaults.headers.common['X-Tenant-ID'];
                            try {
                                const storedUser = localStorage.getItem('auth_user');
                                if (storedUser) return JSON.parse(storedUser).tenant_id;
                            } catch (e) { }
                            return process.env.NEXT_PUBLIC_TENANT_ID;
                        };
                        const tenantId = getTenantId();

                        const res = await axios.post(
                            `${api.defaults.baseURL}/auth/refresh`,
                            { refreshToken: storedRefreshToken },
                            {
                                headers: {
                                    'Content-Type': 'application/json',
                                    ...(tenantId ? { 'X-Tenant-ID': tenantId } : {}),
                                },
                                withCredentials: true,
                            }
                        );

                        if (res.data.success) {
                            const { accessToken, refreshToken: newRefreshToken } = res.data;

                            // Persist updated tokens
                            setToken(accessToken);
                            localStorage.setItem('auth_token', accessToken);
                            if (newRefreshToken) {
                                localStorage.setItem('auth_refresh_token', newRefreshToken);
                            }

                            // Update default auth header for all future requests
                            api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
                            originalRequest.headers['Authorization'] = `Bearer ${accessToken}`;

                            // Unblock all queued requests
                            processQueue(null, accessToken);
                            return api(originalRequest);
                        }

                        throw new Error('Refresh response indicated failure');
                    } catch (refreshError) {
                        console.error('[AuthContext] Token refresh failed:', refreshError);
                        processQueue(refreshError, null);
                        logout();
                        return Promise.reject(refreshError);
                    } finally {
                        isRefreshing = false;
                    }
                }

                return Promise.reject(error);
            }
        );

        return () => {
            api.interceptors.response.eject(interceptor);
        };
    }, [logout]);

    const value = {
        user,
        token,
        loading,
        login,
        register,
        logout,
        syncSession,
        isAuthenticated: !!user
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
