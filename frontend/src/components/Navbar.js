import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../styles/Navbar.css';

const Navbar = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { user, logout } = useAuth();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    const handleLogout = () => {
        logout();
        navigate('/login');
        setMobileMenuOpen(false);
    };

    const isActive = (path) => {
        return location.pathname === path ? 'active' : '';
    };

    const handleNavClick = (path) => {
        navigate(path);
        setMobileMenuOpen(false);
    };

    const toggleMobileMenu = () => {
        setMobileMenuOpen(!mobileMenuOpen);
    };

    return (
        <nav className="navbar">
            <div className="navbar-container">
                {/* Brand */}
                <div className="navbar-brand" onClick={() => handleNavClick('/dashboard')}>
                    <span className="brand-icon">🚗</span>
                    <span className="brand-text">Tour Management</span>
                </div>

                {/* Hamburger Menu Button */}
                <button
                    className={`hamburger-btn ${mobileMenuOpen ? 'active' : ''}`}
                    onClick={toggleMobileMenu}
                    aria-label="Toggle menu"
                >
                    <span></span>
                    <span></span>
                    <span></span>
                </button>

                {/* Navigation Links */}
                <div className={`navbar-links ${mobileMenuOpen ? 'mobile-active' : ''}`}>
                    <button
                        className={`nav-link ${isActive('/dashboard')}`}
                        onClick={() => handleNavClick('/dashboard')}
                    >
                        <span className="nav-icon">🏠</span>
                        <span className="nav-text">Dashboard</span>
                    </button>

                    <button
                        className={`nav-link ${isActive('/bookings')}`}
                        onClick={() => handleNavClick('/bookings')}
                    >
                        <span className="nav-icon">📅</span>
                        <span className="nav-text">Bookings</span>
                    </button>

                    <button
                        className={`nav-link ${isActive('/calendar')}`}
                        onClick={() => handleNavClick('/calendar')}
                    >
                        <span className="nav-icon">📆</span>
                        <span className="nav-text">Calendar</span>
                    </button>

                    <button
                        className={`nav-link ${isActive('/reports')}`}
                        onClick={() => handleNavClick('/reports')}
                    >
                        <span className="nav-icon">📊</span>
                        <span className="nav-text">Reports</span>
                    </button>

                    <button
                        className={`nav-link ${isActive('/vehicles')}`}
                        onClick={() => handleNavClick('/vehicles')}
                    >
                        <span className="nav-icon">🚙</span>
                        <span className="nav-text">Vehicles</span>
                    </button>

                    {user?.role === 'superadmin' && (
                        <button
                            className={`nav-link ${isActive('/admin/users')}`}
                            onClick={() => handleNavClick('/admin/users')}
                        >
                            <span className="nav-icon">👥</span>
                            <span className="nav-text">Users</span>
                        </button>
                    )}
                </div>

                {/* User Section */}
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
