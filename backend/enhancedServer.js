// Enhanced SkillSwap Backend Server with comprehensive optimizations
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const cluster = require('cluster');
const os = require('os');

// Load environment variables
dotenv.config();

// Import enhanced middleware and utilities
const {
  enhancedSecurityMiddleware,
  sanitizeInput,
  enhancedAuth,
  enhancedAdminAuth,
  enhancedErrorHandler,
  performanceMonitor,
  healthCheck
} = require('./middleware/enhancedMiddleware');

const { initializeDatabase, createIndexes } = require('./utils/databaseOptimization');
const { cacheService } = require('./utils/cacheService');
const { socketUtils } = require('./utils/socketUtils');

// Performance optimization: Use cluster in production
if (cluster.isMaster && process.env.NODE_ENV === 'production') {
  const numCPUs = os.cpus().length;
  console.log(`Master ${process.pid} is running`);
  console.log(`Forking ${numCPUs} workers...`);

  // Fork workers
  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }

  cluster.on('exit', (worker, code, signal) => {
    console.log(`Worker ${worker.process.pid} died. Forking new worker...`);
    cluster.fork();
  });
} else {
  // Worker process or development mode
  startServer();
}

async function startServer() {
  const app = express();
  const server = http.createServer(app);
  
  // Enhanced Socket.IO configuration
  const io = socketIo(server, {
    cors: {
      origin: [
        'http://localhost:3000',
        'http://127.0.0.1:3000',
        'http://192.168.1.93:3000',
        'exp://192.168.1.93:8081',
        process.env.FRONTEND_URL
      ].filter(Boolean),
      methods: ['GET', 'POST'],
      credentials: true
    },
    transports: ['websocket', 'polling'],
    pingTimeout: 60000,
    pingInterval: 25000,
    upgradeTimeout: 30000,
    maxHttpBufferSize: 1e6, // 1MB
    allowRequest: (req, callback) => {
      // Additional security checks can be added here
      callback(null, true);
    }
  });

  // Initialize services
  try {
    console.log('🚀 Starting SkillSwap Enhanced Server...');
    
    // Connect to MongoDB with optimizations
    await connectToMongoDB();
    
    // Initialize cache service
    await cacheService.connect();
    
    // Apply enhanced security middleware
    enhancedSecurityMiddleware(app);
    
    // Performance monitoring
    app.use(performanceMonitor);
    
    // Input sanitization
    app.use(sanitizeInput);
    
    // Serve static files with caching
    app.use('/uploads', express.static(path.join(__dirname, 'uploads'), {
      maxAge: '1d',
      etag: true,
      lastModified: true
    }));
    
    // Health check endpoint
    app.get('/health', healthCheck);
    app.get('/api/health', healthCheck);
    
    // API Routes with enhanced middleware
    setupRoutes(app);
    
    // Enhanced Socket.IO setup
    setupEnhancedSocket(io);
    
    // Error handling middleware (must be last)
    app.use(enhancedErrorHandler);
    
    // Start server
    const PORT = process.env.PORT || 3000;
    server.listen(PORT, '0.0.0.0', () => {
      console.log(`✅ Server running on port ${PORT}`);
      console.log(`🏠 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`🔧 Worker PID: ${process.pid}`);
      console.log(`💾 Database: Connected`);
      console.log(`⚡ Cache: ${cacheService.isConnected() ? 'Connected' : 'Disconnected'}`);
    });

    // Graceful shutdown
    setupGracefulShutdown(server);
    
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Enhanced MongoDB connection with optimization
async function connectToMongoDB() {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/skillswap';
    
    await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      maxPoolSize: 10, // Maintain up to 10 socket connections
      serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
      socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
      bufferCommands: false, // Disable mongoose buffering
      bufferMaxEntries: 0, // Disable mongoose buffering
      maxIdleTimeMS: 30000, // Close connections after 30 seconds of inactivity
      autoIndex: process.env.NODE_ENV !== 'production', // Don't build indexes in production
    });

    console.log('✅ Connected to MongoDB');
    
    // Initialize database with indexes and optimizations
    await initializeDatabase();
    await createIndexes();
    
  } catch (error) {
    console.error('❌ MongoDB connection error:', error);
    throw error;
  }
}

// Setup API routes with enhanced middleware
function setupRoutes(app) {
  // Import route modules
  const authRoutes = require('./routes/auth');
  const userRoutes = require('./routes/users');
  const skillRoutes = require('./routes/skills');
  const matchRoutes = require('./routes/matches');
  const sessionRoutes = require('./routes/sessions');
  const chatRoutes = require('./routes/chats');
  const messageRoutes = require('./routes/messages');
  const followRoutes = require('./routes/follows');
  const adminRoutes = require('./routes/admin');

  // Apply routes with middleware
  app.use('/api/auth', authRoutes);
  app.use('/api/users', enhancedAuth, userRoutes);
  app.use('/api/skills', enhancedAuth, skillRoutes);
  app.use('/api/matches', enhancedAuth, matchRoutes);
  app.use('/api/sessions', enhancedAuth, sessionRoutes);
  app.use('/api/chats', enhancedAuth, chatRoutes);
  app.use('/api/messages', enhancedAuth, messageRoutes);
  app.use('/api/follows', enhancedAuth, followRoutes);
  app.use('/api/admin', enhancedAdminAuth, adminRoutes);

  // 404 handler
  app.use('/api/*', (req, res) => {
    res.status(404).json({
      error: 'API endpoint not found',
      path: req.path,
      method: req.method
    });
  });
}

// Enhanced Socket.IO setup with real-time features
function setupEnhancedSocket(io) {
  // Make io available to other modules
  socketUtils.setIO(io);
  
  // Enhanced connection handling
  io.on('connection', (socket) => {
    console.log('👤 User connected:', socket.id);
    
    let currentUserId = null;
    let currentChatId = null;
    
    // Enhanced user authentication for sockets
    socket.on('authenticate', async (token) => {
      try {
        const jwt = require('jsonwebtoken');
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const User = require('./models/User');
        
        const user = await User.findById(decoded.userId).select('-password');
        if (user) {
          currentUserId = user._id.toString();
          socket.userId = currentUserId;
          
          // Join user to their personal room
          socket.join(`user-${currentUserId}`);
          
          // Update user's online status
          await cacheService.set(`online:${currentUserId}`, true, 300); // 5 minutes
          
          // Notify friends about online status
          socket.broadcast.emit('user-online', currentUserId);
          
          socket.emit('authenticated', { userId: currentUserId });
          console.log(`✅ User authenticated: ${user.name} (${currentUserId})`);
        }
      } catch (error) {
        console.error('❌ Socket authentication failed:', error);
        socket.emit('authentication-failed');
      }
    });

    // Enhanced chat management
    socket.on('join-chat', (chatId) => {
      if (currentChatId) {
        socket.leave(currentChatId);
      }
      currentChatId = chatId;
      socket.join(chatId);
      console.log(`💬 User ${currentUserId} joined chat: ${chatId}`);
    });

    socket.on('leave-chat', (chatId) => {
      socket.leave(chatId);
      if (currentChatId === chatId) {
        currentChatId = null;
      }
      console.log(`👋 User ${currentUserId} left chat: ${chatId}`);
    });

    // Enhanced messaging with real-time features
    socket.on('send-message', async (data) => {
      try {
        const { chatId, content, type = 'text' } = data;
        
        if (!currentUserId || !chatId || !content) {
          socket.emit('message-error', 'Invalid message data');
          return;
        }

        // Save message to database
        const Message = require('./models/Message');
        const Chat = require('./models/Chat');
        
        const message = new Message({
          chatId,
          senderId: currentUserId,
          content,
          type,
          timestamp: new Date()
        });
        
        await message.save();
        
        // Update chat's last message
        await Chat.findByIdAndUpdate(chatId, {
          lastMessage: message._id,
          updatedAt: new Date()
        });

        // Populate sender info
        await message.populate('senderId', 'name profileImage');
        
        // Send to all users in the chat
        io.to(chatId).emit('new-message', message);
        
        // Send push notification to offline users (implement as needed)
        // await sendPushNotification(chatId, currentUserId, message);
        
        console.log(`📨 Message sent in chat ${chatId} by ${currentUserId}`);
        
      } catch (error) {
        console.error('❌ Error sending message:', error);
        socket.emit('message-error', 'Failed to send message');
      }
    });

    // Typing indicators
    socket.on('typing-start', (data) => {
      const { chatId } = data;
      if (chatId && currentUserId) {
        socket.to(chatId).emit('user-typing-start', {
          userId: currentUserId,
          chatId
        });
      }
    });

    socket.on('typing-stop', (data) => {
      const { chatId } = data;
      if (chatId && currentUserId) {
        socket.to(chatId).emit('user-typing-stop', {
          userId: currentUserId,
          chatId
        });
      }
    });

    // Message read receipts
    socket.on('mark-messages-read', async (data) => {
      try {
        const { chatId } = data;
        if (!chatId || !currentUserId) return;

        const Message = require('./models/Message');
        
        // Mark messages as read
        await Message.updateMany(
          { 
            chatId, 
            senderId: { $ne: currentUserId },
            readBy: { $ne: currentUserId }
          },
          { 
            $addToSet: { readBy: currentUserId },
            $set: { readAt: new Date() }
          }
        );

        // Notify other users in chat
        socket.to(chatId).emit('messages-read', {
          chatId,
          readBy: currentUserId
        });

      } catch (error) {
        console.error('❌ Error marking messages as read:', error);
      }
    });

    // Video call signaling
    socket.on('call-user', (data) => {
      const { to, signal, from } = data;
      io.to(`user-${to}`).emit('incoming-call', {
        signal,
        from,
        fromSocketId: socket.id
      });
    });

    socket.on('accept-call', (data) => {
      const { signal, to } = data;
      io.to(to).emit('call-accepted', { signal });
    });

    socket.on('reject-call', (data) => {
      const { to } = data;
      io.to(to).emit('call-rejected');
    });

    socket.on('end-call', (data) => {
      const { to } = data;
      io.to(to).emit('call-ended');
    });

    // Enhanced user presence
    socket.on('update-presence', async (status) => {
      if (currentUserId) {
        await cacheService.set(`presence:${currentUserId}`, {
          status,
          lastSeen: new Date(),
          socketId: socket.id
        }, 300);
        
        // Notify friends about presence change
        socket.broadcast.emit('user-presence-updated', {
          userId: currentUserId,
          status,
          lastSeen: new Date()
        });
      }
    });

    // Location sharing for sessions
    socket.on('share-location', (data) => {
      const { sessionId, location } = data;
      if (sessionId && location && currentUserId) {
        socket.to(`session-${sessionId}`).emit('location-shared', {
          userId: currentUserId,
          location,
          timestamp: new Date()
        });
      }
    });

    // Enhanced disconnection handling
    socket.on('disconnect', async (reason) => {
      console.log(`👋 User disconnected: ${socket.id}, reason: ${reason}`);
      
      if (currentUserId) {
        // Update offline status
        await cacheService.delete(`online:${currentUserId}`);
        await cacheService.set(`presence:${currentUserId}`, {
          status: 'offline',
          lastSeen: new Date()
        }, 3600); // Keep for 1 hour
        
        // Notify friends about offline status
        socket.broadcast.emit('user-offline', {
          userId: currentUserId,
          lastSeen: new Date()
        });
      }
    });

    // Error handling
    socket.on('error', (error) => {
      console.error('🔥 Socket error:', error);
    });
  });

  // Enhanced Socket.IO middleware for authentication
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (token) {
        const jwt = require('jsonwebtoken');
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        socket.userId = decoded.userId;
      }
      next();
    } catch (error) {
      console.error('Socket middleware error:', error);
      // Allow connection even without token for initial auth
      next();
    }
  });
}

// Graceful shutdown handling
function setupGracefulShutdown(server) {
  const gracefulShutdown = async (signal) => {
    console.log(`\n📡 Received ${signal}. Starting graceful shutdown...`);
    
    // Stop accepting new connections
    server.close(() => {
      console.log('🔌 HTTP server closed');
    });
    
    try {
      // Close database connection
      await mongoose.connection.close();
      console.log('🗄️ Database connection closed');
      
      // Close cache connection
      await cacheService.disconnect();
      console.log('⚡ Cache connection closed');
      
      console.log('✅ Graceful shutdown completed');
      process.exit(0);
    } catch (error) {
      console.error('❌ Error during shutdown:', error);
      process.exit(1);
    }
  };

  // Handle shutdown signals
  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));
  
  // Handle uncaught exceptions
  process.on('uncaughtException', (error) => {
    console.error('💥 Uncaught Exception:', error);
    gracefulShutdown('UNCAUGHT_EXCEPTION');
  });
  
  process.on('unhandledRejection', (reason, promise) => {
    console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
    gracefulShutdown('UNHANDLED_REJECTION');
  });
}

module.exports = { app: null }; // Export for testing purposes
