import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../utils/api';
import { toast } from 'react-toastify';
import '../styles/UserManagement.css';

const UserManagement = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        phone: '',
        role: 'user'
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

    const handleApprove = async (userId) => {
        try {
            await authAPI.approveUser(userId);
            toast.success('User approved successfully!');
            fetchUsers();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to approve user');
        }
    };

    const handlePause = async (userId) => {
        try {
            await authAPI.pauseUser(userId);
            toast.success('User paused successfully!');
            fetchUsers();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to pause user');
        }
    };

    const handleDelete = async (userId) => {
        if (window.confirm('Are you sure you want to delete this user?')) {
            try {
                await authAPI.deleteUser(userId);
                toast.success('User deleted successfully!');
                fetchUsers();
            } catch (error) {
                toast.error(error.response?.data?.message || 'Failed to delete user');
            }
        }
    };

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const filteredUsers = users.filter(u => {
        if (filter === 'all') return true;
        return u.status === filter;
    });

    const getStatusBadge = (status) => {
        const badges = {
            pending: { class: 'badge-warning', icon: '⏳', text: 'Pending' },
            approved: { class: 'badge-success', icon: '✅', text: 'Approved' },
            paused: { class: 'badge-danger', icon: '⏸️', text: 'Paused' }
        };
        const badge = badges[status] || badges.pending;
        return (
            <span className={`badge ${badge.class}`}>
                {badge.icon} {badge.text}
            </span>
        );
    };

    const getRoleBadge = (role) => {
        return role === 'superadmin' ? (
            <span className="badge badge-primary">👑 Super Admin</span>
        ) : (
            <span className="badge badge-secondary">👤 User</span>
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
        <div className="user-management-container">
            {/* Header */}
            <div className="page-header">
                <div>
                    <h1>👥 User Management</h1>
                    <p>Manage user accounts and approvals</p>
                </div>
                <div className="header-actions">
                    <button onClick={() => setShowCreateModal(true)} className="btn btn-primary">
                        ➕ Create User
                    </button>
                    <button onClick={() => navigate('/dashboard')} className="btn btn-secondary">
                        🏠 Dashboard
                    </button>
                    <button onClick={handleLogout} className="btn btn-secondary">
                        🚪 Logout
                    </button>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="stats-grid">
                <div className="stat-card stat-total">
                    <div className="stat-icon">📊</div>
                    <div className="stat-content">
                        <h3>{users.length}</h3>
                        <p>Total Users</p>
                    </div>
                </div>
                <div className="stat-card stat-pending">
                    <div className="stat-icon">⏳</div>
                    <div className="stat-content">
                        <h3>{users.filter(u => u.status === 'pending').length}</h3>
                        <p>Pending Approval</p>
                    </div>
                </div>
                <div className="stat-card stat-approved">
                    <div className="stat-icon">✅</div>
                    <div className="stat-content">
                        <h3>{users.filter(u => u.status === 'approved').length}</h3>
                        <p>Approved</p>
                    </div>
                </div>
                <div className="stat-card stat-paused">
                    <div className="stat-icon">⏸️</div>
                    <div className="stat-content">
                        <h3>{users.filter(u => u.status === 'paused').length}</h3>
                        <p>Paused</p>
                    </div>
                </div>
            </div>

            {/* Filter Section */}
            <div className="filter-section">
                <button
                    className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
                    onClick={() => setFilter('all')}
                >
                    All Users ({users.length})
                </button>
                <button
                    className={`filter-btn ${filter === 'pending' ? 'active' : ''}`}
                    onClick={() => setFilter('pending')}
                >
                    Pending ({users.filter(u => u.status === 'pending').length})
                </button>
                <button
                    className={`filter-btn ${filter === 'approved' ? 'active' : ''}`}
                    onClick={() => setFilter('approved')}
                >
                    Approved ({users.filter(u => u.status === 'approved').length})
                </button>
                <button
                    className={`filter-btn ${filter === 'paused' ? 'active' : ''}`}
                    onClick={() => setFilter('paused')}
                >
                    Paused ({users.filter(u => u.status === 'paused').length})
                </button>
            </div>

            {/* Users Table */}
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
                                    <td>
                                        <strong>{u.name}</strong>
                                    </td>
                                    <td>{u.email}</td>
                                    <td>{u.phone || '-'}</td>
                                    <td>{getRoleBadge(u.role)}</td>
                                    <td>{getStatusBadge(u.status)}</td>
                                    <td>{new Date(u.createdAt).toLocaleDateString()}</td>
                                    <td>
                                        <div className="action-buttons">
                                            {u.role !== 'superadmin' && (
                                                <>
                                                    {u.status === 'pending' && (
                                                        <button
                                                            className="btn-action btn-approve"
                                                            onClick={() => handleApprove(u._id)}
                                                            title="Approve User"
                                                        >
                                                            ✅
                                                        </button>
                                                    )}
                                                    {u.status === 'approved' && (
                                                        <button
                                                            className="btn-action btn-pause"
                                                            onClick={() => handlePause(u._id)}
                                                            title="Pause User"
                                                        >
                                                            ⏸️
                                                        </button>
                                                    )}
                                                    {u.status === 'paused' && (
                                                        <button
                                                            className="btn-action btn-approve"
                                                            onClick={() => handleApprove(u._id)}
                                                            title="Reactivate User"
                                                        >
                                                            ▶️
                                                        </button>
                                                    )}
                                                    <button
                                                        className="btn-action btn-delete"
                                                        onClick={() => handleDelete(u._id)}
                                                        title="Delete User"
                                                    >
                                                        🗑️
                                                    </button>
                                                </>
                                            )}
                                            {u.role === 'superadmin' && (
                                                <span className="protected-badge">🔒 Protected</span>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* Create User Modal */}
            {showCreateModal && (
                <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <h2>➕ Create New User</h2>
                            <button className="modal-close" onClick={() => setShowCreateModal(false)}>
                                ✕
                            </button>
                        </div>
                        <form onSubmit={handleCreateUser} className="modal-form">
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
                                <label>Role *</label>
                                <select
                                    value={formData.role}
                                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                                    required
                                >
                                    <option value="user">User</option>
                                    <option value="superadmin">Super Admin</option>
                                </select>
                            </div>

                            <div className="form-group">
                                <label>Password *</label>
                                <input
                                    type="password"
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    placeholder="Enter password (min 6 characters)"
                                    required
                                />
                            </div>

                            <div className="info-box-modal">
                                <p>✅ User will be created with <strong>Approved</strong> status</p>
                            </div>

                            <div className="modal-actions">
                                <button type="button" onClick={() => setShowCreateModal(false)} className="btn btn-secondary">
                                    Cancel
                                </button>
                                <button type="submit" className="btn btn-primary">
                                    ✅ Create User
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UserManagement;
