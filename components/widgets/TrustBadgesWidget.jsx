// Trust Badges Widget - Payment/security logos
import { ShieldCheck, CreditCard, Truck, RefreshCcw, Lock } from 'lucide-react';

export default function TrustBadgesWidget({ config }) {
    const { badges = [], style = 'simple' } = config;

    // Mapping of icon names to components
    const iconMap = {
        'visa': CreditCard,
        'mastercard': CreditCard,
        'paypal': CreditCard,
        'amex': CreditCard,
        'secure': Lock,
        'shipping': Truck,
        'returns': RefreshCcw,
        'guarantee': ShieldCheck
    };

    // Default configuration if none provided
    const displayBadges = badges.length > 0 ? badges : [
        { name: 'Secure Payment', icon: 'secure', text: '256-bit SSL Encrypted' },
        { name: 'Free Shipping', icon: 'shipping', text: 'On orders over $50' },
        { name: 'Easy Returns', icon: 'returns', text: '30-day money back' },
        { name: 'Authenticity', icon: 'guarantee', text: '100% Authentic' }
    ];

    return (
        <section className="py-12 bg-gray-50 border-t border-b border-gray-100">
            <div className="container mx-auto px-4">
                <div className={`grid grid-cols-2 lg:grid-cols-4 gap-8 ${style === 'cards' ? '' : 'text-center'}`}>
                    {displayBadges.map((badge, index) => {
                        const IconComponent = iconMap[badge.icon] || ShieldCheck;

                        // Icon or Image Renderer
                        const MediaContent = () => {
                            if (badge.image) {
                                return <img src={badge.image} alt={badge.name} className="w-8 h-8 object-contain" />;
                            }
                            return <IconComponent className="w-8 h-8" />;
                        };

                        if (style === 'cards') {
                            return (
                                <div key={index} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4 hover:shadow-md transition-shadow">
                                    <div className="p-3 bg-blue-50 text-blue-600 rounded-lg shrink-0 flex items-center justify-center">
                                        <MediaContent />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-gray-900">{badge.name}</h3>
                                        {badge.text && <p className="text-sm text-gray-500">{badge.text}</p>}
                                    </div>
                                </div>
                            );
                        }

                        return (
                            <div key={index} className="flex flex-col items-center gap-3 group">
                                <div className="p-4 bg-white rounded-full shadow-sm text-gray-600 group-hover:text-blue-600 group-hover:scale-110 transition-all duration-300 flex items-center justify-center">
                                    <MediaContent />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-gray-900">{badge.name}</h3>
                                    {badge.text && <p className="text-sm text-gray-500">{badge.text}</p>}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}
