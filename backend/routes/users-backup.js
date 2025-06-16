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
      const { page = 1, limit = 20, search, skills, location, filter, currentUserId } = req.query;
      const skip = (page - 1) * limit;

      // Build query with optimization
      let query = {};
      
      // Exclude current user from results
      if (currentUserId && currentUserId !== 'undefined' && currentUserId !== null) {
        query._id = { $ne: currentUserId };
      }

      if (search) {
        query.$or = [
          { name: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
          { bio: { $regex: search, $options: 'i' } },
          { city: { $regex: search, $options: 'i' } }
        ];
      }

      if (skills) {
        const skillArray = Array.isArray(skills) ? skills : [skills];
        // Search in both skillsToTeach and skillsToLearn
        const skillsQuery = {
          $or: [
            { 'skillsToTeach.name': { $in: skillArray } },
            { 'skillsToLearn.name': { $in: skillArray } }
          ]
        };
        
        // If we already have a $or condition, combine them properly
        if (query.$or) {
          query = {
            $and: [
              { $or: query.$or },
              skillsQuery
            ]
          };
        } else {
          query = { ...query, ...skillsQuery };
        }
      }

      if (location) {
        query.city = { $regex: location, $options: 'i' };
      }

      console.log('Users search query:', JSON.stringify(query, null, 2));

      // Enhanced aggregation pipeline with better error handling
      const users = await User.aggregate([
        { $match: query },
        {
          $lookup: {
            from: 'skills',
            localField: 'skillsToTeach',
            foreignField: '_id',
            as: 'skillsToTeach',
            pipeline: [
              { $project: { name: 1, level: 1, category: 1, description: 1 } }
            ]
          }
        },
        {
          $lookup: {
            from: 'skills',
            localField: 'skillsToLearn',
            foreignField: '_id',
            as: 'skillsToLearn',
            pipeline: [
              { $project: { name: 1, level: 1, category: 1, description: 1 } }
            ]
          }
        },
        {
          $addFields: {
            id: '$_id'
          }
        },
        {
          $project: {
            password: 0,
            __v: 0
          }
        },
        { $skip: skip },
        { $limit: parseInt(limit) },
        { $sort: { createdAt: -1 } }
      ]);

      const total = await User.countDocuments(query);

      console.log(`Found ${users.length} users out of ${total} total`);

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
          responseTime: Date.now() - (req.startTime || Date.now())
        }
      });

    } catch (error) {
      console.error('Error fetching users:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Error fetching users',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  }
);

module.exports = router;
