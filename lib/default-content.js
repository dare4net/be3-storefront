export const DEFAULT_WIDGETS = [
    // 1. Hero Widget (High Impact)
    {
        id: 'def-hero',
        widget_type: 'hero',
        config: {
            layout: 'centered',
            height: { desktop: '80vh', tablet: '600px', mobile: '500px' },
            backgroundType: 'particles',
            particles: { count: 80, color: '#ffffff', speed: 1.5 },
            gradient: {
                type: 'linear',
                angle: 135,
                stops: [
                    { color: '#4f46e5', position: 0 }, // Indigo
                    { color: '#ec4899', position: 100 } // Pink
                ]
            },
            overlay: { enabled: true, color: '#000000', opacity: 0.4 },
            title: {
                text: 'Reimagine Your Store',
                color: '#ffffff',
                fontSize: { desktop: '5rem', tablet: '3.5rem', mobile: '2.5rem' },
                fontWeight: '800',
                animation: { type: 'fade-up', delay: 0 }
            },
            subtitle: {
                text: 'The most powerful, beautiful, and flexible e-commerce platform for modern brands.',
                color: '#e0e7ff',
                fontSize: { desktop: '1.5rem', tablet: '1.25rem', mobile: '1.125rem' },
                animation: { type: 'fade-up', delay: 200 }
            },
            ctas: [
                {
                    text: 'Start Shopping',
                    link: '/products',
                    style: 'primary',
                    icon: 'shopping-bag',
                    animation: { type: 'zoom', delay: 400 }
                },
                {
                    text: 'Our Story',
                    link: '/about-us',
                    style: 'outline',
                    animation: { type: 'zoom', delay: 500 }
                }
            ],
            ctaAlignment: 'center'
        }
    },

    // 2. Category Grid (Shop by Collection)
    {
        id: 'def-category-grid',
        widget_type: 'category_grid',
        config: {
            title: 'Shop by Collection',
            parentCategoryId: null, // Top level
        }
    },

    // 3. Product Grid (Best Sellers)
    {
        id: 'def-product-grid',
        widget_type: 'product_grid',
        config: {
            title: 'Best Sellers',
            limit: 8,
            columns: { desktop: 4, tablet: 2, mobile: 1 },
            showAddToCart: true,
            showPrice: true,
            showFeaturedBadge: true,
            sectionBackground: { type: 'solid', color: '#ffffff' },
            cardStyle: {
                backgroundColor: '#ffffff',
                shadow: 'md',
                borderRadius: '12px',
                hoverLift: true
            },
            colors: {
                accent: '#4f46e5',
                badgeBackground: '#ec4899'
            }
        }
    },

    // 4. Stats Widget (Social Proof)
    {
        id: 'def-stats',
        widget_type: 'stats',
        config: {
            layout: 'horizontal',
            columns: { desktop: 4, tablet: 2, mobile: 2 },
            background: { type: 'solid', color: '#111827' },
            textColor: '#ffffff',
            separator: { enabled: true, color: 'rgba(255,255,255,0.1)', width: 1 },
            stats: [
                { label: 'Active Users', value: 10000, prefix: '', suffix: '+', animationDuration: 2500, icon: 'users', iconColor: '#818cf8' },
                { label: 'Products', value: 500, prefix: '', suffix: '+', animationDuration: 2000, icon: 'package', iconColor: '#f472b6' },
                { label: 'Countries', value: 25, prefix: '', suffix: '', animationDuration: 1500, icon: 'globe', iconColor: '#34d399' },
                { label: 'Satisfaction', value: 100, prefix: '', suffix: '%', animationDuration: 3000, icon: 'heart', iconColor: '#fbbf24' }
            ]
        }
    },

    // 5. Features Widget (Core Value Props)
    {
        id: 'def-features',
        widget_type: 'features',
        config: {
            layout: 'grid',
            columns: { desktop: 3, tablet: 2, mobile: 1 },
            gap: { x: '2rem', y: '3rem' },
            sectionBackground: { type: 'solid', color: '#f9fafb' },
            hoverEffect: 'glow',
            entranceAnimation: 'fade',
            staggerDelay: 150,
            cardStyle: {
                backgroundColor: '#ffffff',
                shadow: 'lg',
                borderRadius: 16,
                padding: '2.5rem'
            },
            features: [
                {
                    title: 'Global Shipping',
                    description: 'We ship to over 50 countries with tracked options and insurance included.',
                    iconType: 'lucide',
                    iconName: 'truck',
                    iconColor: '#4f46e5',
                    iconBackground: '#e0e7ff'
                },
                {
                    title: 'Secure Payments',
                    description: 'Your transactions are protected by industry-leading 256-bit SSL encryption.',
                    iconType: 'lucide',
                    iconName: 'shield-check',
                    iconColor: '#059669',
                    iconBackground: '#d1fae5'
                },
                {
                    title: '24/7 Support',
                    description: 'Our dedicated team is here to help you anytime, anywhere, via chat or email.',
                    iconType: 'lucide',
                    iconName: 'headphones',
                    iconColor: '#db2777',
                    iconBackground: '#fce7f3'
                }
            ]
        }
    },

    // 6. Testimonials Widget (Carousel)
    {
        id: 'def-testimonials',
        widget_type: 'testimonials',
        config: {
            title: 'Trusted by Thousands',
            layout: 'carousel',
            autoPlay: true,
            interval: 6000,
            backgroundColor: '#ffffff',
            cardStyle: {
                backgroundColor: '#f3f4f6',
                textColor: '#1f2937',
                starColor: '#fbbf24', // Amber 400
                borderRadius: '20px',
                shadow: 'none'
            },
            testimonials: [
                {
                    name: 'Sarah Johnson',
                    role: 'Fashion Blogger',
                    content: 'The quality of the products is absolutely outstanding. I receive compliments every time I wear their collection!',
                    rating: 5,
                    date: '2025-12-15'
                },
                {
                    name: 'Michael Chen',
                    role: 'Tech Enthusiast',
                    content: 'Incredible customer service and lightning-fast shipping. This is exactly how online shopping should be.',
                    rating: 5,
                    date: '2026-01-02'
                },
                {
                    name: 'Emma Davis',
                    role: 'Interior Designer',
                    content: 'I recommend this store to all my clients. The attention to detail and curated selection is unmatched.',
                    rating: 5,
                    date: '2026-01-10'
                }
            ]
        }
    },

    // 7. Newsletter Widget (Conversion)
    {
        id: 'def-newsletter',
        widget_type: 'newsletter',
        config: {
            layout: 'stacked',
            backgroundColor: '#111827', // Dark background
            textColor: '#ffffff',
            title: 'Join the Community',
            subtitle: 'Get 10% off your first order when you subscribe to our weekly newsletter.',
            placeholder: 'your@email.com',
            buttonText: 'Get My Code',
            inputStyle: {
                backgroundColor: 'rgba(255,255,255,0.1)',
                borderColor: 'rgba(255,255,255,0.2)',
                textColor: '#ffffff',
                borderRadius: '50px'
            },
            buttonStyle: {
                backgroundColor: '#4f46e5', // Indigo 600
                textColor: '#ffffff',
                borderRadius: '50px'
            }
        }
    }
];

