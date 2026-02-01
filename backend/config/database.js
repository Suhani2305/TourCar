const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    console.log('🔄 Attempting to connect to MongoDB...');
    console.log('📍 URI:', process.env.MONGODB_URI?.substring(0, 50) + '...');

    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
    });

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
    console.log(`📊 Database Name: ${conn.connection.name}`);
  } catch (error) {
    console.error(`❌ Error connecting to MongoDB:`);
    console.error(`   Message: ${error.message}`);

    if (error.message.includes('ENOTFOUND') || error.message.includes('getaddrinfo')) {
      console.error('   💡 Check your internet connection');
    } else if (error.message.includes('Authentication failed')) {
      console.error('   💡 Check MongoDB credentials in .env file');
    } else if (error.message.includes('IP') || error.message.includes('whitelist')) {
      console.error('   💡 Add your IP to MongoDB Atlas whitelist');
      console.error('   💡 Or use 0.0.0.0/0 to allow all IPs (development only)');
    }

    console.error('\n⚠️  Server will continue without database connection');
    console.error('⚠️  API endpoints will not work until MongoDB connects\n');
    // Don't exit, let server run
    // process.exit(1);
  }
};

// Handle connection events
mongoose.connection.on('connected', () => {
  console.log('🔗 Mongoose connected to MongoDB');
});

mongoose.connection.on('error', (err) => {
  console.error(`❌ Mongoose connection error: ${err}`);
});

mongoose.connection.on('disconnected', () => {
  console.log('🔌 Mongoose disconnected from MongoDB');
});

// Graceful shutdown
process.on('SIGINT', async () => {
  await mongoose.connection.close();
  console.log('🛑 MongoDB connection closed due to app termination');
  process.exit(0);
});

module.exports = connectDB;
