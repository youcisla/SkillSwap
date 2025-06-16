const express = require('express');
const Match = require('../models/Match');
const User = require('../models/User');
const Skill = require('../models/Skill');
const auth = require('../middleware/auth');
const { emitNewMatch } = require('../utils/socketUtils');

const router = express.Router();

// Get matches for a user
router.get('/user/:userId', auth, async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Validate userId
    if (!userId || userId === 'undefined' || userId === 'null' || !/^[0-9a-fA-F]{24}$/.test(userId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid or missing user ID'
      });
    }

    const matches = await Match.find({
      $or: [
        { user1Id: userId },
        { user2Id: userId }
      ],
      isActive: true
    })
    .populate('user1Id', 'name city profileImage rating totalSessions')
    .populate('user2Id', 'name city profileImage rating totalSessions')
    .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: matches
    });
  } catch (error) {
    console.error('Get matches error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get matches'
    });
  }
});

// Create a match
router.post('/', auth, async (req, res) => {
  try {
    const { user1Id, user2Id, user1Skills, user2Skills, compatibilityScore } = req.body;

    // Check if users exist
    const user1 = await User.findById(user1Id);
    const user2 = await User.findById(user2Id);

    if (!user1 || !user2) {
      return res.status(404).json({
        success: false,
        error: 'One or both users not found'
      });
    }

    // Check if match already exists
    const existingMatch = await Match.findOne({
      $or: [
        { user1Id, user2Id },
        { user1Id: user2Id, user2Id: user1Id }
      ]
    });

    if (existingMatch) {
      return res.status(400).json({
        success: false,
        error: 'Match already exists between these users'
      });
    }

    const match = new Match({
      user1Id,
      user2Id,
      user1Skills,
      user2Skills,
      compatibilityScore
    });

    await match.save();

    const populatedMatch = await Match.findById(match._id)
      .populate('user1Id', 'name city profileImage rating totalSessions')
      .populate('user2Id', 'name city profileImage rating totalSessions');

    // Emit real-time match notification to both users
    emitNewMatch(user1Id, user2Id, populatedMatch);

    res.status(201).json({
      success: true,
      data: populatedMatch
    });
  } catch (error) {
    console.error('Create match error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create match'
    });
  }
});

// NEW: Dynamic matching endpoint
router.get('/dynamic', auth, async (req, res) => {
  try {
    const { 
      userId, 
      maxDistance = 50, 
      skillCategories, 
      minCompatibilityScore = 30,
      latitude,
      longitude 
    } = req.query;

    // Validate userId
    if (!userId || userId === 'undefined' || userId === 'null' || !/^[0-9a-fA-F]{24}$/.test(userId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid or missing user ID'
      });
    }

    console.log('🔍 Dynamic matching request:', {
      userId,
      maxDistance,
      skillCategories,
      minCompatibilityScore,
      hasLocation: !!(latitude && longitude)
    });

    // Get current user's skills
    const currentUser = await User.findById(userId);
    if (!currentUser) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    const userTeachSkills = await Skill.find({ 
      userId, 
      type: 'teach', 
      isActive: true 
    });
    const userLearnSkills = await Skill.find({ 
      userId, 
      type: 'learn', 
      isActive: true 
    });

    console.log(`📚 User has ${userTeachSkills.length} teaching skills, ${userLearnSkills.length} learning skills`);

    if (userTeachSkills.length === 0 && userLearnSkills.length === 0) {
      return res.json({
        success: true,
        data: [],
        message: 'Add skills to your profile to find matches!'
      });
    }

    // Build user search criteria
    let userQuery = {
      _id: { $ne: userId },
      isActive: true
    };

    // Add location filtering if provided
    if (latitude && longitude && maxDistance) {
      userQuery['location.coordinates'] = {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [parseFloat(longitude), parseFloat(latitude)]
          },
          $maxDistance: parseFloat(maxDistance) * 1000 // Convert km to meters
        }
      };
    }

    // Get potential match users
    const potentialUsers = await User.find(userQuery)
      .limit(100) // Limit for performance
      .lean();

    console.log(`👥 Found ${potentialUsers.length} potential users`);

    const dynamicMatches = [];

    for (const otherUser of potentialUsers) {
      // Skip if already matched
      const existingMatch = await Match.findOne({
        $or: [
          { user1Id: userId, user2Id: otherUser._id },
          { user1Id: otherUser._id, user2Id: userId }
        ],
        isActive: true
      });

      if (existingMatch) continue;

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

      // Skip users with no skills
      if (otherTeachSkills.length === 0 && otherLearnSkills.length === 0) {
        continue;
      }

      // Calculate dynamic compatibility
      const compatibility = calculateDynamicCompatibility(
        userTeachSkills,
        userLearnSkills,
        otherTeachSkills,
        otherLearnSkills
      );

      if (compatibility.score >= minCompatibilityScore) {
        // Calculate distance if location provided
        let distance = null;
        if (latitude && longitude && otherUser.location?.coordinates) {
          distance = calculateDistance(
            parseFloat(latitude),
            parseFloat(longitude),
            otherUser.location.coordinates[1],
            otherUser.location.coordinates[0]
          );
        }

        dynamicMatches.push({
          user: {
            id: otherUser._id.toString(),
            name: otherUser.name,
            email: otherUser.email,
            city: otherUser.city,
            bio: otherUser.bio,
            profileImage: otherUser.profileImage,
            rating: otherUser.rating,
            totalSessions: otherUser.totalSessions,
            skillsToTeach: otherTeachSkills.map(s => ({ 
              id: s._id.toString(), 
              name: s.name, 
              category: s.category,
              level: s.level 
            })),
            skillsToLearn: otherLearnSkills.map(s => ({ 
              id: s._id.toString(), 
              name: s.name, 
              category: s.category,
              level: s.level 
            }))
          },
          compatibilityScore: compatibility.score,
          sharedSkills: {
            canTeach: compatibility.canTeach,
            canLearnFrom: compatibility.canLearnFrom
          },
          distance: distance,
          matchReasons: compatibility.reasons
        });
      }
    }

    // Sort by compatibility score, then by distance if available
    dynamicMatches.sort((a, b) => {
      if (a.compatibilityScore !== b.compatibilityScore) {
        return b.compatibilityScore - a.compatibilityScore;
      }
      if (a.distance !== null && b.distance !== null) {
        return a.distance - b.distance;
      }
      return 0;
    });

    console.log(`✅ Found ${dynamicMatches.length} dynamic matches`);

    res.json({
      success: true,
      data: dynamicMatches.slice(0, 20), // Return top 20 matches
      totalFound: dynamicMatches.length
    });

  } catch (error) {
    console.error('Dynamic matching error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to find dynamic matches'
    });
  }
});

