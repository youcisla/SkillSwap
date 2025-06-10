// Check Users in Database Script
const mongoose = require('mongoose');
const User = require('../models/User');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/skillswap';

async function checkUsers() {
  try {
    console.log('🔗 Connecting to MongoDB to check users...');
    
    await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 10000,
    });
    
    console.log('✅ Connected successfully');
    console.log('📊 Database name:', mongoose.connection.db.databaseName);
    
    // Count total users
    const userCount = await User.countDocuments();
    console.log(`👥 Total users in database: ${userCount}`);
    
    if (userCount > 0) {
      // Get all users (without passwords)
      const users = await User.find({}, { password: 0 }).limit(10);
      
      console.log('\n📋 Users in database:');
      console.log('========================');
      
      users.forEach((user, index) => {
        console.log(`${index + 1}. Name: ${user.name}`);
        console.log(`   Email: ${user.email}`);
        console.log(`   City: ${user.city}`);
        console.log(`   ID: ${user._id}`);
        console.log(`   Created: ${user.createdAt}`);
        console.log(`   Skills to teach: ${user.skillsToTeach.length}`);
        console.log(`   Skills to learn: ${user.skillsToLearn.length}`);
        console.log('   ---');
      });
      
      // Check for the specific user from your login
      const specificUser = await User.findOne({ email: 'azerty@gmail.com' });
      if (specificUser) {
        console.log('\n🎯 Found your registered user:');
        console.log(`   Name: ${specificUser.name}`);
        console.log(`   Email: ${specificUser.email}`);
        console.log(`   City: ${specificUser.city}`);
        console.log(`   ID: ${specificUser._id}`);
        console.log(`   Created: ${specificUser.createdAt}`);
      } else {
        console.log('\n❌ User with email "azerty@gmail.com" not found');
      }
    } else {
      console.log('\n❌ No users found in database');
    }
    
    // Check collections and their document counts
    console.log('\n📁 Collection statistics:');
    const collections = await mongoose.connection.db.listCollections().toArray();
    
    for (const collection of collections) {
      const count = await mongoose.connection.db.collection(collection.name).countDocuments();
      console.log(`   ${collection.name}: ${count} documents`);
    }
    
  } catch (error) {
    console.error('❌ Error checking users:', error);
    console.error('📊 Error details:', {
      name: error.name,
      message: error.message
    });
  } finally {
    await mongoose.connection.close();
    console.log('\n🔒 Database connection closed');
  }
}

// Run the check
if (require.main === module) {
  checkUsers();
}

module.exports = checkUsers;
