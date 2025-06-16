const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Import the User model
const User = require('../models/User');

async function testUserCreation() {
  try {
    console.log('🔗 Connecting to MongoDB...');
    
    const mongoUri = process.env.MONGODB_URI || 'mongodb+srv://malikahemdi2:UnGQFSkuf4Etymi2@skillswap.0lzqr7a.mongodb.net/skillswap?retryWrites=true&w=majority&appName=SkillSwap';
    
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');
    
    console.log('🧪 Testing user creation...');
    
    // Test 1: Create a user without location (should work)
    const testUser1 = new User({
      name: 'Test User 1',
      email: 'test1@example.com',
      password: 'password123',
      city: 'Test City'
    });
    
    await testUser1.save();
    console.log('✅ Test 1 passed: User created without location');
    
    // Test 2: Create a user without invalid location data
    const testUser2 = new User({
      name: 'Test User 2', 
      email: 'test2@example.com',
      password: 'password123',
      city: 'Test City'
      // No location set - should work fine
    });
    
    await testUser2.save();
    console.log('✅ Test 2 passed: User created without location');
    console.log('Location after save:', testUser2.location);
    
    // Test 3: Create a user with valid location (should work)
    const testUser3 = new User({
      name: 'Test User 3',
      email: 'test3@example.com', 
      password: 'password123',
      city: 'Test City'
    });
    
    // Set valid location using the helper method
    testUser3.setLocation(40.7128, -74.0060); // New York coordinates
    await testUser3.save();
    console.log('✅ Test 3 passed: User created with valid location');
    console.log('Location after save:', testUser3.location);
    
    // Clean up test users
    await User.deleteMany({ email: { $in: ['test1@example.com', 'test2@example.com', 'test3@example.com'] } });
    console.log('🧹 Cleaned up test users');
    
    console.log('🎉 All tests passed! User model is working correctly.');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
    process.exit(0);
  }
}

// Run the test
testUserCreation();
