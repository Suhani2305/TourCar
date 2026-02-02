const express = require('express');
const router = express.Router();
const Expense = require('../models/Expense');
const { protect } = require('../middleware/auth');

// @route   GET /api/expenses
// @desc    Get all expenses
// @access  Private
router.get('/', protect, async (req, res) => {
    try {
        let query = {};
        if (req.user.role !== 'superadmin') {
            query.createdBy = req.user._id;
        }

        const expenses = await Expense.find(query)
            .populate('vehicle', 'vehicleNumber model')
            .populate('booking', 'bookingNumber customerName')
            .sort({ date: -1 });

        res.status(200).json({
            success: true,
            expenses
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching expenses',
            error: error.message
        });
    }
});

// @route   POST /api/expenses
// @desc    Create an expense
// @access  Private
router.post('/', protect, async (req, res) => {
    try {
        const { type, amount, date, vehicle, booking, description } = req.body;

        const expense = await Expense.create({
            type,
            amount,
            date: date || Date.now(),
            vehicle: vehicle || null,
            booking: booking || null,
            description,
            createdBy: req.user._id
        });

        res.status(201).json({
            success: true,
            expense
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            message: 'Error creating expense',
            error: error.message
        });
    }
});

// @route   DELETE /api/expenses/:id
// @desc    Delete an expense
// @access  Private
router.delete('/:id', protect, async (req, res) => {
    try {
        const expense = await Expense.findById(req.id);
        if (!expense) {
            return res.status(404).json({ success: false, message: 'Expense not found' });
        }

        // Check ownership
        if (expense.createdBy.toString() !== req.user._id.toString() && req.user.role !== 'superadmin') {
            return res.status(403).json({ success: false, message: 'Not authorized' });
        }

        await expense.deleteOne();
        res.status(200).json({ success: true, message: 'Expense deleted' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error deleting expense' });
    }
});

module.exports = router;
