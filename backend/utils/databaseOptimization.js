// Backend optimization: Database indexing and query optimization
const mongoose = require('mongoose');

// Initialize database with proper setup
const initializeDatabase = async () => {
  try {
    // Production mode - minimal logging
    if (process.env.NODE_ENV === 'production') {
      console.log('🔧 Initializing database...');
    }
    
    // Set up connection optimizations
    optimizeConnection();
    
    // Create all necessary indexes
    await createOptimizedIndexes();
    
    if (process.env.NODE_ENV === 'production') {
      console.log('✅ Database initialization completed');
    }
    return true;
  } catch (error) {
    if (process.env.NODE_ENV === 'production') {
      console.error('❌ Database initialization failed:', error.message);
    }
    throw error;
  }
};

// Enhanced indexes for better query performance
const createOptimizedIndexes = async () => {
  try {
    if (process.env.NODE_ENV === 'development') {
      console.log('🔧 Creating optimized database indexes...');
    }

    // First, let's clean up any invalid location data
    await cleanupInvalidLocationData();

    // User indexes - check for existing text index first
    try {
      const userIndexes = await mongoose.connection.db.collection('users').listIndexes().toArray();
      const hasTextIndex = userIndexes.some(index => index.name && index.name.includes('text'));
      
      const userIndexesToCreate = [
        { key: { email: 1 }, unique: true },
        { key: { city: 1 } },
        { key: { role: 1 } },
        { key: { isActive: 1 } },
        { key: { lastActive: -1 } },
        { key: { createdAt: -1 } },
        // Compound indexes for common queries
        { key: { city: 1, isActive: 1 } },
        { key: { role: 1, isActive: 1 } },
      ];
      
      // Only add text index if it doesn't exist
      if (!hasTextIndex) {
        userIndexesToCreate.push({ key: { name: 'text', email: 'text' } });
      }
      
      await mongoose.connection.db.collection('users').createIndexes(userIndexesToCreate);
    } catch (userIndexError) {
      // Silent error handling in production
      if (process.env.NODE_ENV === 'development') {
        console.warn('⚠️ Some user indexes may already exist:', userIndexError.message);
      }
    }

    // Try to create geospatial index separately with error handling
    try {
      await mongoose.connection.db.collection('users').createIndex(
        { location: '2dsphere' },
        { sparse: true } // Only index documents that have the location field
      );
      console.log('✅ Geospatial index created successfully');
    } catch (geoError) {
      console.warn('⚠️  Skipping geospatial index due to invalid data:', geoError.message);
    }

    // Skill indexes - check for existing text index first
    try {
      const skillIndexes = await mongoose.connection.db.collection('skills').listIndexes().toArray();
      const hasTextIndex = skillIndexes.some(index => index.name && index.name.includes('text'));
      
      const skillIndexesToCreate = [
        { key: { userId: 1, type: 1 } },
        { key: { category: 1 } },
        { key: { level: 1 } },
        { key: { isActive: 1 } },
        // Compound indexes
        { key: { category: 1, level: 1 } },
        { key: { userId: 1, isActive: 1 } },
      ];
      
      // Only add text index if it doesn't exist
      if (!hasTextIndex) {
        skillIndexesToCreate.push({ key: { name: 'text', description: 'text' } });
      }
      
      await mongoose.connection.db.collection('skills').createIndexes(skillIndexesToCreate);
    } catch (skillIndexError) {
      console.warn('⚠️ Some skill indexes may already exist:', skillIndexError.message);
    }

    // Session indexes
    try {
      await mongoose.connection.db.collection('sessions').createIndexes([
        { key: { teacherId: 1 } },
        { key: { studentId: 1 } },
        { key: { skillId: 1 } },
        { key: { status: 1 } },
        { key: { scheduledAt: -1 } },
        { key: { createdAt: -1 } },
        // Compound indexes for common queries
        { key: { teacherId: 1, status: 1 } },
        { key: { studentId: 1, status: 1 } },
        { key: { status: 1, scheduledAt: -1 } },
      ]);
    } catch (sessionIndexError) {
      console.warn('⚠️ Some session indexes may already exist:', sessionIndexError.message);
    }

    // Match indexes
    try {
      await mongoose.connection.db.collection('matches').createIndexes([
        { key: { user1Id: 1 } },
        { key: { user2Id: 1 } },
        { key: { isActive: 1 } },
        { key: { compatibilityScore: -1 } },
        { key: { createdAt: -1 } },
        // Compound indexes
        { key: { user1Id: 1, isActive: 1 } },
        { key: { user2Id: 1, isActive: 1 } },
      ]);
    } catch (matchIndexError) {
      console.warn('⚠️ Some match indexes may already exist:', matchIndexError.message);
    }

    // Chat indexes
    try {
      await mongoose.connection.db.collection('chats').createIndexes([
        { key: { participants: 1 } },
        { key: { updatedAt: -1 } },
        { key: { isActive: 1 } },
      ]);
    } catch (chatIndexError) {
      console.warn('⚠️ Some chat indexes may already exist:', chatIndexError.message);
    }

    // Message indexes
    try {
      await mongoose.connection.db.collection('messages').createIndexes([
        { key: { chat: 1, createdAt: -1 } },
        { key: { sender: 1 } },
        { key: { readBy: 1 } },
        { key: { createdAt: -1 } },
        // Compound indexes for chat queries
        { key: { chat: 1, sender: 1 } },
      ]);
    } catch (messageIndexError) {
      console.warn('⚠️ Some message indexes may already exist:', messageIndexError.message);
    }

    // Follow indexes
    try {
      await mongoose.connection.db.collection('follows').createIndexes([
        { key: { followerId: 1 } },
        { key: { followingId: 1 } },
        { key: { createdAt: -1 } },
        // Compound index for mutual follows
        { key: { followerId: 1, followingId: 1 }, unique: true },
      ]);
    } catch (followIndexError) {
      console.warn('⚠️ Some follow indexes may already exist:', followIndexError.message);
    }

    if (process.env.NODE_ENV === 'development') {
      console.log('✅ Database indexes created successfully');
    }
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('❌ Error creating indexes:', error);
    }
    // Don't throw the error, just log it so the server can continue
  }
};

