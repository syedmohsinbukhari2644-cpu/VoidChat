@echo off
echo ===================================================
echo   VOID CHAT Android Crash Log Collector
echo ===================================================
echo.
echo 1. Connect your Android phone to your PC via USB.
echo 2. Enable USB Debugging in developer options.
echo 3. Open the VOID CHAT app on your phone so it crashes.
echo.
echo Press any key when ready to capture logs...
pause > nul

echo.
echo Locating Android ADB tool...

set "ADB_PATH=adb"

:: Check common Android SDK locations
if exist "%LOCALAPPDATA%\Android\Sdk\platform-tools\adb.exe" (
    set "ADB_PATH=%LOCALAPPDATA%\Android\Sdk\platform-tools\adb"
) else if exist "%USERPROFILE%\AppData\Local\Android\Sdk\platform-tools\adb.exe" (
    set "ADB_PATH=%USERPROFILE%\AppData\Local\Android\Sdk\platform-tools\adb"
) else if exist "C:\Users\acer\AppData\Local\Android\Sdk\platform-tools\adb.exe" (
    set "ADB_PATH=C:\Users\acer\AppData\Local\Android\Sdk\platform-tools\adb"
) else if exist "C:\Program Files (x86)\Android\android-sdk\platform-tools\adb.exe" (
    set "ADB_PATH=C:\Program Files (x86)\Android\android-sdk\platform-tools\adb"
) else if exist "C:\Android\sdk\platform-tools\adb.exe" (
    set "ADB_PATH=C:\Android\sdk\platform-tools\adb"
)

echo Using ADB from: %ADB_PATH%
echo Collecting error logs from your device...
"%ADB_PATH%" logcat -d -v time *:E > crash_log.txt

if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Could not run adb. Make sure:
    echo - Android Studio / SDK is installed
    echo - Your phone is connected and USB debugging is allowed
) else (
    echo.
    echo [SUCCESS] Log collected successfully in 'crash_log.txt'!
    echo Please copy and paste the contents of 'crash_log.txt' in our chat.
)
echo ===================================================
pause
