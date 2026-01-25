const express = require('express');
const router = express.Router();
const Booking = require('../models/Booking');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

// @route   GET /api/reports/revenue
// @desc    Get revenue report
// @access  Private
router.get('/revenue', protect, async (req, res) => {
    try {
        const { startDate, endDate, viewMode, userId } = req.query;

        let query = {
            createdAt: {
                $gte: new Date(startDate),
                $lte: new Date(endDate)
            }
        };

        // Role-based filtering
        if (req.user.role !== 'superadmin') {
            query.createdBy = req.user._id;
        } else {
            if (viewMode === 'all' && userId) {
                query.createdBy = userId;
            } else if (viewMode === 'my') {
                query.createdBy = req.user._id;
            }
        }

        const bookings = await Booking.find(query);

        // Calculate revenue metrics
        const totalRevenue = bookings.reduce((sum, b) => sum + (b.amount || 0), 0);
        const bookingCount = bookings.length;
        const averageBookingValue = bookingCount > 0 ? totalRevenue / bookingCount : 0;

        // Daily revenue breakdown
        const dailyRevenue = {};
        bookings.forEach(booking => {
            const date = booking.createdAt.toISOString().split('T')[0];
            if (!dailyRevenue[date]) {
                dailyRevenue[date] = 0;
            }
            dailyRevenue[date] += booking.amount || 0;
        });

        const dailyRevenueArray = Object.entries(dailyRevenue).map(([date, revenue]) => ({
            date,
            revenue
        })).sort((a, b) => new Date(a.date) - new Date(b.date));

        // Growth rate (compare with previous period)
        const previousPeriodStart = new Date(startDate);
        const previousPeriodEnd = new Date(endDate);
        const daysDiff = Math.ceil((new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24));
        previousPeriodStart.setDate(previousPeriodStart.getDate() - daysDiff);
        previousPeriodEnd.setDate(previousPeriodEnd.getDate() - daysDiff);

        const previousQuery = {
            ...query,
            createdAt: {
                $gte: previousPeriodStart,
                $lte: previousPeriodEnd
            }
        };

        const previousBookings = await Booking.find(previousQuery);
        const previousRevenue = previousBookings.reduce((sum, b) => sum + (b.amount || 0), 0);
        const growthRate = previousRevenue > 0
            ? ((totalRevenue - previousRevenue) / previousRevenue * 100).toFixed(2)
            : 0;

        res.status(200).json({
            success: true,
            totalRevenue,
            bookingCount,
            averageBookingValue: Math.round(averageBookingValue),
            dailyRevenue: dailyRevenueArray,
            growthRate
        });
    } catch (error) {
        console.error('Error fetching revenue report:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching revenue report',
            error: error.message
        });
    }
});

// @route   GET /api/reports/booking-analytics
// @desc    Get booking analytics
// @access  Private
router.get('/booking-analytics', protect, async (req, res) => {
    try {
        const { startDate, endDate, viewMode, userId } = req.query;

        let query = {
            createdAt: {
                $gte: new Date(startDate),
                $lte: new Date(endDate)
            }
        };

        // Role-based filtering
        if (req.user.role !== 'superadmin') {
            query.createdBy = req.user._id;
        } else {
            if (viewMode === 'all' && userId) {
                query.createdBy = userId;
            } else if (viewMode === 'my') {
                query.createdBy = req.user._id;
            }
        }

        const bookings = await Booking.find(query);

        // Booking status distribution
        const byStatus = {
            pending: 0,
            confirmed: 0,
            cancelled: 0,
            completed: 0
        };

        bookings.forEach(booking => {
            byStatus[booking.status] = (byStatus[booking.status] || 0) + 1;
        });

        // Top customers
        const customerBookings = {};
        bookings.forEach(booking => {
            if (!customerBookings[booking.customerName]) {
                customerBookings[booking.customerName] = {
                    name: booking.customerName,
                    bookings: 0,
                    revenue: 0
                };
            }
            customerBookings[booking.customerName].bookings++;
            customerBookings[booking.customerName].revenue += booking.amount || 0;
        });

        const topCustomers = Object.values(customerBookings)
            .sort((a, b) => b.bookings - a.bookings)
            .slice(0, 10);

        res.status(200).json({
            success: true,
            totalBookings: bookings.length,
            byStatus,
            topCustomers
        });
    } catch (error) {
        console.error('Error fetching booking analytics:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching booking analytics',
            error: error.message
        });
    }
});

// @route   GET /api/reports/vehicle-utilization
// @desc    Get vehicle utilization report
// @access  Private
router.get('/vehicle-utilization', protect, async (req, res) => {
    try {
        const { startDate, endDate, viewMode, userId } = req.query;

        let query = {
            createdAt: {
                $gte: new Date(startDate),
                $lte: new Date(endDate)
            }
        };

        // Role-based filtering
        if (req.user.role !== 'superadmin') {
            query.createdBy = req.user._id;
        } else {
            if (viewMode === 'all' && userId) {
                query.createdBy = userId;
            } else if (viewMode === 'my') {
                query.createdBy = req.user._id;
            }
        }

        const bookings = await Booking.find(query).populate('vehicle', 'vehicleNumber type');

        // Vehicle utilization metrics
        const vehicleStats = {};
        bookings.forEach(booking => {
            const vehicleNumber = booking.vehicle?.vehicleNumber || booking.vehicleNumber;
            if (!vehicleStats[vehicleNumber]) {
                vehicleStats[vehicleNumber] = {
                    vehicleNumber,
                    bookings: 0,
                    revenue: 0,
                    days: 0
                };
            }
            vehicleStats[vehicleNumber].bookings++;
            vehicleStats[vehicleNumber].revenue += booking.amount || 0;

            // Calculate days (approximation)
            if (booking.startDate && booking.endDate) {
                const days = Math.ceil((new Date(booking.endDate) - new Date(booking.startDate)) / (1000 * 60 * 60 * 24));
                vehicleStats[vehicleNumber].days += days;
            }
        });

        // Calc utilization rate (days used / total days in period)
        const totalDays = Math.ceil((new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24));
        const vehicles = Object.values(vehicleStats).map(v => ({
            ...v,
            utilizationRate: totalDays > 0 ? (v.days / totalDays * 100) : 0
        }));

        const topVehicles = vehicles.sort((a, b) => b.revenue - a.revenue).slice(0, 10);

        res.status(200).json({
            success: true,
            vehicles,
            topVehicles
        });
    } catch (error) {
        console.error('Error fetching vehicle utilization:', error);
        res.status(500).json({
            success: false,
            message: 'Error fetching vehicle utilization',
            error: error.message
        });
    }
});

module.exports = router;
