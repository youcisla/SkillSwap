const mongoose = require('mongoose');
const User = require('../models/User');
const Match = require('../models/Match');

const testMatchClick = async () => {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/skillswap');
    console.log('✅ Connected to database');

    // Get a few users to test with
    const users = await User.find({}).limit(3);
    console.log('👥 Available users:', users.map(u => ({ id: u._id, name: u.name })));

    if (users.length < 2) {
      console.log('❌ Need at least 2 users for testing');
      return;
    }

    // Get a match between two users
    const match = await Match.findOne({}).populate('user1Id').populate('user2Id');
    
    if (!match) {
      console.log('❌ No matches found in database');
      return;
    }

    console.log('🎯 Testing match scenario:');
    console.log('Match ID:', match._id);
    console.log('User 1:', { id: match.user1Id._id, name: match.user1Id.name });
    console.log('User 2:', { id: match.user2Id._id, name: match.user2Id.name });

    // Simulate what happens when user1 clicks on user2's profile
    const testUserId = match.user2Id._id;
    console.log('\n🔍 Simulating profile fetch for user:', testUserId);

    const foundUser = await User.findById(testUserId)
      .populate('skillsToTeach')
      .populate('skillsToLearn');

    if (foundUser) {
      console.log('✅ User profile found successfully:', {
        id: foundUser._id,
        name: foundUser.name,
        city: foundUser.city,
        hasProfileImage: !!foundUser.profileImage,
        skillsToTeach: foundUser.skillsToTeach?.length || 0,
        skillsToLearn: foundUser.skillsToLearn?.length || 0
      });
    } else {
      console.log('❌ User profile not found for ID:', testUserId);
    }

    // Test the exact same query that the API endpoint uses
    console.log('\n🔍 Testing API endpoint simulation...');
    const user = await User.findById(testUserId)
      .populate('skillsToTeach')
      .populate('skillsToLearn');

    if (user) {
      const userData = user.toJSON();
      console.log('✅ API simulation successful:', {
        id: userData.id,
        name: userData.name,
        dataKeys: Object.keys(userData)
      });
    } else {
      console.log('❌ API simulation failed');
    }

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack:', error.stack);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from database');
  }
};

// Check if running directly
if (require.main === module) {
  testMatchClick()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

module.exports = { testMatchClick };
