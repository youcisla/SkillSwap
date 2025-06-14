const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const { setSocketIO } = require('./utils/socketUtils');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve static files for uploaded images
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/skillswap';

// Global connection state
let isConnected = false;

console.log('🔗 Connecting to MongoDB...');
console.log('📍 Database URI:', MONGODB_URI.replace(/:[^:@]*@/, ':****@')); // Hide password in logs

// Ensure we wait for connection before starting server
async function connectToDatabase() {
  try {
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 10000, // Timeout after 10s
      connectTimeoutMS: 10000,
      maxPoolSize: 10,
    });
    
    console.log('✅ Connected to MongoDB successfully');
    console.log('📊 Database name:', mongoose.connection.db.databaseName);
    isConnected = true;
    
    // List collections to verify database setup
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log('📁 Available collections:', collections.map(c => c.name));
    if (collections.length === 0) {
      console.log('💡 No collections found - they will be created automatically when data is inserted');
    }
    
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    console.log('🔧 Please check:');
    console.log('   1. Internet connection');
    console.log('   2. MongoDB Atlas credentials');
    console.log('   3. Database whitelist settings');
    console.log('   4. Network firewall settings');
    isConnected = false;
    throw error;
  }
}

// Connection event handlers
mongoose.connection.on('connected', () => {
  console.log('🔗 Mongoose connected to MongoDB');
  isConnected = true;
});

mongoose.connection.on('error', (error) => {
  console.error('❌ Mongoose connection error:', error);
  isConnected = false;
});

mongoose.connection.on('disconnected', () => {
  console.log('🔌 Mongoose disconnected from MongoDB');
  isConnected = false;
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'SkillSwap API is running',
    database: isConnected ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString()
  });
});

// Import routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const skillRoutes = require('./routes/skills');
const matchRoutes = require('./routes/matches');
const sessionRoutes = require('./routes/sessions');
const chatRoutes = require('./routes/chats');
const messageRoutes = require('./routes/messages');
const followRoutes = require('./routes/follows');
const adminRoutes = require('./routes/admin');

// Use routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/skills', skillRoutes);
app.use('/api/matches', matchRoutes);
app.use('/api/sessions', sessionRoutes);
app.use('/api/chats', chatRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/follows', followRoutes);
app.use('/api/admin', adminRoutes);

// Socket.io for real-time messaging
setSocketIO(io); // Make io available to other modules

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Store user ID for this socket connection
  let currentUserId = null;

  // Join user to their personal room for notifications
  socket.on('join-user-room', (userId) => {
    currentUserId = userId;
    socket.join(`user-${userId}`);
    console.log(`User ${userId} joined personal room`);
    
    // Update user online status
    socket.emit('user-status', { userId, status: 'online' });
  });

  // Join chat room
  socket.on('join-chat', (chatId) => {
    socket.join(chatId);
    console.log(`User joined chat: ${chatId}`);
  });

  // Leave chat room
  socket.on('leave-chat', (chatId) => {
    socket.leave(chatId);
    console.log(`User left chat: ${chatId}`);
  });

  // Handle real-time message sending
  socket.on('send-message', (data) => {
    console.log('Broadcasting message to chat:', data.chatId);
    // Broadcast to all users in the chat except sender
    socket.to(data.chatId).emit('new-message', data);
    
    // Also send to the receiver's personal room for notifications
    if (data.receiverId) {
      socket.to(`user-${data.receiverId}`).emit('new-message', data);
    }
  });

  // Handle user status updates
  socket.on('user-status', (data) => {
    if (currentUserId) {
      socket.broadcast.emit('user-status-update', {
        userId: currentUserId,
        status: data.status
      });
    }
  });

  // Handle typing indicators
  socket.on('typing-start', (data) => {
    socket.to(data.chatId).emit('user-typing', {
      userId: currentUserId,
      chatId: data.chatId,
      isTyping: true
    });
  });

  socket.on('typing-stop', (data) => {
    socket.to(data.chatId).emit('user-typing', {
      userId: currentUserId,
      chatId: data.chatId,
      isTyping: false
    });
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    
    // Update user offline status if we know their ID
    if (currentUserId) {
      socket.broadcast.emit('user-status-update', {
        userId: currentUserId,
        status: 'offline'
      });
    }
  });
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Error:', error);
  res.status(error.status || 500).json({
    success: false,
    error: error.message || 'Internal server error'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found'
  });
});

const PORT = process.env.PORT || 3000;

// Start server after database connection
async function startServer() {
  try {
    await connectToDatabase();
    
    server.listen(PORT, () => {
      console.log(`✅ Server running on port ${PORT}`);
      console.log(`🌐 Health check: http://localhost:${PORT}/api/health`);
      console.log(`🔐 Auth endpoints: http://localhost:${PORT}/api/auth/`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error.message);
    console.log('🔄 Retrying in 5 seconds...');
    setTimeout(startServer, 5000);
  }
}

startServer();
