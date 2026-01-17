"use client";

import { Facebook, Twitter, Instagram, Linkedin, Youtube, Globe } from 'lucide-react';

export default function SocialLinksWidget({ config }) {
    const {
        facebook,
        twitter,
        instagram,
        linkedin,
        youtube,
        title = "Follow Us"
    } = config;

    const links = [
        { icon: Facebook, url: facebook, label: "Facebook" },
        { icon: Twitter, url: twitter, label: "Twitter" },
        { icon: Instagram, url: instagram, label: "Instagram" },
        { icon: Linkedin, url: linkedin, label: "LinkedIn" },
        { icon: Youtube, url: youtube, label: "YouTube" },
    ].filter(item => item.url);

    if (links.length === 0) return null;

    return (
        <div className="w-full">
            {title && (
                <h3 className="text-sm font-semibold text-gray-900 tracking-wider uppercase mb-4">
                    {title}
                </h3>
            )}
            <div className="flex space-x-4">
                {links.map((item) => (
                    <a
                        key={item.label}
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-gray-400 hover:text-gray-900 transition-colors transform hover:-translate-y-1"
                    >
                        <span className="sr-only">{item.label}</span>
                        <item.icon className="h-6 w-6" />
                    </a>
                ))}
            </div>
        </div>
    );
}
