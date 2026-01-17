// Pricing Table Comparison Widget
'use client';

import { useState } from 'react';
import Link from 'next/link';
import * as LucideIcons from 'lucide-react';

export default function PricingTableWidget({ config }) {
    const {
        plans = [],
        columns = { desktop: 3, tablet: 2, mobile: 1 },
        showComparison = false,
        billingToggle = { enabled: false, options: ['monthly', 'yearly'], yearlyDiscount: 20 },
        cardStyle = {
            borderRadius: '16px',
            shadow: true,
            hoverLift: true
        },
        tooltipsEnabled = true,
        theme = {
            background: { type: 'solid', color: '#f9fafb' },
            cardBackground: '#ffffff',
            cardBorder: '#e5e7eb',
            primaryAccent: '#3b82f6',
            textColor: '#111827',
            featureIncluded: '#10b981',
            featureExcluded: '#9ca3af',
            cardShadow: 'xl',
            borderRadius: '16px'
        }
    } = config;

    const [billingPeriod, setBillingPeriod] = useState(billingToggle.options?.[0] || 'monthly');

    if (!plans || plans.length === 0) return null;

    // Calculate discounted price for yearly
    const getPrice = (plan) => {
        if (billingPeriod === 'yearly' && billingToggle.enabled) {
            const discount = billingToggle.yearlyDiscount || 0;
            return plan.price * 12 * ((100 - discount) / 100);
        }
        return plan.price;
    };

    // Generate background style
    const getBackgroundStyle = () => {
        if (theme.background?.type === 'gradient' && theme.background.gradient) {
            const { type, angle, stops } = theme.background.gradient;
            if (stops && stops.length > 0) {
                const gradient = stops.map(s => `${s.color} ${s.position}%`).join(', ');
                return type === 'radial'
                    ? { background: `radial-gradient(circle, ${gradient})` }
                    : { background: `linear-gradient(${angle || 135}deg, ${gradient})` };
            }
        }
        return { backgroundColor: theme.background?.color || '#f9fafb' };
    };

    return (
        <section className="py-20" style={getBackgroundStyle()}>
            <div className="container mx-auto px-4">
                <div className="max-w-7xl mx-auto">
                    {/* Header */}
                    <div className="text-center mb-12">
                        <h2 className="text-4xl md:text-5xl font-bold mb-4">
                            Choose Your Plan
                        </h2>
                        <p className="text-xl text-gray-600 mb-8">
                            Select the perfect plan for your needs
                        </p>

                        {/* Billing Toggle */}
                        {billingToggle.enabled && (
                            <div className="inline-flex items-center gap-4 bg-white rounded-full p-2 shadow-lg">
                                {(billingToggle.options || ['monthly', 'yearly']).map((option) => (
                                    <button
                                        key={option}
                                        onClick={() => setBillingPeriod(option)}
                                        className={`px-6 py-2 rounded-full font-semibold transition-all ${billingPeriod === option
                                            ? 'bg-blue-600 text-white shadow-md'
                                            : 'text-gray-600 hover:text-gray-900'
                                            }`}
                                    >
                                        {option.charAt(0).toUpperCase() + option.slice(1)}
                                        {option === 'yearly' && billingToggle.yearlyDiscount > 0 && (
                                            <span className="ml-2 text-xs bg-green-500 text-white px-2 py-1 rounded-full">
                                                Save {billingToggle.yearlyDiscount}%
                                            </span>
                                        )}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Pricing Cards */}
                    <div
                        className="grid gap-8"
                        style={{
                            gridTemplateColumns: `repeat(${columns.desktop}, 1fr)`
                        }}
                    >
                        {plans.map((plan, index) => (
                            <PricingCard
                                key={index}
                                plan={plan}
                                billingPeriod={billingPeriod}
                                price={getPrice(plan)}
                                cardStyle={cardStyle}
                                tooltipsEnabled={tooltipsEnabled}
                                isYearly={billingPeriod === 'yearly'}
                                theme={theme}
                            />
                        ))}
                    </div>

                    {/* Comparison Table */}
                    {showComparison && (
                        <div className="mt-16">
                            <ComparisonTable plans={plans} />
                        </div>
                    )}
                </div>
            </div>

            <style jsx>{`
                @media (max-width: 768px) {
                    .grid {
                        grid-template-columns: repeat(${columns.mobile}, 1fr) !important;
                    }
                }

                @media (min-width: 769px) and (max-width: 1024px) {
                    .grid {
                        grid-template-columns: repeat(${columns.tablet}, 1fr) !important;
                    }
                }
            `}</style>
        </section>
    );
}

function PricingCard({ plan, billingPeriod, price, cardStyle, tooltipsEnabled, isYearly, theme }) {
    const [showTooltip, setShowTooltip] = useState(null);

    const CheckIcon = LucideIcons.Check;
    const XIcon = LucideIcons.X;

    return (
        <div
            className={`relative rounded-2xl overflow-hidden transition-all duration-300 ${cardStyle.hoverLift ? 'hover:-translate-y-2' : ''
                } ${cardStyle.shadow ? `shadow-${theme?.cardShadow || 'xl'} hover:shadow-2xl` : ''} ${plan.featured ? 'ring-4 scale-105' : ''
                }`}
            style={{
                backgroundColor: theme?.cardBackground || '#ffffff',
                borderWidth: '2px',
                borderStyle: 'solid',
                borderColor: theme?.cardBorder || '#e5e7eb',
                borderRadius: theme?.borderRadius || '16px',
                ...(plan.featured ? { ringColor: theme?.primaryAccent || '#3b82f6' } : {})
            }}
        >
            {/* Featured Badge */}
            {plan.featured && (
                <div
                    className="absolute top-0 left-0 right-0 py-2 text-center text-white text-sm font-semibold"
                    style={{ backgroundColor: theme?.primaryAccent || '#3b82f6' }}
                >
                    ⭐ Most Popular
                </div>
            )}

            <div className={`p-8 ${plan.featured ? 'pt-14' : ''}`}>
                {/* Plan Name */}
                <h3 className="text-2xl font-bold mb-4" style={{ color: theme.textColor }}>{plan.name}</h3>

                {/* Price */}
                <div className="mb-6">
                    <div className="flex items-baseline gap-2">
                        <span className="text-5xl font-bold" style={{ color: plan.accentColor || '#3b82f6' }}>
                            {plan.currency === 'USD' && '$'}
                            {plan.currency === 'EUR' && '€'}
                            {plan.currency === 'GBP' && '£'}
                            {isYearly
                                ? Math.round(price)
                                : price.toLocaleString('en-US', {
                                    minimumFractionDigits: 2,
                                    maximumFractionDigits: 2
                                })}
                        </span>
                        <span className="text-gray-500">
                            /{isYearly ? 'year' : plan.billingPeriod || 'month'}
                        </span>
                    </div>
                    {isYearly && (
                        <div className="text-sm text-gray-500 mt-1">
                            ${(price / 12).toFixed(2)} per month, billed annually
                        </div>
                    )}
                </div>

                {/* Features List */}
                <ul className="space-y-4 mb-8">
                    {plan.features?.map((feature, idx) => (
                        <li key={idx} className="flex items-start gap-3 relative">
                            {feature.included ? (
                                <CheckIcon className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: theme?.featureIncluded || '#10b981' }} />
                            ) : (
                                <XIcon className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: theme?.featureExcluded || '#9ca3af' }} />
                            )}
                            <span className={feature.included ? '' : 'line-through'} style={{ color: feature.included ? (theme?.textColor || '#111827') : (theme?.featureExcluded || '#9ca3af') }}>
                                {feature.text}
                            </span>

                            {/* Tooltip */}
                            {tooltipsEnabled && feature.tooltip && (
                                <>
                                    <button
                                        className="ml-auto text-gray-400 hover:text-gray-600"
                                        onMouseEnter={() => setShowTooltip(idx)}
                                        onMouseLeave={() => setShowTooltip(null)}
                                    >
                                        <LucideIcons.Info className="w-4 h-4" />
                                    </button>
                                    {showTooltip === idx && (
                                        <div className="absolute left-0 top-full mt-2 bg-gray-900 text-white text-sm rounded-lg p-3 shadow-xl z-10 w-64">
                                            {feature.tooltip}
                                        </div>
                                    )}
                                </>
                            )}
                        </li>
                    ))}
                </ul>

                {/* CTA Button */}
                <Link
                    href={plan.ctaLink || '#'}
                    className="block w-full text-center px-6 py-4 rounded-xl font-bold transition-all hover:scale-105 shadow-lg"
                    style={{
                        backgroundColor: plan.featured ? (theme?.primaryAccent || '#3b82f6') : '#f3f4f6',
                        color: plan.featured ? '#ffffff' : (theme?.textColor || '#374151')
                    }}
                >
                    {plan.ctaText || 'Get Started'}
                </Link>
            </div>
        </div>
    );
}

