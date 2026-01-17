import { useEffect, useRef } from "react";

// Custom HTML Widget - For advanced users
export default function CustomHTMLWidget({ config }) {
    const { html = '' } = config;
    const containerRef = useRef(null);

    useEffect(() => {
        if (!html || !containerRef.current) return;

        // 1. Render HTML
        const container = containerRef.current;

        // 2. Find scripts that need execution
        // Browsers don't execute <script> tags inserted via innerHTML
        const scripts = container.querySelectorAll("script");

        scripts.forEach((oldScript) => {
            const newScript = document.createElement("script");

            // Copy attributes (src, type, async, etc.)
            Array.from(oldScript.attributes).forEach((attr) => {
                newScript.setAttribute(attr.name, attr.value);
            });

            // Copy content
            newScript.appendChild(document.createTextNode(oldScript.innerHTML));

            // Replace old script with new one to trigger execution
            oldScript.parentNode.replaceChild(newScript, oldScript);
        });

    }, [html]);

    if (!html) return null;

    return (
        <section className="py-8">
            <div className="container mx-auto px-4">
                <div
                    ref={containerRef}
                    dangerouslySetInnerHTML={{ __html: html }}
                />
            </div>
        </section>
    );
}
