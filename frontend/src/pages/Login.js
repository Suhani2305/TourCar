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
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const response = await login(formData.email, formData.password);
            toast.success(response.message || 'Login successful!');

            // Redirect based on role
            if (response.user.role === 'superadmin') {
                navigate('/admin/users');
            } else {
                navigate('/dashboard');
            }
        } catch (error) {
            const message = error.response?.data?.message || 'Login failed. Please try again.';
            toast.error(message);
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
                            <div className="auth-icon-wrapper">
                                <span className="auth-icon-dot"></span>
                            </div>
                            <h1>Welcome Back</h1>
                            <p>Enter your credentials to access the dashboard</p>
                        </div>

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
                                        type="password"
                                        id="password"
                                        name="password"
                                        value={formData.password}
                                        onChange={handleChange}
                                        placeholder="••••••••"
                                        required
                                    />
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
