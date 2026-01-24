const mongoose = require('mongoose');

const vehicleSchema = new mongoose.Schema({
    vehicleNumber: {
        type: String,
        required: [true, 'Vehicle number is required'],
        unique: true,
        uppercase: true,
        trim: true
    },
    type: {
        type: String,
        required: [true, 'Vehicle type is required'],
        enum: ['Sedan', 'SUV', 'Mini Bus', 'Bus', 'Luxury Car', 'Tempo Traveller', 'Other'],
        default: 'Sedan'
    },
    brand: {
        type: String,
        trim: true
    },
    model: {
        type: String,
        trim: true
    },
    capacity: {
        type: Number,
        min: 1
    },
    status: {
        type: String,
        enum: ['available', 'booked', 'maintenance', 'inactive'],
        default: 'available'
    },
    color: {
        type: String,
        trim: true
    },
    year: {
        type: Number,
        min: 1900,
        max: new Date().getFullYear() + 1
    },
    notes: {
        type: String,
        trim: true
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
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

// Update timestamp on save
vehicleSchema.pre('save', function (next) {
    this.updatedAt = Date.now();
    next();
});

module.exports = mongoose.model('Vehicle', vehicleSchema);
