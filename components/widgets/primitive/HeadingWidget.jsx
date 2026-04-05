import React from 'react';

export default function HeadingWidget({ config }) {
    const Tag = config.tag || 'h2';
    const alignClass = {
        left: 'text-left',
        center: 'text-center',
        right: 'text-right'
    }[config.align || 'left'];

    const fontSizes = {
        h1: 'clamp(2rem, 1.5rem + 2.5vw, 4.5rem)',
        h2: 'clamp(1.75rem, 1.25rem + 2vw, 3.5rem)',
        h3: 'clamp(1.5rem, 1rem + 1.5vw, 2.5rem)',
        h4: 'clamp(1.25rem, 0.9rem + 1vw, 2rem)',
        h5: '1.125rem',
        h6: '1rem'
    };

    return (
        <Tag 
            className={`${alignClass} font-bold mb-5 text-gray-900`}
            style={{ fontSize: fontSizes[Tag] }}
        >
            {config.text || 'Heading'}
        </Tag>
    );
}