// Function to clean up invalid location data
const cleanupInvalidLocationData = async () => {
  try {
    console.log('🧹 Cleaning up invalid location data...');
    
    // Find all users with location data
    const allUsers = await mongoose.connection.db.collection('users').find({
      location: { $exists: true, $not: { $type: "null" } }
    }).toArray();

    for (const user of allUsers) {
      if (user.location && typeof user.location === 'object') {
        let needsUpdate = false;
        let updateFields = {};
        
        // Check if location has invalid structure (only updatedAt field)
        if (user.location.updatedAt !== undefined && 
            (!user.location.type || !user.location.coordinates)) {
          console.log(`🔧 Removing invalid location data for user: ${user._id}`);
          updateFields.$unset = { location: "" };
          needsUpdate = true;
        }
        // Check if location has old format (latitude/longitude fields)
        else if (user.location.latitude !== undefined && user.location.longitude !== undefined) {
          console.log(`🔄 Converting old location format for user: ${user._id}`);
          updateFields.$set = {
            location: {
              type: 'Point',
              coordinates: [user.location.longitude, user.location.latitude]
            }
          };
          
          // Keep the original updatedAt if it exists
          if (user.location.updatedAt) {
            updateFields.$set.locationUpdatedAt = user.location.updatedAt;
          }
          needsUpdate = true;
        }
        // Check if location has incomplete GeoJSON structure
        else if (!user.location.type || !Array.isArray(user.location.coordinates) || user.location.coordinates.length !== 2) {
          console.log(`🔧 Removing incomplete location structure for user: ${user._id}`);
          updateFields.$unset = { location: "" };
          needsUpdate = true;
        }
        
        if (needsUpdate) {
          await mongoose.connection.db.collection('users').updateOne(
            { _id: user._id },
            updateFields
          );
        }
      }
    }
    
    console.log('✅ Location data cleanup completed');
  } catch (error) {
    console.error('❌ Error cleaning up location data:', error);
  }
};

