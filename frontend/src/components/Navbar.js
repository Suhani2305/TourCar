import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../styles/Navbar.css';

const Navbar = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { user, logout } = useAuth();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const isActive = (path) => {
        return location.pathname === path ? 'active' : '';
    };

    return (
        <nav className="navbar">
            <div className="navbar-container">
                <div className="navbar-brand" onClick={() => navigate('/dashboard')}>
                    <span className="brand-icon">🚗</span>
                    <span className="brand-text">Tour Management</span>
                </div>

                <div className="navbar-links">
                    <button
                        className={`nav-link ${isActive('/dashboard')}`}
                        onClick={() => navigate('/dashboard')}
                    >
                        <span className="nav-icon">🏠</span>
                        <span className="nav-text">Dashboard</span>
                    </button>

                    <button
                        className={`nav-link ${isActive('/bookings')}`}
                        onClick={() => navigate('/bookings')}
                    >
                        <span className="nav-icon">📅</span>
                        <span className="nav-text">Bookings</span>
                    </button>

                    <button
                        className={`nav-link ${isActive('/vehicles')}`}
                        onClick={() => navigate('/vehicles')}
                    >
                        <span className="nav-icon">🚗</span>
                        <span className="nav-text">Vehicles</span>
                    </button>

                    {user?.role === 'superadmin' && (
                        <button
                            className={`nav-link ${isActive('/admin/users')}`}
                            onClick={() => navigate('/admin/users')}
                        >
                            <span className="nav-icon">👥</span>
                            <span className="nav-text">Users</span>
                        </button>
                    )}
                </div>

                <div className="navbar-user">
                    <div className="user-info">
                        <span className="user-name">{user?.name}</span>
                        <span className="user-role">
                            {user?.role === 'superadmin' ? '👑 Admin' : '👤 User'}
                        </span>
                    </div>
                    <button className="logout-btn" onClick={handleLogout}>
                        🚪 Logout
                    </button>
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
