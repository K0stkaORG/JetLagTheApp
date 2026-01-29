# clear.ps1
# PowerShell script to clear build artifacts and output directories for JetLagTheApp

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

Write-Log "🧹 Clearing build artifacts..." Cyan

# Remove everything from output directory
$outputDir = "output"
if (Test-Path $outputDir) {
    Remove-Item "$outputDir\*" -Recurse -Force
    Write-Log "✅ Emptied $outputDir" Green
} else {
    Write-Log "ℹ️  $outputDir does not exist." DarkCyan
}

# Run gradle clear (hide output)
Write-Log "⚡ Running gradle clear..." Green
cd android
$gradleClear = & ./gradlew.bat clean *>&1
cd ..
if ($LASTEXITCODE -eq 0) {
    Write-Log "✅ Gradle clear complete!" Green
} else {
    Write-Log "❌ Gradle clear failed!" Red
    $gradleClear | ForEach-Object { Write-Log $_ Red }
    exit 1
}

Write-Log "🎉 Clear complete!" Cyan
