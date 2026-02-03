import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import axios from 'axios';
import '../styles/OTPVerification.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const OTPVerification = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const email = location.state?.email;


    const [otp, setOtp] = useState(['', '', '', '', '', '']);
    const [loading, setLoading] = useState(false);
    const [timeLeft, setTimeLeft] = useState(600); // 10 minutes in seconds
    const [canResend, setCanResend] = useState(false);
    const [resendCooldown, setResendCooldown] = useState(60); // 1 minute cooldown

    useEffect(() => {
        if (!email) {
            toast.error('Invalid access. Please register first.');
            navigate('/register');
            return;
        }

        // Timer countdown
        const timer = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 1) {
                    clearInterval(timer);
                    toast.error('OTP expired. Please request a new one.');
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        // Resend cooldown timer
        const resendTimer = setInterval(() => {
            setResendCooldown((prev) => {
                if (prev <= 1) {
                    setCanResend(true);
                    clearInterval(resendTimer);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => {
            clearInterval(timer);
            clearInterval(resendTimer);
        };
    }, [email, navigate]);

    const handleChange = (index, value) => {
        if (isNaN(value)) return;

        const newOtp = [...otp];
        newOtp[index] = value;
        setOtp(newOtp);

        // Auto-focus next input
        if (value && index < 5) {
            document.getElementById(`otp-${index + 1}`).focus();
        }
    };

    const handleKeyDown = (index, e) => {
        // Handle backspace
        if (e.key === 'Backspace' && !otp[index] && index > 0) {
            document.getElementById(`otp-${index - 1}`).focus();
        }
    };

    const handlePaste = (e) => {
        e.preventDefault();
        const pastedData = e.clipboardData.getData('text').slice(0, 6);
        const newOtp = pastedData.split('').slice(0, 6);

        while (newOtp.length < 6) {
            newOtp.push('');
        }

        setOtp(newOtp);

        // Focus last filled input or first empty
        const lastFilledIndex = newOtp.findIndex(val => !val);
        const focusIndex = lastFilledIndex === -1 ? 5 : lastFilledIndex;
        document.getElementById(`otp-${focusIndex}`).focus();
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const otpString = otp.join('');
        if (otpString.length !== 6) {
            toast.error('Please enter complete OTP');
            return;
        }

        setLoading(true);
        try {
            const response = await axios.post(`${API_URL}/auth/verify-otp`, {
                email,
                otp: otpString
            });

            if (response.data.success) {
                toast.success('Email verified successfully! Redirecting to login...');
                setTimeout(() => {
                    navigate('/login');
                }, 2000);
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Invalid OTP');
            // Clear OTP on error
            setOtp(['', '', '', '', '', '']);
            document.getElementById('otp-0').focus();
        } finally {
            setLoading(false);
        }
    };

    const handleResend = async () => {
        if (!canResend) return;

        setLoading(true);
        try {
            const response = await axios.post(`${API_URL}/auth/resend-otp`, { email });

            if (response.data.success) {
                toast.success('New OTP sent to your email!');
                setTimeLeft(600); // Reset timer
                setCanResend(false);
                setResendCooldown(60);
                setOtp(['', '', '', '', '', '']);
                document.getElementById('otp-0').focus();
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to resend OTP');
        } finally {
            setLoading(false);
        }
    };

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div className="auth-page-wrapper">
            <div className="auth-container premium-auth">
                {/* Left Side - Visual Branding */}
                <div className="auth-decorative-side">
                    <div className="auth-overlay"></div>
                    <div className="auth-branding">
                        <h1 className="brand-logo">TOUR <span className="accent">MANAGEMENT</span></h1>
                        <p className="brand-tagline">Premium Fleet & Booking Solutions</p>
                    </div>
                    <div className="auth-illustration">
                        <div className="premium-badge">SECURITY VERIFICATION</div>
                    </div>
                </div>

                {/* Right Side - OTP Form */}
                <div className="auth-form-side">
                    <div className="auth-card otp-card">
                        <div className="auth-header">
                            <div className="auth-icon-wrapper">
                                <span className="auth-icon">📧</span>
                            </div>
                            <h1>Verify Your Email</h1>
                            <p>We've sent a 6-digit verification code to</p>
                            <p className="email-highlight">{email}</p>
                        </div>

                        <form onSubmit={handleSubmit} className="auth-form otp-form">
                            <div className="otp-inputs-grid" onPaste={handlePaste}>
                                {otp.map((digit, index) => (
                                    <input
                                        key={index}
                                        id={`otp-${index}`}
                                        type="text"
                                        maxLength="1"
                                        value={digit}
                                        onChange={(e) => handleChange(index, e.target.value)}
                                        onKeyDown={(e) => handleKeyDown(index, e)}
                                        className="premium-otp-input"
                                        autoFocus={index === 0}
                                        disabled={loading || timeLeft === 0}
                                    />
                                ))}
                            </div>

                            <div className="timer-wrapper">
                                <span className={`timer-badge ${timeLeft < 60 ? 'warning' : ''}`}>
                                    {formatTime(timeLeft)}
                                </span>
                                <p className="timer-label">Code expires in</p>
                            </div>

                            <button
                                type="submit"
                                className="btn-auth-submit"
                                disabled={loading || otp.join('').length !== 6 || timeLeft === 0}
                            >
                                {loading ? (
                                    <span className="loader-small"></span>
                                ) : (
                                    <>VERIFY CODE <span className="btn-arrow">→</span></>
                                )}
                            </button>
                        </form>

                        <div className="auth-footer otp-footer">
                            <p>Didn't receive the code?</p>
                            <button
                                type="button"
                                onClick={handleResend}
                                className={`btn-resend-link ${!canResend ? 'waiting' : ''}`}
                                disabled={!canResend || loading}
                            >
                                {canResend ? 'Resend OTP Now' : `Resend in ${resendCooldown}s`}
                            </button>
                        </div>

                        <div className="auth-back-nav">
                            <button onClick={() => navigate('/register')} className="btn-link-back">
                                ← Back to Registration
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default OTPVerification;
