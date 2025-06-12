// Test API endpoints to debug chat functionality issues
// Run this from browser console when the app is running

async function testApiEndpoints() {
  const baseUrl = 'http://localhost:3000/api';
  const testUserId1 = '6848767b4da77e177b95ca8e';
  const testUserId2 = '684a82a8f614362af743f6e2';
  
  console.log('🧪 Testing API Endpoints');
  console.log('========================');
  
  // Get auth token from localStorage (if available)
  const token = localStorage.getItem('authToken');
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` })
  };
  
  try {
    // Test 1: Health check
    console.log('\n1️⃣ Testing health endpoint...');
    const healthResponse = await fetch(`${baseUrl}/health`);
    const healthData = await healthResponse.json();
    console.log('Health:', healthData);
    
    // Test 2: Find or create chat
    console.log('\n2️⃣ Testing find or create chat...');
    const chatResponse = await fetch(`${baseUrl}/chats/find-or-create`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        participants: [testUserId1, testUserId2]
      })
    });
    const chatData = await chatResponse.json();
    console.log('Find/Create Chat:', chatData);
    
    if (chatData.success) {
      const chatId = chatData.data.id;
      
      // Test 3: Get chat messages
      console.log('\n3️⃣ Testing get chat messages...');
      const messagesResponse = await fetch(`${baseUrl}/chats/${chatId}/messages`, {
        headers
      });
      const messagesData = await messagesResponse.json();
      console.log('Chat Messages:', messagesData);
      
      // Test 4: Send a message
      console.log('\n4️⃣ Testing send message...');
      const sendResponse = await fetch(`${baseUrl}/messages`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          chatId: chatId,
          senderId: testUserId1,
          receiverId: testUserId2,
          content: 'Test message from API test'
        })
      });
      const sendData = await sendResponse.json();
      console.log('Send Message:', sendData);
      
      // Test 5: Mark messages as read
      console.log('\n5️⃣ Testing mark as read...');
      const readResponse = await fetch(`${baseUrl}/chats/${chatId}/read`, {
        method: 'PUT',
        headers,
        body: JSON.stringify({
          userId: testUserId1
        })
      });
      const readData = await readResponse.json();
      console.log('Mark as Read:', readData);
    }
    
  } catch (error) {
    console.error('❌ API Test Error:', error);
  }
}

// Run the test
console.log('To test API endpoints, run: testApiEndpoints()');

// Export for Node.js if needed
if (typeof module !== 'undefined' && module.exports) {
  module.exports = testApiEndpoints;
}
