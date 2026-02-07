import React, { useState, useEffect } from 'react';
import { expenseAPI, vehicleAPI } from '../utils/api';
import { toast } from 'react-toastify';
import ConfirmationModal from '../components/ConfirmationModal';
import '../styles/Expenses.css';

const Expenses = () => {
    const [expenses, setExpenses] = useState([]);
    const [vehicles, setVehicles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    // Delete Confirmation Modal State
    const [deleteModal, setDeleteModal] = useState({
        isOpen: false,
        expenseId: null
    });
    const [formData, setFormData] = useState({
        type: 'fuel',
        amount: '',
        date: new Date().toISOString().split('T')[0],
        vehicle: '',
        booking: '',
        description: ''
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [expRes, vehRes] = await Promise.all([
                expenseAPI.getAll(),
                vehicleAPI.getAll()
            ]);
            setExpenses(expRes.data.expenses);
            setVehicles(vehRes.data.vehicles);
        } catch (error) {
            toast.error('Failed to fetch data');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await expenseAPI.create(formData);
            toast.success('Expense added successfully');
            setShowModal(false);
            setFormData({
                type: 'fuel',
                amount: '',
                date: new Date().toISOString().split('T')[0],
                vehicle: '',
                booking: '',
                description: ''
            });
            fetchData();
        } catch (error) {
            toast.error('Failed to add expense');
        }
    };

    const handleDelete = async () => {
        try {
            await expenseAPI.delete(deleteModal.expenseId);
            toast.success('Expense deleted');
            setDeleteModal({ isOpen: false, expenseId: null });
            fetchData();
        } catch (error) {
            toast.error('Failed to delete');
        }
    };

    const expenseTypes = [
        { value: 'fuel', label: '⛽ Fuel' },
        { value: 'toll', label: '🛣️ Toll' },
        { value: 'parking', label: '🅿️ Parking' },
        { value: 'maintenance', label: '🔧 Maintenance' },
        { value: 'food', label: '🍔 Food' },
        { value: 'other', label: '📝 Other' }
    ];

    return (
        <div className="main-container">
            <div className="premium-header">
                <h1 className="premium-title">EXPENSE <span className="accent">TRACKER</span></h1>
                <p className="premium-tagline">LOG YOUR FUEL, TOLL AND MAINTENANCE COSTS</p>
                <div className="premium-underline"></div>
            </div>

            <div className="controls-strip">
                <div className="controls-left">
                    <div className="expense-summary-mini">
                        Total: <strong>₹{expenses.reduce((sum, e) => sum + e.amount, 0)}</strong>
                    </div>
                </div>
                <div className="controls-right">
                    <button className="btn-premium-add" onClick={() => setShowModal(true)}>
                        + ADD EXPENSE
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="loader">Loading expenses...</div>
            ) : (
                expenses.length === 0 ? (
                    <div className="empty-state-container">
                        <div className="empty-state-content">
                            <div className="empty-state-icon-wrapper">
                                <span className="empty-icon">💸</span>
                                <div className="icon-pulse"></div>
                            </div>
                            <h2 className="empty-title">No Expenses Yet</h2>
                            <p className="empty-text">
                                Your expense ledger is clear. Keep it this way or log your first maintenance or fuel cost to keep track of your fleet's profitability.
                            </p>
                            <div className="empty-actions">
                                <button
                                    className="btn-premium-add"
                                    onClick={() => setShowModal(true)}
                                >
                                    + LOG FIRST EXPENSE
                                </button>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="expense-list-grid">
                        {expenses.map(exp => (
                            <div key={exp._id} className="expense-card">
                                <div className="expense-tag">{exp.type.toUpperCase()}</div>
                                <div className="expense-amount">₹{exp.amount}</div>
                                <div className="expense-info">
                                    <p>📅 {new Date(exp.date).toLocaleDateString()}</p>
                                    {exp.vehicle && <p>🚗 {exp.vehicle.vehicleNumber}</p>}
                                    {exp.description && <p className="exp-desc">📝 {exp.description}</p>}
                                </div>
                                <button className="btn-delete-mini" onClick={() =>
                                    setDeleteModal({ isOpen: true, expenseId: exp._id })
                                }>🗑️</button>
                            </div>
                        ))}
                    </div>
                )
            )}

            {/* Premium Delete Confirmation Modal */}
            <ConfirmationModal
                isOpen={deleteModal.isOpen}
                title="Delete Expense"
                message="Are you sure you want to remove this expense entry? This action cannot be undone."
                onConfirm={handleDelete}
                onCancel={() => setDeleteModal({ isOpen: false, expenseId: null })}
                type="danger"
                confirmText="Delete"
                cancelText="Cancel"
            />

            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal-content modal-large" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>Add New Expense</h2>
                            <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
                        </div>
                        <form onSubmit={handleSubmit} className="modal-form">
                            <div className="form-section">
                                <h3>Expense Category</h3>
                                <div className="form-group">
                                    <label>Type *</label>
                                    <select
                                        value={formData.type}
                                        onChange={e => setFormData({ ...formData, type: e.target.value })}
                                        className="premium-select"
                                    >
                                        {expenseTypes.map(t => (
                                            <option key={t.value} value={t.value}>{t.label}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="form-section">
                                <h3>Transaction Details</h3>
                                <div className="form-row">
                                    <div className="form-group">
                                        <label>Amount (₹) *</label>
                                        <input
                                            type="number"
                                            required
                                            value={formData.amount}
                                            onChange={e => setFormData({ ...formData, amount: e.target.value })}
                                            placeholder="0.00"
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label>Date *</label>
                                        <input
                                            type="date"
                                            required
                                            value={formData.date}
                                            onChange={e => setFormData({ ...formData, date: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="form-section">
                                <h3>Assignment</h3>
                                <div className="form-group">
                                    <label>Vehicle (Optional)</label>
                                    <select
                                        value={formData.vehicle}
                                        onChange={e => setFormData({ ...formData, vehicle: e.target.value })}
                                        className="premium-select"
                                    >
                                        <option value="">Select vehicle</option>
                                        {vehicles.map(v => (
                                            <option key={v._id} value={v._id}>{v.vehicleNumber} ({v.model})</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="form-section">
                                <h3>Additional Information</h3>
                                <div className="form-group">
                                    <label>Description/Notes</label>
                                    <textarea
                                        value={formData.description}
                                        onChange={e => setFormData({ ...formData, description: e.target.value })}
                                        placeholder="Add any specific details here..."
                                        rows="3"
                                    />
                                </div>
                            </div>

                            <div className="modal-actions">
                                <button type="button" onClick={() => setShowModal(false)} className="btn btn-secondary">
                                    Cancel
                                </button>
                                <button type="submit" className="btn btn-primary">
                                    ✅ Save Expense
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Expenses;
