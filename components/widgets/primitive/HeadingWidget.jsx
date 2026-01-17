import React from 'react';

export default function HeadingWidget({ config }) {
    const Tag = config.tag || 'h2';
    const alignClass = {
        left: 'text-left',
        center: 'text-center',
        right: 'text-right'
    }[config.align || 'left'];

    const sizeClass = {
        h1: 'text-4xl md:text-5xl font-extrabold mb-6',
        h2: 'text-3xl md:text-4xl font-bold mb-5',
        h3: 'text-2xl md:text-3xl font-bold mb-4',
        h4: 'text-xl md:text-2xl font-semibold mb-3',
        h5: 'text-lg font-semibold mb-2',
        h6: 'text-base font-semibold mb-2',
    }[Tag];

    return (
        <Tag className={`${alignClass} ${sizeClass} text-gray-900`}>
            {config.text || 'Heading'}
        </Tag>
    );
}
