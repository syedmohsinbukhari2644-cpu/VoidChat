@ECHO OFF
TITLE VOID CHAT - Start Local Servers
COLOR 0A

echo.
echo  ==================================================
echo   VOID CHAT - Local Server Development Suite
echo  ==================================================
echo.

SET "PATH=C:\Program Files\nodejs;C:\Users\acer\AppData\Roaming\npm;%PATH%"

echo [1/2] Starting Backend Server (Express + Socket.io)...
echo Launching backend server on port 3000 in a new window...
start "VOID CHAT - Backend Server" cmd.exe /k "cd /d "%~dp0backend" && node server.js"

echo.
echo [2/2] Starting Frontend Expo Web Server...
echo Launching Expo Web server on port 8081 in a new window...
start "VOID CHAT - Expo Web Server" cmd.exe /k "cd /d "%~dp0" && npx expo start --web"

echo.
echo ==================================================
echo  Both servers have been launched in new windows!
echo  - Backend: http://localhost:3000
echo  - Frontend Web: http://localhost:8081
echo ==================================================
echo.
pause
