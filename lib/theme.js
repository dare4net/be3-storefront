function hexToRgb(hex) {
    if (!hex || typeof hex !== 'string') return '37, 99, 235';
    let clean = hex.replace('#', '').trim();
    if (clean.length === 3) {
        clean = clean.split('').map(c => c + c).join('');
    }
    if (clean.length !== 6) return '37, 99, 235';
    const num = parseInt(clean, 16);
    return `${(num >> 16) & 255}, ${(num >> 8) & 255}, ${num & 255}`;
}

export const generateThemeVariables = (theme) => {
    const vars = (theme && theme.variables) || {};

    const primary = vars.primary || vars.buttonPrimaryBg || '#2563eb';
    const primaryHover = vars.primaryHover || '#1d4ed8';
    const primaryContent = vars.primaryContent || vars.buttonPrimaryText || '#ffffff';
    const primaryRgb = hexToRgb(primary);

    const secondary = vars.secondary || '#4b5563';
    const accent = vars.accent || '#f59e0b';
    const accentSoft = vars.accentSoft || `rgba(${primaryRgb}, 0.1)`;
    const accentContent = vars.accentContent || primary;

    const buttonPrimaryBg = vars.buttonPrimaryBg || primary;
    const buttonPrimaryText = vars.buttonPrimaryText || primaryContent;
    const buttonSecondaryBg = vars.buttonSecondaryBg || `rgba(${primaryRgb}, 0.08)`;
    const buttonSecondaryText = vars.buttonSecondaryText || primary;

    const background = vars.background || '#ffffff';
    const foreground = vars.text || '#0f172a';
    const radius = vars.radius || '0.5rem';
    const buttonRadius = vars.buttonRadius || radius;
    const cardBg = vars.cardBg || '#ffffff';
    const cardRadius = vars.cardRadius || radius;
    const border = vars.border || '#e2e8f0';

    return `
        :root {
            --primary: ${primary};
            --primary-rgb: ${primaryRgb};
            --primary-hover: ${primaryHover};
            --primary-content: ${primaryContent};
            --primary-foreground: ${primaryContent};
            --secondary: ${secondary};
            --accent: ${accent};
            --accent-soft: ${accentSoft};
            --accent-content: ${accentContent};
            --btn-primary-bg: ${buttonPrimaryBg};
            --btn-primary-text: ${buttonPrimaryText};
            --btn-secondary-bg: ${buttonSecondaryBg};
            --btn-secondary-text: ${buttonSecondaryText};
            --background: ${background};
            --foreground: ${foreground};
            --radius: ${radius};
            --btn-radius: ${buttonRadius};
            --card-bg: ${cardBg};
            --card-radius: ${cardRadius};
            --border: ${border};
        }
        
        body {
            background-color: var(--background);
            color: var(--foreground);
        }

        /* Direct Theme Utility Classes */
        .btn-theme-primary,
        .btn-primary {
            background-color: var(--btn-primary-bg, var(--primary)) !important;
            color: var(--btn-primary-text, var(--primary-foreground, #ffffff)) !important;
        }

        .btn-theme-primary:hover,
        .btn-primary:hover {
            background-color: var(--primary-hover, var(--primary)) !important;
            filter: brightness(0.92);
        }

        .btn-theme-secondary,
        .btn-secondary {
            background-color: var(--btn-secondary-bg, rgba(${primaryRgb}, 0.08)) !important;
            color: var(--btn-secondary-text, var(--primary)) !important;
        }

        .bg-theme-primary,
        .bg-primary {
            background-color: var(--primary) !important;
        }

        .text-theme-primary,
        .text-primary,
        .theme-price {
            color: var(--primary) !important;
        }

        .border-theme-primary,
        .border-primary {
            border-color: var(--primary) !important;
        }

        .badge-theme {
            background-color: var(--accent-soft, rgba(${primaryRgb}, 0.1)) !important;
            color: var(--primary) !important;
        }

        .card-theme {
            background-color: var(--card-bg, #ffffff) !important;
            border-radius: var(--card-radius, 0.75rem) !important;
            border-color: var(--border, #e2e8f0) !important;
        }

        /* Seamless Tailwind Auto-Conformance (Forces legacy/hardcoded components to obey the layout theme) */
        .bg-blue-600,
        .bg-blue-500 {
            background-color: var(--primary) !important;
        }
        .hover\\:bg-blue-700:hover,
        .hover\\:bg-blue-600:hover {
            background-color: var(--primary-hover, var(--primary)) !important;
        }
        .text-blue-600,
        .text-blue-700,
        .text-blue-500 {
            color: var(--primary) !important;
        }
        .hover\\:text-blue-600:hover,
        .hover\\:text-blue-700:hover,
        .group:hover .group-hover\\:text-blue-600,
        .group:hover .group-hover\\:text-blue-700 {
            color: var(--primary-hover, var(--primary)) !important;
        }
        .border-blue-600,
        .border-blue-500 {
            border-color: var(--primary) !important;
        }
        .bg-blue-50,
        .bg-blue-100 {
            background-color: var(--accent-soft, rgba(${primaryRgb}, 0.1)) !important;
        }
        .border-blue-100,
        .border-blue-200 {
            border-color: rgba(${primaryRgb}, 0.2) !important;
        }
        .ring-blue-500,
        .focus\\:ring-blue-500:focus {
            --tw-ring-color: var(--primary) !important;
        }
    `;
};

