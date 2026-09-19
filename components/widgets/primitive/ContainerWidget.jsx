import React from 'react';

export default function ContainerWidget({ config = {}, children }) {
    const validChildren = React.Children.toArray(children).filter(Boolean);
    if (validChildren.length === 0 && (!config.backgroundColor || config.backgroundColor === 'transparent') && !config.minHeight) {
        return null;
    }
    const isFullWidth = config.width === 'full';

    // Container styles
    const styles = {
        padding: config.padding || '0',
        backgroundColor: config.backgroundColor || 'transparent',
    };

    return (
        <div style={{ backgroundColor: styles.backgroundColor }}>
            <div
                className={`mx-auto ${isFullWidth ? 'w-full' : 'container px-4'}`}
                style={{ padding: styles.padding }}
            >
                {/* Render nested children here */}
                {children}
            </div>
        </div>
    );
}
