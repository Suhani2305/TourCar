const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
    bookingNumber: {
        type: String,
        unique: true
    },
    vehicle: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Vehicle',
        required: [true, 'Vehicle is required']
    },
    customerName: {
        type: String,
        required: [true, 'Customer name is required'],
        trim: true
    },
    customerPhone: {
        type: String,
        required: [true, 'Customer phone is required'],
        trim: true
    },
    customerEmail: {
        type: String,
        trim: true,
        lowercase: true
    },
    startDate: {
        type: Date,
        required: [true, 'Start date is required']
    },
    endDate: {
        type: Date,
        required: [true, 'End date is required']
    },
    pickupLocation: {
        type: String,
        required: [true, 'Pickup location is required'],
        trim: true
    },
    pickupTime: {
        type: String,
        trim: true
    },
    dropLocation: {
        type: String,
        trim: true
    },
    dropTime: {
        type: String,
        trim: true
    },
    purpose: {
        type: String,
        trim: true
    },
    status: {
        type: String,
        enum: ['confirmed', 'completed', 'cancelled'],
        default: 'confirmed'
    },
    totalAmount: {
        type: Number,
        min: 0
    },
    advanceAmount: {
        type: Number,
        min: 0,
        default: 0
    },
    notes: {
        type: String,
        trim: true
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    reminderSent: {
        type: Boolean,
        default: false
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Generate booking number before saving
bookingSchema.pre('save', async function (next) {
    if (!this.bookingNumber) {
        const count = await mongoose.model('Booking').countDocuments();
        const year = new Date().getFullYear();
        this.bookingNumber = `BK${year}${String(count + 1).padStart(5, '0')}`;
    }
    this.updatedAt = Date.now();
    next();
});

// Validate date range
bookingSchema.pre('save', function (next) {
    if (this.endDate < this.startDate) {
        next(new Error('End date cannot be before start date'));
    }
    next();
});

module.exports = mongoose.model('Booking', bookingSchema);
