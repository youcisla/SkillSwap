@echo off
echo Starting SkillSwap Backend Server...
echo ====================================
echo.
echo Backend will be available at: http://localhost:3000
echo Press Ctrl+C to stop the server
echo.

cd /d "%~dp0"
npm start

pause
