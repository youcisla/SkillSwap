const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect('mongodb+srv://malikahemdi2:UnGQFSkuf4Etymi2@skillswap.0lzqr7a.mongodb.net/skillswap?retryWrites=true&w=majority&appName=SkillSwap', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

const User = require('./models/User');
const Chat = require('./models/Chat');
const Message = require('./models/Message');

async function createQuickTestData() {
  try {
    console.log('🚀 Creating test data quickly...');

    // Create matches first
    await require('./quick-create-matches');

    // Wait a moment for matches to be created
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Get the current user
    const currentUser = await User.findOne({ email: 'hghghg@gmail.com' });
    const yahooUser = await User.findOne({ name: 'Yahoo' });

    if (!currentUser || !yahooUser) {
      console.log('❌ Users not found');
      return;
    }

    console.log(`Creating chat between ${currentUser.name} and ${yahooUser.name}`);

    // Create a chat between them
    const chatId = Chat.generateChatId(currentUser._id, yahooUser._id);
    
    let chat = await Chat.findById(chatId);
    if (!chat) {
      chat = new Chat({
        _id: chatId,
        participants: [currentUser._id, yahooUser._id],
        isActive: true
      });
      await chat.save();
      console.log('✅ Chat created');

      // Add a welcome message
      const message = new Message({
        chat: chatId,
        sender: yahooUser._id,
        content: `Hi ${currentUser.name}! I saw we're a great match. I can help you learn Python and Node.js, and I'd love to learn Public Speaking from you!`,
        type: 'text',
        readBy: [yahooUser._id]
      });

      await message.save();
      
      chat.lastMessage = message._id;
      await chat.save();
      
      console.log('✅ Welcome message added');
    } else {
      console.log('✅ Chat already exists');
    }

    console.log('🎉 Test data created successfully!');
    console.log('💬 You should now see matches and be able to chat!');

  } catch (error) {
    console.error('❌ Error creating test data:', error);
  } finally {
    mongoose.connection.close();
  }
}

createQuickTestData();
