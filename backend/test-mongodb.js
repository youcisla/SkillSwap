const mongoose = require('mongoose');

async function testConnection() {
  console.log('🔍 Testing MongoDB connection...');
  
  const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/skillswap';
  console.log(`📡 Connecting to: ${mongoURI}`);
  
  try {
    await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      maxPoolSize: 10,
      connectTimeoutMS: 10000,
    });
    
    console.log('✅ MongoDB connection successful!');
    console.log('📊 Database name:', mongoose.connection.db.databaseName);
    console.log('🔗 Connection state:', mongoose.connection.readyState);
    
    // Test basic database operations
    const testCollection = mongoose.connection.db.collection('test');
    await testCollection.insertOne({ test: true, timestamp: new Date() });
    const testDoc = await testCollection.findOne({ test: true });
    console.log('✅ Database write/read test successful!');
    
    // Clean up test document
    await testCollection.deleteOne({ test: true });
    console.log('✅ Database cleanup successful!');
    
  } catch (error) {
    console.error('❌ MongoDB connection failed:');
    console.error('📋 Error details:', error.message);
    
    if (error.message.includes('ECONNREFUSED')) {
      console.log('\n💡 Solutions:');
      console.log('   1. Make sure MongoDB is installed and running');
      console.log('   2. Use: net start MongoDB (Windows)');
      console.log('   3. Or install via Docker: docker run -d -p 27017:27017 mongo');
      console.log('   4. Or use MongoDB Atlas cloud database');
    }
    
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Database connection closed');
  }
}

// Load environment variables
require('dotenv').config();

testConnection();
