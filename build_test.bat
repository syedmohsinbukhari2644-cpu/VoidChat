@echo off
TITLE VoidChat Build Debugger
COLOR 0B
SET "PATH=C:\Program Files\nodejs;C:\Users\acer\AppData\Roaming\npm;%PATH%"
cd /d "d:\VOID CHAT\VoidChat"
echo.
echo =======================================
echo  Starting Expo Web Build...
echo =======================================
echo.
call npm run build
echo.
echo Build script finished. Directory contents of dist:
dir dist
echo.
pause
