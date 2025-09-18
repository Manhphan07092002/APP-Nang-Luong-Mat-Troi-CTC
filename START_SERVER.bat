@echo off
echo Starting Solar Analytics Server...
echo.
cd /d "%~dp0"
node server/server.js
pause
