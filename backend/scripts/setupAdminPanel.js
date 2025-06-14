const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

// Database connection
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/skillshare', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  }
};

// Create initial admin user
const createAdminUser = async () => {
  try {
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@admin.admin';
    const adminPassword = process.env.ADMIN_PASSWORD || 'Admin123!';
    const adminName = process.env.ADMIN_NAME || 'System Administrator';

    // Check if admin user already exists
    const existingAdmin = await User.findOne({ email: adminEmail });
    
    if (existingAdmin) {
      console.log('ℹ️  Admin user already exists:', adminEmail);
      
      // Update existing admin with full permissions if needed
      if (existingAdmin.role !== 'super-admin') {
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
        await existingAdmin.save();
        console.log('✅ Updated existing user to super-admin');
      }
      
      return existingAdmin;
    }

    // Create new admin user
    const hashedPassword = await bcrypt.hash(adminPassword, 10);
    
    const adminUser = new User({
      name: adminName,
      email: adminEmail,
      password: hashedPassword,
      city: 'System',
      bio: 'System Administrator with full access to manage the platform',
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
      isActive: true,
      lastActive: new Date()
    });

    await adminUser.save();
    
    console.log('🎉 Super admin user created successfully!');
    console.log('📧 Email:', adminEmail);
    console.log('🔑 Password:', adminPassword);
    console.log('⚠️  Please change the default password after first login!');
    
    return adminUser;
  } catch (error) {
    console.error('❌ Error creating admin user:', error);
    throw error;
  }
};

// Create additional admin users
const createAdditionalAdmins = async () => {
  const additionalAdmins = [
    {
      name: 'Content Moderator',
      email: 'moderator@skillshare.com',
      password: 'moderator123',
      role: 'admin',
      permissions: ['manage_content', 'view_analytics', 'manage_users']
    },
    {
      name: 'User Manager',
      email: 'usermanager@skillshare.com',
      password: 'usermanager123',
      role: 'admin',
      permissions: ['manage_users', 'manage_sessions', 'view_analytics']
    }
  ];

  for (const adminData of additionalAdmins) {
    try {
      const existingUser = await User.findOne({ email: adminData.email });
      
      if (!existingUser) {
        const hashedPassword = await bcrypt.hash(adminData.password, 10);
        
        const newAdmin = new User({
          ...adminData,
          password: hashedPassword,
          city: 'System',
          bio: `${adminData.name} - Limited admin access`,
          isActive: true,
          lastActive: new Date()
        });

        await newAdmin.save();
        console.log(`✅ Created admin user: ${adminData.email}`);
      } else {
        console.log(`ℹ️  Admin user already exists: ${adminData.email}`);
      }
    } catch (error) {
      console.error(`❌ Error creating admin ${adminData.email}:`, error);
    }
  }
};

// Display admin panel access instructions
const displayInstructions = () => {
  console.log('\n🎛️  ADMIN PANEL ACCESS INSTRUCTIONS');
  console.log('=====================================');
  console.log('');
  console.log('1. 📱 Login to the app with any admin credentials above');
  console.log('2. 👤 Go to your Profile screen');
  console.log('3. 🛡️  Look for the "Admin Dashboard" button (visible only to admins)');
  console.log('4. 🎯 Click to access the comprehensive admin panel');
  console.log('');
  console.log('🔧 ADMIN PANEL FEATURES:');
  console.log('• 📊 Dashboard - Overview statistics and metrics');
  console.log('• 👥 Users - Manage user accounts, roles, and permissions');
  console.log('• 🎓 Skills - Manage skills, categories, and approvals');
  console.log('• 📅 Sessions - Monitor and manage learning sessions');
  console.log('• 📈 Analytics - Detailed analytics and insights');
  console.log('• 🛡️  Moderation - Content moderation and reports');
  console.log('• ⚙️  Settings - System-wide configuration');
  console.log('');
  console.log('🔐 PERMISSION LEVELS:');
  console.log('• super-admin: Full access to all features');
  console.log('• admin: Limited access based on assigned permissions');
  console.log('• user: No admin access');
  console.log('');
  console.log('⚠️  SECURITY REMINDERS:');
  console.log('• Change default passwords immediately');
  console.log('• Use strong passwords for admin accounts');
  console.log('• Regularly review admin permissions');
  console.log('• Monitor admin activity logs');
  console.log('');
};

// Main setup function
const setupAdminPanel = async () => {
  try {
    console.log('🚀 Setting up Admin Panel...\n');
    
    await connectDB();
    
    console.log('👤 Creating admin users...');
    await createAdminUser();
    
    console.log('\n👥 Creating additional admin users...');
    await createAdditionalAdmins();
    
    displayInstructions();
    
    console.log('✅ Admin panel setup completed successfully!\n');
  } catch (error) {
    console.error('❌ Setup failed:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 Database connection closed');
  }
};

// Run the setup
if (require.main === module) {
  setupAdminPanel();
}

module.exports = { setupAdminPanel, createAdminUser };
