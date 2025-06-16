#!/bin/bash

echo "🚀 Starting SkillSwap App Development..."
echo "=================================="

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found. Make sure you're in the project root directory."
    exit 1
fi

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Install react-native-calendars if not already installed
echo "📅 Installing React Native Calendars..."
npm install react-native-calendars

# Check if backend is running
echo "🌐 Checking backend server..."
curl -s http://localhost:3000/api/health > /dev/null
if [ $? -eq 0 ]; then
    echo "✅ Backend server is running"
else
    echo "⚠️  Backend server not detected. Starting backend..."
    (cd backend && npm install && npm start) &
    sleep 5
fi

# Clear npm cache if needed
echo "🧹 Clearing caches..."
npm start -- --clear-cache

echo "✅ Setup complete! App should be starting..."
echo "=================================="
echo "📱 Open Expo Go on your device and scan the QR code"
echo "🌐 Or press 'w' to open in web browser"
echo "📱 Or press 'a' for Android emulator"
echo "📱 Or press 'i' for iOS simulator"
