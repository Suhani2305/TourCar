const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');
const connectDB = require('./config/database');

// Load environment variables
dotenv.config();

// Connect to MongoDB
connectDB();

const createOrUpdateSuperAdmin = async () => {
    try {
        const adminData = {
            name: 'Vishal (Super Admin)',
            email: 'vp312600@gmail.com',
            password: 'Vishal@26',
            role: 'superadmin',
            status: 'approved',
            phone: '8840206492'
        };

        // 1. First, check if a user with this new email already exists
        let userByEmail = await User.findOne({ email: adminData.email });

        if (userByEmail) {
            console.log('🔄 User with new email already exists. Updating to Super Admin status...');
            userByEmail.name = adminData.name;
            userByEmail.password = adminData.password;
            userByEmail.role = 'superadmin';
            userByEmail.status = 'approved';
            userByEmail.phone = adminData.phone;
            await userByEmail.save();
            console.log('✅ User updated successfully!');
        } else {
            // 2. If not found by email, check if there's any existing superadmin to replace
            let existingAdmin = await User.findOne({ role: 'superadmin' });

            if (existingAdmin) {
                console.log(`🔄 Replacing existing Super Admin (${existingAdmin.email}) with ${adminData.email}...`);
                existingAdmin.name = adminData.name;
                existingAdmin.email = adminData.email;
                existingAdmin.password = adminData.password;
                existingAdmin.phone = adminData.phone;
                existingAdmin.status = 'approved';
                await existingAdmin.save();
                console.log('✅ Super Admin replaced successfully!');
            } else {
                // 3. Create brand new
                console.log('✨ Creating brand new Super Admin...');
                await User.create(adminData);
                console.log('✅ Super Admin created successfully!');
            }
        }

        console.log('='.repeat(50));
        console.log(`📧 Email: ${adminData.email}`);
        console.log(`🔑 Password: ${adminData.password}`);
        console.log(`📱 Phone: ${adminData.phone}`);
        console.log('='.repeat(50));

        process.exit(0);
    } catch (error) {
        console.error('❌ Error in Super Admin seeding:', error.message);
        process.exit(1);
    }
};

createOrUpdateSuperAdmin();
