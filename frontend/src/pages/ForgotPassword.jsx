import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { authAPI } from '../utils/api';
import { toast } from 'react-toastify';
import '../styles/Auth.css';

const ForgotPassword = () => {
    const navigate = useNavigate();
    const [step, setStep] = useState(1); // 1: Email, 2: OTP, 3: New Password
    const [loading, setLoading] = useState(false);
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [resetToken, setResetToken] = useState('');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const handleSendOTP = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        try {
            setLoading(true);
            await authAPI.forgotPassword(email);
            setSuccess('OTP sent to your email!');
            setStep(2);
        } catch (error) {
            const message = error.response?.data?.message || 'Failed to send OTP';
            setError(message);
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOTP = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        try {
            setLoading(true);
            const response = await authAPI.verifyResetOTP({ email, otp });
            if (response.data.success) {
                setResetToken(response.data.resetToken);
                setSuccess('OTP Verified!');
                setStep(3);
            }
        } catch (error) {
            const message = error.response?.data?.message || 'Invalid OTP';
            setError(message);
        } finally {
            setLoading(false);
        }
    };

    const handleResetPassword = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        if (newPassword !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }
        if (newPassword.length < 6) {
            setError('Password must be at least 6 characters');
            return;
        }

        try {
            setLoading(true);
            const response = await authAPI.resetPassword({ resetToken, newPassword });
            if (response.data.success) {
                setSuccess('Password reset successfully! Please login.');
                navigate('/login');
            }
        } catch (error) {
            const message = error.response?.data?.message || 'Failed to reset password';
            setError(message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-page-wrapper">
            <div className="auth-container premium-auth">
                <div className="auth-form-side" style={{ width: '100%' }}>
                    <div className="auth-card" style={{ maxWidth: '450px', margin: '0 auto' }}>
                        <div className="auth-header">
                            <h1>Reset Password</h1>
                            <p>
                                {step === 1 && "Enter your email to receive an OTP"}
                                {step === 2 && "Enter the 6-digit OTP sent to your email"}
                                {step === 3 && "Create a strong new password"}
                            </p>
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

                        {step === 1 && (
                            <form onSubmit={handleSendOTP} className="auth-form">
                                <div className="form-group premium-group">
                                    <label>Email Address</label>
                                    <div className="input-with-icon">
                                        <input
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            placeholder="name@company.com"
                                            required
                                            disabled={loading}
                                        />
                                    </div>
                                </div>
                                <button type="submit" className="btn-auth-submit" disabled={loading}>
                                    {loading ? 'SENDING...' : 'SEND OTP'}
                                </button>
                                <div className="auth-footer">
                                    <Link to="/login" className="auth-link">Back to Login</Link>
                                </div>
                            </form>
                        )}

                        {step === 2 && (
                            <form onSubmit={handleVerifyOTP} className="auth-form">
                                <div className="form-group premium-group">
                                    <label>Enter 6-Digit OTP</label>
                                    <div className="input-with-icon">
                                        <input
                                            type="text"
                                            value={otp}
                                            onChange={(e) => setOtp(e.target.value)}
                                            placeholder="123456"
                                            maxLength="6"
                                            required
                                            style={{ textAlign: 'center', fontSize: '1.5rem', letterSpacing: '8px' }}
                                            disabled={loading}
                                        />
                                    </div>
                                </div>
                                <button type="submit" className="btn-auth-submit" disabled={loading}>
                                    {loading ? 'VERIFYING...' : 'VERIFY OTP'}
                                </button>
                                <div className="auth-footer">
                                    <button type="button" onClick={() => setStep(1)} className="auth-link" style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
                                        Change Email
                                    </button>
                                </div>
                            </form>
                        )}

                        {step === 3 && (
                            <form onSubmit={handleResetPassword} className="auth-form">
                                <div className="form-group premium-group">
                                    <label>New Password</label>
                                    <div className="input-with-icon">
                                        <input
                                            type={showPassword ? "text" : "password"}
                                            value={newPassword}
                                            onChange={(e) => setNewPassword(e.target.value)}
                                            placeholder="••••••••"
                                            required
                                            disabled={loading}
                                        />
                                        <button
                                            type="button"
                                            className="password-toggle"
                                            onClick={() => setShowPassword(!showPassword)}
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
                                </div>
                                <div className="form-group premium-group">
                                    <label>Confirm New Password</label>
                                    <div className="input-with-icon">
                                        <input
                                            type={showConfirmPassword ? "text" : "password"}
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            placeholder="••••••••"
                                            required
                                            disabled={loading}
                                        />
                                        <button
                                            type="button"
                                            className="password-toggle"
                                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                        >
                                            {showConfirmPassword ? (
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
                                </div>
                                <button type="submit" className="btn-auth-submit" disabled={loading}>
                                    {loading ? 'RESETTING...' : 'RESET PASSWORD'}
                                </button>
                            </form>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ForgotPassword;
