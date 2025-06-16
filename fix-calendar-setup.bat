@echo off
echo 🔧 Setting up React Native Calendars...
echo =====================================

cd /d "%~dp0"

echo 📦 Installing react-native-calendars...
npm install react-native-calendars@^1.1303.0
echo ℹ️  Skipping @types/react-native-calendars (not available)

echo 🧹 Clearing TypeScript cache...
if exist "node_modules\.cache" rmdir /s /q "node_modules\.cache"

echo 📋 Running TypeScript check...
npx tsc --noEmit --project .

if %errorlevel% equ 0 (
    echo ✅ TypeScript check passed!
) else (
    echo ⚠️ TypeScript errors found. Check output above.
)

echo 🚀 Starting development server...
npm start

pause
