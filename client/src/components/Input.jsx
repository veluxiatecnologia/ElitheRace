import React, { useState } from 'react';
import './Input.css';

/**
 * Input - Modern input field with floating label, icons, and validation states
 * @param {Object} props
 * @param {string} props.label - Input label
 * @param {string} props.type - Input type (text, email, password, etc.)
 * @param {string} props.value - Input value
 * @param {Function} props.onChange - Change handler
 * @param {string} props.placeholder - Placeholder text
 * @param {string} props.error - Error message
 * @param {string} props.helperText - Helper text below input
 * @param {React.ReactNode} props.icon - Icon element (emoji or component)
 * @param {boolean} props.required - Mark as required
 * @param {boolean} props.disabled - Disable input
 * @param {string} props.name - Input name attribute
 * @param {string} props.className - Additional CSS classes
 */
const Input = ({
    label,
    type = 'text',
    value,
    onChange,
    placeholder = '',
    error,
    helperText,
    icon,
    required = false,
    disabled = false,
    name,
    className = '',
    ...rest
}) => {
    const [isFocused, setIsFocused] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const hasValue = value && value.length > 0;
    const isFloating = isFocused || hasValue;

    const inputClasses = [
        'modern-input-wrapper',
        error ? 'modern-input-error' : '',
        disabled ? 'modern-input-disabled' : '',
        icon ? 'modern-input-with-icon' : '',
        className
    ].filter(Boolean).join(' ');

    const actualType = (type === 'password' && showPassword) ? 'text' : type;

    return (
        <div className={inputClasses}>
            <div className="modern-input-container">
                {icon && <span className="modern-input-icon">{icon}</span>}

                <input
                    type={actualType}
                    value={value}
                    onChange={onChange}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    placeholder={isFloating ? placeholder : ''}
                    disabled={disabled}
                    name={name}
                    className="modern-input-field"
                    {...rest}
                />

                {label && (
                    <label className={`modern-input-label ${isFloating ? 'modern-input-label-floating' : ''}`}>
                        {label}
                        {required && <span className="modern-input-required">*</span>}
                    </label>
                )}

                {type === 'password' && (
                    <button
                        type="button"
                        className="modern-input-toggle-password"
                        onClick={() => setShowPassword(!showPassword)}
                        tabIndex={-1}
                    >
                        {showPassword ? '👁️' : '👁️‍🗨️'}
                    </button>
                )}
            </div>

            {error && (
                <span className="modern-input-error-text animate-shake">
                    {error}
                </span>
            )}

            {!error && helperText && (
                <span className="modern-input-helper-text">
                    {helperText}
                </span>
            )}
        </div>
    );
};

export default Input;
