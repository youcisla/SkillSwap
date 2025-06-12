// Debug utility for chat functionality
// Add this to your ChatScreen.tsx or run in browser console

interface DebugInfo {
  chatId: string;
  actualChatId: string;
  otherUserId: string;
  userId: string;
  chatMessages: any[];
  otherUser: any;
}

export const debugChatScreen = (debugInfo: DebugInfo) => {
  console.group('🐛 Chat Screen Debug Info');
  
  console.log('📊 Current State:');
  console.table({
    'Route Chat ID': debugInfo.chatId,
    'Actual Chat ID': debugInfo.actualChatId,
    'Other User ID': debugInfo.otherUserId,
    'Current User ID': debugInfo.userId,
    'Messages Count': debugInfo.chatMessages.length,
    'Other User Found': !!debugInfo.otherUser
  });
  
  console.log('👤 Other User Info:', debugInfo.otherUser);
  
  console.log('💬 Chat Messages:');
  debugInfo.chatMessages.forEach((msg, index) => {
    console.log(`  ${index + 1}. [${msg.senderId === debugInfo.userId ? 'You' : 'Other'}] ${msg.content}`);
  });
  
  // Generate expected chat ID
  const sortedIds = [debugInfo.userId, debugInfo.otherUserId].sort();
  const expectedChatId = `${sortedIds[0]}-${sortedIds[1]}`;
  
  console.log('🔍 ID Analysis:');
  console.table({
    'Route Param ID': debugInfo.chatId,
    'Actual Used ID': debugInfo.actualChatId,
    'Expected ID': expectedChatId,
    'IDs Match': debugInfo.actualChatId === expectedChatId
  });
  
  // API URLs that will be called
  const apiBaseUrl = 'http://localhost:3000/api';
  console.log('🌐 API Endpoints:');
  console.log(`  Find/Create: ${apiBaseUrl}/chats/find-or-create`);
  console.log(`  Get Messages: ${apiBaseUrl}/chats/${debugInfo.actualChatId}/messages`);
  console.log(`  Send Message: ${apiBaseUrl}/messages`);
  console.log(`  Mark Read: ${apiBaseUrl}/chats/${debugInfo.actualChatId}/read`);
  
  console.groupEnd();
};

// Network request interceptor for debugging
export const setupNetworkDebugging = () => {
  const originalFetch = window.fetch;
  
  window.fetch = async (...args) => {
    const [url, options] = args;
    
    if (typeof url === 'string' && url.includes('/api/')) {
      console.group(`🌐 API Request: ${options?.method || 'GET'} ${url}`);
      
      if (options?.body) {
        try {
          const body = JSON.parse(options.body as string);
          console.log('📤 Request Body:', body);
        } catch (e) {
          console.log('📤 Request Body:', options.body);
        }
      }
      
      const response = await originalFetch(...args);
      const responseClone = response.clone();
      
      try {
        const responseData = await responseClone.json();
        console.log(`📥 Response (${response.status}):`, responseData);
      } catch (e) {
        console.log(`📥 Response (${response.status}): Non-JSON response`);
      }
      
      console.groupEnd();
      return response;
    }
    
    return originalFetch(...args);
  };
  
  console.log('🕵️ Network debugging enabled. All API requests will be logged.');
};

// Add to window for browser console access
if (typeof window !== 'undefined') {
  (window as any).debugChatScreen = debugChatScreen;
  (window as any).setupNetworkDebugging = setupNetworkDebugging;
}
