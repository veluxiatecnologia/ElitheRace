import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import './Modal.css';

const Modal = ({
    isOpen,
    onClose,
    title,
    children,
    footer,
    size = 'md', // sm, md, lg, xl, full
    closeOnOverlayClick = true
}) => {
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    if (!isOpen) return null;

    const handleOverlayClick = (e) => {
        if (closeOnOverlayClick && e.target === e.currentTarget) {
            onClose();
        }
    };

    return createPortal(
        <div className="modal-overlay" onClick={handleOverlayClick}>
            <div className={`modal-container modal-${size}`}>
                <div className="modal-header">
                    <h3 className="modal-title">{title}</h3>
                    <button className="modal-close" onClick={onClose} aria-label="Fechar">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <line x1="18" y1="6" x2="6" y2="18"></line>
                            <line x1="6" y1="6" x2="18" y2="18"></line>
                        </svg>
                    </button>
                </div>

                <div className="modal-content">
                    {children}
                </div>

                {footer && (
                    <div className="modal-footer">
                        {footer}
                    </div>
                )}
            </div>
        </div>,
        document.body
    );
};

export default Modal;
