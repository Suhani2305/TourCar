const express = require('express');
const router = express.Router();
const Booking = require('../models/Booking');
const Vehicle = require('../models/Vehicle');
const { protect } = require('../middleware/auth');
const { sendBookingConfirmation } = require('../utils/emailService');

// Helper function to check date conflicts
const checkDateConflict = async (vehicleId, startDate, endDate, excludeBookingId = null) => {
    const query = {
        vehicle: vehicleId,
        status: { $in: ['pending', 'confirmed'] },
        $or: [
            {
                startDate: { $lte: new Date(endDate) },
                endDate: { $gte: new Date(startDate) }
            }
        ]
    };

    if (excludeBookingId) {
        query._id = { $ne: excludeBookingId };
    }

    const conflictingBooking = await Booking.findOne(query);
    return conflictingBooking;
};

// @route   GET /api/bookings
// @desc    Get all bookings
// @access  Private
router.get('/', protect, async (req, res) => {
    try {
        const { status, vehicle, startDate, endDate, search, createdBy } = req.query;

        let query = {};

        // Role-based filtering: Users see only their bookings, Super Admin sees all
        if (req.user.role !== 'superadmin') {
            query.createdBy = req.user._id;
        } else if (createdBy && createdBy !== 'all' && createdBy !== 'my') {
            // Super admin can filter by specific user ID
            query.createdBy = createdBy;
        }

        console.log('Final Query:', JSON.stringify(query));

        if (status) {
            query.status = status;
        }

        if (vehicle) {
            query.vehicle = vehicle;
        }

        if (startDate && endDate) {
            query.startDate = { $gte: new Date(startDate) };
            query.endDate = { $lte: new Date(endDate) };
        }

        if (search) {
            query.$or = [
                { bookingNumber: { $regex: search, $options: 'i' } },
                { customerName: { $regex: search, $options: 'i' } },
                { customerPhone: { $regex: search, $options: 'i' } }
            ];
        }

        const bookings = await Booking.find(query)
            .populate('vehicle', 'vehicleNumber type brand model')
            .populate('createdBy', 'name email')
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            count: bookings.length,
            bookings
        });
    } catch (error) {
        console.error('Get bookings error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching bookings',
            error: error.message
        });
    }
});

// @route   GET /api/bookings/calendar
// @desc    Get bookings for calendar view
// @access  Private
router.get('/calendar', protect, async (req, res) => {
    try {
        const { startDate, endDate, viewMode, userId } = req.query;

        let query = {};

        // Role-based filtering
        if (req.user.role !== 'superadmin') {
            query.createdBy = req.user._id;
        } else {
            // Super admin logic
            if (viewMode === 'all' && userId) {
                query.createdBy = userId;
            } else if (viewMode === 'my') {
                query.createdBy = req.user._id;
            }
            // If viewMode === 'all' and no userId, fetch all bookings
        }

        // Date range filter
        if (startDate && endDate) {
            query.startDate = {
                $gte: new Date(startDate),
                $lte: new Date(endDate)
            };
        }

        const bookings = await Booking.find(query)
            .populate('vehicle', 'vehicleNumber type')
            .populate('createdBy', 'name email')
            .sort({ pickupDate: 1 });

        res.status(200).json({
            success: true,
            bookings
        });
    } catch (error) {
        console.error('Error fetching calendar bookings:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching calendar bookings',
            error: error.message
        });
    }
});

