'use client';

import { useEffect } from 'react';

export default function DynamicMetaTags({ meta, tenant }) {
    useEffect(() => {
        if (!meta || typeof document === 'undefined') return;

        // Update document title
        document.title = `${meta.title}${tenant ? ` | ${tenant.name}` : ''}`;

        // Helper to set meta tag
        const setMetaTag = (property, content, isProperty = false) => {
            if (!content) return;

            const attribute = isProperty ? 'property' : 'name';
            let metaTag = document.querySelector(`meta[${attribute}="${property}"]`);

            if (!metaTag) {
                metaTag = document.createElement('meta');
                metaTag.setAttribute(attribute, property);
                document.head.appendChild(metaTag);
            }

            metaTag.setAttribute('content', content);
        };

        // Helper to set link tag
        const setLinkTag = (rel, href) => {
            if (!href) return;

            let link = document.querySelector(`link[rel="${rel}"]`);

            if (!link) {
                link = document.createElement('link');
                link.setAttribute('rel', rel);
                document.head.appendChild(link);
            }

            link.setAttribute('href', href);
        };

        // Basic SEO
        setMetaTag('description', meta.meta_description);
        setMetaTag('robots', meta.robots || 'index,follow');

        // Canonical URL
        if (meta.canonical_url) {
            setLinkTag('canonical', meta.canonical_url);
        }

        // Open Graph
        setMetaTag('og:title', meta.og_title || meta.title, true);
        setMetaTag('og:description', meta.og_description || meta.meta_description, true);
        setMetaTag('og:type', meta.og_type || 'website', true);
        if (meta.og_image) {
            setMetaTag('og:image', meta.og_image, true);
            setMetaTag('og:image:width', '1200', true);
            setMetaTag('og:image:height', '630', true);
        }

        // Twitter Card
        setMetaTag('twitter:card', meta.twitter_card || 'summary_large_image');
        setMetaTag('twitter:title', meta.twitter_title || meta.og_title || meta.title);
        setMetaTag('twitter:description', meta.twitter_description || meta.og_description || meta.meta_description);
        if (meta.twitter_image || meta.og_image) {
            setMetaTag('twitter:image', meta.twitter_image || meta.og_image);
        }

        // Structured Data (JSON-LD)
        if (meta.structured_data) {
            let script = document.querySelector('script[type="application/ld+json"]#page-structured-data');

            if (!script) {
                script = document.createElement('script');
                script.type = 'application/ld+json';
                script.id = 'page-structured-data';
                document.head.appendChild(script);
            }

            script.textContent = JSON.stringify(meta.structured_data);
        }

    }, [meta, tenant]);

    return null; // This component only manages head tags
}
