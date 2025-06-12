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

// Create or get existing chat between two users
router.post('/create', auth, async (req, res) => {
  try {
    const { otherUserId } = req.body;
    
    if (!otherUserId) {
      return res.status(400).json({ error: 'Other user ID is required' });
    }

    // Check if chat already exists
    let chat = await Chat.findOne({
      participants: { $all: [req.userId, otherUserId] }
    })
    .populate('participants', 'name email profileImage')
    .populate('lastMessage');

    if (chat) {
      return res.json(chat);
    }

    // Create new chat
    chat = new Chat({
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
    
    if (!participants || !Array.isArray(participants) || participants.length !== 2) {
      return res.status(400).json({
        success: false,
        error: 'Exactly 2 participants are required'
      });
    }

    // Ensure current user is one of the participants
    if (!participants.includes(req.userId)) {
      return res.status(403).json({
        success: false,
        error: 'Unauthorized'
      });
    }

    // Generate consistent chat ID using the static method
    const chatId = Chat.generateChatId(participants[0], participants[1]);

    // Check if chat already exists
    let chat = await Chat.findById(chatId)
      .populate('participants', 'name email profileImage')
      .populate('lastMessage');

    if (chat) {
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

    // Create new chat with consistent ID
    chat = new Chat({
      _id: chatId,
      participants: participants
    });
    
    await chat.save();
    
    chat = await Chat.findById(chat._id)
      .populate('participants', 'name email profileImage');

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
