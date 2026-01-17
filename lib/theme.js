export const generateThemeVariables = (theme) => {
    if (!theme || !theme.variables) return '';

    const vars = theme.variables;
    return `
        :root {
            --primary: ${vars.primary};
            --secondary: ${vars.secondary};
            --accent: ${vars.accent};
            --background: ${vars.background};
            --foreground: ${vars.text};
            --font-heading: ${vars.font_heading}, sans-serif;
            --font-body: ${vars.font_body}, sans-serif;
            --radius: ${vars.radius};
        }
        
        body {
            background-color: var(--background);
            color: var(--foreground);
            font-family: var(--font-body);
        }

        h1, h2, h3, h4, h5, h6 {
            font-family: var(--font-heading);
        }
    `;
};
