const express = require('express');
const router = express.Router();
const User = require('../models/User');
const OTP = require('../models/OTP');
const jwt = require('jsonwebtoken');
const { protect, authorize } = require('../middleware/auth');
const { sendWelcomeEmail, sendUserApprovalEmail, sendOTPEmail, sendResetPasswordOTPEmail } = require('../utils/emailService');

// Generate JWT Token
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRE || '7d'
    });
};

// @route   POST /api/auth/send-otp
// @desc    Send OTP to email for registration
// @access  Public
router.post('/send-otp', async (req, res) => {
    try {
        const { name, email, password, phone, role } = req.body;

        // Validation
        if (!name || !email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Please provide name, email and password'
            });
        }

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'User with this email already exists'
            });
        }

        // Check for recent OTP request (rate limiting - 1 per minute)
        const recentOTP = await OTP.findOne({
            email,
            createdAt: { $gte: new Date(Date.now() - 60 * 1000) }
        });

        if (recentOTP) {
            return res.status(429).json({
                success: false,
                message: 'Please wait 1 minute before requesting another OTP'
            });
        }

        // Generate 6-digit OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();

        // Delete any existing OTP for this email
        await OTP.deleteMany({ email });

        // Create OTP record (will be hashed by pre-save hook)
        await OTP.create({
            email,
            otp,
            name,
            phone,
            password,
            role: role || 'user'
        });

        // Send OTP email
        await sendOTPEmail(email, otp, name);

        res.status(200).json({
            success: true,
            message: 'OTP sent to your email. Please verify within 10 minutes.'
        });
    } catch (error) {
        console.error('Send OTP error:', error);
        res.status(500).json({
            success: false,
            message: 'Error sending OTP',
            error: error.message
        });
    }
});

// @route   POST /api/auth/verify-otp
// @desc    Verify OTP and create user
// @access  Public
router.post('/verify-otp', async (req, res) => {
    try {
        const { email, otp } = req.body;

        if (!email || !otp) {
            return res.status(400).json({
                success: false,
                message: 'Please provide email and OTP'
            });
        }

        // Find OTP record
        const otpRecord = await OTP.findOne({ email });

        if (!otpRecord) {
            return res.status(400).json({
                success: false,
                message: 'OTP not found or expired'
            });
        }

        // Check if OTP is expired
        if (otpRecord.expiresAt < new Date()) {
            await OTP.deleteOne({ email });
            return res.status(400).json({
                success: false,
                message: 'OTP has expired. Please request a new one.'
            });
        }

        // Check attempts
        if (otpRecord.attempts >= 3) {
            await OTP.deleteOne({ email });
            return res.status(400).json({
                success: false,
                message: 'Maximum verification attempts exceeded. Please request a new OTP.'
            });
        }

        // Verify OTP
        const isMatch = await otpRecord.compareOTP(otp);

        if (!isMatch) {
            otpRecord.attempts += 1;
            await otpRecord.save();
            return res.status(400).json({
                success: false,
                message: `Invalid OTP. ${3 - otpRecord.attempts} attempts remaining.`
            });
        }

        // OTP verified - create user
        const user = await User.create({
            name: otpRecord.name,
            email: otpRecord.email,
            password: otpRecord.password,
            phone: otpRecord.phone,
            role: otpRecord.role,
            status: 'pending' // Still needs admin approval
        });

        // Delete OTP record
        await OTP.deleteOne({ email });

        // Send welcome email
        if (user.email) {
            await sendWelcomeEmail(user);
        }

        res.status(201).json({
            success: true,
            message: 'Email verified successfully! Your account is pending approval.',
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                status: user.status
            }
        });
    } catch (error) {
        console.error('Verify OTP error:', error);
        res.status(500).json({
            success: false,
            message: 'Error verifying OTP',
            error: error.message
        });
    }
});

