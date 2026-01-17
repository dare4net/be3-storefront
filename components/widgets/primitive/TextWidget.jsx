import React from 'react';

export default function TextWidget({ config }) {
    const style = {
        fontSize: config.size || '1rem',
        color: config.color || 'inherit'
    };

    return (
        <div
            className="prose prose-lg max-w-none text-gray-600 leading-relaxed"
            style={style}
            dangerouslySetInnerHTML={{ __html: config.content || '' }}
        />
    );
}
