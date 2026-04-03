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
            --radius: ${vars.radius};
        }
        
        body {
            background-color: var(--background);
            color: var(--foreground);
        }
    `;
};
