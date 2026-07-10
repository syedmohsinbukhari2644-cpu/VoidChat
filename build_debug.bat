@echo off
SET "PATH=C:\Program Files\nodejs;C:\Users\acer\AppData\Roaming\npm;%PATH%"
cd /d "d:\VOID CHAT\VoidChat"
echo Running build and redirecting output...
call npm run build > build_stdout.log 2> build_stderr.log
echo Done! Please check build_stderr.log
pause
