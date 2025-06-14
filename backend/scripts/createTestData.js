const mongoose = require('mongoose');
const User = require('../models/User');
const Match = require('../models/Match');
const Skill = require('../models/Skill');

const createTestData = async () => {
  try {
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/skillswap');
    console.log('✅ Connected to database');

    // Get existing users
    const users = await User.find({}).limit(3);
    console.log('👥 Found users:', users.map(u => ({ id: u._id, name: u.name })));

    if (users.length < 2) {
      console.log('❌ Need at least 2 users. Creating test users...');
      
      // Create test users if needed
      const testUser1 = new User({
        name: 'Alice Smith',
        email: 'alice@test.com',
        city: 'New York',
        password: 'password123',
        isActive: true
      });
      
      const testUser2 = new User({
        name: 'Bob Johnson', 
        email: 'bob@test.com',
        city: 'San Francisco',
        password: 'password123',
        isActive: true
      });

      await testUser1.save();
      await testUser2.save();
      
      users.push(testUser1, testUser2);
      console.log('✅ Created test users');
    }

    // Check if match already exists
    const existingMatch = await Match.findOne({
      $or: [
        { user1Id: users[0]._id, user2Id: users[1]._id },
        { user1Id: users[1]._id, user2Id: users[0]._id }
      ]
    });

    if (existingMatch) {
      console.log('✅ Match already exists:', existingMatch._id);
    } else {
      console.log('🎯 Creating test match...');
      
      // Create a test match between first two users
      const testMatch = new Match({
        user1Id: users[0]._id,
        user2Id: users[1]._id,
        user1Skills: [
          { skillName: 'JavaScript' },
          { skillName: 'React' }
        ],
        user2Skills: [
          { skillName: 'Python' },
          { skillName: 'Node.js' }
        ],
        compatibilityScore: 75,
        status: 'accepted',
        isActive: true
      });

      await testMatch.save();
      console.log('✅ Created test match:', testMatch._id);
    }

    // Create some test skills if they don't exist
    const skillsToCreate = [
      { name: 'JavaScript', category: 'technology', type: 'teach', userId: users[0]._id },
      { name: 'React', category: 'technology', type: 'teach', userId: users[0]._id },
      { name: 'Python', category: 'technology', type: 'learn', userId: users[0]._id },
      { name: 'Python', category: 'technology', type: 'teach', userId: users[1]._id },
      { name: 'Node.js', category: 'technology', type: 'teach', userId: users[1]._id },
      { name: 'JavaScript', category: 'technology', type: 'learn', userId: users[1]._id }
    ];

    for (const skillData of skillsToCreate) {
      const existingSkill = await Skill.findOne({
        name: skillData.name,
        type: skillData.type,
        userId: skillData.userId
      });

      if (!existingSkill) {
        const skill = new Skill({
          ...skillData,
          level: 'intermediate',
          isActive: true
        });
        await skill.save();
        console.log(`✅ Created skill: ${skillData.name} (${skillData.type}) for ${skillData.userId}`);
      }
    }

    // Now test the match flow
    console.log('\n🧪 Testing match-to-profile flow...');
    
    const match = await Match.findOne({}).populate('user1Id').populate('user2Id');
    
    if (match) {
      console.log('🎯 Found match:', {
        id: match._id,
        user1: { id: match.user1Id._id, name: match.user1Id.name },
        user2: { id: match.user2Id._id, name: match.user2Id.name }
      });

      // Test fetching user2's profile (as if user1 clicked on the match)
      const targetUserId = match.user2Id._id;
      console.log('\n🔍 Fetching profile for:', targetUserId);

      const userProfile = await User.findById(targetUserId)
        .populate('skillsToTeach')
        .populate('skillsToLearn');

      if (userProfile) {
        console.log('✅ Profile fetch successful:', {
          id: userProfile._id,
          name: userProfile.name,
          city: userProfile.city,
          hasProfileImage: !!userProfile.profileImage,
          teachSkills: userProfile.skillsToTeach?.length || 0,
          learnSkills: userProfile.skillsToLearn?.length || 0
        });

        // Test the JSON conversion (what the API does)
        const jsonData = userProfile.toJSON();
        console.log('✅ JSON conversion successful, keys:', Object.keys(jsonData));
      } else {
        console.log('❌ Profile fetch failed for user ID:', targetUserId);
      }
    } else {
      console.log('❌ No matches found after creation');
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
  createTestData()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

module.exports = { createTestData };
