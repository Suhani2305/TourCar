import React from 'react';
import '../styles/ConfirmationModal.css';

const ConfirmationModal = ({ isOpen, title, message, onConfirm, onCancel, confirmText = 'Confirm', cancelText = 'Cancel', type = 'danger' }) => {
    if (!isOpen) return null;

    // Icon and color based on type
    const getModalConfig = () => {
        switch (type) {
            case 'danger':
                return {
                    icon: '⚠️',
                    gradient: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a6f 100%)',
                    iconBg: 'rgba(255, 107, 107, 0.15)',
                    iconColor: '#ff6b6b'
                };
            case 'confirm':
                return {
                    icon: '✓',
                    gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                    iconBg: 'rgba(79, 172, 254, 0.15)',
                    iconColor: '#4facfe'
                };
            default:
                return {
                    icon: '❓',
                    gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    iconBg: 'rgba(102, 126, 234, 0.15)',
                    iconColor: '#667eea'
                };
        }
    };

    const config = getModalConfig();

    return (
        <div className="confirmation-modal-overlay" onClick={onCancel}>
            <div className="confirmation-modal-container" onClick={(e) => e.stopPropagation()}>
                {/* Animated Icon Circle */}
                <div
                    className="confirmation-modal-icon-wrapper"
                    style={{ background: config.iconBg }}
                >
                    <div
                        className="confirmation-modal-icon-circle"
                        style={{
                            background: config.gradient,
                            boxShadow: `0 8px 24px ${config.iconColor}40`
                        }}
                    >
                        <span className="confirmation-modal-icon">{config.icon}</span>
                    </div>
                    <div className="confirmation-modal-icon-ripple"></div>
                </div>

                {/* Title */}
                <h2 className="confirmation-modal-title">{title}</h2>

                {/* Message */}
                <p className="confirmation-modal-message">{message}</p>

                {/* Action Buttons */}
                <div className="confirmation-modal-actions">
                    <button
                        className="confirmation-modal-btn confirmation-modal-btn-cancel"
                        onClick={onCancel}
                    >
                        <span className="confirmation-modal-btn-text">{cancelText}</span>
                    </button>
                    <button
                        className={`confirmation-modal-btn confirmation-modal-btn-confirm ${type === 'danger' ? 'danger' : 'primary'}`}
                        onClick={onConfirm}
                        style={type !== 'danger' ? { background: config.gradient } : {}}
                    >
                        <span className="confirmation-modal-btn-text">{confirmText}</span>
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmationModal;
