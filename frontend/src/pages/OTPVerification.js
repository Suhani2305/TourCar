import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import axios from 'axios';
import '../styles/OTPVerification.css';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const OTPVerification = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const email = location.state?.email;
    const name = location.state?.name;

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
        <div className="otp-verification-container">
            <div className="otp-card">
                <div className="otp-header">
                    <div className="icon-circle">
                        <span className="icon">📧</span>
                    </div>
                    <h2>Verify Your Email</h2>
                    <p>We've sent a 6-digit OTP to</p>
                    <p className="email-display">{email}</p>
                </div>

                <form onSubmit={handleSubmit} className="otp-form">
                    <div className="otp-inputs" onPaste={handlePaste}>
                        {otp.map((digit, index) => (
                            <input
                                key={index}
                                id={`otp-${index}`}
                                type="text"
                                maxLength="1"
                                value={digit}
                                onChange={(e) => handleChange(index, e.target.value)}
                                onKeyDown={(e) => handleKeyDown(index, e)}
                                className="otp-input"
                                autoFocus={index === 0}
                                disabled={loading || timeLeft === 0}
                            />
                        ))}
                    </div>

                    <div className="timer-section">
                        <div className={`timer ${timeLeft < 60 ? 'timer-warning' : ''}`}>
                            ⏰ {formatTime(timeLeft)}
                        </div>
                        <p className="timer-text">Time remaining</p>
                    </div>

                    <button
                        type="submit"
                        className="btn btn-primary btn-verify"
                        disabled={loading || otp.join('').length !== 6 || timeLeft === 0}
                    >
                        {loading ? 'Verifying...' : 'Verify OTP'}
                    </button>
                </form>

                <div className="otp-footer">
                    <p>Didn't receive the code?</p>
                    <button
                        type="button"
                        onClick={handleResend}
                        className={`btn-resend ${!canResend ? 'disabled' : ''}`}
                        disabled={!canResend || loading}
                    >
                        {canResend ? 'Resend OTP' : `Resend in ${resendCooldown}s`}
                    </button>
                </div>

                <div className="back-link">
                    <button onClick={() => navigate('/register')} className="btn-back">
                        ← Back to Registration
                    </button>
                </div>
            </div>
        </div>
    );
};

export default OTPVerification;
