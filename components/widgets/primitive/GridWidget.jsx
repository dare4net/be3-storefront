import React from 'react';

export default function GridWidget({ config = {}, children }) {
    const validChildren = React.Children.toArray(children).filter(Boolean);
    if (validChildren.length === 0) return null;

    const {
        columnCount = 3,
        mobileColumnCount = 1,
        rowCount = 1,
        gap = 16,
        backgroundColor = 'transparent',
        padding = '0',
    } = config;

    return (
        <div
            style={{
                backgroundColor,
                padding,
                display: 'grid',
                gap: `${gap}px`,
                gridTemplateRows: `repeat(${rowCount}, auto)`,
            }}
            className="w-full grid-container"
        >
            <style jsx>{`
                .grid-container {
                    grid-template-columns: repeat(${columnCount}, 1fr);
                }
                @media (max-width: 768px) {
                    .grid-container {
                        grid-template-columns: repeat(${mobileColumnCount}, 1fr);
                    }
                }
            `}</style>
            {children}
        </div>
    );
}
