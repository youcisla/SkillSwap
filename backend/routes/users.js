// Enhanced Users Route with Optimized Middleware
const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const User = require('../models/User');
const auth = require('../middleware/auth');
const enhancedMiddleware = require('../middleware/enhancedMiddleware');

const router = express.Router();

// Configure multer for file uploads with enhanced security
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = 'uploads/profile-images/';
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `profile-${req.user.id}-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
    files: 1
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed (jpeg, jpg, png, gif, webp)'));
    }
  }
});

// Get all users with enhanced caching and pagination
router.get('/', 
  auth,
  async (req, res) => {
    try {
      const { page = 1, limit = 20, search, skills, location } = req.query;
      const skip = (page - 1) * limit;

      // Build query with optimization
      let query = {};
      
      if (search) {
        query.$or = [
          { name: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
          { bio: { $regex: search, $options: 'i' } }
        ];
      }

      if (skills) {
        const skillArray = Array.isArray(skills) ? skills : [skills];
        query['skills.name'] = { $in: skillArray };
      }

      if (location) {
        query.location = { $regex: location, $options: 'i' };
      }

      // Use aggregation pipeline for better performance
      const users = await User.aggregate([
        { $match: query },
        {
          $lookup: {
            from: 'skills',
            localField: 'skills',
            foreignField: '_id',
            as: 'skillDetails'
          }
        },
        {
          $project: {
            password: 0,
            __v: 0,
            'skillDetails.createdAt': 0,
            'skillDetails.updatedAt': 0
          }
        },
        { $skip: skip },
        { $limit: parseInt(limit) },
        { $sort: { createdAt: -1 } }
      ]);

      const total = await User.countDocuments(query);

      res.json({
        success: true,
        data: users,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit),
          hasNext: page * limit < total,
          hasPrev: page > 1
        },
        meta: {
          cached: req.fromCache || false,
          responseTime: Date.now() - req.startTime
        }
      });

    } catch (error) {
      console.error('Error fetching users:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Error fetching users',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
);

// Get user by ID with enhanced error handling
router.get('/:id', 
  auth,
  async (req, res) => {
    try {
      // Validate user ID parameter
      const userId = req.params.id;
      if (!userId || userId === 'undefined' || userId === 'null') {
        return res.status(400).json({ 
          success: false, 
          message: 'Invalid user ID provided' 
        });
      }

      // Validate MongoDB ObjectId format
      if (!userId.match(/^[0-9a-fA-F]{24}$/)) {
        return res.status(400).json({ 
          success: false, 
          message: 'Invalid user ID format' 
        });
      }

      const user = await User.findById(userId)
        .populate('skillsToTeach', 'name description level category')
        .populate('skillsToLearn', 'name description level category')
        .select('-password -__v')
        .lean(); // Use lean() for better performance

      if (!user) {
        return res.status(404).json({ 
          success: false, 
          message: 'User not found' 
        });
      }

      res.json({
        success: true,
        data: user,
        meta: {
          cached: req.fromCache || false,
          responseTime: Date.now() - req.startTime
        }
      });

    } catch (error) {
      console.error('Error fetching user:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Error fetching user',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
);

// Update user profile with enhanced validation and security
router.put('/:id', 
  auth,
  async (req, res) => {
    try {
      // Check if user can update this profile
      if (req.user.id !== req.params.id && req.user.role !== 'admin') {
        return res.status(403).json({ 
          success: false, 
          message: 'Not authorized to update this profile' 
        });
      }

      const allowedUpdates = ['name', 'bio', 'location', 'skills', 'preferences'];
      const updates = {};

      // Filter and validate updates
      Object.keys(req.body).forEach(key => {
        if (allowedUpdates.includes(key)) {
          updates[key] = req.body[key];
        }
      });

      const user = await User.findByIdAndUpdate(
        req.params.id,
        { $set: updates },
        { 
          new: true, 
          runValidators: true,
          select: '-password -__v'
        }
      ).populate('skillsToTeach', 'name description level category')
       .populate('skillsToLearn', 'name description level category');

      if (!user) {
        return res.status(404).json({ 
          success: false, 
          message: 'User not found' 
        });
      }

      // Clear cache for this user
      req.cacheKey = `user:${req.params.id}`;

      res.json({
        success: true,
        data: user,
        message: 'Profile updated successfully',
        meta: {
          responseTime: Date.now() - req.startTime
        }
      });

    } catch (error) {
      console.error('Error updating user:', error);
      
      if (error.name === 'ValidationError') {
        return res.status(400).json({ 
          success: false, 
          message: 'Validation error',
          errors: Object.values(error.errors).map(e => e.message)
        });
      }

      res.status(500).json({ 
        success: false, 
        message: 'Error updating user',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
);

// Upload profile image with enhanced security
router.post('/:id/upload-image', 
  auth,
  (req, res, next) => {
    // Check if user can update this profile
    if (req.user.id !== req.params.id && req.user.role !== 'admin') {
      return res.status(403).json({ 
        success: false, 
        message: 'Not authorized to update this profile' 
      });
    }
    next();
  },
  (req, res, next) => {
    upload.single('profileImage')(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({ 
            success: false, 
            message: 'File too large. Maximum size is 5MB.' 
          });
        }
        return res.status(400).json({ 
          success: false, 
          message: `Upload error: ${err.message}` 
        });
      } else if (err) {
        return res.status(400).json({ 
          success: false, 
          message: err.message 
        });
      }
      next();
    });
  },
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ 
          success: false, 
          message: 'No image file provided' 
        });
      }

      const imageUrl = `/uploads/profile-images/${req.file.filename}`;

      // Update user with new image URL
      const user = await User.findByIdAndUpdate(
        req.params.id,
        { $set: { profileImage: imageUrl } },
        { new: true, select: '-password -__v' }
      );

      if (!user) {
        // Clean up uploaded file if user not found
        fs.unlinkSync(req.file.path);
        return res.status(404).json({ 
          success: false, 
          message: 'User not found' 
        });
      }

      res.json({
        success: true,
        data: {
          profileImage: imageUrl,
          filename: req.file.filename
        },
        message: 'Profile image uploaded successfully',
        meta: {
          responseTime: Date.now() - req.startTime
        }
      });

    } catch (error) {
      console.error('Error uploading profile image:', error);
      
      // Clean up uploaded file on error
      if (req.file) {
        fs.unlinkSync(req.file.path);
      }

      res.status(500).json({ 
        success: false, 
        message: 'Error uploading profile image',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
);

// Delete user with enhanced security
router.delete('/:id', 
  auth,
  async (req, res) => {
    try {
      // Only admin or user themselves can delete
      if (req.user.role !== 'admin' && req.user.id !== req.params.id) {
        return res.status(403).json({ 
          success: false, 
          message: 'Not authorized to delete this user' 
        });
      }

      const user = await User.findByIdAndDelete(req.params.id);

      if (!user) {
        return res.status(404).json({ 
          success: false, 
          message: 'User not found' 
        });
      }

      // Clean up profile image if exists
      if (user.profileImage) {
        const imagePath = path.join(__dirname, '..', user.profileImage);
        if (fs.existsSync(imagePath)) {
          fs.unlinkSync(imagePath);
        }
      }

      res.json({
        success: true,
        message: 'User deleted successfully',
        meta: {
          responseTime: Date.now() - req.startTime
        }
      });

    } catch (error) {
      console.error('Error deleting user:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Error deleting user',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
);

// Get user statistics (admin only)
router.get('/stats/overview',
  auth,
  async (req, res) => {
    try {
      const stats = await User.aggregate([
        {
          $group: {
            _id: null,
            totalUsers: { $sum: 1 },
            activeUsers: {
              $sum: {
                $cond: [
                  { $gte: ['$lastActive', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)] },
                  1,
                  0
                ]
              }
            },
            newUsersThisMonth: {
              $sum: {
                $cond: [
                  { $gte: ['$createdAt', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)] },
                  1,
                  0
                ]
              }
            }
          }
        }
      ]);

      res.json({
        success: true,
        data: stats[0] || { totalUsers: 0, activeUsers: 0, newUsersThisMonth: 0 },
        meta: {
          cached: req.fromCache || false,
          responseTime: Date.now() - req.startTime
        }
      });

    } catch (error) {
      console.error('Error fetching user stats:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Error fetching user statistics',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  }
);

module.exports = router;
