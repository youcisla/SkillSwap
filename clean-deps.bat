@echo off
echo 🧹 Cleaning up dependencies...

REM Remove node_modules folder
if exist node_modules (
    echo Removing node_modules...
    rmdir /s /q node_modules
    echo ✅ node_modules removed
) else (
    echo ℹ️  node_modules not found
)

REM Remove package-lock.json
if exist package-lock.json (
    echo Removing package-lock.json...
    del package-lock.json
    echo ✅ package-lock.json removed
) else (
    echo ℹ️  package-lock.json not found
)

REM Remove yarn.lock if it exists
if exist yarn.lock (
    echo Removing yarn.lock...
    del yarn.lock
    echo ✅ yarn.lock removed
)

REM Clean npm cache
echo 🧹 Cleaning npm cache...
npm cache clean --force

echo.
echo 🎯 Ready for fresh installation!
echo Run: npm install
