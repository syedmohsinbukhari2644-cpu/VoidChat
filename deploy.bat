@ECHO OFF
TITLE VOID CHAT - Build and Deploy to Firebase
COLOR 0A

echo.
echo  ========================================
echo   VOID CHAT - Live Deploy Script
echo  ========================================
echo.

SET "PATH=C:\Program Files\nodejs;C:\Users\acer\AppData\Roaming\npm;%PATH%"

cd /d "d:\VOID CHAT\VoidChat"

echo [1/3] Preparing build environment...
FOR /F "tokens=5" %%P IN ('netstat -a -n -o ^| findstr ":8081 "') DO (
  taskkill /F /PID %%P 2>nul
)

echo [2/3] Building Expo web bundle...
call npx expo export --platform web --output-dir dist

IF %ERRORLEVEL% NEQ 0 (
  echo.
  echo ERROR: Web build failed! Check errors above.
  pause
  exit /b 1
)

IF EXIST "d:\VOID CHAT\VoidChat\dist\voidchat.apk" (
  echo Removing old APK from dist folder to prevent Firebase upload restriction...
  del /f /q "d:\VOID CHAT\VoidChat\dist\voidchat.apk"
)

echo.
echo [3/3] Deploying to Firebase Hosting (project: azaad-app)...
call npx firebase deploy --only hosting --project azaad-app

IF %ERRORLEVEL% NEQ 0 (
  echo.
  echo ERROR: Firebase deploy failed!
  pause
  exit /b 1
)

echo.
echo  ========================================
echo   DEPLOYED SUCCESSFULLY!
echo   URL: https://azaad-app.web.app
echo  ========================================
echo.
pause
