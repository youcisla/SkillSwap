const express = require('express');
const router = express.Router();
const Message = require('../models/Message');
const Chat = require('../models/Chat');
const auth = require('../middleware/auth');
const { emitToChat, emitToUser } = require('../utils/socketUtils');

// Get messages for a chat
router.get('/chat/:chatId', auth, async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;

    // Verify user is part of the chat
    const chat = await Chat.findOne({
      _id: req.params.chatId,
      participants: req.userId
    });

    if (!chat) {
      return res.status(404).json({ error: 'Chat not found' });
    }

    const messages = await Message.find({ chat: req.params.chatId })
      .populate('sender', 'name email profileImage')
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
    const { chatId, senderId, receiverId, content, type = 'text' } = req.body;

    // Handle both formats: chatId directly or senderId/receiverId
    let actualChatId = chatId;
    
    if (!chatId && senderId && receiverId) {
      // Generate consistent chat ID using the Chat model's static method
      actualChatId = Chat.generateChatId(senderId, receiverId);
      
      // Find or create chat between sender and receiver
      let chat = await Chat.findById(actualChatId);

      if (!chat) {
        // Create new chat with the generated ID
        chat = new Chat({
          _id: actualChatId,
          participants: [senderId, receiverId]
        });
        await chat.save();
      }
    }

    if (!actualChatId || !content) {
      return res.status(400).json({
        success: false,
        error: 'Chat ID/participants and content are required'
      });
    }

    // Verify user is part of the chat
    const chat = await Chat.findOne({
      _id: actualChatId,
      participants: req.userId
    });

    if (!chat) {
      return res.status(404).json({
        success: false,
        error: 'Chat not found'
      });
    }

    // Create new message
    const message = new Message({
      chat: actualChatId,
      sender: req.userId,
      content,
      type,
      readBy: [req.userId] // Sender has read the message
    });

    await message.save();

    // Update chat's last message
    chat.lastMessage = message._id;
    chat.updatedAt = new Date();
    await chat.save();

    // Populate message with sender info
    await message.populate('sender', 'name email profileImage');

    const messageData = {
      id: message._id,
      senderId: message.sender._id,
      receiverId: chat.participants.find(p => p.toString() !== message.sender._id.toString()),
      content: message.content,
      timestamp: message.createdAt,
      isRead: message.readBy.includes(req.userId)
    };

    // Emit real-time message to chat participants
    emitToChat(actualChatId, 'new-message', messageData);
    
    // Also emit to receiver's personal room for notifications
    const targetReceiverId = messageData.receiverId;
    if (targetReceiverId) {
      emitToUser(targetReceiverId, 'new-message', {
        ...messageData,
        senderName: message.sender.name,
        chatId: actualChatId
      });
    }

    res.status(201).json({
      success: true,
      data: messageData
    });
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to send message'
    });
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
      participants: req.userId
    });

    if (!chat) {
      return res.status(404).json({ error: 'Chat not found' });
    }

    // Add user to readBy array if not already there
    if (!message.readBy.includes(req.userId)) {
      message.readBy.push(req.userId);
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
      sender: req.userId
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
      sender: req.userId
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
      participants: req.userId
    }).select('_id');

    const chatIds = chats.map(chat => chat._id);

    // Count unread messages across all chats
    const unreadCount = await Message.countDocuments({
      chat: { $in: chatIds },
      sender: { $ne: req.userId },
      readBy: { $nin: [req.userId] }
    });

    res.json({ unreadCount });
  } catch (error) {
    console.error('Error fetching unread count:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
