// Newsletter Widget - Email subscription form
'use client';

import { useState } from 'react';
import { Send, CheckCircle, Mail } from 'lucide-react';

export default function NewsletterWidget({ config }) {
    const {
        title = "Subscribe to our Newsletter",
        subtitle = "Get the latest updates and exclusive offers.",
        placeholder = "Enter your email address",
        buttonText = "Subscribe",
        layout = "inline", // 'inline' | 'stacked' | 'minimal'
        backgroundColor = "#transparent",
        inputStyle = {
            backgroundColor: "#ffffff",
            borderColor: "#e5e7eb",
            textColor: "#1f2937",
            borderRadius: "8px"
        },
        buttonStyle = {
            backgroundColor: "#111827",
            textColor: "#ffffff",
            borderRadius: "8px"
        },
        textColor = "#111827"
    } = config;

    const [email, setEmail] = useState("");
    const [status, setStatus] = useState("idle");

    const handleSubmit = (e) => {
        e.preventDefault();
        setStatus("loading");

        // Simulate API Key
        setTimeout(() => {
            console.log("Subscribed:", email);
            setStatus("success");
            setEmail("");
            // Reset status after a few seconds
            setTimeout(() => setStatus("idle"), 3000);
        }, 1000);
    };

    const isMinimal = layout === 'minimal';
    const isStacked = layout === 'stacked';

    return (
        <section className={`w-full py-8 transition-colors duration-300 ${isMinimal ? 'border-b' : 'rounded-2xl'}`} style={{ backgroundColor }}>
            <div className={`container mx-auto px-4 ${isMinimal ? 'max-w-4xl' : ''}`}>
                <div className={`flex flex-col ${!isStacked && !isMinimal ? 'md:flex-row md:items-center md:gap-8' : 'gap-6'} justify-between`}>

                    {/* Text Content */}
                    <div className={`${!isStacked && !isMinimal ? 'md:w-1/2' : 'w-full text-center'}`}>
                        {title && (
                            <h3 className="text-2xl font-bold mb-2 flex items-center justify-center md:justify-start gap-2" style={{ color: textColor }}>
                                {isMinimal && <Mail className="w-5 h-5 opacity-75" />}
                                {title}
                            </h3>
                        )}
                        {subtitle && (
                            <p className="text-base opacity-80" style={{ color: textColor }}>
                                {subtitle}
                            </p>
                        )}
                    </div>

                    {/* Form */}
                    <div className={`${!isStacked && !isMinimal ? 'md:w-1/2' : 'w-full max-w-md mx-auto'}`}>
                        {status === "success" ? (
                            <div className="flex items-center justify-center gap-2 p-4 rounded-lg bg-green-50 text-green-700 animate-fade-in border border-green-200">
                                <CheckCircle className="w-5 h-5" />
                                <span className="font-medium">Thanks for subscribing!</span>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit} className={`flex ${isStacked ? 'flex-col gap-3' : 'gap-2'}`}>
                                <div className="relative flex-grow">
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder={placeholder}
                                        required
                                        className="w-full px-4 py-3 outline-none transition-all duration-200 focus:ring-2 focus:ring-opacity-50"
                                        style={{
                                            backgroundColor: inputStyle.backgroundColor,
                                            border: `1px solid ${inputStyle.borderColor}`,
                                            color: inputStyle.textColor,
                                            borderRadius: inputStyle.borderRadius,
                                            '--tw-ring-color': buttonStyle.backgroundColor // Use button color for focus ring
                                        }}
                                    />
                                </div>
                                <button
                                    type="submit"
                                    disabled={status === "loading"}
                                    className="px-6 py-3 font-medium transition-all duration-200 hover:opacity-90 active:scale-95 flex items-center justify-center gap-2 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                                    style={{
                                        backgroundColor: buttonStyle.backgroundColor,
                                        color: buttonStyle.textColor,
                                        borderRadius: buttonStyle.borderRadius
                                    }}
                                >
                                    {status === "loading" ? (
                                        <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    ) : (
                                        <>
                                            {buttonText}
                                            {!isMinimal && <Send className="w-4 h-4" />}
                                        </>
                                    )}
                                </button>
                            </form>
                        )}
                    </div>
                </div>
            </div>
        </section>
    );
}