// @route   GET /api/bookings/stats/summary
// @desc    Get booking statistics
// @access  Private
router.get('/stats/summary', protect, async (req, res) => {
    try {
        // Role-based filtering
        const baseQuery = req.user.role !== 'superadmin'
            ? { createdBy: req.user._id }
            : {};

        const total = await Booking.countDocuments(baseQuery);
        const pending = await Booking.countDocuments({ ...baseQuery, status: 'pending' });
        const confirmed = await Booking.countDocuments({ ...baseQuery, status: 'confirmed' });
        const completed = await Booking.countDocuments({ ...baseQuery, status: 'completed' });
        const cancelled = await Booking.countDocuments({ ...baseQuery, status: 'cancelled' });

        // Today's bookings
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const todayBookings = await Booking.countDocuments({
            ...baseQuery,
            startDate: { $gte: today, $lt: tomorrow }
        });

        res.status(200).json({
            success: true,
            stats: {
                total,
                pending,
                confirmed,
                completed,
                cancelled,
                todayBookings
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching statistics'
        });
    }
});

// @route   GET /api/bookings/stats/dashboard
// @desc    Get dashboard statistics (total bookings, revenue, upcoming bookings)
// @access  Private
router.get('/stats/dashboard', protect, async (req, res) => {
    try {
        // Role-based filtering
        const baseQuery = req.user.role !== 'superadmin'
            ? { createdBy: req.user._id }
            : {};

        // Total bookings count
        const totalBookings = await Booking.countDocuments(baseQuery);

        // Total revenue (sum of totalAmount from ONLY completed bookings)
        const revenueResult = await Booking.aggregate([
            { $match: { ...baseQuery, status: 'completed' } },
            { $group: { _id: null, total: { $sum: '$totalAmount' } } }
        ]);
        const totalRevenue = revenueResult.length > 0 ? revenueResult[0].total : 0;

        // Today's bookings
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const todayBookings = await Booking.countDocuments({
            ...baseQuery,
            startDate: { $gte: today, $lt: tomorrow }
        });

        // Upcoming bookings (next 48 hours)
        const now = new Date();
        const next48Hours = new Date(now.getTime() + 48 * 60 * 60 * 1000);

        const upcomingBookings = await Booking.find({
            ...baseQuery,
            startDate: { $gte: now, $lte: next48Hours },
            status: { $in: ['pending', 'confirmed'] }
        })
            .populate('vehicle', 'registrationNumber model')
            .populate('createdBy', 'name')
            .sort({ startDate: 1 })
            .limit(10);

        res.status(200).json({
            success: true,
            stats: {
                totalBookings,
                totalRevenue,
                todayBookings,
                upcomingCount: upcomingBookings.length,
                upcomingBookings
            }
        });
    } catch (error) {
        console.error('Dashboard stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching dashboard statistics',
            error: error.message
        });
    }
});

// @route   GET /api/bookings/:id
// @desc    Get single booking
// @access  Private
router.get('/:id', protect, async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.id)
            .populate('vehicle')
            .populate('createdBy', 'name email');

        if (!booking) {
            return res.status(404).json({
                success: false,
                message: 'Booking not found'
            });
        }

        res.status(200).json({
            success: true,
            booking
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error fetching booking'
        });
    }
});

// @route   POST /api/bookings
// @desc    Create new booking
// @access  Private
router.post('/', protect, async (req, res) => {
    try {
        const {
            vehicle,
            customerName,
            customerPhone,
            customerEmail,
            startDate,
            endDate,
            pickupLocation,
            pickupTime,
            dropLocation,
            dropTime,
            purpose,
            totalAmount,
            advanceAmount,
            notes
        } = req.body;

        // Check if vehicle exists
        const vehicleExists = await Vehicle.findById(vehicle);
        if (!vehicleExists) {
            return res.status(404).json({
                success: false,
                message: 'Vehicle not found'
            });
        }

        // Check for date conflicts
        const conflict = await checkDateConflict(vehicle, startDate, endDate);
        if (conflict) {
            return res.status(400).json({
                success: false,
                message: `Vehicle is already booked from ${new Date(conflict.startDate).toLocaleDateString()} to ${new Date(conflict.endDate).toLocaleDateString()}`,
                conflictingBooking: conflict.bookingNumber
            });
        }

        // Create booking
        const booking = await Booking.create({
            vehicle,
            customerName,
            customerPhone,
            customerEmail,
            startDate,
            endDate,
            pickupLocation,
            pickupTime,
            dropLocation,
            dropTime,
            purpose,
            totalAmount,
            advanceAmount,
            notes,
            createdBy: req.user._id
        });

        // Update vehicle status to booked if booking starts today or in past
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const bookingStart = new Date(startDate);
        bookingStart.setHours(0, 0, 0, 0);

        if (bookingStart <= today) {
            await Vehicle.findByIdAndUpdate(vehicle, { status: 'booked' });
        }

        const populatedBooking = await Booking.findById(booking._id)
            .populate('vehicle')
            .populate('createdBy', 'name email');

        // Send booking confirmation email
        if (customerEmail) {
            await sendBookingConfirmation(populatedBooking, customerEmail);
        }

        res.status(201).json({
            success: true,
            message: 'Booking created successfully',
            booking: populatedBooking
        });
    } catch (error) {
        console.error('Create booking error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Error creating booking'
        });
    }
});

