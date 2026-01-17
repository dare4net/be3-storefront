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

    // Axios interceptor for 401 Token Expired
    useEffect(() => {
        const interceptor = api.interceptors.response.use(
            (response) => response,
            async (error) => {
                const originalRequest = error.config;

                // If 401 and we have a refresh token and haven't retried yet
                if (error.response?.status === 401 &&
                    error.response?.data?.error === 'TokenExpired' &&
                    !originalRequest._retry) {

                    originalRequest._retry = true;
                    const refreshToken = localStorage.getItem('auth_refresh_token');

                    if (refreshToken) {
                        try {
                            const res = await api.post('/auth/refresh', { refreshToken });

                            if (res.data.success) {
                                const { accessToken, refreshToken: newRefreshToken } = res.data;

                                // Update state
                                setToken(accessToken);
                                localStorage.setItem('auth_token', accessToken);
                                if (newRefreshToken) {
                                    localStorage.setItem('auth_refresh_token', newRefreshToken);
                                }

                                // Update header
                                api.defaults.headers.common['Authorization'] = `Bearer ${accessToken}`;
                                originalRequest.headers['Authorization'] = `Bearer ${accessToken}`;

                                return api(originalRequest);
                            }
                        } catch (refreshError) {
                            console.error('Token refresh failed:', refreshError);
                            logout();
                        }
                    } else {
                        logout();
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
