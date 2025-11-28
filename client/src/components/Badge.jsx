import React from 'react';
import './Badge.css';

/**
 * Badge - Modern badge/tag component for status, labels, and notifications
 * @param {Object} props
 * @param {React.ReactNode} props.children - Badge content
 * @param {'default'|'success'|'warning'|'error'|'info'|'gold'} props.variant - Badge color variant
 * @param {'small'|'medium'|'large'} props.size - Badge size
 * @param {boolean} props.dot - Show as a dot indicator
 * @param {boolean} props.pulse - Add pulse animation
 * @param {string} props.icon - Optional icon (emoji)
 * @param {string} props.className - Additional CSS classes
 */
const Badge = ({
    children,
    variant = 'default',
    size = 'medium',
    dot = false,
    pulse = false,
    icon,
    className = ''
}) => {
    const badgeClasses = [
        'modern-badge',
        `modern-badge-${variant}`,
        `modern-badge-${size}`,
        dot ? 'modern-badge-dot' : '',
        pulse ? 'animate-pulse' : '',
        className
    ].filter(Boolean).join(' ');

    if (dot) {
        return <span className={badgeClasses}></span>;
    }

    return (
        <span className={badgeClasses}>
            {icon && <span className="modern-badge-icon">{icon}</span>}
            {children}
        </span>
    );
};

export default Badge;
