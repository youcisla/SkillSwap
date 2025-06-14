const fs = require('fs');
const path = require('path');

// Test script to verify profile image upload functionality
console.log('🧪 Testing Profile Image Upload Setup...\n');

// Check if uploads directory exists
const uploadsDir = path.join(__dirname, '..', 'uploads', 'profile-images');
console.log('📁 Checking uploads directory:', uploadsDir);

if (!fs.existsSync(uploadsDir)) {
    console.log('❌ Uploads directory does not exist');
    console.log('💡 Creating uploads directory...');
    try {
        fs.mkdirSync(uploadsDir, { recursive: true });
        console.log('✅ Uploads directory created successfully');
    } catch (error) {
        console.error('❌ Failed to create uploads directory:', error.message);
    }
} else {
    console.log('✅ Uploads directory exists');
}

// Check directory permissions
try {
    const testFile = path.join(uploadsDir, 'test.txt');
    fs.writeFileSync(testFile, 'test content');
    fs.unlinkSync(testFile);
    console.log('✅ Directory is writable');
} catch (error) {
    console.error('❌ Directory is not writable:', error.message);
}

// Check if multer is installed
try {
    require('multer');
    console.log('✅ Multer package is available');
} catch (error) {
    console.error('❌ Multer package is not installed');
}

console.log('\n📋 Summary:');
console.log('- Profile images will be stored in:', uploadsDir);
console.log('- Images will be accessible via: /uploads/profile-images/[filename]');
console.log('- Backend should serve static files from /uploads endpoint');
