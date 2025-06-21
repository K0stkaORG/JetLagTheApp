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

# 0. Load environment variables from .env file (ignoring comments)
Write-Log "🔄 Loading environment variables from .env..." Cyan
$envFile = Get-Content .env | Where-Object { $_ -notmatch '^\s*#' -and $_ -match '=' }
foreach ($line in $envFile) {
    if ($line -match '^(.*?)=(.*)$') {
        $key = $matches[1].Trim()
        $value = $matches[2].Trim(' "')
        Set-Item -Path Env:$key -Value $value
    }
}

# 0. Inject environment variables into app.json
Write-Log "📝 Injecting EXPO_PUBLIC_SERVER_URL and EXPO_PUBLIC_WS_URL into app.json..." Yellow
$appJsonPath = "app.json"
$appJson = Get-Content $appJsonPath | Out-String | ConvertFrom-Json
$appJson.expo.extra.EXPO_PUBLIC_SERVER_URL = $env:EXPO_PUBLIC_SERVER_URL
$appJson.expo.extra.EXPO_PUBLIC_WS_URL = $env:EXPO_PUBLIC_WS_URL
$appJson | ConvertTo-Json -Depth 10 | Set-Content $appJsonPath

# 1. Install dependencies
Write-Log "📦 Installing dependencies with pnpm..." Green
pnpm install

# 2. Ensure assets directory exists
$assetsPath = "android/app/src/main/assets"
if (-not (Test-Path $assetsPath)) {
    Write-Log "📁 Creating assets directory..." DarkCyan
    New-Item -ItemType Directory -Path $assetsPath | Out-Null
}

# 3. Bundle JS and assets
Write-Log "📦 Bundling JS and assets for production..." Green
npx react-native bundle --platform android --dev false --entry-file index.js --bundle-output android/app/src/main/assets/index.android.bundle --assets-dest android/app/src/main/res

# 4. Build the release APK
Write-Log "🏗️  Building the release APK..." Magenta
cd android
./gradlew assembleRelease
cd ..

# 5. Move the APK to the /output/ folder
$apkSource = "android/app/build/outputs/apk/release/app-release.apk"
$apkDest = "output/app-release.apk"
if (Test-Path $apkSource) {
    Move-Item -Path $apkSource -Destination $apkDest -Force
    Write-Log "✅ APK moved to $apkDest" Green
} else {
    Write-Log "❌ APK not found at $apkSource. Build may have failed." Red
}

Write-Log "🎉 Build complete! APK is in the /output/ folder." Cyan

# Set NODE_ENV=production for build
Write-Log "🔄 Setting NODE_ENV=production for build..." Cyan
$env:NODE_ENV = "production"
