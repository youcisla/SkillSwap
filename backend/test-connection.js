// Test script to verify database connection
const mongoose = require('mongoose');
require('dotenv').config();

async function testConnection() {
  try {
    console.log('🧪 Testing database connection...');
    
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/skillswap';
    
    await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });

    console.log('✅ MongoDB connection successful');
    
    // Test ObjectId creation
    const testId = new mongoose.Types.ObjectId();
    console.log('✅ ObjectId creation works:', testId);
    
    await mongoose.connection.close();
    console.log('✅ Connection closed successfully');
    
  } catch (error) {
    console.error('❌ Connection test failed:', error);
    process.exit(1);
  }
}

testConnection();
