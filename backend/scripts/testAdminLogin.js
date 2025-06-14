const http = require('http');

async function testAdminLogin() {
  try {
    console.log('🔐 Testing admin login...');
    
    const postData = JSON.stringify({
      email: 'admin@admin.admin',
      password: 'Admin123!'
    });
    
    const options = {
      hostname: '192.168.1.93',
      port: 3000,
      path: '/api/auth/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };
    
    const req = http.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        try {
          const response = JSON.parse(data);
          
          if (res.statusCode === 200) {
            console.log('✅ Login successful!');
            console.log('👤 User:', response.data.user.name);
            console.log('🛡️  Role:', response.data.user.role);
            console.log('🔑 Token received:', response.data.token ? 'Yes' : 'No');
            console.log('🎯 Permissions:', response.data.user.permissions);
          } else {
            console.error('❌ Login failed:');
            console.error('Status:', res.statusCode);
            console.error('Response:', response);
          }
        } catch (error) {
          console.error('❌ Error parsing response:', error);
          console.error('Raw response:', data);
        }
      });
    });
    
    req.on('error', (error) => {
      console.error('❌ Request error:', error);
    });
    
    req.write(postData);
    req.end();
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

testAdminLogin();