// @route   POST /api/auth/resend-otp
// @desc    Resend OTP
// @access  Public
router.post('/resend-otp', async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({
                success: false,
                message: 'Please provide email'
            });
        }

        // Find existing OTP record
        const otpRecord = await OTP.findOne({ email });

        if (!otpRecord) {
            return res.status(400).json({
                success: false,
                message: 'No OTP request found for this email'
            });
        }

        // Rate limiting - allow resend only after 1 minute
        const timeSinceCreation = Date.now() - otpRecord.createdAt.getTime();
        if (timeSinceCreation < 60 * 1000) {
            return res.status(429).json({
                success: false,
                message: 'Please wait before requesting another OTP'
            });
        }

        // Generate new OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();

        // Update OTP record
        otpRecord.otp = otp; // Will be hashed by pre-save hook
        otpRecord.attempts = 0;
        otpRecord.expiresAt = new Date(Date.now() + 10 * 60 * 1000);
        otpRecord.createdAt = new Date();
        await otpRecord.save();

        // Send OTP email
        await sendOTPEmail(email, otp, otpRecord.name);

        res.status(200).json({
            success: true,
            message: 'New OTP sent to your email'
        });
    } catch (error) {
        console.error('Resend OTP error:', error);
        res.status(500).json({
            success: false,
            message: 'Error resending OTP',
            error: error.message
        });
    }
});

// @route   POST /api/auth/register
// @desc    Register new user (OLD - kept for backward compatibility)
// @access  Public
router.post('/register', async (req, res) => {
    try {
        const { name, email, password, phone, role } = req.body;

        // Validation
        if (!name || !email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Please provide name, email and password'
            });
        }

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'User with this email already exists'
            });
        }

        // Create user with pending status
        const user = await User.create({
            name,
            email,
            password,
            phone,
            role: role || 'user',
            status: 'pending' // All new users need approval
        });

        // Send welcome email
        if (user.email) {
            await sendWelcomeEmail(user);
        }

        res.status(201).json({
            success: true,
            message: 'Registration successful! Your account is pending approval.',
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                status: user.status
            }
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({
            success: false,
            message: 'Error in registration',
            error: error.message
        });
    }
});

// @route   POST /api/auth/create-user
// @desc    Create user by Super Admin (auto-approved)
// @access  Private/Super Admin
router.post('/create-user', protect, authorize('superadmin'), async (req, res) => {
    try {
        const { name, email, password, phone, role } = req.body;

        // Validation
        if (!name || !email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Please provide name, email and password'
            });
        }

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'User with this email already exists'
            });
        }

        // Create user with approved status (created by Super Admin)
        const user = await User.create({
            name,
            email,
            password,
            phone,
            role: role || 'user',
            status: 'approved', // Auto-approved when created by Super Admin
            approvedBy: req.user._id,
            approvedAt: Date.now()
        });

        res.status(201).json({
            success: true,
            message: 'User created successfully!',
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                status: user.status
            }
        });
    } catch (error) {
        console.error('Create user error:', error);
        res.status(500).json({
            success: false,
            message: 'Error creating user',
            error: error.message
        });
    }
});

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validation
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Please provide email and password'
            });
        }

        // Find user and include password
        const user = await User.findOne({ email }).select('+password');

        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        // Check password
        const isPasswordMatch = await user.comparePassword(password);

        if (!isPasswordMatch) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }

        // Check user status
        if (user.status === 'pending') {
            return res.status(403).json({
                success: false,
                message: 'Your account is pending approval by Super Admin. Please wait for approval.'
            });
        }

        if (user.status === 'paused') {
            return res.status(403).json({
                success: false,
                message: 'Your account has been paused by Super Admin. Please contact administrator.'
            });
        }

        // Generate token
        const token = generateToken(user._id);

        res.status(200).json({
            success: true,
            message: 'Login successful',
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                status: user.status
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: 'Error in login',
            error: error.message
        });
    }
});