function ComparisonTable({ plans }) {
    // Extract all unique features
    const allFeatures = new Set();
    plans.forEach(plan => {
        plan.features?.forEach(feature => {
            allFeatures.add(feature.text);
        });
    });

    const featuresList = Array.from(allFeatures);

    return (
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-4 text-left text-sm font-bold text-gray-900">
                                Features
                            </th>
                            {plans.map((plan, idx) => (
                                <th
                                    key={idx}
                                    className="px-6 py-4 text-center text-sm font-bold"
                                    style={{ color: plan.accentColor || '#3b82f6' }}
                                >
                                    {plan.name}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {featuresList.map((featureText, idx) => (
                            <tr key={idx} className="hover:bg-gray-50">
                                <td className="px-6 py-4 text-sm text-gray-700">
                                    {featureText}
                                </td>
                                {plans.map((plan, planIdx) => {
                                    const feature = plan.features?.find(f => f.text === featureText);
                                    return (
                                        <td key={planIdx} className="px-6 py-4 text-center">
                                            {feature?.included ? (
                                                <LucideIcons.Check className="w-5 h-5 text-green-500 mx-auto" />
                                            ) : (
                                                <LucideIcons.Minus className="w-5 h-5 text-gray-300 mx-auto" />
                                            )}
                                        </td>
                                    );
                                })}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
