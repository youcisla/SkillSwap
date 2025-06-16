@echo off
echo 🔍 Checking TypeScript compilation...
echo =====================================

cd /d "%~dp0"

echo 📋 Running TypeScript check...
npx tsc --noEmit --project . --skipLibCheck

if %errorlevel% equ 0 (
    echo ✅ TypeScript check passed!
    echo 🚀 Ready to run: npm start
) else (
    echo ⚠️ TypeScript errors found. 
    echo 💡 Try running quick-start-fixed.bat to continue anyway
)

echo.
pause