router.get('/me', protect, async (req, res) => {
    try {
        res.status(200).json({
            success: true,
            user: req.user
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching user data'
        });
    }
});

// @route   PUT /api/auth/update-profile
// @desc    Update user profile (name, phone)
// @access  Private
router.put('/update-profile', protect, async (req, res) => {
    try {
        const { name, phone } = req.body;

        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        if (name) user.name = name;
        if (phone) user.phone = phone;

        await user.save();

        res.status(200).json({
            success: true,
            message: 'Profile updated successfully',
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                phone: user.phone,
                status: user.status
            }
        });
    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({ success: false, message: 'Error updating profile' });
    }
});

// @route   POST /api/auth/forgot-password
// @desc    Send OTP for forgot password
// @access  Public
router.post('/forgot-password', async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ success: false, message: 'Please provide email' });
        }

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ success: false, message: 'No user found with this email' });
        }

        // Generate OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();

        // Save OTP to special recovery OTP record or reuse OTP model
        // Reusing OTP model but with password = 'RECOVERY' to distinguish
        await OTP.deleteMany({ email });
        await OTP.create({
            email,
            otp,
            name: user.name,
            password: 'RECOVERY_REQUEST', // Flag to indicate this is for recovery
            role: user.role
        });

        // Send Email
        await sendResetPasswordOTPEmail(email, otp, user.name);

        res.status(200).json({
            success: true,
            message: 'Password reset OTP sent to your email'
        });
    } catch (error) {
        console.error('Forgot password error:', error);
        res.status(500).json({ success: false, message: 'Error sending reset OTP' });
    }
});

// @route   POST /api/auth/verify-reset-otp
// @desc    Verify OTP for password reset
// @access  Public
router.post('/verify-reset-otp', async (req, res) => {
    try {
        const { email, otp } = req.body;

        if (!email || !otp) {
            return res.status(400).json({ success: false, message: 'Please provide email and OTP' });
        }

        const otpRecord = await OTP.findOne({ email });
        if (!otpRecord || otpRecord.password !== 'RECOVERY_REQUEST') {
            return res.status(400).json({ success: false, message: 'Reset request not found or expired' });
        }

        const isMatch = await otpRecord.compareOTP(otp);
        if (!isMatch) {
            return res.status(400).json({ success: false, message: 'Invalid OTP' });
        }

        // Return a temp recovery token (signed JWT specific for reset)
        const resetToken = jwt.sign({ email, purpose: 'password_reset' }, process.env.JWT_SECRET, { expiresIn: '10m' });

        res.status(200).json({
            success: true,
            message: 'OTP verified successfully',
            resetToken
        });
    } catch (error) {
        console.error('Verify reset OTP error:', error);
        res.status(500).json({ success: false, message: 'Error verifying OTP' });
    }
});

// @route   POST /api/auth/reset-password
// @desc    Reset password using reset token
// @access  Public
router.post('/reset-password', async (req, res) => {
    try {
        const { resetToken, newPassword } = req.body;

        if (!resetToken || !newPassword) {
            return res.status(400).json({ success: false, message: 'Missing token or password' });
        }

        const decoded = jwt.verify(resetToken, process.env.JWT_SECRET);
        if (decoded.purpose !== 'password_reset') {
            return res.status(400).json({ success: false, message: 'Invalid reset token' });
        }

        const user = await User.findOne({ email: decoded.email });
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        user.password = newPassword;
        await user.save();

        // Small cleanup: delete OTP record
        await OTP.deleteMany({ email: decoded.email });

        res.status(200).json({
            success: true,
            message: 'Password reset successful. You can now login.'
        });
    } catch (error) {
        console.error('Reset password error:', error);
        res.status(400).json({ success: false, message: 'Invalid or expired reset token' });
    }
});

