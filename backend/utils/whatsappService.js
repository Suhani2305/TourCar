const twilio = require('twilio');

// Twilio WhatsApp configuration
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const whatsappNumber = process.env.TWILIO_WHATSAPP_FROM || 'whatsapp:+14155238886'; // Twilio Sandbox

let client;
if (accountSid && authToken) {
    client = twilio(accountSid, authToken);
    console.log('✅ Twilio WhatsApp client initialized');
} else {
    console.log('⚠️ Twilio credentials not found. WhatsApp notifications disabled.');
}

// Send WhatsApp notification for 48-hour booking reminder
const sendBookingReminder = async (booking, customerPhone) => {
    try {
        if (!client) {
            console.log('⚠️ Twilio not configured. WhatsApp notification skipped.');
            return false;
        }

        // Format phone number for WhatsApp (add country code if needed)
        let formattedPhone = customerPhone.trim();

        // If phone doesn't start with +, assume India and add +91
        if (!formattedPhone.startsWith('+')) {
            formattedPhone = `+91${formattedPhone}`;
        }

        // Add whatsapp: prefix
        if (!formattedPhone.startsWith('whatsapp:')) {
            formattedPhone = `whatsapp:${formattedPhone}`;
        }

        const pickupDate = new Date(booking.pickupDate).toLocaleDateString('en-IN', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });

        const message = `🚗 *Tour Booking Reminder*

Hello ${booking.customerName}! 👋

Your upcoming tour booking is approaching:

📋 *Booking Details:*
• Booking ID: ${booking.bookingNumber}
• Vehicle: ${booking.vehicleNumber}
• Pickup Date: ${pickupDate}
• Pickup Time: ${booking.pickupTime}
• Destination: ${booking.destination}
• Amount: ₹${booking.amount?.toLocaleString()}

⏰ *Reminder: Your booking is within 48 hours!*

Please be ready for your journey.

Thank you! 🙏`;

        const result = await client.messages.create({
            from: whatsappNumber,
            to: formattedPhone,
            body: message
        });

        console.log('✅ WhatsApp reminder sent to', customerPhone, '- SID:', result.sid);
        return true;
    } catch (error) {
        console.error('❌ Error sending WhatsApp reminder to', customerPhone, ':', error.message);
        return false;
    }
};

// Send booking confirmation via WhatsApp
const sendBookingConfirmationWhatsApp = async (booking, customerPhone) => {
    try {
        if (!client) {
            console.log('⚠️ Twilio not configured. WhatsApp notification skipped.');
            return false;
        }

        let formattedPhone = customerPhone.trim();
        if (!formattedPhone.startsWith('+')) {
            formattedPhone = `+91${formattedPhone}`;
        }
        if (!formattedPhone.startsWith('whatsapp:')) {
            formattedPhone = `whatsapp:${formattedPhone}`;
        }

        const pickupDate = new Date(booking.pickupDate).toLocaleDateString('en-IN');
        const dropDate = new Date(booking.dropDate).toLocaleDateString('en-IN');

        const message = `🎉 *Booking Confirmed!*

Hello ${booking.customerName}! 👋

Your tour booking has been successfully confirmed.

📋 *Booking Details:*
• Booking ID: ${booking.bookingNumber}
• Vehicle: ${booking.vehicleNumber}
• Pickup: ${pickupDate} at ${booking.pickupTime}
• Drop: ${dropDate} at ${booking.dropTime}
• Destination: ${booking.destination}
• Amount: ₹${booking.amount?.toLocaleString()}

We'll send you a reminder 48 hours before your journey.

Thank you for choosing our service! 🙏`;

        const result = await client.messages.create({
            from: whatsappNumber,
            to: formattedPhone,
            body: message
        });

        console.log('✅ WhatsApp confirmation sent to', customerPhone, '- SID:', result.sid);
        return true;
    } catch (error) {
        console.error('❌ Error sending WhatsApp confirmation to', customerPhone, ':', error.message);
        return false;
    }
};

module.exports = {
    sendBookingReminder,
    sendBookingConfirmationWhatsApp
};
