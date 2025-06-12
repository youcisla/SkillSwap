const Chat = require('../models/Chat');

// Test chat ID generation
function testChatIdGeneration() {
  console.log('🧪 Testing Chat ID Generation...\n');
  
  // Test case 1: Normal order
  const user1 = '684a82a8f614362af743f6e2';
  const user2 = '6848767b4da77e177b95ca8e';
  
  const chatId1 = Chat.generateChatId(user1, user2);
  console.log(`Chat ID (${user1}, ${user2}): ${chatId1}`);
  
  // Test case 2: Reverse order - should produce same result
  const chatId2 = Chat.generateChatId(user2, user1);
  console.log(`Chat ID (${user2}, ${user1}): ${chatId2}`);
  
  // Test case 3: Check consistency
  const isConsistent = chatId1 === chatId2;
  console.log(`Consistent: ${isConsistent ? '✅' : '❌'}`);
  
  if (isConsistent) {
    console.log('\n🎉 Chat ID generation is working correctly!');
    console.log(`Expected format: ${chatId1}`);
  } else {
    console.log('\n❌ Chat ID generation is inconsistent!');
  }
}

testChatIdGeneration();
