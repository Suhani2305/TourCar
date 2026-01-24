import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../styles/Dashboard.css';

const Dashboard = () => {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <div className="dashboard-container">
            <div className="dashboard-header">
                <h1>🎉 Welcome, {user?.name}!</h1>
                <button onClick={handleLogout} className="btn btn-secondary">
                    🚪 Logout
                </button>
            </div>

            <div className="dashboard-content">
                <div className="welcome-message">
                    <h2>Dashboard Coming Soon!</h2>
                    <p>Your account is approved and active.</p>
                    <p>Role: <strong>{user?.role === 'superadmin' ? '👑 Super Admin' : '👤 User'}</strong></p>
                    <p>Status: <strong className="status-approved">✅ Approved</strong></p>
                </div>

                {user?.role === 'superadmin' && (
                    <div className="admin-actions">
                        <button
                            onClick={() => navigate('/admin/users')}
                            className="btn btn-primary"
                        >
                            👥 Manage Users
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Dashboard;
