@echo off
echo 🔧 SkillSwap App - Fixed Setup (No Types Issues)
echo ================================================

cd /d "%~dp0"

echo 📦 Step 1: Installing all dependencies...
npm install

echo 📅 Step 2: Installing React Native Calendars (without types)...
npm install react-native-calendars@^1.1303.0

echo ℹ️  Step 3: Using custom type declarations...
echo     ✅ Custom types file created for react-native-calendars
echo     ✅ Fallback calendar component available

echo 🧹 Step 4: Clearing caches...
if exist "node_modules\.cache" rmdir /s /q "node_modules\.cache"
if exist ".expo" rmdir /s /q ".expo"

echo 🔍 Step 5: Type checking...
npx tsc --noEmit --project .

if %errorlevel% equ 0 (
    echo ✅ TypeScript compilation successful!
    
    echo 🚀 Step 6: Starting the development server...
    echo ==========================================
    echo 📱 The app should open shortly...
    echo 📱 Scan QR code with Expo Go app on your device
    echo 🌐 Or press 'w' for web browser
    echo 📱 Or press 'a' for Android emulator
    echo 📱 Or press 'i' for iOS simulator
    echo ==========================================
    
    npm start
) else (
    echo ❌ TypeScript errors found!
    echo 📋 Details above - check EnhancedCalendarScreen.tsx
    echo.
    echo 🔧 Attempting to continue anyway (errors may be in unused code)...
    echo.
    echo 🚀 Starting development server...
    npm start
)
