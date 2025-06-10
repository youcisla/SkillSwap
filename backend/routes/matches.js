const express = require('express');
const Match = require('../models/Match');
const User = require('../models/User');
const Skill = require('../models/Skill');
const auth = require('../middleware/auth');

const router = express.Router();

// Get matches for a user
router.get('/user/:userId', auth, async (req, res) => {
  try {
    const matches = await Match.find({
      $or: [
        { user1Id: req.params.userId },
        { user2Id: req.params.userId }
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

// Find potential matches for a user
router.get('/find/:userId', auth, async (req, res) => {
  try {
    const { maxDistance = 50, skillCategories, minCompatibilityScore = 60 } = req.query;
    const userId = req.params.userId;

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
    console.error('Delete match error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete match'
    });
  }
});

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
