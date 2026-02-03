import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../utils/api';
import { toast } from 'react-toastify';
import '../styles/Profile.css';

const Profile = () => {
    const { user, checkAuth } = useAuth();
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(false);

    // States for Profile Info
    const [formData, setFormData] = useState({
        name: user?.name || '',
        email: user?.email || '',
        phone: user?.phone || ''
    });

    // States for Password Change
    const [passData, setPassData] = useState({
        newPassword: '',
        confirmPassword: ''
    });

    const [showOTPStage, setShowOTPStage] = useState(false);
    const [otp, setOtp] = useState('');

    const handleInfoChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handlePassChange = (e) => {
        setPassData({ ...passData, [e.target.name]: e.target.value });
    };

    const handleUpdateProfile = async (e) => {
        e.preventDefault();
        try {
            setLoading(true);
            const response = await authAPI.updateProfile({
                name: formData.name,
                phone: formData.phone
            });
            if (response.data.success) {
                toast.success('Profile updated successfully!');
                setIsEditing(false);
                await checkAuth(); // Refresh user data in context
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to update profile');
        } finally {
            setLoading(false);
        }
    };

    const initPasswordChange = async (e) => {
        e.preventDefault();
        if (passData.newPassword !== passData.confirmPassword) {
            toast.error('Passwords do not match');
            return;
        }
        if (passData.newPassword.length < 6) {
            toast.error('Password must be at least 6 characters');
            return;
        }

        try {
            setLoading(true);
            await authAPI.sendProfilePasswordOTP();
            setShowOTPStage(true);
            toast.info('OTP sent to your email for verification');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to send OTP');
        } finally {
            setLoading(false);
        }
    };

    const verifyAndChangePassword = async () => {
        if (!otp) {
            toast.error('Please enter OTP');
            return;
        }

        try {
            setLoading(true);
            const response = await authAPI.changePasswordVerified({
                otp,
                newPassword: passData.newPassword
            });
            if (response.data.success) {
                toast.success('Password changed successfully!');
                setShowOTPStage(false);
                setPassData({ newPassword: '', confirmPassword: '' });
                setOtp('');
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Invalid OTP or failed to change password');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="main-container">
            <div className="profile-container">
                <div className="premium-header">
                    <h1 className="premium-title">USER <span className="accent">PROFILE</span></h1>
                    <p className="premium-tagline">MANAGE YOUR ACCOUNT SETTINGS AND SECURITY</p>
                    <div className="premium-underline"></div>
                </div>

                <div className="profile-grid">
                    {/* Profile Info Card */}
                    <div className="profile-card info-card">
                        <div className="profile-card-header">
                            <div className="profile-avatar-large">
                                {user?.name?.charAt(0).toUpperCase()}
                            </div>
                            <div className="profile-header-text">
                                <h2>{user?.name}</h2>
                                <span className={`role-badge ${user?.role}`}>
                                    {user?.role === 'superadmin' ? 'Administrator' : 'Staff Member'}
                                </span>
                            </div>
                        </div>

                        <form onSubmit={handleUpdateProfile} className="profile-form">
                            <div className="form-group-row">
                                <div className="form-group">
                                    <label>FULL NAME</label>
                                    <input
                                        type="text"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleInfoChange}
                                        disabled={!isEditing || loading}
                                        placeholder="Enter your name"
                                    />
                                </div>
                                <div className="form-group">
                                    <label>EMAIL ADDRESS</label>
                                    <input
                                        type="email"
                                        name="email"
                                        value={formData.email}
                                        disabled={true}
                                        style={{ opacity: 0.6 }}
                                    />
                                </div>
                            </div>
                            <div className="form-group">
                                <label>PHONE NUMBER</label>
                                <input
                                    type="tel"
                                    name="phone"
                                    value={formData.phone}
                                    onChange={handleInfoChange}
                                    disabled={!isEditing || loading}
                                    placeholder="Enter your phone number"
                                />
                            </div>

                            <div className="profile-actions">
                                {!isEditing ? (
                                    <button
                                        type="button"
                                        onClick={() => setIsEditing(true)}
                                        className="btn-edit-profile"
                                    >
                                        EDIT PROFILE
                                    </button>
                                ) : (
                                    <>
                                        <button
                                            type="button"
                                            onClick={() => { setIsEditing(false); setFormData({ name: user.name, phone: user.phone || '', email: user.email }); }}
                                            className="btn-cancel"
                                            disabled={loading}
                                        >
                                            CANCEL
                                        </button>
                                        <button
                                            type="submit"
                                            className="btn-save"
                                            disabled={loading}
                                        >
                                            {loading ? 'SAVING...' : 'SAVE CHANGES'}
                                        </button>
                                    </>
                                )}
                            </div>
                        </form>
                    </div>

                    {/* Password Change Card */}
                    <div className="profile-card security-card">
                        <div className="card-title">
                            <h3>SECURITY SETTINGS</h3>
                            <p>Update your password with email verification</p>
                        </div>

                        {!showOTPStage ? (
                            <form onSubmit={initPasswordChange} className="profile-form">
                                <div className="form-group">
                                    <label>NEW PASSWORD</label>
                                    <input
                                        type="password"
                                        name="newPassword"
                                        value={passData.newPassword}
                                        onChange={handlePassChange}
                                        placeholder="••••••••"
                                        required
                                        disabled={loading}
                                    />
                                </div>
                                <div className="form-group">
                                    <label>CONFIRM NEW PASSWORD</label>
                                    <input
                                        type="password"
                                        name="confirmPassword"
                                        value={passData.confirmPassword}
                                        onChange={handlePassChange}
                                        placeholder="••••••••"
                                        required
                                        disabled={loading}
                                    />
                                </div>

                                <button type="submit" className="btn-change-password" disabled={loading}>
                                    {loading ? 'SENDING OTP...' : 'REQUEST PASSWORD CHANGE'}
                                </button>
                            </form>
                        ) : (
                            <div className="otp-verification-section">
                                <div className="info-box-modal" style={{ marginBottom: '1.5rem' }}>
                                    We've sent a 6-digit OTP to <strong>{user?.email}</strong>.
                                    Please enter it below to confirm your new password.
                                </div>
                                <div className="form-group">
                                    <label>ENTER 6-DIGIT OTP</label>
                                    <input
                                        type="text"
                                        value={otp}
                                        onChange={(e) => setOtp(e.target.value)}
                                        placeholder="123456"
                                        maxLength="6"
                                        className="otp-input-field"
                                        style={{ textAlign: 'center', fontSize: '1.5rem', letterSpacing: '8px' }}
                                    />
                                </div>
                                <div className="profile-actions" style={{ flexDirection: 'column' }}>
                                    <button
                                        onClick={verifyAndChangePassword}
                                        className="btn-save"
                                        style={{ width: '100%' }}
                                        disabled={loading}
                                    >
                                        {loading ? 'VERIFYING...' : 'VERIFY & CHANGE PASSWORD'}
                                    </button>
                                    <button
                                        onClick={() => setShowOTPStage(false)}
                                        className="btn-cancel"
                                        style={{ width: '100%', marginTop: '0.5rem' }}
                                        disabled={loading}
                                    >
                                        BACK
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Profile;
