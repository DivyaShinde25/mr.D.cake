@echo off
echo Installing MongoDB dependencies...
npm install
echo.
echo Starting Mr D Cakes website with MongoDB...
echo.
echo Website: http://localhost:3000
echo Admin Panel: http://localhost:3000/admin.html
echo.
echo MongoDB will store orders and users in database
echo Make sure MongoDB is running on your system
echo.
node mongodb-server.js
pause