// Query optimization utilities
const QueryOptimizer = {
  // Paginated query with proper sorting
  paginatedQuery: (model, query = {}, options = {}) => {
    const {
      page = 1,
      limit = 20,
      sort = { createdAt: -1 },
      populate = [],
      select = null,
    } = options;

    const skip = (page - 1) * limit;

    let queryBuilder = model
      .find(query)
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    if (select) {
      queryBuilder = queryBuilder.select(select);
    }

    if (populate.length > 0) {
      populate.forEach(pop => {
        queryBuilder = queryBuilder.populate(pop);
      });
    }

    return queryBuilder;
  },

  // Aggregation pipeline for complex queries
  userStatsAggregation: (userId) => [
    { $match: { _id: new mongoose.Types.ObjectId(userId) } },
    {
      $lookup: {
        from: 'skills',
        localField: '_id',
        foreignField: 'userId',
        as: 'skills'
      }
    },
    {
      $lookup: {
        from: 'sessions',
        let: { userId: '$_id' },
        pipeline: [
          {
            $match: {
              $expr: {
                $or: [
                  { $eq: ['$teacherId', '$$userId'] },
                  { $eq: ['$studentId', '$$userId'] }
                ]
              },
              status: 'completed'
            }
          }
        ],
        as: 'completedSessions'
      }
    },
    {
      $lookup: {
        from: 'follows',
        localField: '_id',
        foreignField: 'followingId',
        as: 'followers'
      }
    },
    {
      $lookup: {
        from: 'follows',
        localField: '_id',
        foreignField: 'followerId',
        as: 'following'
      }
    },
    {
      $addFields: {
        skillsCount: { $size: '$skills' },
        completedSessionsCount: { $size: '$completedSessions' },
        followersCount: { $size: '$followers' },
        followingCount: { $size: '$following' },
        averageRating: {
          $avg: '$completedSessions.feedback.rating'
        }
      }
    },
    {
      $project: {
        password: 0,
        followers: 0,
        following: 0,
        completedSessions: 0
      }
    }
  ],

  // Skill matching aggregation
  skillMatchingAggregation: (userId, filters = {}) => {
    const {
      maxDistance = 50000, // 50km in meters
      skillCategories = [],
      minCompatibilityScore = 30,
      latitude,
      longitude
    } = filters;

    const pipeline = [
      {
        $match: {
          _id: { $ne: new mongoose.Types.ObjectId(userId) },
          isActive: true
        }
      }
    ];

    // Add geospatial filter if coordinates provided
    if (latitude && longitude) {
      pipeline.push({
        $match: {
          location: {
            $near: {
              $geometry: {
                type: 'Point',
                coordinates: [longitude, latitude]
              },
              $maxDistance: maxDistance
            }
          }
        }
      });
    }

    // Add skill lookup and filtering
    pipeline.push(
      {
        $lookup: {
          from: 'skills',
          localField: '_id',
          foreignField: 'userId',
          as: 'skills'
        }
      },
      {
        $match: skillCategories.length > 0 ? {
          'skills.category': { $in: skillCategories }
        } : {}
      }
    );

    return pipeline;
  },

  // Session analytics aggregation
  sessionAnalyticsAggregation: (dateRange = {}) => {
    const { startDate, endDate } = dateRange;
    const matchStage = {};

    if (startDate || endDate) {
      matchStage.createdAt = {};
      if (startDate) matchStage.createdAt.$gte = new Date(startDate);
      if (endDate) matchStage.createdAt.$lte = new Date(endDate);
    }

    return [
      { $match: matchStage },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' },
            day: { $dayOfMonth: '$createdAt' }
          },
          totalSessions: { $sum: 1 },
          completedSessions: {
            $sum: { $cond: [{ $eq: ['$status', 'completed'] }, 1, 0] }
          },
          cancelledSessions: {
            $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] }
          },
          averageRating: { $avg: '$feedback.rating' }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
    ];
  }
};

// Database connection optimization
const optimizeConnection = () => {
  // Set mongoose global options that are valid
  mongoose.set('strictQuery', false);
  
  // Disable automatic index creation in production
  if (process.env.NODE_ENV === 'production') {
    mongoose.set('autoIndex', false);
  }
};

// Performance monitoring middleware
const performanceMiddleware = (req, res, next) => {
  const startTime = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    
    // Log slow queries (>500ms)
    if (duration > 500) {
      console.warn(`🐌 Slow request: ${req.method} ${req.path} - ${duration}ms`);
    }
    
    // Log query metrics
    console.log(`📊 ${req.method} ${req.path} - ${duration}ms`);
  });
  
  next();
};

module.exports = {
  initializeDatabase,
  createIndexes: createOptimizedIndexes,
  createOptimizedIndexes,
  QueryOptimizer,
  optimizeConnection,
  performanceMiddleware
};
