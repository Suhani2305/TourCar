const express = require('express');
const router = express.Router();
const Booking = require('../models/Booking');
const Vehicle = require('../models/Vehicle');
const { protect } = require('../middleware/auth');
const { sendBookingConfirmation } = require('../utils/emailService');

const { getTravelTime } = require('../utils/routeHelper');

// Helper function to check date conflicts and travel time
const checkVehicleAvailability = async (startDate, endDate, pickupTime, dropTime, pickupLocation, dropLocation, excludeBookingId = null) => {
    const vehicles = await Vehicle.find({ status: { $ne: 'inactive' } });
    const startDateTime = new Date(`${startDate}T${pickupTime || '00:00'}`);
    const endDateTime = new Date(`${endDate}T${dropTime || '23:59'}`);

    const availabilityStatus = await Promise.all(vehicles.map(async (vehicle) => {
        // Find conflicting bookings (direct overlap)
        const conflictQuery = {
            vehicle: vehicle._id,
            status: 'confirmed',
            $or: [
                {
                    startDate: { $lte: endDateTime },
                    endDate: { $gte: startDateTime }
                }
            ]
        };
        if (excludeBookingId) conflictQuery._id = { $ne: excludeBookingId };

        const directConflict = await Booking.findOne(conflictQuery);
        if (directConflict) {
            return {
                vehicleId: vehicle._id,
                available: false,
                reason: 'booked',
                bookingNumber: directConflict.bookingNumber
            };
        }

        // Travel Time logic: Check previous and next bookings
        // 1. Check booking finishing before this one
        const previousBooking = await Booking.findOne({
            vehicle: vehicle._id,
            status: { $in: ['confirmed', 'completed'] },
            endDate: { $lte: startDateTime }
        }).sort({ endDate: -1 });

        if (previousBooking) {
            const prevEndDateTime = new Date(previousBooking.endDate);
            if (previousBooking.dropTime) {
                const [hours, minutes] = previousBooking.dropTime.split(':');
                prevEndDateTime.setHours(parseInt(hours), parseInt(minutes));
            }

            const bufferHours = await getTravelTime(previousBooking.dropLocation, pickupLocation);
            const diffHours = (startDateTime - prevEndDateTime) / (1000 * 60 * 60);

            if (diffHours < bufferHours) {
                return {
                    vehicleId: vehicle._id,
                    available: false,
                    reason: 'travel_time_buffer',
                    message: `Needs ${bufferHours}h to reach from ${previousBooking.dropLocation || 'last drop'}`,
                    bookingNumber: previousBooking.bookingNumber
                };
            }
        }

        // 2. Check booking starting after this one
        const nextBooking = await Booking.findOne({
            vehicle: vehicle._id,
            status: 'confirmed',
            startDate: { $gte: endDateTime }
        }).sort({ startDate: 1 });

        if (nextBooking) {
            const nextStartDateTime = new Date(nextBooking.startDate);
            if (nextBooking.pickupTime) {
                const [hours, minutes] = nextBooking.pickupTime.split(':');
                nextStartDateTime.setHours(parseInt(hours), parseInt(minutes));
            }

            const bufferHours = await getTravelTime(dropLocation, nextBooking.pickupLocation);
            const diffHours = (nextStartDateTime - endDateTime) / (1000 * 60 * 60);

            if (diffHours < bufferHours) {
                return {
                    vehicleId: vehicle._id,
                    available: false,
                    reason: 'travel_time_buffer',
                    message: `Needs ${bufferHours}h to reach ${nextBooking.pickupLocation} for next trip`,
                    bookingNumber: nextBooking.bookingNumber
                };
            }
        }

        return {
            vehicleId: vehicle._id,
            available: true
        };
    }));

    return availabilityStatus;
};

// Helper function to check date conflicts
const checkDateConflict = async (vehicleId, startDate, endDate, excludeBookingId = null) => {
    const query = {
        vehicle: vehicleId,
        status: 'confirmed',
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
            status: 'confirmed'
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

// @route   GET /api/bookings/availability-check
// @desc    Check all vehicles availability for a given slot
// @access  Private
router.get('/availability-check', protect, async (req, res) => {
    try {
        const { startDate, endDate, pickupTime, dropTime, pickupLocation, dropLocation, excludeBookingId } = req.query;

        console.log('Availability check params:', { startDate, endDate, pickupTime, dropTime, pickupLocation, dropLocation });

        if (!startDate || !endDate) {
            return res.status(400).json({
                success: false,
                message: 'Start date and end date are required'
            });
        }

        const availability = await checkVehicleAvailability(
            startDate,
            endDate,
            pickupTime,
            dropTime,
            pickupLocation,
            dropLocation,
            excludeBookingId
        );

        res.status(200).json({
            success: true,
            availability
        });
    } catch (error) {
        console.error('Availability check error:', error);
        res.status(500).json({
            success: false,
            message: 'Error checking availability',
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

        // Check for date conflicts and travel time
        const availability = await checkVehicleAvailability(
            startDate,
            endDate,
            pickupTime,
            dropTime,
            pickupLocation,
            dropLocation
        );

        const vStatus = availability.find(a => a.vehicleId.toString() === vehicle.toString());
        if (!vStatus || !vStatus.available) {
            const reason = vStatus?.reason === 'travel_time_buffer' ? 'requires travel time' : 'is already booked';
            const message = vStatus?.message ? ` (${vStatus.message})` : '';
            return res.status(400).json({
                success: false,
                message: `Vehicle ${reason} for these dates${message}`,
                conflictingBooking: vStatus?.bookingNumber
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

        // No longer updating vehicle status to 'booked' as per requirement

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
        if (req.body.startDate || req.body.endDate || req.body.vehicle || req.body.pickupTime || req.body.dropTime || req.body.pickupLocation || req.body.dropLocation) {
            const vehicleId = req.body.vehicle || booking.vehicle;
            const startDate = req.body.startDate || booking.startDate;
            const endDate = req.body.endDate || booking.endDate;
            const pickupTime = req.body.pickupTime || booking.pickupTime;
            const dropTime = req.body.dropTime || booking.dropTime;
            const pickupLocation = req.body.pickupLocation || booking.pickupLocation;
            const dropLocation = req.body.dropLocation || booking.dropLocation;

            const availability = await checkVehicleAvailability(
                startDate,
                endDate,
                pickupTime,
                dropTime,
                pickupLocation,
                dropLocation,
                req.params.id
            );

            const vStatus = availability.find(a => a.vehicleId.toString() === vehicleId.toString());
            if (!vStatus || !vStatus.available) {
                const reason = vStatus?.reason === 'travel_time_buffer' ? 'requires travel time' : 'is already booked';
                const message = vStatus?.message ? ` (${vStatus.message})` : '';
                return res.status(400).json({
                    success: false,
                    message: `Vehicle ${reason} for these dates${message}`,
                    conflictingBooking: vStatus?.bookingNumber
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

        // No longer reverting to 'available' as per requirement

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
