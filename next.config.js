/** @type {import('next').NextConfig} */
const nextConfig = {
    async headers() {
        return [
            {
                // Apply to all page routes (not API routes)
                source: '/((?!api/).*)',
                headers: [
                    {
                        key: 'Cache-Control',
                        // 'no-cache' allows bfcache; 'no-store' blocks it
                        value: 'no-cache',
                    },
                ],
            },
        ];
    },
};

module.exports = nextConfig;
