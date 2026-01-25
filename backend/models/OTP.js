const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const OTPSchema = new mongoose.Schema({
    email: {
        type: String,
        required: [true, 'Email is required'],
        lowercase: true,
        trim: true
    },
    otp: {
        type: String,
        required: [true, 'OTP is required']
    },
    name: {
        type: String,
        required: true
    },
    phone: {
        type: String
    },
    password: {
        type: String,
        required: true
    },
    role: {
        type: String,
        default: 'user'
    },
    attempts: {
        type: Number,
        default: 0
    },
    verified: {
        type: Boolean,
        default: false
    },
    expiresAt: {
        type: Date,
        required: true,
        default: () => new Date(Date.now() + 10 * 60 * 1000), // 10 minutes
        index: { expires: 0 } // TTL index - auto delete when expired
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Hash OTP before saving
OTPSchema.pre('save', async function (next) {
    if (!this.isModified('otp')) {
        return next();
    }

    const salt = await bcrypt.genSalt(10);
    this.otp = await bcrypt.hash(this.otp, salt);
    next();
});

// Method to compare OTP
OTPSchema.methods.compareOTP = async function (enteredOTP) {
    return await bcrypt.compare(enteredOTP, this.otp);
};

module.exports = mongoose.model('OTP', OTPSchema);
