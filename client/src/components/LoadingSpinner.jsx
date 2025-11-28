import React from 'react';
import './LoadingSpinner.css';

/**
 * LoadingSpinner - Modern loading spinner with customizable size and color
 * @param {Object} props
 * @param {'small'|'medium'|'large'} props.size - Spinner size
 * @param {'gold'|'white'|'red'|'success'} props.color - Spinner color
 * @param {string} props.text - Optional text below spinner
 * @param {boolean} props.fullPage - Show as full-page overlay
 */
const LoadingSpinner = ({
    size = 'medium',
    color = 'gold',
    text,
    fullPage = false
}) => {
    const spinnerClasses = [
        'loading-spinner',
        `loading-spinner-${size}`,
        `loading-spinner-${color}`
    ].join(' ');

    const content = (
        <div className="loading-spinner-container">
            <div className={spinnerClasses}></div>
            {text && <p className="loading-spinner-text">{text}</p>}
        </div>
    );

    if (fullPage) {
        return (
            <div className="loading-spinner-overlay">
                {content}
            </div>
        );
    }

    return content;
};

export default LoadingSpinner;
