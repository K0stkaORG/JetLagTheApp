# Android Emulator Launcher Script
# Launches the emulator without blocking the terminal

$emulatorPath = "$env:USERPROFILE\AppData\Local\Android\Sdk\emulator\emulator.exe"
$avdName = "Medium_Phone_API_36.0"

# Check if emulator exists
if (-not (Test-Path $emulatorPath)) {
    Write-Host "❌ Emulator not found at: $emulatorPath" -ForegroundColor Red
    exit 1
}

Write-Host "🚀 Starting Android emulator: $avdName" -ForegroundColor Cyan
Write-Host "⏳ Emulator will launch in background..." -ForegroundColor Yellow

# Start emulator process without blocking terminal
Start-Process -FilePath $emulatorPath -ArgumentList "-avd", $avdName -WindowStyle Hidden

Write-Host "✅ Emulator started successfully!" -ForegroundColor Green
