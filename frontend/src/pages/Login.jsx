import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import '../styles/Auth.css';

const Login = () => {
    const navigate = useNavigate();
    const { login } = useAuth();
    const [formData, setFormData] = useState({
        email: '',
        password: ''
    });
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const togglePasswordVisibility = () => {
        setShowPassword(!showPassword);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            setError('');
            setSuccess('');
            const response = await login(formData.email, formData.password);
            setSuccess(response.message || 'Login successful!');
            // toast.success removed

            // Redirect based on role
            if (response.user.role === 'superadmin') {
                navigate('/admin/users');
            } else {
                navigate('/dashboard');
            }
        } catch (error) {
            const message = error.response?.data?.message || 'Login failed. Please try again.';
            setError(message);
            // toast.error removed
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-page-wrapper">
            <div className="auth-container premium-auth">
                {/* Left Side - Visual Branding */}
                <div className="auth-decorative-side">
                    <div className="auth-overlay"></div>
                    <div className="auth-branding">
                        <h1 className="brand-logo">TOUR <span className="accent">CAR</span></h1>
                        <p className="brand-tagline">Premium Fleet & Booking Solutions</p>
                    </div>
                    <div className="auth-illustration">
                        {/* You can add an image or icon here */}
                        <div className="premium-badge">PREMIUM ACCESS</div>
                    </div>
                </div>

                {/* Right Side - Login Form */}
                <div className="auth-form-side">
                    <div className="auth-card">
                        <div className="auth-header">
                            <h1>Welcome Back</h1>
                            <p>Enter your credentials to access the dashboard</p>
                        </div>

                        {error && (
                            <div className="auth-message error">
                                <span className="message-icon">⚠️</span>
                                <span>{error}</span>
                            </div>
                        )}

                        {success && (
                            <div className="auth-message success">
                                <span className="message-icon">✓</span>
                                <span>{success}</span>
                            </div>
                        )}

                        <form onSubmit={handleSubmit} className="auth-form">
                            <div className="form-group premium-group">
                                <label htmlFor="email">Email Address</label>
                                <div className="input-with-icon">
                                    <input
                                        type="email"
                                        id="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        placeholder="name@company.com"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="form-group premium-group">
                                <label htmlFor="password">Password</label>
                                <div className="input-with-icon">
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        id="password"
                                        name="password"
                                        value={formData.password}
                                        onChange={handleChange}
                                        placeholder="••••••••"
                                        required
                                    />
                                    <button
                                        type="button"
                                        className="password-toggle"
                                        onClick={togglePasswordVisibility}
                                    >
                                        {showPassword ? (
                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M17.94 17.94A10.07 10.07 0 0112 19c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24"></path>
                                                <line x1="1" y1="1" x2="23" y2="23"></line>
                                            </svg>
                                        ) : (
                                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                                                <circle cx="12" cy="12" r="3"></circle>
                                            </svg>
                                        )}
                                    </button>
                                </div>
                                <div className="forgot-password-link-container">
                                    <Link to="/forgot-password" style={{
                                        color: '#D4AF37',
                                        textDecoration: 'none',
                                        fontSize: '0.85rem',
                                        marginTop: '0.5rem',
                                        display: 'block',
                                        textAlign: 'right'
                                    }}>
                                        Forgot Password?
                                    </Link>
                                </div>
                            </div>

                            <button type="submit" className="btn-auth-submit" disabled={loading}>
                                {loading ? (
                                    <span className="loader-small"></span>
                                ) : (
                                    <>SIGN IN <span className="btn-arrow">→</span></>
                                )}
                            </button>
                        </form>

                        <div className="auth-footer">
                            <p>New to the system? <Link to="/register" className="auth-link">Create Account</Link></p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;
