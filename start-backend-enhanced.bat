@echo off
setlocal enabledelayedexpansion

echo.
echo ========================================
echo        SkillSwap Backend Startup
echo ========================================
echo.

cd /d "%~dp0"

REM Check if we're in the backend directory
if not exist "server.js" (
    echo Navigating to backend directory...
    cd backend
    if not exist "server.js" (
        echo ❌ Could not find backend directory or server.js
        echo Please run this script from the project root directory
        pause
        exit /b 1
    )
)

echo 🔍 Checking MongoDB connection...

REM Test MongoDB connection
node -e "
const mongoose = require('mongoose');
mongoose.connect('mongodb://localhost:27017/skillswap', {
    serverSelectionTimeoutMS: 2000
}).then(() => {
    console.log('✅ MongoDB connection successful');
    mongoose.disconnect();
    process.exit(0);
}).catch((err) => {
    console.log('❌ MongoDB connection failed:', err.message);
    process.exit(1);
});
" >nul 2>&1

if %errorlevel% == 0 (
    echo ✅ MongoDB is running and accessible!
    goto :start_server
)

echo ❌ Cannot connect to MongoDB. Please choose an option:
echo.
echo 1. Install MongoDB locally (requires manual installation)
echo 2. Use MongoDB with Docker (requires Docker Desktop)
echo 3. Use MongoDB Atlas (cloud database)
echo 4. Try to start local MongoDB service
echo 5. Exit
echo.
set /p choice="Enter your choice (1-5): "

if "%choice%"=="1" (
    echo.
    echo Please install MongoDB Community Server:
    echo 1. Download from: https://www.mongodb.com/try/download/community
    echo 2. Choose Windows x64 MSI installer
    echo 3. Install with default settings
    echo 4. Restart this script after installation
    pause
    exit /b 0
)

if "%choice%"=="2" (
    echo.
    echo Setting up MongoDB with Docker...
    call "%~dp0setup-mongodb-docker.bat"
    echo.
    echo Waiting for MongoDB to be ready...
    timeout /t 10 /nobreak >nul
    goto :start_server
)

if "%choice%"=="3" (
    echo.
    echo To use MongoDB Atlas:
    echo 1. Go to https://www.mongodb.com/atlas/database
    echo 2. Create a free account and cluster
    echo 3. Get your connection string
    echo 4. Update backend/.env file with your connection string
    echo.
    echo Example connection string:
    echo MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/skillswap
    echo.
    pause
    exit /b 0
)

if "%choice%"=="4" (
    echo.
    echo Trying to start MongoDB service...
    net start MongoDB >nul 2>&1
    if !errorlevel! == 0 (
        echo ✅ MongoDB service started!
        timeout /t 3 /nobreak >nul
        goto :start_server
    ) else (
        echo ❌ Could not start MongoDB service
        echo Please try one of the other options
        pause
        exit /b 1
    )
)

if "%choice%"=="5" (
    exit /b 0
)

echo Invalid choice. Please run the script again.
pause
exit /b 1

:start_server
echo.
echo 🚀 Starting SkillSwap Backend Server...
echo.

REM Check if node_modules exists
if not exist "node_modules" (
    echo 📦 Installing dependencies...
    npm install
    if !errorlevel! neq 0 (
        echo ❌ Failed to install dependencies
        pause
        exit /b 1
    )
)

REM Initialize database
echo 🗄️ Initializing database...
node scripts/initDatabase.js
if !errorlevel! neq 0 (
    echo ⚠️ Database initialization had some issues, but continuing...
)

echo.
echo ✅ Starting server on port 3000...
echo 🌐 Server will be available at: http://localhost:3000
echo 📊 Health check: http://localhost:3000/api/health
echo.
echo Press Ctrl+C to stop the server
echo.

npm start

echo.
echo Server stopped.
pause
