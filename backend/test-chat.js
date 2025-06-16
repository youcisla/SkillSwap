const mongoose = require('mongoose');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect('mongodb+srv://malikahemdi2:UnGQFSkuf4Etymi2@skillswap.0lzqr7a.mongodb.net/skillswap?retryWrites=true&w=majority&appName=SkillSwap')
  .then(() => console.log('Connected to database'))
  .catch(err => console.error('Database connection error:', err));

const User = require('./models/User');
const Chat = require('./models/Chat');

async function testChatCreation() {
  try {
    // Get two existing users
    const users = await User.find().limit(2);
    
    if (users.length < 2) {
      console.log('Need at least 2 users in database');
      return;
    }

    const user1 = users[0];
    const user2 = users[1];
    
    console.log('Testing chat creation between:');
    console.log(`User 1: ${user1.name} (${user1._id})`);
    console.log(`User 2: ${user2.name} (${user2._id})`);
    
    // Test the Chat.generateChatId method
    const chatId = Chat.generateChatId(user1._id, user2._id);
    console.log(`Generated chat ID: ${chatId}`);
    
    // Test creating participants array
    const participants = [user1._id.toString(), user2._id.toString()];
    console.log('Participants array:', participants);
    console.log('Array details:', {
      isArray: Array.isArray(participants),
      length: participants.length,
      types: participants.map(p => typeof p)
    });
    
    // Try to create or find chat
    let chat = await Chat.findById(chatId);
    
    if (chat) {
      console.log('Chat already exists:', chat._id);
    } else {
      console.log('Creating new chat...');
      chat = new Chat({
        _id: chatId,
        participants: [user1._id, user2._id]
      });
      
      await chat.save();
      console.log('Chat created successfully:', chat._id);
    }
    
  } catch (error) {
    console.error('Error testing chat creation:', error);
  } finally {
    mongoose.connection.close();
  }
}

testChatCreation();
