// Widget Demo Page - Test all enhanced and new widgets
import HeroWidget from '../../components/widgets/HeroWidget.jsx';
import FeaturesWidget from '../../components/widgets/FeaturesWidget.jsx';
import StatsWidget from '../../components/widgets/StatsWidget.jsx';
import CountdownTimerWidget from '../../components/widgets/CountdownTimerWidget.jsx';
import BeforeAfterSliderWidget from '../../components/widgets/BeforeAfterSliderWidget.jsx';
import PricingTableWidget from '../../components/widgets/PricingTableWidget.jsx';
import AccordionWidget from '../../components/widgets/AccordionWidget.jsx';
import TabsWidget from '../../components/widgets/TabsWidget.jsx';
import AnnouncementBarWidget from '../../components/widgets/AnnouncementBarWidget.jsx';

export default function WidgetDemoPage() {
    return (
        <div className="min-h-screen bg-gray-50">
            <div className="bg-white shadow-sm sticky top-0 z-50 border-b">
                <div className="container mx-auto px-4 py-4">
                    <h1 className="text-3xl font-bold">Widget Demo Gallery</h1>
                    <p className="text-gray-600">Enhanced widgets with extensive customization</p>
                </div>
            </div>

            {/* Announcement Bar Widget */}
            <section className="border-b-4 border-blue-500">
                <div className="bg-gray-100 px-4 py-3">
                    <h2 className="text-xl font-bold">Announcement Bar Widget</h2>
                    <p className="text-sm text-gray-600">Sticky notification bar with auto-rotation</p>
                </div>
                <AnnouncementBarWidget
                    config={{
                        messages: [
                            {
                                text: '🎉 Free shipping on orders over $50!',
                                link: '/shipping',
                                linkText: 'Learn More'
                            },
                            {
                                text: '🔥 Flash Sale - 30% off everything!',
                                link: '/sale',
                                linkText: 'Shop Now'
                            },
                            {
                                text: '⭐ New products just arrived!',
                                link: '/new',
                                linkText: 'Explore'
                            }
                        ],
                        autoRotate: true,
                        rotateInterval: 3000,
                        position: 'top',
                        sticky: false,
                        backgroundColor: '#3b82f6',
                        textColor: '#ffffff',
                        dismissible: true,
                        dismissCookieDuration: 7,
                        icon: 'megaphone'
                    }}
                />
            </section>

            {/* Hero Widget */}
            <section className="border-b-4 border-blue-500">
                <div className="bg-gray-100 px-4 py-3">
                    <h2 className="text-xl font-bold">Enhanced Hero Widget</h2>
                    <p className="text-sm text-gray-600">Particle background, multiple CTAs, animations</p>
                </div>
                <HeroWidget
                    config={{
                        layout: 'centered',
                        height: { desktop: '600px', tablet: '500px', mobile: '400px' },
                        backgroundType: 'particles',
                        particles: {
                            count: 80,
                            color: '#ffffff',
                            speed: 2
                        },
                        overlay: {
                            enabled: true,
                            color: '#1e40af',
                            opacity: 0.8
                        },
                        title: {
                            text: 'Welcome to Our Amazing Store',
                            fontSize: { desktop: '4.5rem', tablet: '3rem', mobile: '2rem' },
                            color: '#ffffff',
                            fontWeight: '700',
                            animation: { type: 'fade-up', duration: 800, delay: 0 }
                        },
                        subtitle: {
                            text: 'Discover the best products with unbeatable prices',
                            fontSize: { desktop: '1.5rem', tablet: '1.25rem', mobile: '1rem' },
                            color: '#ffffff',
                            animation: { type: 'fade-up', duration: 800, delay: 200 }
                        },
                        ctas: [
                            {
                                text: 'Shop Now',
                                link: '/products',
                                style: 'primary',
                                icon: 'shopping-cart',
                                animation: { type: 'fade-up', duration: 800, delay: 400 }
                            },
                            {
                                text: 'Learn More',
                                link: '/about',
                                style: 'outline',
                                icon: 'arrow-right',
                                animation: { type: 'fade-up', duration: 800, delay: 500 }
                            }
                        ]
                    }}
                />
            </section>

            {/* Features Widget - Grid Layout */}
            <section className="border-b-4 border-blue-500">
                <div className="bg-gray-100 px-4 py-3">
                    <h2 className="text-xl font-bold">Features Widget - Grid Layout</h2>
                    <p className="text-sm text-gray-600">Icon library, hover effects, animations</p>
                </div>
                <FeaturesWidget
                    config={{
                        layout: 'grid',
                        columns: { desktop: 4, tablet: 2, mobile: 1 },
                        gap: { x: '2rem', y: '2rem' },
                        features: [
                            {
                                iconType: 'lucide',
                                iconName: 'zap',
                                iconColor: '#3b82f6',
                                iconBackground: '#eff6ff',
                                iconSize: 48,
                                title: 'Lightning Fast',
                                description: 'Optimized for speed and performance'
                            },
                            {
                                iconType: 'lucide',
                                iconName: 'shield',
                                iconColor: '#10b981',
                                iconBackground: '#d1fae5',
                                iconSize: 48,
                                title: 'Secure & Safe',
                                description: 'Bank-level security for your data'
                            },
                            {
                                iconType: 'lucide',
                                iconName: 'heart',
                                iconColor: '#ef4444',
                                iconBackground: '#fee2e2',
                                iconSize: 48,
                                title: 'Made with Love',
                                description: 'Crafted with attention to detail'
                            },
                            {
                                iconType: 'lucide',
                                iconName: 'star',
                                iconColor: '#f59e0b',
                                iconBackground: '#fef3c7',
                                iconSize: 48,
                                title: 'Top Rated',
                                description: '5-star reviews from customers'
                            }
                        ],
                        cardStyle: {
                            backgroundColor: '#ffffff',
                            padding: '2rem',
                            borderRadius: 16,
                            shadow: 'medium',
                            border: { width: '1px', color: '#e5e7eb', style: 'solid' }
                        },
                        hoverEffect: 'lift',
                        entranceAnimation: 'slide-up',
                        staggerDelay: 100,
                        sectionBackground: {
                            type: 'solid',
                            color: '#ffffff'
                        }
                    }}
                />
            </section>

            {/* Stats Widget */}
            <section className="border-b-4 border-blue-500">
                <div className="bg-gray-100 px-4 py-3">
                    <h2 className="text-xl font-bold">Stats Widget</h2>
                    <p className="text-sm text-gray-600">Animated counters with gradient background</p>
                </div>
                <StatsWidget
                    config={{
                        layout: 'horizontal',
                        columns: { desktop: 4, tablet: 2, mobile: 2 },
                        stats: [
                            {
                                value: 10000,
                                label: 'Happy Customers',
                                suffix: '+',
                                icon: 'users',
                                iconColor: '#ffffff',
                                format: 'number',
                                decimals: 0,
                                animationDuration: 2000
                            },
                            {
                                value: 500,
                                label: 'Products',
                                suffix: '+',
                                icon: 'package',
                                iconColor: '#ffffff',
                                format: 'number',
                                decimals: 0,
                                animationDuration: 2000
                            },
                            {
                                value: 50,
                                label: 'Countries',
                                suffix: '',
                                icon: 'globe',
                                iconColor: '#ffffff',
                                format: 'number',
                                decimals: 0,
                                animationDuration: 2000
                            },
                            {
                                value: 99.9,
                                label: 'Satisfaction',
                                suffix: '%',
                                icon: 'star',
                                iconColor: '#ffffff',
                                format: 'number',
                                decimals: 1,
                                animationDuration: 2000
                            }
                        ],
                        textColor: '#ffffff',
                        valueSize: { desktop: '4rem', tablet: '3rem', mobile: '2.5rem' },
                        labelSize: { desktop: '1.25rem', tablet: '1rem', mobile: '0.875rem' },
                        background: {
                            type: 'gradient',
                            gradient: {
                                type: 'linear',
                                angle: 45,
                                stops: [
                                    { color: '#3b82f6', position: 0 },
                                    { color: '#8b5cf6', position: 100 }
                                ]
                            }
                        },
                        separator: {
                            enabled: true,
                            color: 'rgba(255,255,255,0.2)',
                            width: 1
                        }
                    }}
                />
            </section>

            {/* Countdown Timer Widget */}
            <section className="border-b-4 border-blue-500">
                <div className="bg-gray-100 px-4 py-3">
                    <h2 className="text-xl font-bold">Countdown Timer Widget</h2>
                    <p className="text-sm text-gray-600">Flash sale countdown with urgency effects</p>
                </div>
                <CountdownTimerWidget
                    config={{
                        targetDate: '2026-12-31T23:59:59',
                        timezone: 'UTC',
                        showDays: true,
                        showHours: true,
                        showMinutes: true,
                        showSeconds: true,
                        labels: {
                            days: 'Days',
                            hours: 'Hours',
                            minutes: 'Min',
                            seconds: 'Sec'
                        },
                        layout: 'horizontal',
                        digitStyle: 'static',
                        size: 'md',
                        colorScheme: 'primary',
                        pulseWhenLow: true,
                        lowThreshold: { days: 365 },
                        urgentColor: '#ef4444',
                        title: '🔥 Flash Sale Ends In',
                        subtitle: 'Hurry up! Don\'t miss out on amazing deals'
                    }}
                />
            </section>

            {/* Before/After Slider Widget */}
            <section className="border-b-4 border-blue-500">
                <div className="bg-gray-100 px-4 py-3">
                    <h2 className="text-xl font-bold">Before/After Slider Widget</h2>
                    <p className="text-sm text-gray-600">Interactive image comparison slider</p>
                </div>
                <BeforeAfterSliderWidget
                    config={{
                        beforeImage: {
                            url: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800',
                            label: 'Before'
                        },
                        afterImage: {
                            url: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&sat=-100',
                            label: 'After'
                        },
                        defaultPosition: 50,
                        orientation: 'horizontal',
                        handleStyle: 'arrow',
                        handleColor: '#ffffff',
                        showLabels: true,
                        labelPosition: 'overlay',
                        labelStyle: {
                            fontSize: '1rem',
                            color: '#ffffff',
                            backgroundColor: 'rgba(0,0,0,0.7)',
                            padding: '0.5rem 1rem'
                        },
                        autoSlide: false,
                        hoverToSlide: true,
                        aspectRatio: '16:9'
                    }}
                />
            </section>

            {/* Pricing Table Widget */}
            <section className="border-b-4 border-blue-500">
                <div className="bg-gray-100 px-4 py-3">
                    <h2 className="text-xl font-bold">Pricing Table Widget</h2>
                    <p className="text-sm text-gray-600">Pricing plans with billing toggle</p>
                </div>
                <PricingTableWidget
                    config={{
                        plans: [
                            {
                                name: 'Basic',
                                price: 9.99,
                                billingPeriod: 'month',
                                currency: 'USD',
                                featured: false,
                                features: [
                                    { text: '10 Products', included: true },
                                    { text: 'Basic Analytics', included: true },
                                    { text: 'Email Support', included: true },
                                    { text: 'Custom Domain', included: false },
                                    { text: 'Priority Support', included: false }
                                ],
                                ctaText: 'Get Started',
                                ctaLink: '/subscribe/basic',
                                accentColor: '#3b82f6'
                            },
                            {
                                name: 'Pro',
                                price: 29.99,
                                billingPeriod: 'month',
                                currency: 'USD',
                                featured: true,
                                badge: '⭐ Most Popular',
                                features: [
                                    { text: 'Unlimited Products', included: true },
                                    { text: 'Advanced Analytics', included: true },
                                    { text: 'Email Support', included: true },
                                    { text: 'Custom Domain', included: true },
                                    { text: 'Priority Support', included: true, tooltip: '24/7 dedicated support team' }
                                ],
                                ctaText: 'Get Started',
                                ctaLink: '/subscribe/pro',
                                accentColor: '#8b5cf6'
                            },
                            {
                                name: 'Enterprise',
                                price: 99.99,
                                billingPeriod: 'month',
                                currency: 'USD',
                                featured: false,
                                features: [
                                    { text: 'Unlimited Everything', included: true },
                                    { text: 'White Label', included: true },
                                    { text: 'Dedicated Account Manager', included: true },
                                    { text: 'Custom Integrations', included: true },
                                    { text: 'SLA Guarantee', included: true }
                                ],
                                ctaText: 'Contact Sales',
                                ctaLink: '/contact',
                                accentColor: '#10b981'
                            }
                        ],
                        columns: { desktop: 3, tablet: 2, mobile: 1 },
                        billingToggle: {
                            enabled: true,
                            options: ['monthly', 'yearly'],
                            yearlyDiscount: 20
                        },
                        showComparison: true,
                        cardStyle: {
                            borderRadius: '16px',
                            shadow: true,
                            hoverLift: true
                        },
                        tooltipsEnabled: true
                    }}
                />
            </section>

            {/* Accordion Widget */}
            <section className="border-b-4 border-blue-500">
                <div className="bg-gray-100 px-4 py-3">
                    <h2 className="text-xl font-bold">Accordion Widget</h2>
                    <p className="text-sm text-gray-600">FAQ-style collapsible content</p>
                </div>
                <AccordionWidget
                    config={{
                        items: [
                            {
                                title: 'What is your return policy?',
                                content: 'We offer a 30-day money-back guarantee on all products. If you\'re not satisfied, simply return the item in its original condition for a full refund.',
                                icon: 'package',
                                defaultOpen: true
                            },
                            {
                                title: 'How long does shipping take?',
                                content: 'Standard shipping takes 5-7 business days. Express shipping is available for 2-3 day delivery. Free shipping on orders over $50!',
                                icon: 'truck'
                            },
                            {
                                title: 'Do you ship internationally?',
                                content: 'Yes! We ship to over 50 countries worldwide. International shipping times vary by location, typically 10-14 business days.',
                                icon: 'globe'
                            },
                            {
                                title: 'What payment methods do you accept?',
                                content: 'We accept all major credit cards (Visa, MasterCard, American Express), PayPal, Apple Pay, and Google Pay.',
                                icon: 'credit-card'
                            }
                        ],
                        allowMultipleOpen: false,
                        closeOthersOnOpen: true,
                        style: 'bordered',
                        iconPosition: 'right',
                        animation: 'smooth',
                        openIcon: 'chevron-up',
                        closedIcon: 'chevron-down',
                        backgroundColor: '#ffffff',
                        borderColor: '#e5e7eb',
                        accentColor: '#3b82f6'
                    }}
                />
            </section>

            {/* Tabs Widget */}
            <section className="border-b-4 border-blue-500">
                <div className="bg-gray-100 px-4 py-3">
                    <h2 className="text-xl font-bold">Tabs Widget</h2>
                    <p className="text-sm text-gray-600">Tabbed content organization</p>
                </div>
                <TabsWidget
                    config={{
                        tabs: [
                            {
                                id: 'features',
                                label: 'Features',
                                icon: 'star',
                                content: 'Our product comes with amazing features including advanced analytics, real-time collaboration, and enterprise-grade security. Built for teams of all sizes with scalability in mind.'
                            },
                            {
                                id: 'reviews',
                                label: 'Reviews',
                                icon: 'message-circle',
                                content: '"This is the best product I\'ve ever used! The interface is intuitive and the features are exactly what I needed." - Sarah J. ⭐⭐⭐⭐⭐'
                            },
                            {
                                id: 'pricing',
                                label: 'Pricing',
                                icon: 'dollar-sign',
                                content: 'Flexible pricing plans starting at $9/month. All plans include a 14-day free trial with no credit card required. Cancel anytime.'
                            },
                            {
                                id: 'support',
                                label: 'Support',
                                icon: 'help-circle',
                                content: '24/7 customer support via email, chat, and phone. Dedicated account managers for enterprise customers. Comprehensive documentation and video tutorials available.'
                            }
                        ],
                        defaultTab: 'features',
                        rememberSelection: true,
                        tabPosition: 'top',
                        tabStyle: 'pills',
                        animation: 'fade',
                        accentColor: '#3b82f6',
                        backgroundColor: '#ffffff'
                    }}
                />
            </section>

            {/* Features Widget - Carousel Layout */}
            <section className="border-b-4 border-blue-500">
                <div className="bg-gray-100 px-4 py-3">
                    <h2 className="text-xl font-bold">Features Widget - Carousel Layout</h2>
                    <p className="text-sm text-gray-600">Scrollable carousel with navigation</p>
                </div>
                <FeaturesWidget
                    config={{
                        layout: 'carousel',
                        features: [
                            {
                                iconType: 'emoji',
                                emoji: '🚀',
                                title: 'Fast Performance',
                                description: 'Lightning-fast load times'
                            },
                            {
                                iconType: 'emoji',
                                emoji: '🎨',
                                title: 'Beautiful Design',
                                description: 'Stunning visual aesthetics'
                            },
                            {
                                iconType: 'emoji',
                                emoji: '🔒',
                                title: 'Secure',
                                description: 'Bank-level encryption'
                            },
                            {
                                iconType: 'emoji',
                                emoji: '📱',
                                title: 'Responsive',
                                description: 'Perfect on all devices'
                            },
                            {
                                iconType: 'emoji',
                                emoji: '⚡',
                                title: 'Powerful',
                                description: 'Feature-rich platform'
                            }
                        ],
                        cardStyle: {
                            backgroundColor: '#ffffff',
                            padding: '2rem',
                            borderRadius: 12,
                            shadow: 'lg'
                        },
                        hoverEffect: 'scale'
                    }}
                />
            </section>

            <div className="py-12 text-center bg-gray-100">
                <h2 className="text-2xl font-bold mb-4">🎉 All Widgets Loaded Successfully!</h2>
                <p className="text-gray-600 mb-4">
                    Scroll through to see all the enhanced and new widgets in action
                </p>
                <p className="text-sm text-gray-500">
                    Total Widgets: 9 | Enhanced: 3 | New: 6
                </p>
            </div>
        </div>
    );
}