export const DEFAULT_PAGES = {
    'about-us': {
        title: 'About Us',
        content: `
            <div class="py-16 px-4 max-w-4xl mx-auto">
                <h1 class="text-5xl font-bold text-center mb-8 text-gray-900">Our Story</h1>
                <p class="text-xl text-gray-600 text-center mb-16 leading-relaxed">
                    Founded with a simple mission: to bring high-quality, sustainable products to the world without compromising on style or functionality. We believe in transparency, craftsmanship, and community.
                </p>
                
                <div class="grid md:grid-cols-2 gap-12 items-center mb-20">
                    <div class="bg-gray-100 rounded-2xl h-80 w-full flex items-center justify-center">
                         <span class="text-gray-400 font-medium">[Brand Image Placeholder]</span>
                    </div>
                    <div>
                        <h2 class="text-3xl font-bold mb-4">The Beginning</h2>
                        <p class="text-gray-600 leading-relaxed mb-6">
                            It started in a small garage in 2020. Frustrated by the lack of durable options in the market, we set out to create something better. What began as a passion project quickly grew into a global community of like-minded individuals.
                        </p>
                        <ul class="space-y-3">
                            <li class="flex items-center gap-3 text-gray-700">
                                <div class="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center text-green-600">✓</div>
                                <span>Sustainable Sourcing</span>
                            </li>
                             <li class="flex items-center gap-3 text-gray-700">
                                <div class="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">✓</div>
                                <span>Ethical Manufacturing</span>
                            </li>
                             <li class="flex items-center gap-3 text-gray-700">
                                <div class="w-6 h-6 rounded-full bg-purple-100 flex items-center justify-center text-purple-600">✓</div>
                                <span>Community First</span>
                            </li>
                        </ul>
                    </div>
                </div>

                <div class="text-center bg-indigo-50 rounded-3xl p-12">
                    <h2 class="text-3xl font-bold mb-4">Our Mission</h2>
                    <p class="text-lg text-indigo-900 max-w-2xl mx-auto italic">
                        "To inspire confidence and joy through exceptional design, while leaving a positive footprint on our planet."
                    </p>
                </div>
            </div>
        `
    },
    'contact': {
        title: 'Contact Us',
        content: `
             <div class="py-16 px-4 max-w-6xl mx-auto">
                <h1 class="text-4xl font-bold text-center mb-4">Get in Touch</h1>
                <p class="text-gray-600 text-center mb-16 max-w-2xl mx-auto">
                    We'd love to hear from you. Whether you have a question about shipping, returns, or just want to say hello, our team is ready to answer.
                </p>

                <div class="grid md:grid-cols-3 gap-8 mb-16">
                    <div class="bg-white p-8 rounded-2xl shadow-lg border border-gray-100 text-center hover:-translate-y-1 transition-transform duration-300">
                        <div class="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
                        </div>
                        <h3 class="text-xl font-bold mb-2">Phone Support</h3>
                        <p class="text-gray-500 mb-4">Mon-Fri 9am-6pm EST</p>
                        <a href="tel:+15550000000" class="text-blue-600 font-semibold hover:underline">+1 (555) 000-0000</a>
                    </div>

                    <div class="bg-white p-8 rounded-2xl shadow-lg border border-gray-100 text-center hover:-translate-y-1 transition-transform duration-300">
                        <div class="w-16 h-16 bg-purple-50 text-purple-600 rounded-full flex items-center justify-center mx-auto mb-6">
                             <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
                        </div>
                        <h3 class="text-xl font-bold mb-2">Email Us</h3>
                        <p class="text-gray-500 mb-4">We usually respond within 24h</p>
                        <a href="mailto:support@examplestore.com" class="text-purple-600 font-semibold hover:underline">support@examplestore.com</a>
                    </div>

                    <div class="bg-white p-8 rounded-2xl shadow-lg border border-gray-100 text-center hover:-translate-y-1 transition-transform duration-300">
                         <div class="w-16 h-16 bg-pink-50 text-pink-600 rounded-full flex items-center justify-center mx-auto mb-6">
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>
                        </div>
                        <h3 class="text-xl font-bold mb-2">Visit HQ</h3>
                        <p class="text-gray-500 mb-4">SoHo, New York City</p>
                        <a href="#" class="text-pink-600 font-semibold hover:underline">Get Directions</a>
                    </div>
                </div>
            </div>
        `
    }
};

export const DEFAULT_MENUS = {
    header: [
        { id: 'def-h-1', label: 'Home', url: '/' },
        { id: 'def-h-2', label: 'Products', url: '/products' },
        { id: 'def-h-3', label: 'About Us', url: '/about-us' }, // Mapped to dynamic slug
        { id: 'def-h-4', label: 'Contact', url: '/contact' }    // Mapped to dynamic slug
    ],
    footer_quick_links: [
        { id: 'def-f-1', label: 'All Products', url: '/products' },
        { id: 'def-f-2', label: 'New Arrivals', url: '/products?sort=newest' },
        { id: 'def-f-3', label: 'Featured', url: '/products?featured=true' }
    ],
    footer_help: [
        { id: 'def-f-4', label: 'About Us', url: '/about-us' },
        { id: 'def-f-5', label: 'Contact Support', url: '/contact' },
        { id: 'def-f-6', label: 'Shipping Policy', url: '#' },
        { id: 'def-f-7', label: 'Terms of Service', url: '#' }
    ]
};
