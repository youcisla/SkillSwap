@echo off
echo 🚀 Starting SkillSwap App Development...
echo ==================================

REM Check if we're in the right directory
if not exist "package.json" (
    echo ❌ Error: package.json not found. Make sure you're in the project root directory.
    pause
    exit /b 1
)

REM Install dependencies if node_modules doesn't exist
if not exist "node_modules" (
    echo 📦 Installing dependencies...
    npm install
)

REM Install react-native-calendars if not already installed
echo 📅 Installing React Native Calendars...
npm install react-native-calendars

REM Check if backend is running
echo 🌐 Checking backend server...
curl -s http://localhost:3000/api/health >nul 2>&1
if %errorlevel% equ 0 (
    echo ✅ Backend server is running
) else (
    echo ⚠️  Backend server not detected. Starting backend...
    start "Backend Server" cmd /c "cd backend && npm install && npm start"
    timeout /t 5 /nobreak >nul
)

REM Clear npm cache and start
echo 🧹 Starting with clear cache...
npm start -- --clear-cache

echo ✅ Setup complete! App should be starting...
echo ==================================
echo 📱 Open Expo Go on your device and scan the QR code
echo 🌐 Or press 'w' to open in web browser
echo 📱 Or press 'a' for Android emulator
echo 📱 Or press 'i' for iOS simulator
pause
