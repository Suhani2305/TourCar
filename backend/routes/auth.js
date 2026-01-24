const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { protect, authorize } = require('../middleware/auth');

// Generate JWT Token
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRE || '7d'
    });
};

// @route   POST /api/auth/register
// @desc    Register new user
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

        res.status(201).json({
            success: true,
            message: 'Registration successful! Your account is pending approval by Super Admin.',
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

// @route   GET /api/auth/me
// @desc    Get current logged in user
// @access  Private
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
