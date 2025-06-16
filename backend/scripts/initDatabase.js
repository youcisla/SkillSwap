// Database Initialization Script
const mongoose = require('mongoose');
require('dotenv').config();

// Import models to ensure they're registered
const User = require('../models/User');
const Skill = require('../models/Skill');
const Session = require('../models/Session');
const Match = require('../models/Match');
const Chat = require('../models/Chat');
const Message = require('../models/Message');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/skillswap';

async function initializeDatabase() {
  try {
    console.log('🔗 Connecting to MongoDB...');
    console.log('📍 URI:', MONGODB_URI.replace(/:[^:@]*@/, ':****@'));
    
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 10000,
    });
    
    console.log('✅ Connected to MongoDB successfully');
    console.log('📊 Database name:', mongoose.connection.db.databaseName);
    
    // List existing collections
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('📁 Existing collections:', collections.map(c => c.name));
    
    // Create indexes for better performance
    console.log('🔧 Setting up database indexes...');
    
    // User indexes
    await User.collection.createIndex({ email: 1 }, { unique: true });
    console.log('✓ User email index created');
    
    // Skill indexes
    await Skill.collection.createIndex({ name: 1 });
    await Skill.collection.createIndex({ category: 1 });
    console.log('✓ Skill indexes created');
    
    // Session indexes
    await Session.collection.createIndex({ 'skill': 1 });
    await Session.collection.createIndex({ 'tutor': 1 });
    await Session.collection.createIndex({ 'dateTime': 1 });
    console.log('✓ Session indexes created');
    
    // Match indexes
    await Match.collection.createIndex({ 'user1': 1, 'user2': 1 }, { unique: true });
    console.log('✓ Match indexes created');
    
    // Chat and Message indexes
    await Chat.collection.createIndex({ 'participants': 1 });
    await Message.collection.createIndex({ 'chat': 1, 'timestamp': 1 });
    console.log('✓ Chat and Message indexes created');
    
    console.log('🎉 Database initialization completed successfully!');
    console.log('📋 Available collections after setup:');
    
    const finalCollections = await mongoose.connection.db.listCollections().toArray();
    finalCollections.forEach(collection => {
      console.log(`   - ${collection.name}`);
    });
    
    if (finalCollections.length === 0) {
      console.log('💡 Note: Collections will appear after the first document is inserted');
    }
    
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    console.error('📊 Error details:', {
      name: error.name,
      message: error.message
    });
    
    if (error.message.includes('ENOTFOUND')) {
      console.log('🔧 Network issue - check internet connection');
    } else if (error.message.includes('authentication')) {
      console.log('🔧 Authentication issue - check MongoDB credentials');
    } else if (error.message.includes('timeout')) {
      console.log('🔧 Connection timeout - check firewall/network settings');
    }
  } finally {
    await mongoose.connection.close();
    console.log('🔒 Database connection closed');
  }
}

// Run the initialization
if (require.main === module) {
  initializeDatabase();
}

module.exports = initializeDatabase;
