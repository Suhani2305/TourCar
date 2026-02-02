import React, { useState, useEffect } from 'react';
import { documentAPI, STORAGE_URL } from '../utils/api';
import { toast } from 'react-toastify';
import ConfirmationModal from '../components/ConfirmationModal';
import '../styles/DocumentVault.css';

const DUAL_SIDE_CATEGORIES = ['dl', 'rc'];

const DOCUMENT_CATEGORIES = [
    { value: 'dl', label: '🪪 Driving License' },
    { value: 'rc', label: '📄 Registration (RC)' },
    { value: 'insurance', label: '🛡️ Insurance' },
    { value: 'permit', label: '🛂 Permit' },
    { value: 'pollution', label: '🌱 Pollution (PUC)' },
    { value: 'other', label: '📂 Other' }
];

const DocumentVault = () => {
    const [documents, setDocuments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [uploading, setUploading] = useState(false);

    // Delete Confirmation Modal State
    const [deleteModal, setDeleteModal] = useState({
        isOpen: false,
        documentId: null
    });



    const [formData, setFormData] = useState({
        name: '',
        category: 'dl',
        documentUrlFront: '',
        documentUrlBack: '',
        expiryDate: '',
        notes: ''
    });

    useEffect(() => {
        fetchDocs();
    }, []);

    const fetchDocs = async () => {
        try {
            setLoading(true);
            const res = await documentAPI.getAll();
            setDocuments(res.data.documents);
        } catch (error) {
            toast.error('Failed to fetch documents');
        } finally {
            setLoading(false);
        }
    };

    const onSelectFile = async (e, side) => {
        if (e.target.files && e.target.files.length > 0) {
            const file = e.target.files[0];

            const uploadData = new FormData();
            uploadData.append('image', file);

            try {
                setUploading(true);
                const res = await documentAPI.uploadImage(uploadData);
                if (side === 'front') {
                    setFormData({ ...formData, documentUrlFront: res.data.url });
                    toast.success('Front photo uploaded');
                } else {
                    setFormData({ ...formData, documentUrlBack: res.data.url });
                    toast.success('Back photo uploaded');
                }
            } catch (error) {
                toast.error('Upload failed');
            } finally {
                setUploading(false);
            }
        }
    };



    const handleSubmit = async (e) => {
        e.preventDefault();

        // Mandatory checks
        if (!formData.documentUrlFront) {
            toast.error('Front image is mandatory');
            return;
        }

        if (DUAL_SIDE_CATEGORIES.includes(formData.category) && !formData.documentUrlBack) {
            toast.error('Back image is mandatory for this document type');
            return;
        }

        try {
            await documentAPI.create(formData);
            toast.success('Document saved to vault');
            setShowModal(false);
            setFormData({
                name: '',
                category: 'dl',
                documentUrlFront: '',
                documentUrlBack: '',
                expiryDate: '',
                notes: ''
            });
            fetchDocs();
        } catch (error) {
            toast.error('Failed to save document');
        }
    };

    const handleDelete = async () => {
        try {
            await documentAPI.delete(deleteModal.documentId);
            toast.success('Document deleted');
            setDeleteModal({ isOpen: false, documentId: null });
            fetchDocs();
        } catch (error) {
            toast.error('Failed to delete');
        }
    };



    return (
        <div className="main-container">
            <div className="premium-header">
                <h1 className="premium-title">DOCUMENT <span className="accent">VAULT</span></h1>
                <p className="premium-tagline">KEEP YOUR RC, DL AND INSURANCE PHOTOS SAFE</p>
                <div className="premium-underline"></div>
            </div>

            <div className="controls-strip">
                <div className="controls-left">
                    <div className="summary-pill">
                        Total Docs: <strong>{documents.length}</strong>
                    </div>
                </div>
                <div className="controls-right">
                    <button className="btn-premium-add" onClick={() => setShowModal(true)}>
                        + UPLOAD NEW DOC
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="loader-container">
                    <div className="loader">Opening vault...</div>
                </div>
            ) : (
                <div className="vault-grid">
                    {documents.length === 0 ? (
                        <div className="no-data-card">
                            <div className="no-data-icon">📂</div>
                            <h3>Vault is Empty</h3>
                            <p>Upload your important documents like RC, DL, and Insurance photos here.</p>
                        </div>
                    ) : (
                        documents.map(doc => (
                            <div key={doc._id} className="doc-card">
                                <div className="doc-type-badge">
                                    {DOCUMENT_CATEGORIES.find(c => c.value === doc.category)?.label.split(' ')[0]}
                                </div>
                                <div className="doc-preview-area">
                                    <img src={`${STORAGE_URL}${doc.documentUrlFront}`} alt={doc.name} />
                                    {doc.documentUrlBack && (
                                        <div className="dual-side-indicator">Dual Side</div>
                                    )}
                                </div>
                                <div className="doc-details">
                                    <h3>{doc.name}</h3>
                                    <p className="doc-category-name">{DOCUMENT_CATEGORIES.find(c => c.value === doc.category)?.label.split(' ').slice(1).join(' ')}</p>
                                    {doc.expiryDate && (
                                        <div className={`expiry-tag ${new Date(doc.expiryDate) < new Date() ? 'expired' : ''}`}>
                                            📅 {new Date(doc.expiryDate).toLocaleDateString()}
                                        </div>
                                    )}
                                </div>
                                <div className="doc-actions-overlay">
                                    <a href={`${STORAGE_URL}${doc.documentUrlFront}`} target="_blank" rel="noopener noreferrer" className="btn-icon-view" title="View Front">🖼️</a>
                                    {doc.documentUrlBack && (
                                        <a href={`${STORAGE_URL}${doc.documentUrlBack}`} target="_blank" rel="noopener noreferrer" className="btn-icon-view" title="View Back">🔙</a>
                                    )}
                                    <button onClick={() => setDeleteModal({ isOpen: true, documentId: doc._id })} className="btn-icon-delete" title="Delete">🗑️</button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}

            {/* Premium Delete Confirmation Modal */}
            <ConfirmationModal
                isOpen={deleteModal.isOpen}
                title="Delete Document"
                message="Are you sure you want to permanently remove this document from your vault? This action cannot be undone."
                onConfirm={handleDelete}
                onCancel={() => setDeleteModal({ isOpen: false, documentId: null })}
                type="danger"
                confirmText="Delete"
                cancelText="Cancel"
            />

            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal-content modal-large" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Upload to Vault</h2>
                            <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
                        </div>
                        <form onSubmit={handleSubmit} className="modal-form">
                            <div className="form-section">
                                <h3>Document Identity</h3>
                                <div className="form-row">
                                    <div className="form-group">
                                        <label>Document Name *</label>
                                        <input
                                            type="text"
                                            required
                                            value={formData.name}
                                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                                            placeholder="e.g. My Driving License"
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Category *</label>
                                        <select
                                            value={formData.category}
                                            onChange={e => setFormData({ ...formData, category: e.target.value, documentUrlBack: '' })}
                                            className="premium-select"
                                        >
                                            {DOCUMENT_CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                                        </select>
                                    </div>
                                </div>
                            </div>

                            <div className="form-section">
                                <h3>Upload Photos (Gallery)</h3>
                                <div className="form-row">
                                    <div className="form-group">
                                        <label>Front Side {uploading ? '(Uploading...)' : '*'}</label>
                                        <div className="upload-preview-box">
                                            {formData.documentUrlFront ? (
                                                <div className="preview-container">
                                                    <img src={`${STORAGE_URL}${formData.documentUrlFront}`} alt="Front Preview" />
                                                    <button type="button" className="remove-photo" onClick={() => setFormData({ ...formData, documentUrlFront: '' })}>✕</button>
                                                </div>
                                            ) : (
                                                <label className="file-upload-label">
                                                    <input
                                                        type="file"
                                                        accept="image/*"
                                                        onChange={(e) => onSelectFile(e, 'front')}
                                                        style={{ display: 'none' }}
                                                    />
                                                    <div className="upload-placeholder">
                                                        <span>📷</span>
                                                        <p>Select Front Photo</p>
                                                    </div>
                                                </label>
                                            )}
                                        </div>
                                    </div>

                                    {(DUAL_SIDE_CATEGORIES.includes(formData.category)) && (
                                        <div className="form-group">
                                            <label>Back Side {uploading ? '(Uploading...)' : '*'}</label>
                                            <div className="upload-preview-box">
                                                {formData.documentUrlBack ? (
                                                    <div className="preview-container">
                                                        <img src={`${STORAGE_URL}${formData.documentUrlBack}`} alt="Back Preview" />
                                                        <button type="button" className="remove-photo" onClick={() => setFormData({ ...formData, documentUrlBack: '' })}>✕</button>
                                                    </div>
                                                ) : (
                                                    <label className="file-upload-label">
                                                        <input
                                                            type="file"
                                                            accept="image/*"
                                                            onChange={(e) => onSelectFile(e, 'back')}
                                                            style={{ display: 'none' }}
                                                        />
                                                        <div className="upload-placeholder">
                                                            <span>🔙</span>
                                                            <p>Select Back Photo</p>
                                                        </div>
                                                    </label>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div className="form-section">
                                <h3>Additional Info</h3>
                                <div className="form-row">
                                    <div className="form-group">
                                        <label>Expiry Date (if any)</label>
                                        <input
                                            type="date"
                                            value={formData.expiryDate}
                                            onChange={e => setFormData({ ...formData, expiryDate: e.target.value })}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Notes</label>
                                        <textarea
                                            value={formData.notes}
                                            onChange={e => setFormData({ ...formData, notes: e.target.value })}
                                            placeholder="Any notes..."
                                            rows="1"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="modal-actions">
                                <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary">
                                    Cancel
                                </button>
                                <button type="submit" className="btn btn-primary" disabled={uploading}>
                                    {uploading ? 'Processing Image...' : 'Save Document'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DocumentVault;
