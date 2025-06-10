const express = require('express');
const router = express.Router();
const Chat = require('../models/Chat');
const Message = require('../models/Message');
const auth = require('../middleware/auth');

// Get all chats for a user
router.get('/', auth, async (req, res) => {
  try {
    const chats = await Chat.find({
      participants: req.user.id
    })
    .populate('participants', 'name email avatar')
    .populate('lastMessage')
    .sort({ updatedAt: -1 });

    res.json(chats);
  } catch (error) {
    console.error('Error fetching chats:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get a specific chat
router.get('/:chatId', auth, async (req, res) => {
  try {
    const chat = await Chat.findOne({
      _id: req.params.chatId,
      participants: req.user.id
    })
    .populate('participants', 'name email avatar')
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

// Create or get existing chat between two users
router.post('/create', auth, async (req, res) => {
  try {
    const { otherUserId } = req.body;
    
    if (!otherUserId) {
      return res.status(400).json({ error: 'Other user ID is required' });
    }

    // Check if chat already exists
    let chat = await Chat.findOne({
      participants: { $all: [req.user.id, otherUserId] }
    })
    .populate('participants', 'name email avatar')
    .populate('lastMessage');

    if (chat) {
      return res.json(chat);
    }

    // Create new chat
    chat = new Chat({
      participants: [req.user.id, otherUserId]
    });

    await chat.save();
    
    chat = await Chat.findById(chat._id)
      .populate('participants', 'name email avatar')
      .populate('lastMessage');

    res.status(201).json(chat);
  } catch (error) {
    console.error('Error creating chat:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Mark chat as read
router.patch('/:chatId/read', auth, async (req, res) => {
  try {
    const chat = await Chat.findOne({
      _id: req.params.chatId,
      participants: req.user.id
    });

    if (!chat) {
      return res.status(404).json({ error: 'Chat not found' });
    }

    // Mark all messages in this chat as read for the current user
    await Message.updateMany(
      {
        chat: req.params.chatId,
        sender: { $ne: req.user.id },
        readBy: { $nin: [req.user.id] }
      },
      {
        $addToSet: { readBy: req.user.id }
      }
    );

    res.json({ message: 'Chat marked as read' });
  } catch (error) {
    console.error('Error marking chat as read:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete a chat
router.delete('/:chatId', auth, async (req, res) => {
  try {
    const chat = await Chat.findOne({
      _id: req.params.chatId,
      participants: req.user.id
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