// @route   POST /api/auth/profile/send-password-otp
// @desc    Send OTP to change password from profile
// @access  Private
router.post('/profile/send-password-otp', protect, async (req, res) => {
    try {
        const user = req.user;
        const otp = Math.floor(100000 + Math.random() * 900000).toString();

        await OTP.deleteMany({ email: user.email });
        await OTP.create({
            email: user.email,
            otp,
            name: user.name,
            password: 'PROFILE_CHANGE_REQUEST',
            role: user.role
        });

        await sendResetPasswordOTPEmail(user.email, otp, user.name);

        res.status(200).json({
            success: true,
            message: 'OTP sent to your email for password change'
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error sending OTP' });
    }
});

// @route   POST /api/auth/profile/change-password-verified
// @desc    Change password with OTP verification
// @access  Private
router.post('/profile/change-password-verified', protect, async (req, res) => {
    try {
        const { otp, newPassword } = req.body;
        const user = await User.findById(req.user._id);

        const otpRecord = await OTP.findOne({ email: user.email });
        if (!otpRecord || otpRecord.password !== 'PROFILE_CHANGE_REQUEST') {
            return res.status(400).json({ success: false, message: 'Change request not found' });
        }

        const isMatch = await otpRecord.compareOTP(otp);
        if (!isMatch) {
            return res.status(400).json({ success: false, message: 'Invalid OTP' });
        }

        user.password = newPassword;
        await user.save();
        await OTP.deleteOne({ email: user.email });

        res.status(200).json({
            success: true,
            message: 'Password changed successfully'
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error changing password' });
    }
});

// @route   GET /api/auth/users
// @desc    Get all users (for Super Admin)
// @access  Private/Super Admin
router.get('/users', protect, authorize('superadmin'), async (req, res) => {
    try {
        const users = await User.find().sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: users.length,
            users
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching users'
        });
    }
});

// @route   GET /api/auth/users/list
// @desc    Get simplified user list for filtering (Super Admin only)
// @access  Private/Super Admin
router.get('/users/list', protect, authorize('superadmin'), async (req, res) => {
    try {
        const users = await User.find({ status: 'approved' })
            .select('name email role')
            .sort({ name: 1 });

        res.status(200).json({
            success: true,
            count: users.length,
            users
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching user list'
        });
    }
});

// @route   PUT /api/auth/users/:id/approve
// @desc    Approve user (Super Admin only)
// @access  Private/Super Admin
router.put('/users/:id/approve', protect, authorize('superadmin'), async (req, res) => {
    try {
        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        user.status = 'approved';
        user.approvedBy = req.user._id;
        user.approvedAt = Date.now();
        await user.save();

        // Send approval email
        if (user.email) {
            await sendUserApprovalEmail(user);
        }

        res.status(200).json({
            success: true,
            message: 'User approved successfully',
            user
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error approving user'
        });
    }
});

// @route   PUT /api/auth/users/:id/pause
// @desc    Pause user (Super Admin only)
// @access  Private/Super Admin
router.put('/users/:id/pause', protect, authorize('superadmin'), async (req, res) => {
    try {
        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        if (user.role === 'superadmin') {
            return res.status(400).json({
                success: false,
                message: 'Cannot pause Super Admin account'
            });
        }

        user.status = 'paused';
        await user.save();

        res.status(200).json({
            success: true,
            message: 'User paused successfully',
            user
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error pausing user'
        });
    }
});

// @route   DELETE /api/auth/users/:id
// @desc    Delete user (Super Admin only)
// @access  Private/Super Admin
router.delete('/users/:id', protect, authorize('superadmin'), async (req, res) => {
    try {
        const user = await User.findById(req.params.id);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        if (user.role === 'superadmin') {
            return res.status(400).json({
                success: false,
                message: 'Cannot delete Super Admin account'
            });
        }

        await user.deleteOne();

        res.status(200).json({
            success: true,
            message: 'User deleted successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error deleting user'
        });
    }
});

module.exports = router;
