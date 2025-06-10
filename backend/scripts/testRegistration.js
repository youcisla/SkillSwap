// Test Registration Script
const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/skillswap';

async function testRegistration() {
  try {
    console.log('🔗 Connecting to MongoDB for registration test...');
    
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 10000,
    });
    
    console.log('✅ Connected successfully');
    
    // Test user data
    const testUser = {
      name: 'Test User',
      email: 'test@example.com',
      password: 'testpassword123',
      city: 'Test City'
    };
    
    console.log('🧪 Testing user creation...');
    
    // Check if test user already exists
    const existingUser = await User.findOne({ email: testUser.email });
    if (existingUser) {
      console.log('🗑️  Removing existing test user...');
      await User.deleteOne({ email: testUser.email });
    }
    
    // Create new test user
    const user = new User(testUser);
    await user.save();
    
    console.log('✅ Test user created successfully!');
    console.log('👤 User ID:', user._id);
    console.log('📧 Email:', user.email);
    console.log('🏙️  City:', user.city);
    
    // Verify user was saved
    const savedUser = await User.findById(user._id);
    console.log('✓ User verification successful');
    
    // Clean up - remove test user
    await User.deleteOne({ _id: user._id });
    console.log('🧹 Test user cleaned up');
    
    // Check collections
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('📁 Available collections:', collections.map(c => c.name));
    
    console.log('🎉 Registration test completed successfully!');
    
  } catch (error) {
    console.error('❌ Registration test failed:', error);
    console.error('📊 Error details:', {
      name: error.name,
      message: error.message
    });
  } finally {
    await mongoose.connection.close();
    console.log('🔒 Database connection closed');
  }
}

// Run the test
if (require.main === module) {
  testRegistration();
}

module.exports = testRegistration;
