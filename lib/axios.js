import axios from 'axios';

// Create Axios instance
const api = axios.create({
    baseURL: 'http://localhost:3000', // Backend URL
    headers: {
        'Content-Type': 'application/json',
    },
});

// Helper to parse JWT payload without external lib
const parseJwt = (token) => {
    try {
        return JSON.parse(atob(token.split('.')[1]));
    } catch (e) {
        return null;
    }
};

// Request Interceptor: The Ultimate Safety Net
// Before any request leaves, check if the Auth Token matches the Target Tenant.
api.interceptors.request.use((config) => {
    // Axios 1.x uses AxiosHeaders class which requires .get()/.delete()
    // We try both methods to be safe across versions
    const getHeader = (key) => {
        if (config.headers && typeof config.headers.get === 'function') {
            return config.headers.get(key);
        }
        return config.headers[key] || api.defaults.headers.common[key];
    };

    const token = getHeader('Authorization');
    const targetTenantId = getHeader('X-Tenant-ID');

    // Debug log to verify what the interceptor sees
    // console.log(`[Axios Interceptor] Checking request. Tenant: ${targetTenantId}, HasToken: ${!!token}`);

    if (token && typeof token === 'string' && token.startsWith('Bearer ') && targetTenantId) {
        const rawToken = token.split(' ')[1];
        const payload = parseJwt(rawToken);

        if (payload && payload.tenant_id) {
            // If the token belongs to a DIFFERENT tenant, strip it!
            if (String(payload.tenant_id) !== String(targetTenantId)) {
                console.warn(`[Axios] 🛑 Interceptor blocked Cross-Tenant Request! Token Tenant: ${payload.tenant_id} vs Target: ${targetTenantId}. Sending as Guest.`);

                // Remove header safely
                if (config.headers && typeof config.headers.delete === 'function') {
                    config.headers.delete('Authorization');
                } else {
                    delete config.headers['Authorization'];
                }
            }
        }
    }
    return config;
}, (error) => {
    return Promise.reject(error);
});

// Instance for Frontend Proxy (Next.js API Routes)
// No baseURL set, so it inherits the current domain/origin (relative path)
export const proxyApi = axios.create({
    headers: {
        'Content-Type': 'application/json',
    },
});

export default api;
