import React from 'react';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';

/**
 * Simple wrapper component for react-loading-skeleton.
 * Allows specifying width, height and optional count.
 */
const LoadingSkeleton = ({ width = '100%', height = 20, count = 1, style = {} }) => {
    const items = [];
    for (let i = 0; i < count; i++) {
        items.push(
            <Skeleton
                key={i}
                width={width}
                height={height}
                style={{ marginBottom: 8, ...style }}
            />
        );
    }
    return <>{items}</>;
};

export default LoadingSkeleton;
