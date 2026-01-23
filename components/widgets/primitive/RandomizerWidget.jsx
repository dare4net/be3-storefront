'use client';

import React, { useMemo } from 'react';

/**
 * RandomizerWidget
 * A logic-based container that selects a random subset of its children to display.
 */
export default function RandomizerWidget({ config = {}, children }) {
    const {
        minDisplay = 1,
        maxDisplay = 3,
        // Optional: Could add session-stable randomization later if needed
    } = config;

    const displayedChildren = useMemo(() => {
        if (!children || !Array.isArray(children)) return children;

        // Convert children to a flat array if it's a single child
        const childrenArray = React.Children.toArray(children);

        if (childrenArray.length === 0) return [];

        // Shuffle the array
        const shuffled = [...childrenArray].sort(() => 0.5 - Math.random());

        // Determine how many to show
        const min = Math.max(1, parseInt(minDisplay));
        const max = Math.max(min, parseInt(maxDisplay));
        const countToShow = Math.floor(Math.random() * (max - min + 1)) + min;

        // Slice and return
        return shuffled.slice(0, countToShow);
    }, [children, minDisplay, maxDisplay]);

    return (
        <>
            {displayedChildren}
        </>
    );
}
