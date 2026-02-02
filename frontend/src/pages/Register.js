import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import '../styles/Auth.css';

const Register = () => {
    const navigate = useNavigate();
    const { register } = useAuth();
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        phone: '',
        role: 'user'
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

        // Validation
        if (formData.password !== formData.confirmPassword) {
            toast.error('Passwords do not match!');
            return;
        }

        if (formData.password.length < 6) {
            toast.error('Password must be at least 6 characters!');
            return;
        }

        setLoading(true);

        try {
            const { confirmPassword, ...registerData } = formData;

            // Send OTP instead of direct registration
            await register(registerData, true); // true = send OTP mode

            toast.success('OTP sent to your email! Please verify.');

            // Navigate to OTP verification page with email and name
            setTimeout(() => {
                navigate('/verify-otp', {
                    state: {
                        email: formData.email,
                        name: formData.name
                    }
                });
            }, 1000);
        } catch (error) {
            const message = error.response?.data?.message || 'Failed to send OTP. Please try again.';
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
                        <div className="premium-badge">NEW ACCOUNT</div>
                    </div>
                </div>

                {/* Right Side - Registration Form */}
                <div className="auth-form-side">
                    <div className="auth-card register-card">
                        <div className="auth-header">
                            <div className="auth-icon-wrapper">
                                <span className="auth-icon-dot"></span>
                            </div>
                            <h1>Create Account</h1>
                            <p>Register to join our premium management network</p>
                        </div>

                        <form onSubmit={handleSubmit} className="auth-form scrollable-form">
                            <div className="form-row">
                                <div className="form-group premium-group">
                                    <label htmlFor="name">Full Name *</label>
                                    <input
                                        type="text"
                                        id="name"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleChange}
                                        placeholder="John Doe"
                                        required
                                    />
                                </div>

                                <div className="form-group premium-group">
                                    <label htmlFor="email">Email Address *</label>
                                    <input
                                        type="email"
                                        id="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        placeholder="john@company.com"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="form-row">
                                <div className="form-group premium-group">
                                    <label htmlFor="phone">Phone Number</label>
                                    <input
                                        type="tel"
                                        id="phone"
                                        name="phone"
                                        value={formData.phone}
                                        onChange={handleChange}
                                        placeholder="+91 98765 43210"
                                    />
                                </div>

                                <div className="form-group premium-group">
                                    <label htmlFor="role">Account Role *</label>
                                    <select
                                        id="role"
                                        name="role"
                                        value={formData.role}
                                        onChange={handleChange}
                                        className="premium-select"
                                        required
                                    >
                                        <option value="user">Standard User</option>
                                        <option value="superadmin">Super Administrator</option>
                                    </select>
                                </div>
                            </div>

                            <div className="form-row">
                                <div className="form-group premium-group">
                                    <label htmlFor="password">Password *</label>
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

                                <div className="form-group premium-group">
                                    <label htmlFor="confirmPassword">Confirm Password *</label>
                                    <input
                                        type="password"
                                        id="confirmPassword"
                                        name="confirmPassword"
                                        value={formData.confirmPassword}
                                        onChange={handleChange}
                                        placeholder="••••••••"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="info-box-premium">
                                <span className="info-icon">●</span>
                                <p>Your account will require manual approval by a Super Admin after email verification.</p>
                            </div>

                            <button type="submit" className="btn-auth-submit" disabled={loading}>
                                {loading ? (
                                    <span className="loader-small"></span>
                                ) : (
                                    <>CREATE ACCOUNT <span className="btn-arrow">→</span></>
                                )}
                            </button>
                        </form>

                        <div className="auth-footer">
                            <p>Already registered? <Link to="/login" className="auth-link">Sign In Instead</Link></p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Register;
