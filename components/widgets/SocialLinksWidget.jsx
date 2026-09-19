"use client";

import { Facebook, Twitter, Instagram, Linkedin, Youtube } from 'lucide-react';

// SVG icons for platforms not in lucide-react
const TikTokIcon = (props) => (
    <svg {...props} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
        <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.27 6.27 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.69a8.18 8.18 0 004.79 1.54V6.78a4.85 4.85 0 01-1.02-.09z"/>
    </svg>
);

const PinterestIcon = (props) => (
    <svg {...props} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
        <path d="M12 0C5.373 0 0 5.372 0 12c0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738a.36.36 0 01.083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.632-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0z"/>
    </svg>
);

const WhatsAppIcon = (props) => (
    <svg {...props} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
    </svg>
);

const SnapchatIcon = (props) => (
    <svg {...props} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
        <path d="M12.206.793c.99 0 4.347.276 5.93 3.821.529 1.193.403 3.219.299 4.847l-.003.06c-.012.18-.022.345-.03.51.07.03.195.08.391.08.246-.014.579-.095.968-.302a1.45 1.45 0 01.644-.166c.176 0 .348.051.497.155.52.358.52.805.52.818 0 .568-.388.818-1.02 1.054-.14.054-.306.116-.501.188-.21.079-.481.177-.695.354a.67.67 0 00-.244.499c-.047.447.063.965.386 1.596.47.899 1.652 2.441 3.954 2.873.158.03.261.165.261.33 0 .027-.005.054-.014.08a1.565 1.565 0 01-.62.774c-.326.197-.798.327-1.406.384-.268.025-.543.038-.818.038-.289 0-.544-.014-.8-.04-.254-.026-.508-.065-.765-.117-.358-.072-.722-.11-1.093-.11-.374 0-.734.04-1.088.12-.354.08-.695.206-1.015.377-.506.27-1.07.407-1.671.407-.601 0-1.165-.137-1.669-.407-.32-.17-.661-.297-1.015-.377-.354-.08-.714-.12-1.088-.12-.371 0-.735.038-1.093.11-.257.052-.511.091-.765.117-.256.026-.511.04-.8.04-.275 0-.55-.013-.818-.038-.608-.057-1.08-.187-1.406-.384a1.565 1.565 0 01-.62-.774.23.23 0 01-.014-.08c0-.165.103-.3.261-.33 2.302-.432 3.484-1.974 3.954-2.873.323-.631.433-1.149.386-1.596a.67.67 0 00-.244-.499c-.214-.177-.485-.275-.695-.354a12.26 12.26 0 01-.501-.188C3.387 9.645 3 9.395 3 8.827c0-.013 0-.46.52-.818a1.025 1.025 0 01.497-.155c.207 0 .428.056.644.166.389.207.722.288.968.302.197 0 .323-.048.395-.082l-.033-.573c-.104-1.628-.23-3.654.299-4.847C7.859 1.069 11.216.793 12.206.793z"/>
    </svg>
);

const TelegramIcon = (props) => (
    <svg {...props} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
        <path d="M11.944 0A12 12 0 000 12a12 12 0 0012 12 12 12 0 0012-12A12 12 0 0012 0a12 12 0 00-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 01.171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
    </svg>
);

const PLATFORM_CONFIG = [
    { key: 'facebook',  IconComponent: Facebook,      label: 'Facebook' },
    { key: 'instagram', IconComponent: Instagram,     label: 'Instagram' },
    { key: 'twitter',   IconComponent: Twitter,       label: 'Twitter / X' },
    { key: 'tiktok',    IconComponent: TikTokIcon,    label: 'TikTok' },
    { key: 'youtube',   IconComponent: Youtube,       label: 'YouTube' },
    { key: 'pinterest', IconComponent: PinterestIcon, label: 'Pinterest' },
    { key: 'linkedin',  IconComponent: Linkedin,      label: 'LinkedIn' },
    { key: 'whatsapp',  IconComponent: WhatsAppIcon,  label: 'WhatsApp' },
    { key: 'snapchat',  IconComponent: SnapchatIcon,  label: 'Snapchat' },
    { key: 'telegram',  IconComponent: TelegramIcon,  label: 'Telegram' },
];

export default function SocialLinksWidget({ config }) {
    const {
        title = "Follow Us",
        iconColor = '#9ca3af',
        iconHoverColor = '',
    } = config || {};

    // Only render platforms that have a real URL configured
    const links = PLATFORM_CONFIG
        .map(({ key, IconComponent, label }) => ({
            icon: IconComponent,
            url: config?.[key],
            label,
        }))
        .filter(item => item.url && item.url.trim() !== '' && item.url !== '#');

    if (links.length === 0) return null;

    // Build CSS custom properties for hover effect if a hover color is set
    const hoverStyle = iconHoverColor
        ? `<style>.social-link-item:hover { color: ${iconHoverColor} !important; }</style>`
        : '';

    return (
        <div className="w-full">
            {iconHoverColor && (
                <style>{`.social-link-item:hover { color: ${iconHoverColor} !important; }`}</style>
            )}
            {title && (
                <h3 className="text-sm font-semibold tracking-wider uppercase mb-4" style={{ color: iconColor }}>
                    {title}
                </h3>
            )}
            <div className="flex flex-wrap gap-3">
                {links.map((item) => (
                    <a
                        key={item.label}
                        href={item.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={item.label}
                        className="social-link-item transition-all duration-200 transform hover:-translate-y-1 hover:opacity-90"
                        style={{ color: iconColor }}
                    >
                        <span className="sr-only">{item.label}</span>
                        <item.icon className="h-6 w-6" />
                    </a>
                ))}
            </div>
        </div>
    );
}
