const express = require('express');
const router = express.Router();
const Document = require('../models/Document');
const { protect } = require('../middleware/auth');

// @route   GET /api/documents
// @desc    Get all documents
// @access  Private
router.get('/', protect, async (req, res) => {
    try {
        let query = {};
        if (req.user.role !== 'superadmin') {
            query.createdBy = req.user._id;
        }

        const documents = await Document.find(query).sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            documents
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching documents',
            error: error.message
        });
    }
});

// @route   POST /api/documents/upload
// @desc    Upload an image
// @access  Private
const upload = require('../utils/multerConfig');
router.post('/upload', protect, upload.single('image'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'No file uploaded' });
        }
        const fileUrl = `/uploads/${req.file.filename}`;
        res.status(200).json({ success: true, url: fileUrl });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Upload failed', error: error.message });
    }
});

// @route   POST /api/documents
// @desc    Upload/Save a document
// @access  Private
router.post('/', protect, async (req, res) => {
    try {
        const { name, category, documentUrlFront, documentUrlBack, expiryDate, notes } = req.body;

        const document = await Document.create({
            name,
            category,
            documentUrlFront,
            documentUrlBack,
            expiryDate,
            notes,
            createdBy: req.user._id
        });

        res.status(201).json({
            success: true,
            document
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: 'Error saving document',
            error: error.message
        });
    }
});

// @route   DELETE /api/documents/:id
// @desc    Delete a document
// @access  Private
router.delete('/:id', protect, async (req, res) => {
    try {
        const document = await Document.findById(req.params.id);
        if (!document) {
            return res.status(404).json({ success: false, message: 'Document not found' });
        }

        if (document.createdBy.toString() !== req.user._id.toString() && req.user.role !== 'superadmin') {
            return res.status(403).json({ success: false, message: 'Not authorized' });
        }

        await document.deleteOne();
        res.status(200).json({ success: true, message: 'Document deleted' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error deleting document' });
    }
});

module.exports = router;
