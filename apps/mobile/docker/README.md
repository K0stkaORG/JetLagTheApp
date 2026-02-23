# Mobile Android Builder

Builds Android APK/AAB for the React Native + Expo app in apps/mobile using a portable Docker image.

## What it does

- Builds Debug (dev) or Release (prod) variants
- Outputs both APK and AAB to /output
- Ensures Release builds include the JS bundle (fails if missing)
- Copies only required workspace paths (apps/mobile, packages/shared-types, pnpm files) to speed up Windows/WSL builds

## Requirements

- Docker Desktop (Windows/macOS) or Docker Engine (Linux)
- The repository mounted into /repo and an output folder mounted into /output

## Usage

1. Build the image from the repo root

docker build -t jetlag-mobile-builder -f apps/mobile/docker/Dockerfile .

Or use pnpm:

pnpm mobile:docker:build

2. Run a build

Dev build (debug APK + AAB)

docker run --rm -e BUILD_TYPE=dev -v /path/to/repo:/repo -v /path/to/output:/output jetlag-mobile-builder

Or use pnpm:

pnpm mobile:android:dev

Release build (release APK + AAB, embedded JS bundle)

docker run --rm -e BUILD_TYPE=release -v /path/to/repo:/repo -v /path/to/output:/output jetlag-mobile-builder

Or use pnpm:

pnpm mobile:android:release

## Inputs (environment variables)

- BUILD_TYPE=dev|prod|release (default: dev)
- PREBUILD=0|1 (default: 0) — runs expo prebuild --clean
- PNPM_FROZEN_LOCKFILE=1|0 (default: 1)
- EXTRA_GRADLE_ARGS (default: empty) — passed to gradlew

## Output files

- /output/app-debug.apk
- /output/app-debug.aab
- /output/app-release.apk
- /output/app-release.aab

## Signing (Google Play App Signing)

For Google Play App Signing, your uploaded AAB must still be signed with your **upload key** (not debug key).

Recommended setup:

1. Run `pnpm build:mobile:gen-upload-key` (generates keystore and scaffolds properties file)
2. Update `apps/mobile/android/keystore.properties` with your real passwords
3. Build release again (`pnpm build:mobile:release`)

Release builds now fail fast if signing config is missing.

## Troubleshooting

- If release bundling fails, ensure react-native-worklets is present and autolinking is disabled via apps/mobile/react-native.config.js.
- Gradle and Android SDK components are cached inside the image, but first build may still be slow.
