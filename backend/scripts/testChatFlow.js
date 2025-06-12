const mongoose = require('mongoose');
const Chat = require('../models/Chat');
const Message = require('../models/Message');
require('dotenv').config();

// Test the chat flow to debug the issues
async function testChatFlow() {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/skillswap');
    console.log('✅ Connected to MongoDB');

    // Test data - using ObjectIds that might exist in your system
    const userId1 = '6848767b4da77e177b95ca8e';
    const userId2 = '684a82a8f614362af743f6e2';
    
    console.log('\n📋 Testing Chat Flow:');
    console.log('User 1:', userId1);
    console.log('User 2:', userId2);

    // Test 1: Generate Chat ID
    const chatId = Chat.generateChatId(userId1, userId2);
    console.log('\n🆔 Generated Chat ID:', chatId);

    // Test 2: Check if chat exists
    let chat = await Chat.findById(chatId);
    console.log('\n🔍 Existing chat:', chat ? 'Found' : 'Not found');

    // Test 3: Create chat if it doesn't exist
    if (!chat) {
      console.log('\n📝 Creating new chat...');
      chat = new Chat({
        _id: chatId,
        participants: [userId1, userId2]
      });
      await chat.save();
      console.log('✅ Chat created successfully');
    }

    // Test 4: Try to fetch messages
    console.log('\n📨 Fetching messages for chat:', chatId);
    const messages = await Message.find({ chat: chatId })
      .populate('sender', 'name email')
      .sort({ createdAt: 1 });
    
    console.log('📊 Messages found:', messages.length);
    messages.forEach((msg, index) => {
      console.log(`  ${index + 1}. ${msg.sender?.name || 'Unknown'}: ${msg.content}`);
    });

    // Test 5: Create a test message
    console.log('\n✉️ Creating test message...');
    const testMessage = new Message({
      chat: chatId,
      sender: userId1,
      content: 'Test message from chat flow test',
      readBy: [userId1]
    });
    await testMessage.save();
    console.log('✅ Test message created');

    // Test 6: Update chat last message
    chat.lastMessage = testMessage._id;
    chat.updatedAt = new Date();
    await chat.save();
    console.log('✅ Chat updated with last message');

    console.log('\n🎉 Chat flow test completed successfully!');
    
  } catch (error) {
    console.error('❌ Error during chat flow test:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

testChatFlow();
