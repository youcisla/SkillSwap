const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

// Database connection
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/skillshare');
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

// Check admin users
const checkAdminUsers = async () => {
  try {
    console.log('🔍 Checking admin users in database...\n');
    
    // Find all admin users
    const adminUsers = await User.find({ 
      role: { $in: ['admin', 'super-admin'] } 
    }).select('name email role permissions isActive createdAt');
    
    console.log(`Found ${adminUsers.length} admin users:`);
    
    for (const user of adminUsers) {
      console.log('\n-----------------------------------');
      console.log('👤 User:', user.name);
      console.log('📧 Email:', user.email);
      console.log('🛡️  Role:', user.role);
      console.log('🔑 Permissions:', user.permissions);
      console.log('✅ Active:', user.isActive);
      console.log('📅 Created:', user.createdAt);
    }
    
    // Test login for specific admin
    const testEmail = 'admin@admin.admin';
    const testPassword = 'Test123!';
    
    console.log('\n🧪 Testing login for:', testEmail);
    
    const adminUser = await User.findOne({ email: testEmail });
    
    if (!adminUser) {
      console.log('❌ User not found with email:', testEmail);
      return;
    }
    
    console.log('✅ User found:', adminUser.name);
    console.log('🔐 Stored password hash:', adminUser.password ? 'Present' : 'Missing');
    console.log('🛡️  Role:', adminUser.role);
    console.log('✅ Active:', adminUser.isActive);
    
    // Test password comparison
    if (adminUser.password) {
      try {
        const isPasswordValid = await bcrypt.compare(testPassword, adminUser.password);
        console.log('🔑 Password test result:', isPasswordValid ? '✅ VALID' : '❌ INVALID');
        
        if (!isPasswordValid) {
          console.log('\n🔧 Attempting to reset password...');
          const newHashedPassword = await bcrypt.hash(testPassword, 10);
          adminUser.password = newHashedPassword;
          await adminUser.save();
          console.log('✅ Password reset successfully');
          
          // Test again
          const retestResult = await bcrypt.compare(testPassword, adminUser.password);
          console.log('🔑 Retest result:', retestResult ? '✅ VALID' : '❌ STILL INVALID');
        }
      } catch (error) {
        console.error('❌ Password comparison error:', error);
      }
    } else {
      console.log('❌ No password hash stored for user');
    }
    
  } catch (error) {
    console.error('❌ Error checking admin users:', error);
  }
};

// Test the auth login endpoint logic
const testAuthLogic = async () => {
  try {
    console.log('\n🧪 Testing auth logic...\n');
    
    const email = 'admin@admin.admin';
    const password = 'Test123!';
    
    // Simulate the login process
    console.log('1. Finding user by email...');
    const user = await User.findOne({ email: email.toLowerCase() });
    
    if (!user) {
      console.log('❌ User not found');
      return;
    }
    
    console.log('✅ User found:', user.name);
    
    console.log('2. Checking if user is active...');
    if (!user.isActive) {
      console.log('❌ User is not active');
      return;
    }
    
    console.log('✅ User is active');
    
    console.log('3. Comparing password...');
    const isPasswordValid = await user.comparePassword(password);
    console.log('Password comparison result:', isPasswordValid ? '✅ VALID' : '❌ INVALID');
    
    if (isPasswordValid) {
      console.log('4. ✅ Login should succeed!');
      console.log('User data that would be returned:');
      console.log('- ID:', user._id);
      console.log('- Name:', user.name);
      console.log('- Email:', user.email);
      console.log('- Role:', user.role);
      console.log('- Permissions:', user.permissions);
    } else {
      console.log('4. ❌ Login should fail - password mismatch');
    }
    
  } catch (error) {
    console.error('❌ Auth logic test error:', error);
  }
};

// Main function
const debugAdminLogin = async () => {
  try {
    await connectDB();
    await checkAdminUsers();
    await testAuthLogic();
  } catch (error) {
    console.error('❌ Debug failed:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
  }
};

// Run the debug
if (require.main === module) {
  debugAdminLogin();
}

module.exports = { debugAdminLogin };
