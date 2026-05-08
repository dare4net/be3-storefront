'use client';
import { useEffect, useState } from 'react';

export default function HeaderSpacer() {
    const [height, setHeight] = useState(0);

    useEffect(() => {
        const header = document.querySelector('header');
        if (!header) return;

        // Set initial height
        setHeight(header.offsetHeight);

        // Update whenever header resizes (scroll collapse, mobile/desktop switch)
        const observer = new ResizeObserver(([entry]) => {
            setHeight(entry.contentRect.height);
        });

        observer.observe(header);
        return () => observer.disconnect();
    }, []);

    return <div style={{ height }} aria-hidden="true" />;
}