# build-dev.ps1
# PowerShell script to prebuild, build, and move the APK for development with styled logging

clear

$ErrorActionPreference = 'Stop'

#region Helper for colored output
function Write-Log {
    param(
        [string]$Message,
        [string]$Color = "White",
        [string]$Prefix = ""
    )
    Write-Host ("$Prefix$Message") -ForegroundColor $Color
}
#endregion

Write-Log "🚧 Starting build-dev script..." Cyan

# Always set NODE_ENV to development
$env:NODE_ENV = 'development'

Write-Log "⚡ Running Expo prebuild..." Green
# Run expo prebuild and filter out npm warnings
if ((npx expo prebuild 2>&1 | Where-Object { $_ -notmatch 'npm warn' })) {
    Write-Log "✅ Expo prebuild completed successfully." Green
} else {
    Write-Log "❌ Expo prebuild failed. Exiting." Red
    exit 1
}

Write-Log "🏗️  Building APK with Gradle..." Magenta
Write-Log ""
cd android

# Run Gradle and capture exit code, showing logs in real time
& .\gradlew.bat assembleDebug --quiet
$gradleExitCode = $LASTEXITCODE

cd ..

if ($gradleExitCode -eq 0) {
    Write-Log "" # blank line for spacing
    Write-Log "✅ Gradle build completed successfully." Green
} else {
    Write-Log "" # blank line for spacing
    Write-Log "❌ Gradle build failed. Exiting." Red
    exit 1
}

# Move the APK to the output directory
$apkPath = "android\app\build\outputs\apk\debug\app-debug.apk"
$outputPath = "output\app-debug.apk"

Write-Log "📦 Moving APK to output directory..." Cyan
if (Test-Path $apkPath) {
    Move-Item $apkPath $outputPath -Force
    Write-Log "✅ APK moved to $outputPath" Green
} else {
    Write-Log "❌ APK not found at $apkPath" Red
    exit 1
}

Write-Log "🎉 Build process completed!" Cyan
