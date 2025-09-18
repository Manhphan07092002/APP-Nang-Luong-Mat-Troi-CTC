@echo off
echo Starting Solar Analytics Server...
echo.

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

echo Node.js version:
node --version

echo.
echo Starting server on port 5000...
echo Admin access: http://localhost:5000/admin
echo Short admin: http://localhost:5000/a
echo.

cd /d "%~dp0server"
node server.js

pause
