@echo off
echo.
echo ========================================
echo   ProjetRN MongoDB Setup Script
echo ========================================
echo.

REM Check if MongoDB is already installed
mongod --version >nul 2>&1
if %errorlevel% == 0 (
    echo ✅ MongoDB is already installed!
    goto :start_mongodb
)

echo ❌ MongoDB is not installed on this system.
echo.
echo Installing MongoDB Community Server...
echo.

REM Create temporary directory for installation
if not exist "%TEMP%\mongodb-setup" mkdir "%TEMP%\mongodb-setup"
cd /d "%TEMP%\mongodb-setup"

echo Downloading MongoDB Community Server (this may take a few minutes)...
powershell -Command "& {try { Invoke-WebRequest -Uri 'https://fastdl.mongodb.org/windows/mongodb-windows-x86_64-7.0.12-signed.msi' -OutFile 'mongodb-installer.msi' -UseBasicParsing } catch { Write-Host 'Download failed. Please check your internet connection.' ; exit 1 }}"

if not exist "mongodb-installer.msi" (
    echo ❌ Failed to download MongoDB installer.
    echo.
    echo Please manually download and install MongoDB:
    echo 1. Visit: https://www.mongodb.com/try/download/community
    echo 2. Download Windows x64 MSI installer
    echo 3. Run the installer and choose "Complete" installation
    echo 4. Install MongoDB as a Service
    echo.
    pause
    goto :cloud_alternative
)

echo Installing MongoDB...
echo Please wait, this may take several minutes...
msiexec /i mongodb-installer.msi /quiet /norestart INSTALLLOCATION="C:\Program Files\MongoDB\Server\7.0\" SHOULD_INSTALL_COMPASS=0

echo ✅ MongoDB installation completed!
echo.

REM Add MongoDB to PATH if not already there
setx PATH "%PATH%;C:\Program Files\MongoDB\Server\7.0\bin" /M >nul 2>&1

echo Please close and reopen your command prompt, then run this script again.
pause
goto :end

:start_mongodb
echo Creating MongoDB data directory...
if not exist "C:\data\db" mkdir "C:\data\db"

echo Starting MongoDB service...
net start MongoDB >nul 2>&1
if %errorlevel% == 0 (
    echo ✅ MongoDB service started successfully!
) else (
    echo ⚠️  MongoDB service not found or failed to start
    echo Starting MongoDB manually...
    echo.
    start "MongoDB Server" /min cmd /c "mongod --dbpath C:\data\db"
    echo MongoDB server started in background window.
)

echo.
echo Testing MongoDB connection...
timeout /t 5 /nobreak >nul

REM Try with mongosh first (newer MongoDB shell)
mongosh --eval "db.runCommand({ping: 1})" --quiet >nul 2>&1
if %errorlevel% == 0 (
    echo ✅ MongoDB is running and accessible!
    goto :success
)

REM Fallback to older mongo shell
mongo --eval "db.runCommand('ping')" --quiet >nul 2>&1
if %errorlevel% == 0 (
    echo ✅ MongoDB is running and accessible!
    goto :success
) else (
    echo ❌ Could not connect to MongoDB
    echo.
    echo Troubleshooting:
    echo 1. Make sure MongoDB is running
    echo 2. Check if port 27017 is available
    echo 3. Try running: mongod --dbpath C:\data\db
    echo.
    goto :cloud_alternative
)

:success
echo.
echo ✅ MongoDB setup completed successfully!
echo Your application can now connect to: mongodb://localhost:27017
echo.
goto :end

:cloud_alternative
echo.
echo ========================================
echo Alternative: MongoDB Atlas (Recommended)
echo ========================================
echo.
echo For a more reliable setup, consider using MongoDB Atlas:
echo 1. Visit: https://cloud.mongodb.com
echo 2. Create a free account (no credit card required)
echo 3. Create a free cluster (512MB storage)
echo 4. Get your connection string
echo 5. Update your .env file: MONGODB_URI=your_connection_string
echo.
echo Benefits of MongoDB Atlas:
echo - Always available (no local setup issues)
echo - Automatic backups
echo - Built-in security
echo - Free tier available
echo.

:end
echo.
echo Press any key to continue...
pause >nul
