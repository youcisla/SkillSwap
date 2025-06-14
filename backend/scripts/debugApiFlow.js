const axios = require('axios');

const testMatchToProfileFlow = async () => {
  const baseURL = process.env.API_BASE_URL || 'http://localhost:3000/api';
  
  try {
    console.log('🧪 Testing Match-to-Profile Flow');
    console.log('Base URL:', baseURL);

    // Step 1: Mock login to get auth token
    console.log('\n1️⃣ Attempting to login...');
    
    let authToken;
    try {
      const loginResponse = await axios.post(`${baseURL}/auth/login`, {
        email: 'test@example.com',
        password: 'password123'
      });
      
      if (loginResponse.data.success) {
        authToken = loginResponse.data.data.token;
        console.log('✅ Login successful');
      } else {
        console.log('❌ Login failed, using mock token');
        authToken = 'mock-token';
      }
    } catch (error) {
      console.log('❌ Login error, using mock token:', error.message);
      authToken = 'mock-token';
    }

    // Step 2: Get user matches
    console.log('\n2️⃣ Fetching matches...');
    try {
      const matchesResponse = await axios.get(`${baseURL}/matches/user/mock-user-id`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      
      if (matchesResponse.data.success && matchesResponse.data.data.length > 0) {
        const firstMatch = matchesResponse.data.data[0];
        console.log('✅ Matches found:', matchesResponse.data.data.length);
        console.log('First match:', {
          id: firstMatch.id,
          user1Id: firstMatch.user1Id,
          user2Id: firstMatch.user2Id
        });

        // Step 3: Test fetching the matched user's profile
        const testUserId = firstMatch.user2Id; // Assuming we're user1
        console.log('\n3️⃣ Fetching matched user profile...');
        
        const profileResponse = await axios.get(`${baseURL}/users/${testUserId}`, {
          headers: { Authorization: `Bearer ${authToken}` }
        });
        
        if (profileResponse.data.success) {
          console.log('✅ Profile fetch successful:', {
            id: profileResponse.data.data.id,
            name: profileResponse.data.data.name,
            city: profileResponse.data.data.city
          });
        } else {
          console.log('❌ Profile fetch failed:', profileResponse.data.error);
        }
        
      } else {
        console.log('❌ No matches found');
      }
    } catch (error) {
      console.log('❌ Matches fetch error:', error.message);
      
      // Step 3: Test direct profile fetch with a known user ID
      console.log('\n3️⃣ Testing direct profile fetch...');
      try {
        const profileResponse = await axios.get(`${baseURL}/users/test-user-id`, {
          headers: { Authorization: `Bearer ${authToken}` }
        });
        
        if (profileResponse.data.success) {
          console.log('✅ Direct profile fetch successful');
        } else {
          console.log('❌ Direct profile fetch failed:', profileResponse.data.error);
        }
      } catch (profileError) {
        console.log('❌ Direct profile fetch error:', profileError.message);
        
        if (profileError.response) {
          console.log('Response status:', profileError.response.status);
          console.log('Response data:', profileError.response.data);
        }
      }
    }

    // Step 4: Test user search to verify database connectivity
    console.log('\n4️⃣ Testing user search...');
    try {
      const searchResponse = await axios.get(`${baseURL}/users/search`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      
      if (searchResponse.data.success) {
        console.log('✅ User search successful:', searchResponse.data.data.length, 'users found');
      } else {
        console.log('❌ User search failed:', searchResponse.data.error);
      }
    } catch (searchError) {
      console.log('❌ User search error:', searchError.message);
    }

  } catch (error) {
    console.error('❌ Test flow failed:', error.message);
  }
};

// Platform-specific debugging
const testPlatformSpecific = () => {
  console.log('\n🔧 Platform-specific debugging info:');
  console.log('Process platform:', process.platform);
  console.log('Node version:', process.version);
  console.log('Environment variables:');
  console.log('  NODE_ENV:', process.env.NODE_ENV);
  console.log('  API_BASE_URL:', process.env.API_BASE_URL);
  console.log('  MONGODB_URI:', process.env.MONGODB_URI ? '[SET]' : '[NOT SET]');
};

// Check if running directly
if (require.main === module) {
  testPlatformSpecific();
  testMatchToProfileFlow()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

module.exports = { testMatchToProfileFlow, testPlatformSpecific };
