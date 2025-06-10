const express = require('express');
const router = express.Router();
const Message = require('../models/Message');
const Chat = require('../models/Chat');
const auth = require('../middleware/auth');

// Get messages for a chat
router.get('/chat/:chatId', auth, async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;

    // Verify user is part of the chat
    const chat = await Chat.findOne({
      _id: req.params.chatId,
      participants: req.user.id
    });

    if (!chat) {
      return res.status(404).json({ error: 'Chat not found' });
    }

    const messages = await Message.find({ chat: req.params.chatId })
      .populate('sender', 'name email avatar')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip(offset)
      .exec();

    // Reverse to get chronological order
    messages.reverse();

    res.json(messages);
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Send a message
router.post('/', auth, async (req, res) => {
  try {
    const { chatId, content, type = 'text' } = req.body;

    if (!chatId || !content) {
      return res.status(400).json({ error: 'Chat ID and content are required' });
    }

    // Verify user is part of the chat
    const chat = await Chat.findOne({
      _id: chatId,
      participants: req.user.id
    });

    if (!chat) {
      return res.status(404).json({ error: 'Chat not found' });
    }

    // Create new message
    const message = new Message({
      chat: chatId,
      sender: req.user.id,
      content,
      type,
      readBy: [req.user.id] // Sender has read the message
    });

    await message.save();

    // Update chat's last message
    chat.lastMessage = message._id;
    chat.updatedAt = new Date();
    await chat.save();

    // Populate message with sender info
    await message.populate('sender', 'name email avatar');

    res.status(201).json(message);
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Mark message as read
router.patch('/:messageId/read', auth, async (req, res) => {
  try {
    const message = await Message.findById(req.params.messageId);

    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }

    // Verify user is part of the chat
    const chat = await Chat.findOne({
      _id: message.chat,
      participants: req.user.id
    });

    if (!chat) {
      return res.status(404).json({ error: 'Chat not found' });
    }

    // Add user to readBy array if not already there
    if (!message.readBy.includes(req.user.id)) {
      message.readBy.push(req.user.id);
      await message.save();
    }

    res.json({ message: 'Message marked as read' });
  } catch (error) {
    console.error('Error marking message as read:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update a message (edit)
router.patch('/:messageId', auth, async (req, res) => {
  try {
    const { content } = req.body;

    if (!content) {
      return res.status(400).json({ error: 'Content is required' });
    }

    const message = await Message.findOne({
      _id: req.params.messageId,
      sender: req.user.id
    });

    if (!message) {
      return res.status(404).json({ error: 'Message not found or unauthorized' });
    }

    message.content = content;
    message.isEdited = true;
    await message.save();

    await message.populate('sender', 'name email avatar');

    res.json(message);
  } catch (error) {
    console.error('Error updating message:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete a message
router.delete('/:messageId', auth, async (req, res) => {
  try {
    const message = await Message.findOne({
      _id: req.params.messageId,
      sender: req.user.id
    });

    if (!message) {
      return res.status(404).json({ error: 'Message not found or unauthorized' });
    }

    await Message.findByIdAndDelete(req.params.messageId);

    // Update chat's last message if this was the last message
    const chat = await Chat.findById(message.chat);
    if (chat && chat.lastMessage && chat.lastMessage.toString() === req.params.messageId) {
      const lastMessage = await Message.findOne({ chat: message.chat })
        .sort({ createdAt: -1 });
      
      chat.lastMessage = lastMessage ? lastMessage._id : null;
      await chat.save();
    }

    res.json({ message: 'Message deleted successfully' });
  } catch (error) {
    console.error('Error deleting message:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get unread messages count for a user
router.get('/unread/count', auth, async (req, res) => {
  try {
    // Get all chats for the user
    const chats = await Chat.find({
      participants: req.user.id
    }).select('_id');

    const chatIds = chats.map(chat => chat._id);

    // Count unread messages across all chats
    const unreadCount = await Message.countDocuments({
      chat: { $in: chatIds },
      sender: { $ne: req.user.id },
      readBy: { $nin: [req.user.id] }
    });

    res.json({ unreadCount });
  } catch (error) {
    console.error('Error fetching unread count:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
