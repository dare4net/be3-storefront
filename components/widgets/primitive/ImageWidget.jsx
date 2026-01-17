import React from 'react';

export default function ImageWidget({ config }) {
    if (!config.url) return null;

    return (
        <div className="w-full">
            <figure className="relative">
                <img
                    src={config.url}
                    alt={config.alt || ''}
                    className="w-full h-auto rounded-lg object-cover"
                />
                {config.caption && (
                    <figcaption className="text-center text-sm text-gray-500 mt-2">
                        {config.caption}
                    </figcaption>
                )}
            </figure>
        </div>
    );
}
