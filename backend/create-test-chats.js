const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect('mongodb+srv://malikahemdi2:UnGQFSkuf4Etymi2@skillswap.0lzqr7a.mongodb.net/skillswap?retryWrites=true&w=majority&appName=SkillSwap')
  .then(() => console.log('Connected to database'))
  .catch(err => console.error('Database connection error:', err));

const User = require('./models/User');
const Chat = require('./models/Chat');
const Message = require('./models/Message');

async function createTestChats() {
  try {
    // Get current user (Azerty)
    const currentUser = await User.findOne({ email: 'hghghg@gmail.com' });
    if (!currentUser) {
      console.log('Current user not found');
      return;
    }
    console.log(`Current user: ${currentUser.name} (${currentUser._id})`);

    // Get other users
    const otherUsers = await User.find({ _id: { $ne: currentUser._id } }).limit(3);
    console.log(`Found ${otherUsers.length} other users`);

    for (const otherUser of otherUsers) {
      console.log(`\nCreating chat with: ${otherUser.name} (${otherUser._id})`);
      
      // Generate chat ID
      const chatId = Chat.generateChatId(currentUser._id, otherUser._id);
      console.log(`Chat ID: ${chatId}`);
      
      // Check if chat exists
      let chat = await Chat.findById(chatId);
      
      if (chat) {
        console.log('Chat already exists');
      } else {
        // Create new chat
        chat = new Chat({
          _id: chatId,
          participants: [currentUser._id, otherUser._id],
          isActive: true
        });
        
        await chat.save();
        console.log('✅ Chat created successfully');
        
        // Create a test message
        const message = new Message({
          chat: chatId,
          sender: currentUser._id,
          content: `Hello ${otherUser.name}! This is a test message.`,
          type: 'text',
          readBy: [currentUser._id]
        });
        
        await message.save();
        
        // Update chat with last message
        chat.lastMessage = message._id;
        await chat.save();
        
        console.log('✅ Test message created');
      }
    }
    
    console.log('\n✅ All test chats created successfully');
    
  } catch (error) {
    console.error('Error creating test chats:', error);
  } finally {
    mongoose.connection.close();
  }
}

createTestChats();
