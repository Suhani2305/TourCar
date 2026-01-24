const nodemailer = require('nodemailer');

// Create transporter
const createTransporter = () => {
    return nodemailer.createTransporter({
        host: process.env.EMAIL_HOST,
        port: process.env.EMAIL_PORT,
        secure: false,
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASSWORD
        }
    });
};

// Send booking confirmation email
const sendBookingConfirmation = async (booking, customerEmail) => {
    try {
        const transporter = createTransporter();

        const mailOptions = {
            from: process.env.EMAIL_FROM,
            to: customerEmail,
            subject: `Booking Confirmation - ${booking.bookingNumber}`,
            html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #1e3a8a;">🎉 Booking Confirmed!</h2>
          <p>Dear ${booking.customerName},</p>
          <p>Your booking has been confirmed. Here are the details:</p>
          
          <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Booking Number:</strong> ${booking.bookingNumber}</p>
            <p><strong>Vehicle:</strong> ${booking.vehicle.vehicleNumber} (${booking.vehicle.type})</p>
            <p><strong>Pickup:</strong> ${booking.pickupLocation} ${booking.pickupTime ? `at ${booking.pickupTime}` : ''}</p>
            <p><strong>Start Date:</strong> ${new Date(booking.startDate).toLocaleDateString()}</p>
            <p><strong>End Date:</strong> ${new Date(booking.endDate).toLocaleDateString()}</p>
            ${booking.totalAmount ? `<p><strong>Total Amount:</strong> ₹${booking.totalAmount}</p>` : ''}
            ${booking.advanceAmount ? `<p><strong>Advance Paid:</strong> ₹${booking.advanceAmount}</p>` : ''}
          </div>
          
          <p>Thank you for choosing our service!</p>
          <p style="color: #6b7280; font-size: 12px;">This is an automated email. Please do not reply.</p>
        </div>
      `
        };

        await transporter.sendMail(mailOptions);
        console.log('Booking confirmation email sent to:', customerEmail);
        return true;
    } catch (error) {
        console.error('Error sending booking confirmation email:', error);
        return false;
    }
};

// Send booking reminder
const sendBookingReminder = async (booking, customerEmail) => {
    try {
        const transporter = createTransporter();

        const mailOptions = {
            from: process.env.EMAIL_FROM,
            to: customerEmail,
            subject: `Reminder: Upcoming Booking - ${booking.bookingNumber}`,
            html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #1e3a8a;">⏰ Booking Reminder</h2>
          <p>Dear ${booking.customerName},</p>
          <p>This is a reminder for your upcoming booking tomorrow:</p>
          
          <div style="background: #fef3c7; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Booking Number:</strong> ${booking.bookingNumber}</p>
            <p><strong>Vehicle:</strong> ${booking.vehicle.vehicleNumber}</p>
            <p><strong>Pickup:</strong> ${booking.pickupLocation} ${booking.pickupTime ? `at ${booking.pickupTime}` : ''}</p>
            <p><strong>Date:</strong> ${new Date(booking.startDate).toLocaleDateString()}</p>
          </div>
          
          <p>Please be ready at the pickup location on time.</p>
          <p style="color: #6b7280; font-size: 12px;">This is an automated reminder.</p>
        </div>
      `
        };

        await transporter.sendMail(mailOptions);
        console.log('Booking reminder email sent to:', customerEmail);
        return true;
    } catch (error) {
        console.error('Error sending booking reminder email:', error);
        return false;
    }
};

// Send user approval email
const sendUserApprovalEmail = async (user) => {
    try {
        const transporter = createTransporter();

        const mailOptions = {
            from: process.env.EMAIL_FROM,
            to: user.email,
            subject: 'Account Approved - Tour Management System',
            html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #27ae60;">✅ Account Approved!</h2>
          <p>Dear ${user.name},</p>
          <p>Great news! Your account has been approved by the administrator.</p>
          
          <div style="background: #d1fae5; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p>You can now login and access all features of the Tour Management System.</p>
            <p><strong>Email:</strong> ${user.email}</p>
            <p><strong>Role:</strong> ${user.role === 'superadmin' ? 'Super Admin' : 'User'}</p>
          </div>
          
          <p>Welcome aboard!</p>
          <p style="color: #6b7280; font-size: 12px;">This is an automated email.</p>
        </div>
      `
        };

        await transporter.sendMail(mailOptions);
        console.log('User approval email sent to:', user.email);
        return true;
    } catch (error) {
        console.error('Error sending user approval email:', error);
        return false;
    }
};

// Send welcome email on registration
const sendWelcomeEmail = async (user) => {
    try {
        const transporter = createTransporter();

        const mailOptions = {
            from: process.env.EMAIL_FROM,
            to: user.email,
            subject: 'Welcome to Tour Management System',
            html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #1e3a8a;">🎉 Welcome!</h2>
          <p>Dear ${user.name},</p>
          <p>Thank you for registering with Tour Management System.</p>
          
          <div style="background: #dbeafe; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p>Your account is currently <strong>pending approval</strong> from the administrator.</p>
            <p>You will receive another email once your account is approved.</p>
          </div>
          
          <p>Thank you for your patience!</p>
          <p style="color: #6b7280; font-size: 12px;">This is an automated email.</p>
        </div>
      `
        };

        await transporter.sendMail(mailOptions);
        console.log('Welcome email sent to:', user.email);
        return true;
    } catch (error) {
        console.error('Error sending welcome email:', error);
        return false;
    }
};

module.exports = {
    sendBookingConfirmation,
    sendBookingReminder,
    sendUserApprovalEmail,
    sendWelcomeEmail
};
