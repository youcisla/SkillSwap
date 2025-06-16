@echo off
echo 🔍 Running TypeScript Check...
echo ================================

cd /d "%~dp0"

npx tsc --noEmit --project .

if %errorlevel% equ 0 (
    echo ✅ TypeScript compilation successful!
    echo 🚀 Ready to start the app!
) else (
    echo ❌ TypeScript errors found. Please fix them before running the app.
)

echo.
echo To start the app after fixing errors:
echo npm start
echo.
pause
