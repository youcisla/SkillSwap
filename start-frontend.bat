@echo off
echo Starting SkillSwap Frontend (React Native Expo)...
echo ===============================================
echo.
echo Frontend will be available at: http://localhost:8081
echo Press Ctrl+C to stop the server
echo.

cd /d "%~dp0"
npx expo start --web --clear

pause
