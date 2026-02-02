import React from 'react';
import '../styles/ConfirmationModal.css';

const ConfirmationModal = ({ isOpen, title, message, onConfirm, onCancel, confirmText = 'Confirm', cancelText = 'Cancel', type = 'danger' }) => {
    if (!isOpen) return null;

    return (
        <div className="conf-modal-overlay" onClick={onCancel}>
            <div className="conf-modal-content" onClick={(e) => e.stopPropagation()}>
                <div className={`conf-modal-header ${type}`}>
                    <div className="conf-modal-icon">
                        {type === 'danger' ? '⚠️' : '❓'}
                    </div>
                    <h3>{title}</h3>
                </div>
                <div className="conf-modal-body">
                    <p>{message}</p>
                </div>
                <div className="conf-modal-footer">
                    <button className="btn-cancel" onClick={onCancel}>
                        {cancelText}
                    </button>
                    <button className={`btn-confirm ${type}`} onClick={onConfirm}>
                        {confirmText}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmationModal;
