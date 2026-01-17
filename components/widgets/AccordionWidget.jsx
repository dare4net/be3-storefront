// Accordion/Collapsible Content Widget
'use client';

import { useState } from 'react';
import * as LucideIcons from 'lucide-react';

export default function AccordionWidget({ config }) {
    const {
        items = [],
        allowMultipleOpen = false,
        closeOthersOnOpen = true,
        style = 'minimal',
        iconPosition = 'right',
        animation = 'smooth',
        openIcon = 'minus',
        closedIcon = 'plus',
        backgroundColor = '#ffffff',
        borderColor = '#e5e7eb',
        accentColor = '#3b82f6'
    } = config;

    const [openItems, setOpenItems] = useState(
        items.reduce((acc, item, index) => {
            if (item.defaultOpen) acc.push(index);
            return acc;
        }, [])
    );

    const toggleItem = (index) => {
        if (openItems.includes(index)) {
            setOpenItems(openItems.filter(i => i !== index));
        } else {
            if (closeOthersOnOpen && !allowMultipleOpen) {
                setOpenItems([index]);
            } else if (allowMultipleOpen) {
                setOpenItems([...openItems, index]);
            } else {
                setOpenItems([index]);
            }
        }
    };

    const OpenIcon = LucideIcons[toPascalCase(openIcon)] || LucideIcons.Minus;
    const ClosedIcon = LucideIcons[toPascalCase(closedIcon)] || LucideIcons.Plus;

    const styleClasses = {
        minimal: 'border-b',
        bordered: 'border rounded-lg mb-3',
        filled: 'rounded-lg mb-3'
    };

    const getItemIcon = (item) => {
        if (!item.icon) return null;
        const Icon = LucideIcons[toPascalCase(item.icon)];
        return Icon ? <Icon className="w-5 h-5" style={{ color: accentColor }} /> : null;
    };

    if (!items || items.length === 0) return null;

    return (
        <section className="py-12 bg-gray-50">
            <div className="container mx-auto px-4">
                <div className="max-w-4xl mx-auto">
                    {items.map((item, index) => {
                        const isOpen = openItems.includes(index);
                        const ItemIcon = getItemIcon(item);

                        return (
                            <div
                                key={index}
                                className={`${styleClasses[style]} overflow-hidden transition-all`}
                                style={{
                                    backgroundColor: style === 'filled' ? backgroundColor : 'transparent',
                                    borderColor: style !== 'minimal' ? borderColor : undefined
                                }}
                            >
                                {/* Header/Trigger */}
                                <button
                                    onClick={() => toggleItem(index)}
                                    className={`w-full flex items-center gap-4 text-left transition-all hover:opacity-80 ${style === 'filled' ? 'p-6' : 'py-4'
                                        } ${iconPosition === 'right' ? 'justify-between' : ''}`}
                                >
                                    {/* Icon Left */}
                                    {iconPosition === 'left' && (
                                        <div className="flex items-center gap-3 flex-1">
                                            {ItemIcon}
                                            <span className="font-bold text-lg">{item.title}</span>
                                        </div>
                                    )}

                                    {/* Icon Right */}
                                    {iconPosition === 'right' && (
                                        <>
                                            <div className="flex items-center gap-3 flex-1">
                                                {ItemIcon}
                                                <span className="font-bold text-lg">{item.title}</span>
                                            </div>
                                            <div
                                                className={`transform transition-transform ${isOpen ? 'rotate-180' : ''
                                                    }`}
                                                style={{ color: accentColor }}
                                            >
                                                {isOpen ? <OpenIcon className="w-5 h-5" /> : <ClosedIcon className="w-5 h-5" />}
                                            </div>
                                        </>
                                    )}
                                </button>

                                {/* Content */}
                                <div
                                    className={`overflow-hidden transition-all ${animation === 'smooth' ? 'duration-300' : 'duration-0'
                                        }`}
                                    style={{
                                        maxHeight: isOpen ? '1000px' : '0px',
                                        opacity: isOpen ? 1 : 0
                                    }}
                                >
                                    <div
                                        className={`text-gray-600 leading-relaxed ${style === 'filled' ? 'px-6 pb-6' : 'pb-4'
                                            }`}
                                    >
                                        {item.content}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}

function toPascalCase(str) {
    return str
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join('');
}
