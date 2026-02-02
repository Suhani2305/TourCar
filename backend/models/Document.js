const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Document name is required'],
        trim: true
    },
    category: {
        type: String,
        enum: ['dl', 'rc', 'insurance', 'permit', 'pollution', 'other'],
        required: [true, 'Category is required']
    },
    documentUrlFront: {
        type: String,
        required: [true, 'Front image is required']
    },
    documentUrlBack: {
        type: String // Optional for some, mandatory for others
    },
    expiryDate: {
        type: Date
    },
    notes: {
        type: String,
        trim: true
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Document', documentSchema);
