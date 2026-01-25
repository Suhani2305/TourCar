const cron = require('node-cron');
const Booking = require('../models/Booking');
const { sendBookingReminder } = require('./whatsappService');

// Check for upcoming bookings and send WhatsApp reminders
const checkUpcomingBookings = async () => {
    try {
        console.log('🔍 Checking for upcoming bookings (48-hour reminders)...');

        const now = new Date();
        const fortyEightHoursLater = new Date(now.getTime() + 48 * 60 * 60 * 1000);

        // Find bookings that are 48 hours away and confirmed
        const upcomingBookings = await Booking.find({
            status: 'confirmed',
            pickupDate: {
                $gte: fortyEightHoursLater,
                $lt: new Date(fortyEightHoursLater.getTime() + 60 * 60 * 1000) // 1-hour window
            },
            reminderSent: { $ne: true } // Not already reminded
        }).populate('vehicle', 'vehicleNumber');

        console.log(`📋 Found ${upcomingBookings.length} bookings needing reminders`);

        for (const booking of upcomingBookings) {
            // Send WhatsApp reminder
            if (booking.customerPhone) {
                const sent = await sendBookingReminder({
                    bookingNumber: booking.bookingNumber,
                    customerName: booking.customerName,
                    vehicleNumber: booking.vehicle?.vehicleNumber || booking.vehicleNumber,
                    pickupDate: booking.pickupDate,
                    pickupTime: booking.pickupTime,
                    destination: booking.destination,
                    amount: booking.amount
                }, booking.customerPhone);

                if (sent) {
                    // Mark as reminded
                    booking.reminderSent = true;
                    await booking.save();
                    console.log(`✅ Reminder sent for booking: ${booking.bookingNumber}`);
                }
            } else {
                console.log(`⚠️ No phone number for booking: ${booking.bookingNumber}`);
            }
        }

        console.log('✅ Booking reminder check completed');
    } catch (error) {
        console.error('❌ Error checking upcoming bookings:', error);
    }
};

// Schedule cron job to run every day at 9:00 AM
const startReminderCron = () => {
    // Run every day at 9:00 AM IST
    cron.schedule('0 9 * * *', () => {
        console.log('⏰ Running daily booking reminder check...');
        checkUpcomingBookings();
    }, {
        timezone: 'Asia/Kolkata'
    });

    console.log('✅ WhatsApp reminder cron job scheduled (Daily at 9:00 AM IST)');

    // Also run immediately on server start for testing
    setTimeout(() => {
        console.log('🔄 Running initial booking reminder check...');
        checkUpcomingBookings();
    }, 5000); // Run after 5 seconds of server start
};

module.exports = {
    startReminderCron,
    checkUpcomingBookings
};