// @route   PUT /api/bookings/:id
// @desc    Update booking
// @access  Private
router.put('/:id', protect, async (req, res) => {
    try {
        let booking = await Booking.findById(req.params.id);

        if (!booking) {
            return res.status(404).json({
                success: false,
                message: 'Booking not found'
            });
        }

        // If dates or vehicle are being updated, check for conflicts
        if (req.body.startDate || req.body.endDate || req.body.vehicle) {
            const vehicleId = req.body.vehicle || booking.vehicle;
            const startDate = req.body.startDate || booking.startDate;
            const endDate = req.body.endDate || booking.endDate;

            const conflict = await checkDateConflict(vehicleId, startDate, endDate, req.params.id);
            if (conflict) {
                return res.status(400).json({
                    success: false,
                    message: `Vehicle is already booked from ${new Date(conflict.startDate).toLocaleDateString()} to ${new Date(conflict.endDate).toLocaleDateString()}`,
                    conflictingBooking: conflict.bookingNumber
                });
            }
        }

        // Update booking
        booking = await Booking.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        ).populate('vehicle').populate('createdBy', 'name email');

        res.status(200).json({
            success: true,
            message: 'Booking updated successfully',
            booking
        });
    } catch (error) {
        console.error('Update booking error:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Error updating booking'
        });
    }
});

// @route   DELETE /api/bookings/:id
// @desc    Delete booking
// @access  Private
router.delete('/:id', protect, async (req, res) => {
    try {
        const booking = await Booking.findById(req.params.id);

        if (!booking) {
            return res.status(404).json({
                success: false,
                message: 'Booking not found'
            });
        }

        await booking.deleteOne();

        res.status(200).json({
            success: true,
            message: 'Booking deleted successfully'
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error deleting booking'
        });
    }
});

// @route   PUT /api/bookings/:id/status
// @desc    Update booking status
// @access  Private
router.put('/:id/status', protect, async (req, res) => {
    try {
        const { status } = req.body;

        const booking = await Booking.findByIdAndUpdate(
            req.params.id,
            { status },
            { new: true, runValidators: true }
        ).populate('vehicle').populate('createdBy', 'name email');

        if (!booking) {
            return res.status(404).json({
                success: false,
                message: 'Booking not found'
            });
        }

        // Update vehicle status based on booking status
        if (status === 'cancelled' || status === 'completed') {
            // Check if there are other active bookings for this vehicle
            const activeBookings = await Booking.countDocuments({
                vehicle: booking.vehicle._id,
                status: { $in: ['pending', 'confirmed'] },
                _id: { $ne: booking._id }
            });

            if (activeBookings === 0) {
                await Vehicle.findByIdAndUpdate(booking.vehicle._id, { status: 'available' });
            }
        }

        res.status(200).json({
            success: true,
            message: 'Booking status updated successfully',
            booking
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Error updating booking status'
        });
    }
});

module.exports = router;