// Find potential matches for a user
router.get('/find/:userId', auth, async (req, res) => {
  try {
    const { maxDistance = 50, skillCategories, minCompatibilityScore = 60 } = req.query;
    const userId = req.params.userId;

    // Validate userId
    if (!userId || userId === 'undefined' || userId === 'null' || !/^[0-9a-fA-F]{24}$/.test(userId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid or missing user ID'
      });
    }

    // Get user's skills
    const userTeachSkills = await Skill.find({ userId, type: 'teach', isActive: true });
    const userLearnSkills = await Skill.find({ userId, type: 'learn', isActive: true });

    if (userTeachSkills.length === 0 && userLearnSkills.length === 0) {
      return res.json({
        success: true,
        data: [],
        message: 'Add some skills to find matches'
      });
    }

    // Find users with complementary skills
    const teachSkillNames = userTeachSkills.map(skill => skill.name);
    const learnSkillNames = userLearnSkills.map(skill => skill.name);

    // Find users who want to learn what this user can teach
    const potentialMatches1 = await Skill.find({
      name: { $in: teachSkillNames },
      type: 'learn',
      userId: { $ne: userId },
      isActive: true
    }).populate('userId');

    // Find users who can teach what this user wants to learn
    const potentialMatches2 = await Skill.find({
      name: { $in: learnSkillNames },
      type: 'teach',
      userId: { $ne: userId },
      isActive: true
    }).populate('userId');

    // Combine and deduplicate potential matches
    const allMatches = [...potentialMatches1, ...potentialMatches2];
    const uniqueUserIds = [...new Set(allMatches.map(match => match.userId._id.toString()))];

    const matches = [];

    for (const matchUserId of uniqueUserIds) {
      // Skip if match already exists
      const existingMatch = await Match.findOne({
        $or: [
          { user1Id: userId, user2Id: matchUserId },
          { user1Id: matchUserId, user2Id: userId }
        ]
      });

      if (existingMatch) continue;

      const matchUser = await User.findById(matchUserId)
        .populate('skillsToTeach')
        .populate('skillsToLearn');

      const matchUserTeachSkills = await Skill.find({ userId: matchUserId, type: 'teach', isActive: true });
      const matchUserLearnSkills = await Skill.find({ userId: matchUserId, type: 'learn', isActive: true });

      // Calculate compatibility score
      const compatibility = calculateCompatibility(
        userTeachSkills,
        userLearnSkills,
        matchUserTeachSkills,
        matchUserLearnSkills
      );

      if (compatibility.score >= minCompatibilityScore) {
        matches.push({
          id: `temp-${userId}-${matchUserId}`,
          user1Id: userId,
          user2Id: matchUserId,
          user1Skills: compatibility.user1Skills,
          user2Skills: compatibility.user2Skills,
          compatibilityScore: compatibility.score,
          createdAt: new Date(),
          matchUser
        });
      }
    }

    // Sort by compatibility score
    matches.sort((a, b) => b.compatibilityScore - a.compatibilityScore);

    res.json({
      success: true,
      data: matches.slice(0, 20) // Limit to top 20 matches
    });
  } catch (error) {
    console.error('Find potential matches error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to find potential matches'
    });
  }
});

