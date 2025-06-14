const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

mongoose.connect('mongodb://localhost:27017/skillshare').then(async () => {
  try {
    const admin = await User.findOne({ email: 'admin@admin.admin' });
    if (admin) {
      console.log('Admin user found:');
      console.log('Email:', admin.email);
      console.log('Name:', admin.name);
      console.log('Role:', admin.role);
      console.log('Permissions:', admin.permissions);
      console.log('isActive:', admin.isActive);
      console.log('Password hash:', admin.password);
      
      // Test password verification
      console.log('\n🔍 Testing password verification...');
      const testPassword = 'Admin123!';
      try {
        const isValidPassword = await bcrypt.compare(testPassword, admin.password);
        console.log(`🔐 Password "${testPassword}" is ${isValidPassword ? '✅ VALID' : '❌ INVALID'}`);
        
        if (!isValidPassword) {
          console.log('🔧 Creating new hash for testing...');
          const newHash = await bcrypt.hash(testPassword, 10);
          console.log('🔧 New hash:', newHash);
          const testNewHash = await bcrypt.compare(testPassword, newHash);
          console.log('🔧 New hash validation:', testNewHash ? '✅ WORKS' : '❌ FAILS');
        }
      } catch (error) {
        console.error('❌ Error testing password:', error);
      }
    } else {
      console.log('No admin user found with email: admin@admin.admin');
    }
    
    // Also check for other admin emails
    const allAdmins = await User.find({ role: { $in: ['admin', 'super-admin'] } });
    console.log('\nAll admin users:');
    allAdmins.forEach(admin => {
      console.log(`- ${admin.email} (${admin.role})`);
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    mongoose.connection.close();
  }
});
