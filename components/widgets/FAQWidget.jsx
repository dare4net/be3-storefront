// FAQ Widget - Accordion
'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

export default function FAQWidget({ config }) {
    const { title = 'Frequently Asked Questions', faqs = [] } = config;
    const [openIndex, setOpenIndex] = useState(null);

    if (faqs.length === 0) return null;

    return (
        <section className="py-16 bg-gray-50">
            <div className="container mx-auto px-4">
                <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">{title}</h2>

                <div className="max-w-3xl mx-auto space-y-4">
                    {faqs.map((faq, index) => (
                        <div
                            key={index}
                            className="bg-white rounded-lg shadow-sm overflow-hidden"
                        >
                            <button
                                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                                className="w-full px-6 py-4 flex justify-between items-center hover:bg-gray-50 transition"
                            >
                                <span className="font-semibold text-left text-lg">{faq.question}</span>
                                <ChevronDown
                                    className={`w-5 h-5 transition-transform ${openIndex === index ? 'rotate-180' : ''
                                        }`}
                                />
                            </button>
                            {openIndex === index && (
                                <div className="px-6 pb-4 text-gray-600">
                                    {faq.answer}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
