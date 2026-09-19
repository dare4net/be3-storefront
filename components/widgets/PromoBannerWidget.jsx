// Promotional Banner Widget
import Link from 'next/link';

export default function PromoBannerWidget({ config = {} }) {
    const {
        title = 'Special Offer',
        subtitle = 'Limited time only',
        ctaText = 'Shop Now',
        ctaLink = '/products',
        backgroundColor = config.useThemeColors || !config.backgroundColor || config.backgroundColor === '#3b82f6' ? 'var(--primary, #3b82f6)' : config.backgroundColor,
        textColor = config.useThemeColors || !config.textColor || config.textColor === '#ffffff' ? 'var(--primary-content, #ffffff)' : config.textColor
    } = config;

    return (
        <section
            className="py-16 transition-colors duration-300"
            style={{ backgroundColor: backgroundColor || 'var(--primary, #3b82f6)' }}
        >
            <div className="container mx-auto px-4">
                <div className="text-center max-w-3xl mx-auto">
                    <h2
                        className="text-4xl md:text-5xl font-bold mb-4"
                        style={{ color: textColor }}
                    >
                        {title}
                    </h2>
                    {subtitle && (
                        <p
                            className="text-xl mb-8 opacity-90"
                            style={{ color: textColor }}
                        >
                            {subtitle}
                        </p>
                    )}
                    {ctaText && (
                        <Link
                            href={ctaLink}
                            className="inline-block px-8 py-4 bg-white text-gray-900 font-bold rounded-full hover:bg-gray-100 transition-all hover:scale-105 shadow-xl"
                        >
                            {ctaText}
                        </Link>
                    )}
                </div>
            </div>
        </section>
    );
}
