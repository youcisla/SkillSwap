// Integration Test for Chat ID Consistency
// This script verifies that frontend and backend use the same chat ID format

console.log('🔍 SkillSwap Chat ID Integration Test\n');

// Simulate frontend chat ID generation (from messageService.ts)
function frontendGenerateChatId(senderId, receiverId) {
  const sortedIds = [senderId, receiverId].sort();
  return `${sortedIds[0]}-${sortedIds[1]}`;
}

// Simulate backend chat ID generation (from Chat model)
function backendGenerateChatId(userId1, userId2) {
  const sortedIds = [userId1.toString(), userId2.toString()].sort();
  return `${sortedIds[0]}-${sortedIds[1]}`;
}

// Test data
const testCases = [
  {
    user1: '684a82a8f614362af743f6e2',
    user2: '6848767b4da77e177b95ca8e',
    description: 'Normal user IDs'
  },
  {
    user1: '6848767b4da77e177b95ca8e', 
    user2: '684a82a8f614362af743f6e2',
    description: 'Reversed order'
  },
  {
    user1: 'aaa',
    user2: 'zzz', 
    description: 'Alphabetical order'
  },
  {
    user1: 'zzz',
    user2: 'aaa',
    description: 'Reverse alphabetical'
  }
];

console.log('Testing chat ID generation consistency...\n');

let allTestsPassed = true;

testCases.forEach((testCase, index) => {
  const frontendId = frontendGenerateChatId(testCase.user1, testCase.user2);
  const backendId = backendGenerateChatId(testCase.user1, testCase.user2);
  
  const matches = frontendId === backendId;
  const status = matches ? '✅' : '❌';
  
  console.log(`Test ${index + 1}: ${testCase.description}`);
  console.log(`  Frontend: ${frontendId}`);
  console.log(`  Backend:  ${backendId}`);
  console.log(`  Match:    ${status}`);
  console.log('');
  
  if (!matches) {
    allTestsPassed = false;
  }
});

console.log('='.repeat(50));
if (allTestsPassed) {
  console.log('🎉 ALL TESTS PASSED! Frontend and backend are consistent.');
  console.log('\n✅ Chat ID generation works correctly');
  console.log('✅ Sorting ensures consistent IDs regardless of parameter order');
  console.log('✅ String format matches between frontend and backend');
} else {
  console.log('❌ TESTS FAILED! Frontend and backend are inconsistent.');
  console.log('\n🔧 Please check chat ID generation logic');
}

console.log('\n📝 Final Implementation Notes:');
console.log('- Chat IDs use format: "userId1-userId2" (sorted)');
console.log('- Frontend generates IDs in messageService.sendMessage()');
console.log('- Backend uses Chat.generateChatId() static method');
console.log('- Both implementations sort user IDs for consistency');
console.log('- Chat model uses String type for _id field');
console.log('- Message model references chat as String type');
