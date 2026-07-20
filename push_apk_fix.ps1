# PowerShell script to push new APK update to GitHub Actions
Write-Host "=========================================" -ForegroundColor Green
Write-Host " VOID CHAT - Pushing New Release for APK " -ForegroundColor Green
Write-Host "=========================================" -ForegroundColor Green
Write-Host ""

Set-Location -Path "d:\VOID CHAT\VoidChat"

git add .
git commit -m "Production Release: Profile Mode Switcher, Media Attachments Send & Real 6-Digit OTP"
git push origin master

Write-Host ""
Write-Host "=========================================" -ForegroundColor Green
Write-Host " SUCCESS! GitHub Actions is building APK " -ForegroundColor Green
Write-Host "=========================================" -ForegroundColor Green
Read-Host -Prompt "Press Enter to exit..."
