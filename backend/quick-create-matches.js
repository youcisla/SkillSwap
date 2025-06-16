const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect('mongodb+srv://malikahemdi2:UnGQFSkuf4Etymi2@skillswap.0lzqr7a.mongodb.net/skillswap?retryWrites=true&w=majority&appName=SkillSwap', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

const User = require('./models/User');
const Match = require('./models/Match');
const Skill = require('./models/Skill');

async function quickCreateMatches() {
  try {
    console.log('🚀 Creating matches quickly...');

    // Get the current user
    const currentUser = await User.findOne({ email: 'hghghg@gmail.com' });
    if (!currentUser) {
      console.log('❌ Current user not found');
      process.exit(1);
    }

    console.log(`✅ Found current user: ${currentUser.name} (${currentUser._id})`);

    // Get Yahoo user (the perfect match)
    const yahooUser = await User.findOne({ name: 'Yahoo' });
    if (!yahooUser) {
      console.log('❌ Yahoo user not found');
      process.exit(1);
    }

    console.log(`✅ Found Yahoo user: ${yahooUser.name} (${yahooUser._id})`);

    // Get their skills
    const currentUserSkills = await Skill.find({ userId: currentUser._id });
    const yahooUserSkills = await Skill.find({ userId: yahooUser._id });

    console.log(`Current user skills: ${currentUserSkills.length}`);
    console.log(`Yahoo user skills: ${yahooUserSkills.length}`);

    // Find matching skills
    const currentUserTeach = currentUserSkills.filter(s => s.type === 'teach');
    const currentUserLearn = currentUserSkills.filter(s => s.type === 'learn');
    const yahooUserTeach = yahooUserSkills.filter(s => s.type === 'teach');
    const yahooUserLearn = yahooUserSkills.filter(s => s.type === 'learn');

    console.log('Current user teaches:', currentUserTeach.map(s => s.name));
    console.log('Current user wants to learn:', currentUserLearn.map(s => s.name));
    console.log('Yahoo teaches:', yahooUserTeach.map(s => s.name));
    console.log('Yahoo wants to learn:', yahooUserLearn.map(s => s.name));

    // Create match data
    const user1Skills = currentUserTeach.map(skill => ({
      skillId: skill._id,
      skillName: skill.name,
      level: skill.level
    }));

    const user2Skills = yahooUserTeach.map(skill => ({
      skillId: skill._id,
      skillName: skill.name,
      level: skill.level
    }));

    // Check if match already exists
    const existingMatch = await Match.findOne({
      $or: [
        { user1Id: currentUser._id, user2Id: yahooUser._id },
        { user1Id: yahooUser._id, user2Id: currentUser._id }
      ]
    });

    if (existingMatch) {
      console.log('✅ Match already exists');
    } else {
      // Create new match
      const newMatch = new Match({
        user1Id: currentUser._id,
        user2Id: yahooUser._id,
        user1Skills,
        user2Skills,
        compatibilityScore: 95,
        status: 'pending'
      });

      await newMatch.save();
      console.log('✅ Match created successfully!');
    }

    // Create matches with other users too
    const otherUsers = await User.find({ 
      _id: { $nin: [currentUser._id, yahooUser._id] } 
    }).limit(2);

    for (const otherUser of otherUsers) {
      const existingMatch = await Match.findOne({
        $or: [
          { user1Id: currentUser._id, user2Id: otherUser._id },
          { user1Id: otherUser._id, user2Id: currentUser._id }
        ]
      });

      if (!existingMatch) {
        const otherUserSkills = await Skill.find({ userId: otherUser._id });
        const otherUserTeach = otherUserSkills.filter(s => s.type === 'teach');

        const match = new Match({
          user1Id: currentUser._id,
          user2Id: otherUser._id,
          user1Skills,
          user2Skills: otherUserTeach.map(skill => ({
            skillId: skill._id,
            skillName: skill.name,
            level: skill.level
          })),
          compatibilityScore: Math.floor(Math.random() * 40) + 60, // 60-100
          status: 'pending'
        });

        await match.save();
        console.log(`✅ Match created with ${otherUser.name}`);
      }
    }

    console.log('🎉 All matches created successfully!');

  } catch (error) {
    console.error('❌ Error creating matches:', error);
  } finally {
    mongoose.connection.close();
  }
}

quickCreateMatches();
