const express = require('express');
const router = express.Router();
const Chat = require('../models/Chat');
const Message = require('../models/Message');
const auth = require('../middleware/auth');

// Get all chats for a user
router.get('/', auth, async (req, res) => {
  try {
    const chats = await Chat.find({
      participants: req.userId
    })
    .populate('participants', 'name email profileImage')
    .populate('lastMessage')
    .sort({ updatedAt: -1 });

    res.json(chats);
  } catch (error) {
    console.error('Error fetching chats:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get chats for a specific user (frontend expects this endpoint)
router.get('/user/:userId', auth, async (req, res) => {
  try {
    // Ensure user can only get their own chats
    if (req.params.userId !== req.userId) {
      return res.status(403).json({
        success: false,
        error: 'Unauthorized'
      });
    }

    const chats = await Chat.find({
      participants: req.params.userId
    })
    .populate('participants', 'name email profileImage')
    .populate('lastMessage')
    .sort({ updatedAt: -1 });

    res.json({
      success: true,
      data: chats.map(chat => ({
        id: chat._id,
        participants: chat.participants.map(p => p._id.toString()),
        lastMessage: chat.lastMessage,
        updatedAt: chat.updatedAt
      }))
    });
  } catch (error) {
    console.error('Error fetching user chats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get user chats'
    });
  }
});

// Get a specific chat
router.get('/:chatId', auth, async (req, res) => {
  try {
    const chat = await Chat.findOne({
      _id: req.params.chatId,
      participants: req.userId
    })
    .populate('participants', 'name email profileImage')
    .populate('lastMessage');

    if (!chat) {
      return res.status(404).json({ error: 'Chat not found' });
    }

    res.json(chat);
  } catch (error) {
    console.error('Error fetching chat:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get messages for a specific chat (frontend expects this endpoint)
router.get('/:chatId/messages', auth, async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;

    // Verify user is part of the chat
    const chat = await Chat.findOne({
      _id: req.params.chatId,
      participants: req.userId
    });

    if (!chat) {
      return res.status(404).json({
        success: false,
        error: 'Chat not found'
      });
    }

    const messages = await Message.find({ chat: req.params.chatId })
      .populate('sender', 'name email profileImage')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip(offset)
      .exec();

    // Reverse to get chronological order
    messages.reverse();

    res.json({
      success: true,
      data: messages.map(msg => ({
        id: msg._id,
        senderId: msg.sender._id,
        receiverId: chat.participants.find(p => p.toString() !== msg.sender._id.toString()),
        content: msg.content,
        timestamp: msg.createdAt,
        isRead: msg.readBy.includes(req.userId)
      }))
    });
  } catch (error) {
    console.error('Error fetching chat messages:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get chat messages'
    });
  }
});

// SIMPLIFIED Find or create chat between participants - THIS IS THE KEY FIX
router.post('/find-or-create', auth, async (req, res) => {
  try {
    console.log('🚀 Find or create chat - START');
    console.log('📝 Request body:', JSON.stringify(req.body, null, 2));
    console.log('👤 Auth user ID:', req.userId);
    
    const { participants } = req.body;
    
    // Basic validation
    if (!participants) {
      console.log('❌ No participants provided');
      return res.status(400).json({
        success: false,
        error: 'Participants are required'
      });
    }

    if (!Array.isArray(participants)) {
      console.log('❌ Participants is not an array:', typeof participants);
      return res.status(400).json({
        success: false,
        error: 'Participants must be an array'
      });
    }

    if (participants.length !== 2) {
      console.log('❌ Wrong number of participants:', participants.length);
      return res.status(400).json({
        success: false,
        error: `Expected 2 participants, got ${participants.length}`
      });
    }

    console.log('✅ Basic validation passed');
    console.log('👥 Participants:', participants);

    // Convert to strings for consistency
    const participant1 = participants[0].toString();
    const participant2 = participants[1].toString();
    const currentUserId = req.userId.toString();

    console.log('🔍 Checking if current user is in participants:');
    console.log('Current user:', currentUserId);
    console.log('Participant 1:', participant1);
    console.log('Participant 2:', participant2);

    // Check if current user is one of the participants
    if (participant1 !== currentUserId && participant2 !== currentUserId) {
      console.log('❌ Current user not in participants');
      return res.status(403).json({
        success: false,
        error: 'You must be one of the participants'
      });
    }

    console.log('✅ Authorization passed');

    // Generate chat ID
    const chatId = Chat.generateChatId(participant1, participant2);
    console.log('🆔 Generated chat ID:', chatId);

    // Try to find existing chat
    let chat = await Chat.findById(chatId);
    console.log('🔍 Existing chat found:', !!chat);

    if (chat) {
      // Populate the existing chat
      chat = await Chat.findById(chatId)
        .populate('participants', 'name email profileImage')
        .populate('lastMessage');
      
      console.log('✅ Returning existing chat');
      return res.json({
        success: true,
        data: {
          id: chat._id,
          participants: chat.participants.map(p => ({
            id: p._id.toString(),
            name: p.name,
            email: p.email,
            profileImage: p.profileImage
          })),
          lastMessage: chat.lastMessage,
          updatedAt: chat.updatedAt
        }
      });
    }

    console.log('🔧 Creating new chat...');

    // Create new chat
    chat = new Chat({
      _id: chatId,
      participants: [participant1, participant2],
      isActive: true
    });

    await chat.save();
    console.log('💾 Chat saved to database');

    // Populate the new chat
    chat = await Chat.findById(chatId)
      .populate('participants', 'name email profileImage');

    console.log('✅ Chat created successfully:', chat._id);

    res.status(201).json({
      success: true,
      data: {
        id: chat._id,
        participants: chat.participants.map(p => ({
          id: p._id.toString(),
          name: p.name,
          email: p.email,
          profileImage: p.profileImage
        })),
        lastMessage: null,
        updatedAt: chat.updatedAt
      }
    });

  } catch (error) {
    console.error('❌ Error in find-or-create chat:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Mark messages in chat as read
router.put('/:chatId/read', auth, async (req, res) => {
  try {
    const { userId } = req.body;
    
    // Ensure user can only mark their own messages as read
    if (userId !== req.userId) {
      return res.status(403).json({
        success: false,
        error: 'Unauthorized'
      });
    }

    const chat = await Chat.findOne({
      _id: req.params.chatId,
      participants: userId
    });

    if (!chat) {
      return res.status(404).json({
        success: false,
        error: 'Chat not found'
      });
    }

    // Mark all messages in this chat as read for the current user
    const result = await Message.updateMany(
      {
        chat: req.params.chatId,
        sender: { $ne: userId },
        readBy: { $nin: [userId] }
      },
      {
        $addToSet: { readBy: userId }
      }
    );

    // Get the message IDs that were updated
    const updatedMessages = await Message.find({
      chat: req.params.chatId,
      readBy: userId
    }).select('_id');

    res.json({
      success: true,
      data: updatedMessages.map(msg => msg._id.toString())
    });
  } catch (error) {
    console.error('Error marking messages as read:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to mark messages as read'
    });
  }
});

// Delete a chat
router.delete('/:chatId', auth, async (req, res) => {
  try {
    const chat = await Chat.findOne({
      _id: req.params.chatId,
      participants: req.userId
    });

    if (!chat) {
      return res.status(404).json({ error: 'Chat not found' });
    }

    // Delete all messages in the chat
    await Message.deleteMany({ chat: req.params.chatId });
    
    // Delete the chat
    await Chat.findByIdAndDelete(req.params.chatId);

    res.json({ message: 'Chat deleted successfully' });
  } catch (error) {
    console.error('Error deleting chat:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;

// Get all chats for a user
router.get('/', auth, async (req, res) => {
  try {
    const chats = await Chat.find({
      participants: req.userId
    })
    .populate('participants', 'name email profileImage')
    .populate('lastMessage')
    .sort({ updatedAt: -1 });

    res.json(chats);
  } catch (error) {
    console.error('Error fetching chats:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get chats for a specific user (frontend expects this endpoint)
router.get('/user/:userId', auth, async (req, res) => {
  try {
    // Ensure user can only get their own chats
    if (req.params.userId !== req.userId) {
      return res.status(403).json({
        success: false,
        error: 'Unauthorized'
      });
    }

    const chats = await Chat.find({
      participants: req.params.userId
    })
    .populate('participants', 'name email profileImage')
    .populate('lastMessage')
    .sort({ updatedAt: -1 });

    res.json({
      success: true,
      data: chats.map(chat => ({
        id: chat._id,
        participants: chat.participants.map(p => p._id.toString()),
        lastMessage: chat.lastMessage,
        updatedAt: chat.updatedAt
      }))
    });
  } catch (error) {
    console.error('Error fetching user chats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get user chats'
    });
  }
});

// Get a specific chat
router.get('/:chatId', auth, async (req, res) => {
  try {
    const chat = await Chat.findOne({
      _id: req.params.chatId,
      participants: req.userId
    })
    .populate('participants', 'name email profileImage')
    .populate('lastMessage');

    if (!chat) {
      return res.status(404).json({ error: 'Chat not found' });
    }

    res.json(chat);
  } catch (error) {
    console.error('Error fetching chat:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get messages for a specific chat (frontend expects this endpoint)
router.get('/:chatId/messages', auth, async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;

    // Verify user is part of the chat
    const chat = await Chat.findOne({
      _id: req.params.chatId,
      participants: req.userId
    });

    if (!chat) {
      return res.status(404).json({
        success: false,
        error: 'Chat not found'
      });
    }

    const messages = await Message.find({ chat: req.params.chatId })
      .populate('sender', 'name email profileImage')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip(offset)
      .exec();

    // Reverse to get chronological order
    messages.reverse();

    res.json({
      success: true,
      data: messages.map(msg => ({
        id: msg._id,
        senderId: msg.sender._id,
        receiverId: chat.participants.find(p => p.toString() !== msg.sender._id.toString()),
        content: msg.content,
        timestamp: msg.createdAt,
        isRead: msg.readBy.includes(req.userId)
      }))
    });
  } catch (error) {
    console.error('Error fetching chat messages:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get chat messages'
    });
  }
});

// Create or get existing chat between two users
router.post('/create', auth, async (req, res) => {
  try {
    const { otherUserId } = req.body;

    if (!otherUserId) {
      return res.status(400).json({ error: 'Other user ID is required' });
    }

    // Generate consistent chat ID using the static method
    const chatId = Chat.generateChatId(req.userId, otherUserId);

    // Check if chat already exists
    let chat = await Chat.findById(chatId)
      .populate('participants', 'name email profileImage')
      .populate('lastMessage');

    if (chat) {
      return res.json(chat);
    }

    // Create new chat with consistent ID
    chat = new Chat({
      _id: chatId,
      participants: [req.userId, otherUserId]
    });
    
    await chat.save();
    
    chat = await Chat.findById(chat._id)
      .populate('participants', 'name email profileImage')
      .populate('lastMessage');

    res.status(201).json(chat);
  } catch (error) {
    console.error('Error creating chat:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Find or create chat between participants
router.post('/find-or-create', auth, async (req, res) => {
  try {
    const { participants } = req.body;
    
    console.log('🐛 Find or create chat debug:', {
      participants,
      participantsType: typeof participants,
      isArray: Array.isArray(participants),
      length: participants?.length,
      reqUserId: req.userId,
      reqBody: req.body
    });
    
    if (!participants || !Array.isArray(participants) || participants.length !== 2) {
      console.log('❌ Validation failed:', { participants, type: typeof participants, isArray: Array.isArray(participants), length: participants?.length });
      return res.status(400).json({
        success: false,
        error: 'Exactly 2 participants are required'
      });
    }

    // Ensure current user is one of the participants  
    const userIdStr = req.userId.toString();
    const participantsStr = participants.map(p => p.toString());
    
    if (!participantsStr.includes(userIdStr)) {
      console.log('❌ Authorization failed - user not in participants:', {
        reqUserId: req.userId,
        userIdStr,
        participants,
        participantsStr,
        includes: participantsStr.includes(userIdStr)
      });
      return res.status(403).json({
        success: false,
        error: 'Unauthorized'
      });
    }

    // Generate consistent chat ID using the static method
    const chatId = Chat.generateChatId(participantsStr[0], participantsStr[1]);
    console.log('📝 Generated chat ID:', chatId);

    // Check if chat already exists
    let chat = await Chat.findById(chatId)
      .populate('participants', 'name email profileImage')
      .populate('lastMessage');

    if (chat) {
      console.log('✅ Chat already exists:', chat._id);
      return res.json({
        success: true,
        data: {
          id: chat._id,
          participants: chat.participants.map(p => p._id.toString()),
          lastMessage: chat.lastMessage,
          updatedAt: chat.updatedAt
        }
      });
    }

    console.log('🔧 Creating new chat...');
    // Create new chat with consistent ID
    chat = new Chat({
      _id: chatId,
      participants: participants
    });
    
    await chat.save();
    console.log('💾 Chat saved to database');
    
    chat = await Chat.findById(chat._id)
      .populate('participants', 'name email profileImage');

    console.log('✅ Chat created successfully:', chat._id);

    res.status(201).json({
      success: true,
      data: {
        id: chat._id,
        participants: chat.participants.map(p => p._id.toString()),
        lastMessage: null,
        updatedAt: chat.updatedAt
      }
    });
  } catch (error) {
    console.error('Error finding or creating chat:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to find or create chat'
    });
  }
});

// Mark messages in chat as read
router.put('/:chatId/read', auth, async (req, res) => {
  try {
    const { userId } = req.body;
    
    // Ensure user can only mark their own messages as read
    if (userId !== req.userId) {
      return res.status(403).json({
        success: false,
        error: 'Unauthorized'
      });
    }

    const chat = await Chat.findOne({
      _id: req.params.chatId,
      participants: userId
    });

    if (!chat) {
      return res.status(404).json({
        success: false,
        error: 'Chat not found'
      });
    }

    // Mark all messages in this chat as read for the current user
    const result = await Message.updateMany(
      {
        chat: req.params.chatId,
        sender: { $ne: userId },
        readBy: { $nin: [userId] }
      },
      {
        $addToSet: { readBy: userId }
      }
    );

    // Get the message IDs that were updated
    const updatedMessages = await Message.find({
      chat: req.params.chatId,
      readBy: userId
    }).select('_id');

    res.json({
      success: true,
      data: updatedMessages.map(msg => msg._id.toString())
    });
  } catch (error) {
    console.error('Error marking messages as read:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to mark messages as read'
    });
  }
});

// Delete a chat
router.delete('/:chatId', auth, async (req, res) => {
  try {
    const chat = await Chat.findOne({
      _id: req.params.chatId,
      participants: req.userId
    });

    if (!chat) {
      return res.status(404).json({ error: 'Chat not found' });
    }

    // Delete all messages in the chat
    await Message.deleteMany({ chat: req.params.chatId });
    
    // Delete the chat
    await Chat.findByIdAndDelete(req.params.chatId);

    res.json({ message: 'Chat deleted successfully' });
  } catch (error) {
    console.error('Error deleting chat:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
