const express = require('express');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const Skill = require('../models/Skill');
const auth = require('../middleware/auth');

const router = express.Router();

// Search users
router.get('/search', auth, async (req, res) => {
  try {
    const { q, city, skillsToTeach, skillsToLearn } = req.query;
    let query = { _id: { $ne: req.userId }, isActive: true };

    if (q) {
      query.$or = [
        { name: { $regex: q, $options: 'i' } },
        { bio: { $regex: q, $options: 'i' } }
      ];
    }

    if (city) {
      query.city = { $regex: city, $options: 'i' };
    }

    const users = await User.find(query)
      .populate('skillsToTeach')
      .populate('skillsToLearn')
      .limit(20)
      .select('-password');

    // Filter by skills if provided
    let filteredUsers = users;
    if (skillsToTeach || skillsToLearn) {
      filteredUsers = users.filter(user => {
        if (skillsToTeach) {
          const hasTeachSkill = user.skillsToTeach.some(skill => 
            skillsToTeach.includes(skill.name)
          );
          if (!hasTeachSkill) return false;
        }

        if (skillsToLearn) {
          const hasLearnSkill = user.skillsToLearn.some(skill => 
            skillsToLearn.includes(skill.name)
          );
          if (!hasLearnSkill) return false;
        }

        return true;
      });
    }

    res.json({
      success: true,
      data: filteredUsers
    });
  } catch (error) {
    console.error('Search users error:', error);
    res.status(500).json({
      success: false,
      error: 'Search failed'
    });
  }
});

// Get user profile
router.get('/:userId', auth, async (req, res) => {
  try {
    const user = await User.findById(req.params.userId)
      .populate('skillsToTeach')
      .populate('skillsToLearn');

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    res.json({
      success: true,
      data: user.toJSON()
    });
  } catch (error) {
    console.error('Get user profile error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get user profile'
    });
  }
});

// Update user profile
router.put('/:userId', [
  auth,
  body('name').optional().notEmpty().withMessage('Name cannot be empty'),
  body('city').optional().notEmpty().withMessage('City cannot be empty'),
  body('bio').optional().isLength({ max: 500 }).withMessage('Bio cannot exceed 500 characters')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: errors.array()[0].msg
      });
    }

    // Check if user is updating their own profile
    if (req.userId !== req.params.userId) {
      return res.status(403).json({
        success: false,
        error: 'You can only update your own profile'
      });
    }

    const updates = req.body;
    const user = await User.findByIdAndUpdate(
      req.params.userId,
      updates,
      { new: true, runValidators: true }
    ).populate('skillsToTeach').populate('skillsToLearn');

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    res.json({
      success: true,
      data: user.toJSON()
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update profile'
    });
  }
});

// Get users by skill
router.get('/by-skill/:skillId', auth, async (req, res) => {
  try {
    const users = await User.find({
      $or: [
        { skillsToTeach: req.params.skillId },
        { skillsToLearn: req.params.skillId }
      ],
      _id: { $ne: req.userId },
      isActive: true
    }).populate('skillsToTeach').populate('skillsToLearn').select('-password');

    res.json({
      success: true,
      data: users
    });
  } catch (error) {
    console.error('Get users by skill error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get users by skill'
    });
  }
});

// Get nearby users
router.get('/nearby', auth, async (req, res) => {
  try {
    const { lat, lng, radius = 10 } = req.query;

    if (!lat || !lng) {
      return res.status(400).json({
        success: false,
        error: 'Latitude and longitude are required'
      });
    }

    // Find users within radius (simple distance calculation)
    const users = await User.find({
      _id: { $ne: req.userId },
      isActive: true,
      'location.latitude': { $exists: true },
      'location.longitude': { $exists: true }
    }).populate('skillsToTeach').populate('skillsToLearn').select('-password');

    // Filter by distance
    const nearbyUsers = users.filter(user => {
      const distance = calculateDistance(
        parseFloat(lat),
        parseFloat(lng),
        user.location.latitude,
        user.location.longitude
      );
      return distance <= parseFloat(radius);
    });

    res.json({
      success: true,
      data: nearbyUsers
    });
  } catch (error) {
    console.error('Get nearby users error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get nearby users'
    });
  }
});

// Update user location
router.put('/:userId/location', auth, async (req, res) => {
  try {
    const { latitude, longitude } = req.body;

    if (req.userId !== req.params.userId) {
      return res.status(403).json({
        success: false,
        error: 'You can only update your own location'
      });
    }

    const user = await User.findByIdAndUpdate(
      req.params.userId,
      {
        location: {
          latitude,
          longitude,
          updatedAt: new Date()
        }
      },
      { new: true }
    ).select('-password');

    res.json({
      success: true,
      data: user
    });
  } catch (error) {
    console.error('Update location error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update location'
    });
  }
});

// Helper function to calculate distance between two points
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Radius of the Earth in kilometers
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c; // Distance in kilometers
  return distance;
}

function deg2rad(deg) {
  return deg * (Math.PI/180);
}

module.exports = router;
