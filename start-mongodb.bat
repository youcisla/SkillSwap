@echo off
echo Starting MongoDB for ProjetRN...
echo.

REM Create data directory if it doesn't exist
if not exist "C:\data\db" (
    echo Creating MongoDB data directory...
    mkdir "C:\data\db"
)

REM Try to start MongoDB service first
net start MongoDB >nul 2>&1
if %errorlevel% == 0 (
    echo ✅ MongoDB service started successfully!
    goto :test
)

REM If service doesn't work, start manually
echo Starting MongoDB manually...
start "MongoDB Server" /min cmd /c "mongod --dbpath C:\data\db"
echo ⏳ Waiting for MongoDB to start...
timeout /t 5 /nobreak >nul

:test
echo Testing connection...
mongosh --eval "db.runCommand({ping: 1})" --quiet >nul 2>&1
if %errorlevel% == 0 (
    echo ✅ MongoDB is running on localhost:27017
    echo ✅ Your application can now connect to the database
) else (
    echo ❌ Failed to connect to MongoDB
    echo.
    echo Troubleshooting:
    echo 1. Make sure MongoDB is installed
    echo 2. Check if another process is using port 27017
    echo 3. Try running: mongod --dbpath C:\data\db
)

echo.
pause
