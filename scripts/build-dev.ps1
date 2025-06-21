// build-dev.ps1
# PowerShell script to prebuild, build, and move the APK for development with styled logging

clear

$ErrorActionPreference = 'Stop'

function Write-Info($msg) {
    Write-Host "[INFO] $msg" -ForegroundColor Cyan
}
function Write-Success($msg) {
    Write-Host "[SUCCESS] $msg" -ForegroundColor Green
}
function Write-WarningStyled($msg) {
    Write-Host "[WARNING] $msg" -ForegroundColor Yellow
}
function Write-ErrorStyled($msg) {
    Write-Host "[ERROR] $msg" -ForegroundColor Red
}

Write-Info "Starting build-dev script..."

# Always set NODE_ENV to development
$env:NODE_ENV = 'development'
Write-Info "NODE_ENV is set to 'development' by the script."

Write-Info "Running expo prebuild..."
if (npx expo prebuild) {
    Write-Success "expo prebuild completed successfully."
} else {
    Write-ErrorStyled "expo prebuild failed. Exiting."
    exit 1
}

Write-Info "Building APK with Gradle..."
cd android
if (./gradlew.bat assembleDebug) {
    Write-Success "Gradle build completed successfully."
} else {
    Write-ErrorStyled "Gradle build failed. Exiting."
    exit 1
}
cd ..

# Move the APK to the output directory
$apkPath = "android\app\build\outputs\apk\debug\app-debug.apk"
$outputPath = "output\app-debug.apk"

Write-Info "Moving APK to output directory..."
if (Test-Path $apkPath) {
    Move-Item $apkPath $outputPath -Force
    Write-Success "APK moved to $outputPath"
} else {
    Write-ErrorStyled "APK not found at $apkPath"
    exit 1
}

Write-Success "Build process completed!"
