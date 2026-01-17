// Tabs Widget for organizing content
'use client';

import { useState, useEffect } from 'react';
import * as LucideIcons from 'lucide-react';
import WidgetRenderer from './WidgetRenderer';

export default function TabsWidget({ config, children }) {
    const {
        tabs = [],
        defaultTab = null,
        rememberSelection = true,
        tabPosition = 'top',
        tabStyle = 'underline',
        animation = 'fade',
        mobileLayout = 'tabs',
        accentColor = '#3b82f6',
        backgroundColor = '#ffffff'
    } = config;

    const [activeTab, setActiveTab] = useState(defaultTab || tabs[0]?.id);

    // Remember selection using localStorage
    useEffect(() => {
        if (rememberSelection) {
            const savedTab = localStorage.getItem('activeTab');
            if (savedTab && tabs.find(t => t.id === savedTab)) {
                setActiveTab(savedTab);
            }
        }
    }, []);

    useEffect(() => {
        if (rememberSelection) {
            localStorage.setItem('activeTab', activeTab);
        }
    }, [activeTab, rememberSelection]);

    if (!tabs || tabs.length === 0) return null;

    const tabStyleClasses = {
        underline: 'border-b-2 border-transparent hover:border-gray-300',
        pills: 'rounded-full px-6 py-2 hover:bg-gray-100',
        boxed: 'border-2 border-gray-200 rounded-lg px-6 py-2 hover:bg-gray-50'
    };

    const activeTabStyleClasses = {
        underline: 'border-blue-600 text-blue-600',
        pills: 'bg-blue-600 text-white hover:bg-blue-700',
        boxed: 'border-blue-600 bg-blue-50 text-blue-600'
    };

    const animationClasses = {
        fade: 'animate-fade-in',
        slide: 'animate-slide-in',
        none: ''
    };

    const positionClasses = {
        top: 'flex-col',
        left: 'flex-row',
        right: 'flex-row-reverse',
        bottom: 'flex-col-reverse'
    };

    return (
        <section className="py-12" style={{ backgroundColor }}>
            <div className="container mx-auto px-4">
                <div className={`flex ${positionClasses[tabPosition]} gap-8`}>
                    {/* Tab List */}
                    <div
                        className={`flex ${tabPosition === 'left' || tabPosition === 'right'
                                ? 'flex-col'
                                : 'flex-row flex-wrap'
                            } gap-2`}
                    >
                        {tabs.map((tab) => {
                            const Icon = tab.icon ? LucideIcons[toPascalCase(tab.icon)] : null;
                            const isActive = activeTab === tab.id;

                            return (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id)}
                                    className={`flex items-center gap-2 font-semibold transition-all ${tabStyleClasses[tabStyle]
                                        } ${isActive ? activeTabStyleClasses[tabStyle] : ''}`}
                                    style={
                                        isActive && tabStyle === 'underline'
                                            ? { borderColor: accentColor, color: accentColor }
                                            : isActive && tabStyle === 'pills'
                                                ? { backgroundColor: accentColor }
                                                : isActive && tabStyle === 'boxed'
                                                    ? { borderColor: accentColor, color: accentColor }
                                                    : {}
                                    }
                                >
                                    {Icon && <Icon className="w-5 h-5" />}
                                    {tab.label}
                                </button>
                            );
                        })}
                    </div>

                    {/* Tab Content */}
                    <div className="flex-1">
                        {tabs.map((tab) => {
                            const isActive = activeTab === tab.id;

                            return (
                                <div
                                    key={tab.id}
                                    className={`${!isActive ? 'hidden' : ''} ${animationClasses[animation]
                                        }`}
                                >
                                    {tab.content && typeof tab.content === 'string' && (
                                        <div className="prose max-w-none">
                                            {tab.content}
                                        </div>
                                    )}

                                    {/* Support for nested widgets */}
                                    {Array.isArray(tab.widgets) && tab.widgets.length > 0 && (
                                        <div>
                                            {tab.widgets.map((widget, idx) => (
                                                <WidgetRenderer
                                                    key={idx}
                                                    widget={widget}
                                                    widgets={tab.widgets}
                                                />
                                            ))}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            <style jsx>{`
                @keyframes fade-in {
                    from {
                        opacity: 0;
                    }
                    to {
                        opacity: 1;
                    }
                }

                @keyframes slide-in {
                    from {
                        opacity: 0;
                        transform: translateY(10px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }

                .animate-fade-in {
                    animation: fade-in 0.3s ease-out;
                }

                .animate-slide-in {
                    animation: slide-in 0.3s ease-out;
                }

                @media (max-width: 768px) {
                    ${mobileLayout === 'accordion' ? `
                        .flex-row,
                        .flex-row-reverse {
                            flex-direction: column !important;
                        }
                    ` : ''}
                }
            `}</style>
        </section>
    );
}

function toPascalCase(str) {
    return str
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join('');
}
