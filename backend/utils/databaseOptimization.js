// Backend optimization: Database indexing and query optimization
const mongoose = require('mongoose');

// Initialize database with proper setup
const initializeDatabase = async () => {
  try {
    console.log('🔧 Initializing database...');
    
    // Set up connection optimizations
    optimizeConnection();
    
    // Create all necessary indexes
    await createOptimizedIndexes();
    
    console.log('✅ Database initialization completed');
    return true;
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    throw error;
  }
};

// Enhanced indexes for better query performance
const createOptimizedIndexes = async () => {
  try {
    console.log('🔧 Creating optimized database indexes...');

    // User indexes
    await mongoose.connection.db.collection('users').createIndexes([
      { key: { email: 1 }, unique: true },
      { key: { city: 1 } },
      { key: { location: '2dsphere' } }, // Geospatial index
      { key: { role: 1 } },
      { key: { isActive: 1 } },
      { key: { lastActive: -1 } },
      { key: { createdAt: -1 } },
      { key: { name: 'text', email: 'text' } }, // Text search
      // Compound indexes for common queries
      { key: { city: 1, isActive: 1 } },
      { key: { role: 1, isActive: 1 } },
    ]);

    // Skill indexes
    await mongoose.connection.db.collection('skills').createIndexes([
      { key: { userId: 1, type: 1 } },
      { key: { category: 1 } },
      { key: { level: 1 } },
      { key: { isActive: 1 } },
      { key: { name: 'text', description: 'text' } }, // Text search
      // Compound indexes
      { key: { category: 1, level: 1 } },
      { key: { userId: 1, isActive: 1 } },
    ]);

    // Session indexes
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

    // Match indexes
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

    // Chat indexes
    await mongoose.connection.db.collection('chats').createIndexes([
      { key: { participants: 1 } },
      { key: { updatedAt: -1 } },
      { key: { isActive: 1 } },
    ]);

    // Message indexes
    await mongoose.connection.db.collection('messages').createIndexes([
      { key: { chat: 1, createdAt: -1 } },
      { key: { sender: 1 } },
      { key: { readBy: 1 } },
      { key: { createdAt: -1 } },
      // Compound indexes for chat queries
      { key: { chat: 1, sender: 1 } },
    ]);

    // Follow indexes
    await mongoose.connection.db.collection('follows').createIndexes([
      { key: { followerId: 1 } },
      { key: { followingId: 1 } },
      { key: { createdAt: -1 } },
      // Compound index for mutual follows
      { key: { followerId: 1, followingId: 1 }, unique: true },
    ]);

    console.log('✅ Database indexes created successfully');
  } catch (error) {
    console.error('❌ Error creating indexes:', error);
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
    { $match: { _id: mongoose.Types.ObjectId(userId) } },
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
          _id: { $ne: mongoose.Types.ObjectId(userId) },
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
  // Connection pooling settings
  mongoose.set('maxPoolSize', 20);
  mongoose.set('minPoolSize', 5);
  mongoose.set('maxIdleTimeMS', 30000);
  mongoose.set('serverSelectionTimeoutMS', 5000);
  mongoose.set('socketTimeoutMS', 45000);
  
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
