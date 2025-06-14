const express = require('express');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const Skill = require('../models/Skill');
const auth = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const router = express.Router();

// Configure multer for image uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = 'uploads/profile-images';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `profile-${req.params.userId}-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: function (req, file, cb) {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  }
});

// Helper function to check if user has admin privileges
const checkAdminPrivileges = async (userId) => {
  try {
    const user = await User.findById(userId);
    return user && (user.role === 'admin' || user.role === 'super-admin');
  } catch (error) {
    return false;
  }
};

// Search users
router.get('/search', auth, async (req, res) => {
  try {
    const { q, city, skillsToTeach, skillsToLearn } = req.query;
    console.log('🔍 Search request received:', { q, city, skillsToTeach, skillsToLearn });
    console.log('🔍 Current user ID:', req.userId);
    
    // Build base query to exclude current user and inactive users
    let baseQuery = { _id: { $ne: req.userId }, isActive: true };

    // Handle text search for name and bio
    if (q && q.trim()) {
      baseQuery.$or = [
        { name: { $regex: q.trim(), $options: 'i' } },
        { bio: { $regex: q.trim(), $options: 'i' } }
      ];
    }

    // Handle city filter
    if (city && city.trim()) {
      baseQuery.city = { $regex: city.trim(), $options: 'i' };
    }

    // Parse skill filters - handle both single values and arrays
    const normalizeSkillParams = (skillParam) => {
      if (!skillParam) return [];
      if (Array.isArray(skillParam)) {
        return skillParam.filter(skill => skill && skill.trim()).map(skill => skill.trim());
      }
      return skillParam.split(',').filter(skill => skill && skill.trim()).map(skill => skill.trim());
    };

    const teachSkillsArray = normalizeSkillParams(skillsToTeach);
    const learnSkillsArray = normalizeSkillParams(skillsToLearn);

    console.log('🔍 Parsed skill filters:', { teachSkillsArray, learnSkillsArray });

    // If we have skill filters, we need to use a more targeted approach
    if (teachSkillsArray.length > 0 || learnSkillsArray.length > 0) {
      console.log('🔍 Using skill-based filtering');
      
      // First, find skills that match the criteria
      const skillQueries = [];
      
      if (teachSkillsArray.length > 0) {
        const teachSkillRegexes = teachSkillsArray.map(skill => {
          // Escape special regex characters to prevent ReDoS
          const escapedSkill = skill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          return new RegExp(`^${escapedSkill}$`, 'i');
        });
        skillQueries.push({
          name: { $in: teachSkillRegexes },
          type: 'teach',
          isActive: true
        });
      }
      
      if (learnSkillsArray.length > 0) {
        const learnSkillRegexes = learnSkillsArray.map(skill => {
          // Escape special regex characters to prevent ReDoS
          const escapedSkill = skill.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          return new RegExp(`^${escapedSkill}$`, 'i');
        });
        skillQueries.push({
          name: { $in: learnSkillRegexes },
          type: 'learn',
          isActive: true
        });
      }
      
      // Find matching skills
      const matchingSkills = await Skill.find({ $or: skillQueries });
      const matchingSkillIds = matchingSkills.map(skill => skill._id);
      
      console.log('🔍 Found matching skills:', matchingSkills.length);
      
      if (matchingSkillIds.length === 0) {
        // No matching skills found
        return res.json({
          success: true,
          data: [],
          count: 0
        });
      }
      
      // Now find users with these skills
      const skillFilterQueries = [];
      
      if (teachSkillsArray.length > 0) {
        const teachSkillIds = matchingSkills
          .filter(skill => skill.type === 'teach')
          .map(skill => skill._id);
        if (teachSkillIds.length > 0) {
          skillFilterQueries.push({ skillsToTeach: { $in: teachSkillIds } });
        }
      }
      
      if (learnSkillsArray.length > 0) {
        const learnSkillIds = matchingSkills
          .filter(skill => skill.type === 'learn')
          .map(skill => skill._id);
        if (learnSkillIds.length > 0) {
          skillFilterQueries.push({ skillsToLearn: { $in: learnSkillIds } });
        }
      }
      
      if (skillFilterQueries.length > 0) {
        baseQuery.$and = [
          baseQuery.$and || {},
          { $or: skillFilterQueries }
        ].filter(q => Object.keys(q).length > 0);
      }
      
      console.log('🔍 Final query with skill filters:', JSON.stringify(baseQuery, null, 2));
      
      const users = await User.find(baseQuery)
        .populate('skillsToTeach')
        .populate('skillsToLearn')
        .limit(50)
        .select('-password');
        
      console.log('🔍 Users found with skill filtering:', users.length);

      res.json({
        success: true,
        data: users,
        count: users.length
      });
    } else {
      // Simple query without skill filtering
      console.log('🔍 Database query:', JSON.stringify(baseQuery));

      const users = await User.find(baseQuery)
        .populate('skillsToTeach')
        .populate('skillsToLearn')
        .limit(50)
        .select('-password');
        
      console.log('🔍 Users found:', users.length);

      res.json({
        success: true,
        data: users,
        count: users.length
      });
    }
  } catch (error) {
    console.error('Search users error:', error);
    res.status(500).json({
      success: false,
      error: 'Search failed'
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

// Get user profile
router.get('/:userId', auth, async (req, res) => {
  try {
    console.log('📋 Backend: Get user profile request:', {
      requestedUserId: req.params.userId,
      requestingUserId: req.userId
    });
    
    const user = await User.findById(req.params.userId)
      .populate('skillsToTeach')
      .populate('skillsToLearn');

    if (!user) {
      console.warn('📋 Backend: User not found:', req.params.userId);
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    console.log('📋 Backend: User profile found:', {
      userId: user._id,
      userName: user.name,
      skillsToTeach: user.skillsToTeach?.length || 0,
      skillsToLearn: user.skillsToLearn?.length || 0
    });

    res.json({
      success: true,
      data: user.toJSON()
    });
  } catch (error) {
    console.error('📋 Backend: Get user profile error:', error);
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
      // Check admin privileges
      const isAdmin = await checkAdminPrivileges(req.userId);
      if (!isAdmin) {
        return res.status(403).json({
          success: false,
          error: 'You can only update your own profile'
        });
      }
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

    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

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

// Upload profile image
router.post('/:userId/image', auth, upload.single('image'), async (req, res) => {
  try {
    // Check if user is updating their own profile
    if (req.userId !== req.params.userId) {
      // Check admin privileges
      const isAdmin = await checkAdminPrivileges(req.userId);
      if (!isAdmin) {
        return res.status(403).json({
          success: false,
          error: 'You can only update your own profile image'
        });
      }
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No image file provided'
      });
    }

    // Validate file path security (prevent path traversal)
    const safePath = path.resolve(req.file.path);
    const uploadDir = path.resolve('uploads/profile-images');
    if (!safePath.startsWith(uploadDir)) {
      // Clean up unsafe file
      try {
        fs.unlinkSync(req.file.path);
      } catch (e) {
        console.error('Failed to clean up unsafe file:', e);
      }
      return res.status(400).json({
        success: false,
        error: 'Invalid file path'
      });
    }

    // Generate the image URL
    const imageUrl = `/uploads/profile-images/${req.file.filename}`;

    // Update user's profile image in database
    const user = await User.findByIdAndUpdate(
      req.params.userId,
      { profileImage: imageUrl },
      { new: true }
    ).select('-password');

    if (!user) {
      // Clean up uploaded file if user not found
      try {
        fs.unlinkSync(safePath);
      } catch (e) {
        console.error('Failed to clean up file after user not found:', e);
      }
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    res.json({
      success: true,
      data: {
        imageUrl: imageUrl,
        user: user.toJSON()
      }
    });
  } catch (error) {
    console.error('Upload profile image error:', error);
    // Clean up uploaded file on error
    if (req.file && req.file.path) {
      try {
        const safePath = path.resolve(req.file.path);
        if (fs.existsSync(safePath)) {
          fs.unlinkSync(safePath);
        }
      } catch (e) {
        console.error('Failed to clean up file on error:', e);
      }
    }
    res.status(500).json({
      success: false,
      error: 'Failed to upload profile image'
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
