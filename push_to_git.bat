@echo off
echo ==============================================
echo Pushing VOID CHAT Updates to GitHub...
echo ==============================================
git add .
git commit -m "Fix chat toggle crash, settings icons, and Telegram style bottom tabs"
git push
echo ==============================================
echo Updates successfully pushed to GitHub!
echo ==============================================
pause
