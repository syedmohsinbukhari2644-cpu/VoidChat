# VoidChat APK Build Fix - Git Push Script
# Is script ko "d:\VOID CHAT\VoidChat" folder mein rakho aur run karo

$repoPath = "d:\VOID CHAT\VoidChat"

Write-Host "=== VoidChat APK Build Fix - GitHub Push ===" -ForegroundColor Cyan
Write-Host ""

# Navigate to repo
Push-Location $repoPath

try {
    # Check git status
    Write-Host "Step 1: Git Status check..." -ForegroundColor Yellow
    git status
    
    Write-Host ""
    Write-Host "Step 2: Adding fixed files..." -ForegroundColor Yellow
    git add package.json
    git add app.json
    git add .github/workflows/build-apk.yml
    
    Write-Host ""
    Write-Host "Step 3: Committing changes..." -ForegroundColor Yellow
    git commit -m "fix: APK build - remove fake expo-glass-effect, fix package versions, rewrite workflow

- Remove expo-glass-effect (fake/non-existent package)
- Fix @expo/metro-runtime from ^57 to ~56 (expo version match)
- Fix @react-native-async-storage from ^3.1.1 to ^2.1.0 (correct version)
- Fix expo package versions to stable 52.x versions
- Remove runtimeVersion/updates.url from app.json (EAS conflict)
- Remove missing asset icon/splash paths from app.json
- Complete rewrite of build-apk.yml workflow:
  * Single job (no separate cleanup that deleted Node)
  * Proper disk cleanup without touching toolcache
  * EXPO_NO_TELEMETRY=1 to avoid EAS auth prompts
  * --no-install flag for expo prebuild
  * Gradle memory settings in gradle.properties
  * Skip lint, test, bundleRelease steps
  * Both signed and unsigned APK upload paths"
    
    Write-Host ""
    Write-Host "Step 4: Pushing to GitHub..." -ForegroundColor Yellow
    git push origin master
    
    Write-Host ""
    Write-Host "SUCCESS! Changes pushed to GitHub!" -ForegroundColor Green
    Write-Host "GitHub Actions build will start in ~30 seconds." -ForegroundColor Green
    Write-Host "Check: https://github.com/syedmohsinbukhari2644-cpu/VoidChat/actions" -ForegroundColor Cyan
    
} catch {
    Write-Host "ERROR: $_" -ForegroundColor Red
} finally {
    Pop-Location
}

Write-Host ""
Write-Host "Press any key to exit..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
