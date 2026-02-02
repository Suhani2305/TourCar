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

        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);

        let query = {
            startDate: {
                $gte: start,
                $lte: end
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

        const bookings = await Booking.find(query).populate('vehicle', 'vehicleNumber model brand registrationNumber');

        // Calculate revenue metrics (ONLY COMPLETED TRIPS)
        const completedBookings = bookings.filter(b => b.status === 'completed');
        const totalRevenue = completedBookings.reduce((sum, b) => sum + (b.totalAmount || 0), 0);
        const bookingCount = bookings.length; // Count all non-cancelled? Or all? Usually all for analytics.
        const averageBookingValue = completedBookings.length > 0 ? totalRevenue / completedBookings.length : 0;

        // Daily revenue breakdown
        const dailyRevenue = {};
        bookings.forEach(booking => {
            if (booking.status === 'completed') {
                const date = booking.startDate.toISOString().split('T')[0];
                if (!dailyRevenue[date]) {
                    dailyRevenue[date] = 0;
                }
                dailyRevenue[date] += booking.totalAmount || 0;
            }
        });

        const dailyRevenueArray = Object.entries(dailyRevenue).map(([date, revenue]) => ({
            date,
            revenue
        })).sort((a, b) => new Date(a.date) - new Date(b.date));

        // Growth rate (compare with identical duration before current period)
        const durationMs = end - start;
        const previousPeriodEnd = new Date(start.getTime() - 1);
        const previousPeriodStart = new Date(previousPeriodEnd.getTime() - durationMs);

        const previousQuery = {
            ...query,
            startDate: {
                $gte: previousPeriodStart,
                $lte: previousPeriodEnd
            }
        };

        const previousBookings = await Booking.find(previousQuery);
        const prevComp = previousBookings.filter(b => b.status === 'completed');
        const previousRevenue = prevComp.reduce((sum, b) => sum + (b.totalAmount || 0), 0);

        // Calculate growth rate as a number
        let growthRate = 0;
        if (previousRevenue > 0) {
            growthRate = parseFloat(((totalRevenue - previousRevenue) / previousRevenue * 100).toFixed(2));
        } else if (totalRevenue > 0) {
            growthRate = 100;
        }

        res.status(200).json({
            success: true,
            totalRevenue,
            bookingCount,
            averageBookingValue: Math.round(averageBookingValue),
            dailyRevenue: dailyRevenueArray,
            growthRate,
            bookings: bookings.sort((a, b) => new Date(b.startDate) - new Date(a.startDate))
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

        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);

        let query = {
            startDate: {
                $gte: start,
                $lte: end
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
            customerBookings[booking.customerName].revenue += booking.totalAmount || 0;
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

        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);

        let query = {
            startDate: {
                $gte: start,
                $lte: end
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
            vehicleStats[vehicleNumber].revenue += booking.totalAmount || 0;

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
