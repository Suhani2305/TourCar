import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../styles/Navbar.css';

const Navbar = () => {
    const navigate = useNavigate();
    const { user, logout } = useAuth();
    const [dropdownOpen, setDropdownOpen] = useState(false);

    const handleLogout = () => {
        logout();
        navigate('/login');
    };



    return (
        <nav className="navbar">
            <div className="navbar-container">
                {/* Brand - Only visible on mobile/small screens via CSS */}
                <div className="navbar-brand mobile-only" onClick={() => navigate('/dashboard')}>
                    <span className="navbar-brand-dot"></span>
                    <span className="brand-text">TOUR <span className="accent">CAR</span></span>
                </div>

                {/* User Section - Right */}
                <div
                    className="navbar-user"
                    onMouseEnter={() => setDropdownOpen(true)}
                    onMouseLeave={() => setDropdownOpen(false)}
                >
                    <div className="user-profile" onClick={() => setDropdownOpen(!dropdownOpen)}>
                        <div className="user-avatar-mini">
                            {user?.name?.charAt(0).toUpperCase() || 'U'}
                        </div>
                        <div className="user-info-text">
                            <span className="user-name">{user?.name}</span>
                            <span className="user-role">
                                {user?.role === 'superadmin' ? 'Admin' : 'Staff'}
                            </span>
                        </div>
                        <span className={`dropdown-arrow ${dropdownOpen ? 'open' : ''}`}>▼</span>
                    </div>

                    {dropdownOpen && (
                        <div className="user-dropdown">
                            <div className="dropdown-header">
                                <p className="dropdown-user-name">{user?.name}</p>
                                <p className="dropdown-user-email">{user?.email}</p>
                            </div>
                            <div className="dropdown-divider"></div>
                            <button className="dropdown-item" onClick={() => { navigate('/profile'); setDropdownOpen(false); }}>
                                👤 My Profile
                            </button>
                            <button className="dropdown-item logout" onClick={handleLogout}>
                                🚪 Log Out
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