// Update match status
router.put('/:matchId', auth, async (req, res) => {
  try {
    const { status } = req.body;
    
    const match = await Match.findById(req.params.matchId);
    if (!match) {
      return res.status(404).json({
        success: false,
        error: 'Match not found'
      });
    }

    // Check if user is part of this match
    if (match.user1Id.toString() !== req.userId && match.user2Id.toString() !== req.userId) {
      return res.status(403).json({
        success: false,
        error: 'You are not part of this match'
      });
    }

    const updatedMatch = await Match.findByIdAndUpdate(
      req.params.matchId,
      { status },
      { new: true }
    )
    .populate('user1Id', 'name city profileImage rating totalSessions')
    .populate('user2Id', 'name city profileImage rating totalSessions');

    res.json({
      success: true,
      data: updatedMatch
    });
  } catch (error) {
    console.error('Update match error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update match'
    });
  }
});

// Delete a match
router.delete('/:matchId', auth, async (req, res) => {
  try {
    const match = await Match.findById(req.params.matchId);
    if (!match) {
      return res.status(404).json({
        success: false,
        error: 'Match not found'
      });
    }

    // Check if user is part of this match
    if (match.user1Id.toString() !== req.userId && match.user2Id.toString() !== req.userId) {
      return res.status(403).json({
        success: false,
        error: 'You are not part of this match'
      });
    }

    await Match.findByIdAndUpdate(req.params.matchId, { isActive: false });

    res.json({
      success: true,
      message: 'Match deleted successfully'
    });
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('Delete match error:', error);
    }
    res.status(500).json({
      success: false,
      error: 'Failed to delete match'
    });
  }
});

// Enhanced compatibility calculation
function calculateDynamicCompatibility(userTeach, userLearn, otherTeach, otherLearn) {
  const canTeach = [];
  const canLearnFrom = [];
  const reasons = [];

  // What I can teach them
  userTeach.forEach(mySkill => {
    const matchingSkill = otherLearn.find(theirSkill => 
      mySkill.name.toLowerCase() === theirSkill.name.toLowerCase() ||
      mySkill.name.toLowerCase().includes(theirSkill.name.toLowerCase()) ||
      theirSkill.name.toLowerCase().includes(mySkill.name.toLowerCase())
    );
    
    if (matchingSkill) {
      canTeach.push(mySkill.name);
      reasons.push(`You can teach ${mySkill.name}`);
    }
  });

  // What I can learn from them
  otherTeach.forEach(theirSkill => {
    const matchingSkill = userLearn.find(mySkill => 
      theirSkill.name.toLowerCase() === mySkill.name.toLowerCase() ||
      theirSkill.name.toLowerCase().includes(mySkill.name.toLowerCase()) ||
      mySkill.name.toLowerCase().includes(theirSkill.name.toLowerCase())
    );
    
    if (matchingSkill) {
      canLearnFrom.push(theirSkill.name);
      reasons.push(`You can learn ${theirSkill.name}`);
    }
  });

  // Calculate score based on mutual benefit
  const totalUserSkills = userTeach.length + userLearn.length;
  const totalMatches = canTeach.length + canLearnFrom.length;
  
  let score = 0;
  if (totalUserSkills > 0) {
    score = Math.round((totalMatches / totalUserSkills) * 100);
  }

  // Bonus for mutual exchange (both can teach each other)
  if (canTeach.length > 0 && canLearnFrom.length > 0) {
    score += 20; // Bonus for mutual exchange
    reasons.push('Mutual skill exchange possible');
  }

  // Cap at 100
  score = Math.min(score, 100);

  return {
    score,
    canTeach,
    canLearnFrom,
    reasons
  };
}

// Calculate distance between two coordinates
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Radius of the Earth in kilometers
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const d = R * c; // Distance in kilometers
  return Math.round(d * 100) / 100; // Round to 2 decimal places
}

function deg2rad(deg) {
  return deg * (Math.PI/180);
}

// Helper function to calculate compatibility between users
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

module.exports = router;
