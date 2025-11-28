import React from 'react';
import './Button.css';

/**
 * Button - Modern button component with variants and loading states
 * @param {Object} props
 * @param {React.ReactNode} props.children - Button content
 * @param {'primary'|'secondary'|'danger'|'ghost'|'success'} props.variant - Button style variant
 * @param {'small'|'medium'|'large'} props.size - Button size
 * @param {boolean} props.loading - Show loading spinner
 * @param {boolean} props.disabled - Disable button
 * @param {boolean} props.fullWidth - Make button full-width
 * @param {string} props.icon - Optional icon (emoji or element)
 * @param {Function} props.onClick - Click handler
 * @param {string} props.type - Button type (button, submit, reset)
 * @param {string} props.className - Additional CSS classes
 */
const Button = ({
    children,
    variant = 'primary',
    size = 'medium',
    loading = false,
    disabled = false,
    fullWidth = false,
    icon,
    onClick,
    type = 'button',
    className = ''
}) => {
    const buttonClasses = [
        'modern-btn',
        `modern-btn-${variant}`,
        `modern-btn-${size}`,
        fullWidth ? 'modern-btn-full' : '',
        loading ? 'modern-btn-loading' : '',
        className
    ].filter(Boolean).join(' ');

    return (
        <button
            type={type}
            className={buttonClasses}
            onClick={onClick}
            disabled={disabled || loading}
        >
            {loading && <span className="modern-btn-spinner"></span>}
            {!loading && icon && <span className="modern-btn-icon">{icon}</span>}
            <span className="modern-btn-text">{children}</span>
        </button>
    );
};

export default Button;
