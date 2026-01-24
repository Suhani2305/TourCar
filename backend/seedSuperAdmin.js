const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');
const connectDB = require('./config/database');

// Load environment variables
dotenv.config();

// Connect to MongoDB
connectDB();

const createSuperAdmin = async () => {
    try {
        // Check if super admin already exists
        const existingSuperAdmin = await User.findOne({ role: 'superadmin' });

        if (existingSuperAdmin) {
            console.log('✅ Super Admin already exists:');
            console.log('   Email:', existingSuperAdmin.email);
            console.log('   Name:', existingSuperAdmin.name);
            process.exit(0);
        }

        // Create super admin
        const superAdmin = await User.create({
            name: 'Super Admin',
            email: 'admin@tourmanagement.com',
            password: 'admin123',
            role: 'superadmin',
            status: 'approved', // Super admin is auto-approved
            phone: '9999999999'
        });

        console.log('✅ Super Admin created successfully!');
        console.log('='.repeat(50));
        console.log('📧 Email: admin@tourmanagement.com');
        console.log('🔑 Password: admin123');
        console.log('='.repeat(50));
        console.log('⚠️  Please change the password after first login!');

        process.exit(0);
    } catch (error) {
        console.error('❌ Error creating Super Admin:', error.message);
        process.exit(1);
    }
};

createSuperAdmin();
