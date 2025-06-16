const mongoose = require('mongoose');
const User = require('./models/User');
const Skill = require('./models/Skill');
const Match = require('./models/Match');

async function createMatches() {
  try {
    await mongoose.connect('mongodb+srv://malikahemdi2:UnGQFSkuf4Etymi2@skillswap.0lzqr7a.mongodb.net/skillswap?retryWrites=true&w=majority&appName=SkillSwap');
    
    console.log('🔗 Connected to database');
    
    // Get the current user
    const currentUserId = '684f393bc40915438bfe0eed';
    const currentUser = await User.findById(currentUserId);
    
    if (!currentUser) {
      console.error('❌ Current user not found');
      return;
    }
    
    console.log(`👤 Current user: ${currentUser.name}`);
    
    // Get user's skills
    const userTeachSkills = await Skill.find({ userId: currentUserId, type: 'teach', isActive: true });
    const userLearnSkills = await Skill.find({ userId: currentUserId, type: 'learn', isActive: true });
    
    console.log(`📚 User teaches: ${userTeachSkills.map(s => s.name).join(', ')}`);
    console.log(`📖 User wants to learn: ${userLearnSkills.map(s => s.name).join(', ')}`);
    
    // Find all other active users
    const otherUsers = await User.find({ 
      _id: { $ne: currentUserId }, 
      isActive: true 
    });
    
    console.log(`👥 Found ${otherUsers.length} other users`);
    
    let matchesCreated = 0;
    
    for (const otherUser of otherUsers) {
      // Check if match already exists
      const existingMatch = await Match.findOne({
        $or: [
          { user1Id: currentUserId, user2Id: otherUser._id },
          { user1Id: otherUser._id, user2Id: currentUserId }
        ]
      });
      
      if (existingMatch) {
        console.log(`⚠️  Match already exists with ${otherUser.name}`);
        continue;
      }
      
      // Get other user's skills
      const otherTeachSkills = await Skill.find({ 
        userId: otherUser._id, 
        type: 'teach', 
        isActive: true 
      });
      const otherLearnSkills = await Skill.find({ 
        userId: otherUser._id, 
        type: 'learn', 
        isActive: true 
      });
      
      // Calculate compatibility
      const compatibility = calculateCompatibility(
        userTeachSkills,
        userLearnSkills,
        otherTeachSkills,
        otherLearnSkills
      );
      
      if (compatibility.score > 0) {
        console.log(`✨ Creating match with ${otherUser.name} (${compatibility.score}% compatibility)`);
        console.log(`   - You can teach them: ${compatibility.user1Skills.map(s => s.skillName).join(', ')}`);
        console.log(`   - They can teach you: ${compatibility.user2Skills.map(s => s.skillName).join(', ')}`);
        
        // Create the match
        const match = new Match({
          user1Id: currentUserId,
          user2Id: otherUser._id,
          user1Skills: compatibility.user1Skills,
          user2Skills: compatibility.user2Skills,
          compatibilityScore: compatibility.score,
          status: 'pending',
          isActive: true
        });
        
        await match.save();
        matchesCreated++;
      } else {
        console.log(`❌ No compatibility with ${otherUser.name}`);
      }
    }
    
    console.log(`🎉 Created ${matchesCreated} matches!`);
    
    // Verify matches were created
    const totalMatches = await Match.countDocuments({ 
      $or: [
        { user1Id: currentUserId },
        { user2Id: currentUserId }
      ],
      isActive: true
    });
    
    console.log(`📊 Total matches for user: ${totalMatches}`);
    
    await mongoose.disconnect();
    console.log('✅ Done');
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Enhanced compatibility calculation
function calculateCompatibility(user1Teach, user1Learn, user2Teach, user2Learn) {
  let totalPossibleMatches = 0;
  let actualMatches = 0;
  const user1Skills = [];
  const user2Skills = [];

  // Check what user1 can teach that user2 wants to learn
  user1Teach.forEach(skill1 => {
    const matchingSkill = user2Learn.find(skill2 => 
      skill1.name.toLowerCase() === skill2.name.toLowerCase()
    );
    if (matchingSkill) {
      actualMatches++;
      user1Skills.push({
        skillId: skill1._id,
        skillName: skill1.name
      });
    }
    totalPossibleMatches++;
  });

  // Check what user2 can teach that user1 wants to learn
  user2Teach.forEach(skill2 => {
    const matchingSkill = user1Learn.find(skill1 => 
      skill2.name.toLowerCase() === skill1.name.toLowerCase()
    );
    if (matchingSkill) {
      actualMatches++;
      user2Skills.push({
        skillId: skill2._id,
        skillName: skill2.name
      });
    }
    totalPossibleMatches++;
  });

  const score = totalPossibleMatches > 0 ? Math.round((actualMatches / totalPossibleMatches) * 100) : 0;

  return {
    score,
    user1Skills,
    user2Skills
  };
}

createMatches();
