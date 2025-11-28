import React from 'react';
import './FormCard.css';

/**
 * FormCard - Modern glassmorphism container for forms
 * @param {Object} props
 * @param {React.ReactNode} props.children - Content to render inside the card
 * @param {string} props.title - Optional title for the card
 * @param {string} props.subtitle - Optional subtitle
 * @param {string} props.className - Additional CSS classes
 * @param {boolean} props.centered - Center the card on the page
 * @param {number} props.maxWidth - Maximum width in pixels (default: 450)
 */
const FormCard = ({
    children,
    title,
    subtitle,
    className = '',
    centered = true,
    maxWidth = 450
}) => {
    const cardClasses = `form-card ${centered ? 'form-card-centered' : ''} ${className}`;

    return (
        <div className={cardClasses} style={{ maxWidth: `${maxWidth}px` }}>
            {(title || subtitle) && (
                <div className="form-card-header">
                    {title && <h2 className="form-card-title">{title}</h2>}
                    {subtitle && <p className="form-card-subtitle">{subtitle}</p>}
                </div>
            )}
            <div className="form-card-content">
                {children}
            </div>
        </div>
    );
};

export default FormCard;
