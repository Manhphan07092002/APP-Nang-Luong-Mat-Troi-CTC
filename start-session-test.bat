@echo off
echo ========================================
echo  SOLAR ANALYTICS - SESSION LOGGING TEST
echo ========================================
echo.

echo Stopping any existing Node.js processes...
taskkill /f /im node.exe >nul 2>&1

echo.
echo Starting server with session logging...
cd /d "%~dp0\server"
node server.js

pause
