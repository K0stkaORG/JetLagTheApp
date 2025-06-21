# clean.ps1
# PowerShell script to clean build artifacts and output directories for JetLagTheApp

clear

$ErrorActionPreference = 'Stop'

function Write-Info($msg) {
    Write-Host "[INFO] $msg" -ForegroundColor Cyan
}
function Write-Success($msg) {
    Write-Host "[SUCCESS] $msg" -ForegroundColor Green
}
function Write-ErrorStyled($msg) {
    Write-Host "[ERROR] $msg" -ForegroundColor Red
}

Write-Info "Cleaning build artifacts..."

# Remove everything from output directory
$outputDir = "output"
if (Test-Path $outputDir) {
    Remove-Item "$outputDir\*" -Recurse -Force
    Write-Success "Emptied $outputDir"
} else {
    Write-Info "$outputDir does not exist."
}

# Run gradle clean (hide output)
Write-Info "Running gradle clean..."
cd android
$gradleClean = & ./gradlew.bat clean *>&1
cd ..
if ($LASTEXITCODE -eq 0) {
    Write-Success "Gradle clean complete!"
} else {
    Write-ErrorStyled "Gradle clean failed!"
    $gradleClean | Write-ErrorStyled
    exit 1
}

Write-Success "Clean complete!"
