const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

async function fixLocationData() {
  try {
    console.log('🔗 Connecting to MongoDB...');
    
    const mongoUri = process.env.MONGODB_URI || 'mongodb+srv://malikahemdi2:UnGQFSkuf4Etymi2@skillswap.0lzqr7a.mongodb.net/skillswap?retryWrites=true&w=majority&appName=SkillSwap';
    
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    
    console.log('✅ Connected to MongoDB');
    
    // Find all users with invalid location data
    console.log('🔍 Finding users with invalid location data...');
    
    const usersWithInvalidLocation = await mongoose.connection.db.collection('users').find({
      location: { $exists: true, $not: { $type: "null" } }
    }).toArray();
    
    console.log(`📊 Found ${usersWithInvalidLocation.length} users with location data`);
    
    let fixedCount = 0;
    
    for (const user of usersWithInvalidLocation) {
      if (user.location && typeof user.location === 'object') {
        let needsUpdate = false;
        let updateFields = {};
        
        // Check if location has invalid structure
        if (user.location.updatedAt !== undefined && 
            (!user.location.type || !user.location.coordinates)) {
          console.log(`🔧 Removing invalid location data for user: ${user._id}`);
          updateFields.$unset = { location: "" };
          needsUpdate = true;
        }
        // Check if location has old format (latitude/longitude fields)
        else if (user.location.latitude !== undefined && user.location.longitude !== undefined) {
          console.log(`🔄 Converting old location format for user: ${user._id}`);
          updateFields.$set = {
            location: {
              type: 'Point',
              coordinates: [user.location.longitude, user.location.latitude]
            }
          };
          
          // Keep the original updatedAt if it exists
          if (user.location.updatedAt) {
            updateFields.$set.locationUpdatedAt = user.location.updatedAt;
          }
          needsUpdate = true;
        }
        // Check if location has incomplete GeoJSON structure
        else if (!user.location.type || !Array.isArray(user.location.coordinates) || user.location.coordinates.length !== 2) {
          console.log(`🔧 Removing incomplete location structure for user: ${user._id}`);
          updateFields.$unset = { location: "" };
          needsUpdate = true;
        }
        
        if (needsUpdate) {
          await mongoose.connection.db.collection('users').updateOne(
            { _id: user._id },
            updateFields
          );
          fixedCount++;
        }
      }
    }
    
    console.log(`✅ Fixed ${fixedCount} users with invalid location data`);
    
    // Now try to recreate the geospatial index
    console.log('🔧 Recreating geospatial index...');
    
    try {
      // Drop existing index if it exists
      await mongoose.connection.db.collection('users').dropIndex('location_2dsphere');
      console.log('🗑️  Dropped existing geospatial index');
    } catch (error) {
      console.log('ℹ️  No existing geospatial index to drop');
    }
    
    // Create new index
    await mongoose.connection.db.collection('users').createIndex(
      { location: '2dsphere' },
      { sparse: true } // Only index documents that have the location field
    );
    console.log('✅ Geospatial index created successfully');
    
    console.log('🎉 Location data cleanup completed successfully!');
    
  } catch (error) {
    console.error('❌ Error fixing location data:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
    process.exit(0);
  }
}

// Run the script
fixLocationData();
