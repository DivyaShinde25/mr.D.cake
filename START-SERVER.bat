@echo off
echo Installing dependencies...
npm install
echo.
echo Starting Mr D Cakes website...
echo.
echo Website will open at: http://localhost:3000
echo Keep this window OPEN while using the website
echo Press Ctrl+C to stop the server
echo.
node server.js
pause