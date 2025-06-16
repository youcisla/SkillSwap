const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

async function fixAdminPassword() {
  try {
    console.log('🔗 Connecting to MongoDB...');
    
    await mongoose.connect('mongodb://localhost:27017/skillshare', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('✅ Connected to MongoDB');
    
    // Find the admin user
    const admin = await User.findOne({ email: 'admin@admin.admin' });
    
    if (!admin) {
      console.log('❌ Admin user not found!');
      return;
    }
    
    console.log('👤 Found admin user:', admin.email);
    
    // Set new password directly (this will trigger the pre-save hook)
    const newPassword = 'Admin123!';
    admin.password = newPassword;
    
    console.log('🔐 Updating password...');
    await admin.save();
    
    console.log('✅ Password updated successfully!');
    
    // Test the new password
    console.log('🔍 Testing new password...');
    const isValid = await admin.comparePassword(newPassword);
    console.log(`🔐 Password test result: ${isValid ? '✅ VALID' : '❌ INVALID'}`);
    
    if (isValid) {
      console.log('🎉 Admin password fixed! You can now login with:');
      console.log('📧 Email: admin@admin.admin');
      console.log('🔑 Password: Admin123!');
    }
    
  } catch (error) {
    console.error('❌ Error fixing admin password:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
}

// Run the fix
fixAdminPassword();
