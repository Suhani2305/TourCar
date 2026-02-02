import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../styles/Sidebar.css';

const Sidebar = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { user, logout } = useAuth();

    const isActive = (path) => {
        return location.pathname === path ? 'active' : '';
    };

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    return (
        <aside className="sidebar">
            <div className="sidebar-brand" onClick={() => navigate('/dashboard')}>
                <div className="brand-wrapper">
                    <span className="brand-logo-text">TOUR<span className="accent-text">CAR</span></span>
                    <span className="brand-subtext">
                        {user?.role === 'superadmin' ? 'SUPER ADMIN NODE' : 'ADMIN NODE'}
                    </span>
                </div>
            </div>

            <div className="sidebar-content">
                <div className="sidebar-section">
                    <p className="section-title">MAIN</p>
                    <button
                        className={`sidebar-link ${isActive('/dashboard')}`}
                        onClick={() => navigate('/dashboard')}
                    >
                        <span className="sidebar-icon icon-dashboard">🏠</span>
                        <span className="sidebar-text">Dashboard</span>
                    </button>
                    <button
                        className={`sidebar-link ${isActive('/calendar')}`}
                        onClick={() => navigate('/calendar')}
                    >
                        <span className="sidebar-icon icon-calendar">🗓️</span>
                        <span className="sidebar-text">Calendar</span>
                    </button>
                </div>

                <div className="sidebar-section">
                    <p className="section-title">MANAGEMENT</p>
                    <button
                        className={`sidebar-link ${isActive('/bookings')}`}
                        onClick={() => navigate('/bookings')}
                    >
                        <span className="sidebar-icon icon-bookings">📋</span>
                        <span className="sidebar-text">Bookings</span>
                    </button>
                    <button
                        className={`sidebar-link ${isActive('/vehicles')}`}
                        onClick={() => navigate('/vehicles')}
                    >
                        <span className="sidebar-icon icon-vehicles">🚙</span>
                        <span className="sidebar-text">Vehicles</span>
                    </button>
                    {user?.role === 'superadmin' && (
                        <button
                            className={`sidebar-link ${isActive('/admin/users')}`}
                            onClick={() => navigate('/admin/users')}
                        >
                            <span className="sidebar-icon icon-users">👥</span>
                            <span className="sidebar-text">Users</span>
                        </button>
                    )}
                    <button
                        className={`sidebar-link ${isActive('/reports')}`}
                        onClick={() => navigate('/reports')}
                    >
                        <span className="sidebar-icon icon-reports">📊</span>
                        <span className="sidebar-text">Reports</span>
                    </button>
                    <button
                        className={`sidebar-link ${isActive('/expenses')}`}
                        onClick={() => navigate('/expenses')}
                    >
                        <span className="sidebar-icon icon-expenses">⛽</span>
                        <span className="sidebar-text">Expenses</span>
                    </button>
                    <button
                        className={`sidebar-link ${isActive('/vault')}`}
                        onClick={() => navigate('/vault')}
                    >
                        <span className="sidebar-icon icon-vault">📂</span>
                        <span className="sidebar-text">Documents</span>
                    </button>
                </div>

                <div className="sidebar-section">
                    <p className="section-title">ACCOUNT</p>
                    <button
                        className={`sidebar-link ${isActive('/profile')}`}
                        onClick={() => navigate('/profile')}
                    >
                        <span className="sidebar-icon icon-profile">👤</span>
                        <span className="sidebar-text">My Profile</span>
                    </button>
                </div>
            </div>

            <div className="sidebar-footer-profile">
                <div className="user-profile-mini">
                    <div className="profile-avatar">
                        {user?.name?.charAt(0).toUpperCase()}
                    </div>
                    <div className="profile-info">
                        <p className="profile-name">{user?.name}</p>
                        <p className="profile-email">{user?.email}</p>
                    </div>
                </div>
                <button className="signout-button" onClick={handleLogout}>
                    <span className="btn-icon">🚪</span> SIGN OUT
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;
