@echo off
echo.
echo ========================================
echo   SkillSwap MongoDB Docker Setup
echo ========================================
echo.

REM Check if Docker is installed
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Docker is not installed.
    echo Please install Docker Desktop from: https://www.docker.com/products/docker-desktop
    pause
    goto :end
)

echo ✅ Docker is installed!
echo.

REM Check if MongoDB container already exists
docker ps -a --filter "name=skillswap-mongo" --format "{{.Names}}" | findstr "skillswap-mongo" >nul
if %errorlevel% == 0 (
    echo ✅ MongoDB container exists. Starting it...
    docker start skillswap-mongo
) else (
    echo 🚀 Creating and starting MongoDB container...
    docker run -d ^
        --name skillswap-mongo ^
        -p 27017:27017 ^
        -v skillswap-mongo-data:/data/db ^
        -e MONGO_INITDB_ROOT_USERNAME=admin ^
        -e MONGO_INITDB_ROOT_PASSWORD=password123 ^
        mongo:latest
)

echo.
echo Waiting for MongoDB to start...
timeout /t 5 /nobreak >nul

REM Test connection
docker exec skillswap-mongo mongosh --eval "db.runCommand('ping')" >nul 2>&1
if %errorlevel% == 0 (
    echo ✅ MongoDB is running successfully in Docker!
    echo.
    echo Connection details:
    echo   Host: localhost
    echo   Port: 27017
    echo   Username: admin
    echo   Password: password123
    echo.
    echo You can now start your SkillSwap backend server.
) else (
    echo ❌ Failed to connect to MongoDB container
    echo Please check Docker logs: docker logs skillswap-mongo
)

:end
echo.
echo Press any key to continue...
pause >nul
