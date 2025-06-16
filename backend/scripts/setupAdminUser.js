const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const User = require('../models/User');

// Load environment variables
dotenv.config();

async function setupAdminUser() {
  try {
    console.log('🔗 Connecting to MongoDB...');
    
    // Use the same connection string as the main server
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/skillswap';
    console.log('🔗 Using MongoDB URI:', mongoUri.replace(/\/\/[^:]+:[^@]+@/, '//***:***@')); // Hide credentials in logs
    
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('✅ Connected to MongoDB');
    
    const adminEmail = 'admin@admin.admin';
    const adminPassword = process.env.ADMIN_PASSWORD || 'Admin123!';
    
    console.log('🔑 Using admin password from environment:', adminPassword ? '✅ Found' : '❌ Not found');
    
    if (!adminPassword) {
      throw new Error('ADMIN_PASSWORD environment variable is required');
    }
    
    // Check if admin user already exists
    const existingAdmin = await User.findOne({ email: adminEmail });
    
    if (existingAdmin) {
      console.log('👤 Admin user already exists, updating password...');
      
      // Update the existing admin user
      existingAdmin.password = adminPassword; // This will trigger the pre-save hook to hash the password
      existingAdmin.role = 'super-admin';
      existingAdmin.permissions = [
        'manage_users',
        'manage_skills', 
        'manage_sessions',
        'manage_matches',
        'manage_chats',
        'manage_content',
        'view_analytics',
        'system_settings',
        'bulk_actions'
      ];
      existingAdmin.isActive = true;
      
      await existingAdmin.save();
      console.log('✅ Admin user updated successfully');
    } else {
      console.log('👤 Creating new admin user...');
      
      // Create new admin user
      const adminUser = new User({
        name: 'System Administrator',
        email: adminEmail,
        password: adminPassword, // This will be hashed by the pre-save hook
        city: 'System',
        bio: 'System Administrator with full access to all features',
        role: 'super-admin',
        permissions: [
          'manage_users',
          'manage_skills', 
          'manage_sessions',
          'manage_matches',
          'manage_chats',
          'manage_content',
          'view_analytics',
          'system_settings',
          'bulk_actions'
        ],
        isActive: true
      });
      
      await adminUser.save();
      console.log('✅ Admin user created successfully');
    }
    
    // Verify the admin user can login
    console.log('🔍 Verifying admin login...');
    const admin = await User.findOne({ email: adminEmail });
    
    if (admin) {
      const isPasswordValid = await admin.comparePassword(adminPassword);
      console.log(`🔐 Password verification: ${isPasswordValid ? '✅ SUCCESS' : '❌ FAILED'}`);
      
      if (isPasswordValid) {
        console.log('🎉 Admin setup completed successfully!');
        console.log('📧 Email:', adminEmail);
        console.log('🔑 Password:', adminPassword);
        console.log('🛡️  Role:', admin.role);
        console.log('🎯 Permissions:', admin.permissions);
      } else {
        console.log('❌ Password verification failed');
      }
    }
    
  } catch (error) {
    console.error('❌ Error setting up admin user:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
}

// Run the setup
setupAdminUser();
