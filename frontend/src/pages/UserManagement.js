import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../utils/api';
import { toast } from 'react-toastify';
import ConfirmationModal from '../components/ConfirmationModal';
import '../styles/UserManagement.css';

const UserManagement = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        phone: '',
        role: 'user'
    });
    const [confModal, setConfModal] = useState({
        isOpen: false,
        title: '',
        message: '',
        onConfirm: () => { },
        type: 'danger'
    });

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const response = await authAPI.getAllUsers();
            setUsers(response.data.users);
        } catch (error) {
            toast.error('Failed to fetch users');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateUser = async (e) => {
        e.preventDefault();

        if (formData.password.length < 6) {
            toast.error('Password must be at least 6 characters');
            return;
        }

        try {
            await authAPI.createUser(formData);
            toast.success('User created successfully!');
            setShowCreateModal(false);
            setFormData({ name: '', email: '', password: '', phone: '', role: 'user' });
            fetchUsers();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to create user');
        }
    };

    const handleApprove = (userId) => {
        setConfModal({
            isOpen: true,
            title: 'Approve Staff Member',
            message: 'Are you sure you want to approve this staff account? They will gain access to the system.',
            type: 'confirm',
            onConfirm: async () => {
                try {
                    await authAPI.approveUser(userId);
                    toast.success('User approved successfully!');
                    fetchUsers();
                } catch (error) {
                    toast.error(error.response?.data?.message || 'Failed to approve user');
                }
                setConfModal(prev => ({ ...prev, isOpen: false }));
            }
        });
    };

    const handlePause = (userId) => {
        setConfModal({
            isOpen: true,
            title: 'Pause Staff Member',
            message: 'Are you sure you want to pause this staff account? They will lose access temporarily.',
            type: 'danger',
            onConfirm: async () => {
                try {
                    await authAPI.pauseUser(userId);
                    toast.success('User paused successfully!');
                    fetchUsers();
                } catch (error) {
                    toast.error(error.response?.data?.message || 'Failed to pause user');
                }
                setConfModal(prev => ({ ...prev, isOpen: false }));
            }
        });
    };

    const handleDelete = (userId) => {
        setConfModal({
            isOpen: true,
            title: 'Delete Staff Member',
            message: 'Are you sure you want to permanently delete this account? This action cannot be undone.',
            type: 'danger',
            onConfirm: async () => {
                try {
                    await authAPI.deleteUser(userId);
                    toast.success('User deleted successfully!');
                    fetchUsers();
                } catch (error) {
                    toast.error(error.response?.data?.message || 'Failed to delete user');
                }
                setConfModal(prev => ({ ...prev, isOpen: false }));
            }
        });
    };



    const filteredUsers = users.filter(u => {
        const matchesFilter = filter === 'all' || u.status === filter;
        const matchesSearch =
            u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            u.email.toLowerCase().includes(searchTerm.toLowerCase());
        return matchesFilter && matchesSearch;
    });

    const getStatusBadge = (status) => {
        const badges = {
            pending: { class: 'badge-warning', text: 'Pending' },
            approved: { class: 'badge-success', text: 'Approved' },
            paused: { class: 'badge-danger', text: 'Paused' }
        };
        const badge = badges[status] || badges.pending;
        return (
            <span className={`badge ${badge.class}`}>
                <span className="badge-dot"></span> {badge.text}
            </span>
        );
    };

    const getRoleBadge = (role) => {
        return role === 'superadmin' ? (
            <span className="badge badge-primary">Admin</span>
        ) : (
            <span className="badge badge-secondary">Staff</span>
        );
    };

    const renderUserActions = (u) => {
        if (u.role === 'superadmin') {
            return <span className="protected-badge">🔒 Protected</span>;
        }

        return (
            <>
                {u.status === 'pending' && (
                    <button
                        className="btn-action btn-approve"
                        onClick={() => handleApprove(u._id)}
                    >
                        <span className="btn-icon">✅</span>
                        <span className="btn-label">Approve</span>
                    </button>
                )}
                {u.status === 'approved' && (
                    <button
                        className="btn-action btn-pause"
                        onClick={() => handlePause(u._id)}
                    >
                        <span className="btn-icon">⏸️</span>
                        <span className="btn-label">Pause</span>
                    </button>
                )}
                {u.status === 'paused' && (
                    <button
                        className="btn-action btn-approve"
                        onClick={() => handleApprove(u._id)}
                    >
                        <span className="btn-icon">▶️</span>
                        <span className="btn-label">Activate</span>
                    </button>
                )}
                <button
                    className="btn-action btn-delete"
                    onClick={() => handleDelete(u._id)}
                >
                    <span className="btn-icon">🗑️</span>
                    <span className="btn-label">Delete</span>
                </button>
            </>
        );
    };

    if (loading) {
        return (
            <div className="loading-container">
                <div className="loader">🔄 Loading users...</div>
            </div>
        );
    }

    return (
        <div className="main-container">
            <div className="user-management-container">
                {/* Premium Header */}
                <div className="premium-header">
                    <h1 className="premium-title">
                        STAFF <span className="accent">MANAGEMENT</span>
                    </h1>
                    <p className="premium-tagline">MANAGE STAFF ACCOUNTS AND ACCESS PERMISSIONS</p>
                    <div className="premium-underline"></div>
                </div>

                {/* Stats Grid - Dashboard Style */}
                <div className="cards-grid-4" style={{ marginBottom: '2.5rem' }}>
                    <div className="stat-card">
                        <div className="stat-icon-dot"></div>
                        <div className="stat-content">
                            <h3>Total Staff</h3>
                            <p className="stat-value">{users.length}</p>
                        </div>
                    </div>
                    <div className="stat-card" style={{ borderLeftColor: '#D4AF37' }}>
                        <div className="stat-icon-dot pending"></div>
                        <div className="stat-content">
                            <h3>Pending</h3>
                            <p className="stat-value">{users.filter(u => u.status === 'pending').length}</p>
                        </div>
                    </div>
                    <div className="stat-card" style={{ borderLeftColor: '#2D5A27' }}>
                        <div className="stat-icon-dot approved"></div>
                        <div className="stat-content">
                            <h3>Approved</h3>
                            <p className="stat-value">{users.filter(u => u.status === 'approved').length}</p>
                        </div>
                    </div>
                    <div className="stat-card" style={{ borderLeftColor: '#8B0000' }}>
                        <div className="stat-icon-dot paused"></div>
                        <div className="stat-content">
                            <h3>Paused</h3>
                            <p className="stat-value">{users.filter(u => u.status === 'paused').length}</p>
                        </div>
                    </div>
                </div>

                {/* Unified Controls Strip */}
                <div className="controls-strip">
                    <div className="controls-left">
                        <div className="search-box-premium">
                            <span className="search-icon">🔍</span>
                            <input
                                type="text"
                                placeholder="Search staff name or email..."
                                value={searchTerm || ''}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <div className="filter-dropdown-wrapper">
                            <label htmlFor="user-filter">STATUS:</label>
                            <select
                                id="user-filter"
                                className="premium-select"
                                value={filter}
                                onChange={(e) => setFilter(e.target.value)}
                            >
                                <option value="all">All ({users.length})</option>
                                <option value="pending">Pending ({users.filter(u => u.status === 'pending').length})</option>
                                <option value="approved">Approved ({users.filter(u => u.status === 'approved').length})</option>
                                <option value="paused">Paused ({users.filter(u => u.status === 'paused').length})</option>
                            </select>
                        </div>
                    </div>

                    <div className="controls-right">
                        <button onClick={() => setShowCreateModal(true)} className="btn-premium-add">
                            CREATE NEW STAFF
                        </button>
                    </div>
                </div>

                {/* Users Table - Desktop */}
                <div className="users-table-container">
                    <table className="users-table">
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Email</th>
                                <th>Phone</th>
                                <th>Role</th>
                                <th>Status</th>
                                <th>Registered</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredUsers.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className="no-data">
                                        No users found
                                    </td>
                                </tr>
                            ) : (
                                filteredUsers.map((u) => (
                                    <tr key={u._id}>
                                        <td><strong>{u.name}</strong></td>
                                        <td>{u.email}</td>
                                        <td>{u.phone || '-'}</td>
                                        <td>{getRoleBadge(u.role)}</td>
                                        <td>{getStatusBadge(u.status)}</td>
                                        <td>{new Date(u.createdAt).toLocaleDateString()}</td>
                                        <td>
                                            <div className="action-buttons">
                                                {renderUserActions(u)}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Users Cards - Mobile */}
                <div className="user-cards-mobile">
                    {filteredUsers.length === 0 ? (
                        <div className="no-data" style={{ padding: '40px', textAlign: 'center' }}>
                            No users found
                        </div>
                    ) : (
                        filteredUsers.map((u) => (
                            <div key={u._id} className="user-card-mobile">
                                <div className="user-card-header">
                                    <h3>{u.name}</h3>
                                    {getRoleBadge(u.role)}
                                </div>

                                <div className="user-card-info">
                                    <div className="user-card-info-row">
                                        <span className="user-card-label">Email:</span>
                                        <span className="user-card-value">{u.email}</span>
                                    </div>
                                    <div className="user-card-info-row">
                                        <span className="user-card-label">Phone:</span>
                                        <span className="user-card-value">{u.phone || '-'}</span>
                                    </div>
                                    <div className="user-card-info-row">
                                        <span className="user-card-label">Status:</span>
                                        <span className="user-card-value">{getStatusBadge(u.status)}</span>
                                    </div>
                                    <div className="user-card-info-row">
                                        <span className="user-card-label">Registered:</span>
                                        <span className="user-card-value">
                                            {new Date(u.createdAt).toLocaleDateString()}
                                        </span>
                                    </div>
                                </div>

                                <div className="user-card-actions">
                                    {renderUserActions(u)}
                                </div>
                            </div>
                        ))
                    )}
                </div>

                {showCreateModal && (
                    <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
                        <div className="modal-content modal-large" onClick={(e) => e.stopPropagation()}>
                            <div className="modal-header">
                                <h2>Create New Staff</h2>
                                <button className="modal-close" onClick={() => setShowCreateModal(false)}>
                                    ✕
                                </button>
                            </div>
                            <form onSubmit={handleCreateUser} className="modal-form">
                                <div className="form-section">
                                    <h3>Basic Identity</h3>
                                    <div className="form-row">
                                        <div className="form-group">
                                            <label>Full Name *</label>
                                            <input
                                                type="text"
                                                value={formData.name}
                                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                                placeholder="Enter full name"
                                                required
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label>Email Address *</label>
                                            <input
                                                type="email"
                                                value={formData.email}
                                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                                placeholder="Enter email"
                                                required
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="form-section">
                                    <h3>Contact & Security</h3>
                                    <div className="form-row">
                                        <div className="form-group">
                                            <label>Phone Number</label>
                                            <input
                                                type="tel"
                                                value={formData.phone}
                                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                                placeholder="Enter phone number"
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label>Password *</label>
                                            <input
                                                type="password"
                                                value={formData.password}
                                                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                                placeholder="Min 6 characters"
                                                required
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="form-section">
                                    <h3>Access Level</h3>
                                    <div className="form-group">
                                        <label>Role *</label>
                                        <select
                                            value={formData.role}
                                            onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                            required
                                            className="premium-select"
                                        >
                                            <option value="user">Staff / Driver</option>
                                            <option value="superadmin">System Admin</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="info-box-modal">
                                    <p>✅ User will be created with <strong>Approved</strong> status</p>
                                </div>

                                <div className="modal-actions">
                                    <button type="button" onClick={() => setShowCreateModal(false)} className="btn btn-secondary">
                                        Cancel
                                    </button>
                                    <button type="submit" className="btn btn-primary">
                                        Create Account
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                <ConfirmationModal
                    isOpen={confModal.isOpen}
                    title={confModal.title}
                    message={confModal.message}
                    onConfirm={confModal.onConfirm}
                    onCancel={() => setConfModal(prev => ({ ...prev, isOpen: false }))}
                    type={confModal.type}
                />
            </div>
        </div>
    );
};

export default UserManagement;
