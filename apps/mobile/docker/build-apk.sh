#!/usr/bin/env bash
set -euo pipefail

export CI=true
export EXPO_NO_TELEMETRY=1
BUILD_TYPE="${BUILD_TYPE:-dev}"
PREBUILD="${PREBUILD:-0}"
PNPM_FROZEN_LOCKFILE="${PNPM_FROZEN_LOCKFILE:-1}"
EXTRA_GRADLE_ARGS="${EXTRA_GRADLE_ARGS:-}"
REPO_CACHE_ROOT="/repo/.cache"

if [[ -z "${JAVA_HOME:-}" ]]; then
  export JAVA_HOME="/usr/lib/jvm/java-17-openjdk-amd64"
  export PATH="${JAVA_HOME}/bin:${PATH}"
fi

export GRADLE_USER_HOME="${REPO_CACHE_ROOT}/gradle"
export PNPM_STORE_PATH="${REPO_CACHE_ROOT}/pnpm-store"
mkdir -p "${GRADLE_USER_HOME}" "${PNPM_STORE_PATH}"

cat <<'INFO'
Signing note: release builds currently use debug signing.
To switch to a real keystore later, update android/app/build.gradle (signingConfigs.release).
You can also inject signing configs via gradle.properties if preferred.
INFO

if [[ "${BUILD_TYPE}" == "prod" || "${BUILD_TYPE}" == "release" ]]; then
  GRADLE_TASKS=("assembleRelease" "bundleRelease")
  APK_GLOB="app-*-release.apk"
  AAB_GLOB="*.aab"
  APK_LABEL="release"
  AAB_LABEL="release"
  EXPECT_BUNDLE=1
  export NODE_ENV=production
else
  GRADLE_TASKS=("assembleDebug" "bundleDebug")
  APK_GLOB="app-*-debug.apk"
  AAB_GLOB="*.aab"
  APK_LABEL="debug"
  AAB_LABEL="debug"
  EXPECT_BUNDLE=0
  export NODE_ENV=development
fi

echo "Build type: ${BUILD_TYPE}"

if [[ ! -d "/repo/apps/mobile" ]]; then
  echo "Expected repo at /repo with apps/mobile" >&2
  exit 1
fi

mkdir -p /output

# Copy repo contents excluding node_modules to avoid permission issues
echo "Copying repository to build workspace (excluding node_modules)..."
mkdir -p /build-workspace
set +e
RSYNC_EXCLUDES=(
  --exclude='node_modules'
  --exclude='.git'
  --exclude='.cache'
  --exclude='.expo'
  --exclude='.gradle'
  --exclude='**/android/build'
  --exclude='**/android/app/build'
  --exclude='**/build'
  --exclude='**/dist'
  --exclude='output'
)

rsync -a "${RSYNC_EXCLUDES[@]}" /repo/package.json /build-workspace/
rsync -a "${RSYNC_EXCLUDES[@]}" /repo/pnpm-lock.yaml /build-workspace/
rsync -a "${RSYNC_EXCLUDES[@]}" /repo/pnpm-workspace.yaml /build-workspace/
mkdir -p /build-workspace/apps/mobile /build-workspace/packages/shared-types
rsync -a "${RSYNC_EXCLUDES[@]}" /repo/apps/mobile/ /build-workspace/apps/mobile/
rsync -a "${RSYNC_EXCLUDES[@]}" /repo/packages/shared-types/ /build-workspace/packages/shared-types/
RSYNC_STATUS=$?
set -e
if [[ ${RSYNC_STATUS} -ne 0 ]]; then
  echo "rsync failed with status ${RSYNC_STATUS}" >&2
  exit ${RSYNC_STATUS}
fi
echo "Copy completed."
cd /build-workspace

corepack enable >/dev/null 2>&1 || true
pnpm --version
echo "Installing dependencies (this may take a few minutes)..."
if [[ "${PNPM_FROZEN_LOCKFILE}" == "1" ]]; then
  pnpm install --frozen-lockfile --prefer-offline --store-dir "${PNPM_STORE_PATH}"
else
  pnpm install --prefer-offline --store-dir "${PNPM_STORE_PATH}"
fi

pushd /build-workspace/apps/mobile >/dev/null
  if [[ "${PREBUILD}" == "1" ]]; then
    pnpm run prebuild -- --clean
  fi

  pushd android >/dev/null
    sed -i 's/\r$//' ./gradlew
    chmod +x ./gradlew
    ./gradlew ${GRADLE_TASKS[@]} ${EXTRA_GRADLE_ARGS} --no-daemon
  popd >/dev/null

  if [[ "${EXPECT_BUNDLE}" == "1" ]]; then
    BUNDLE_PATH=$(find android/app -path '*/release/*' -name 'index.android.bundle' | head -n 1)
    if [[ -z "${BUNDLE_PATH}" ]]; then
      echo "Release JS bundle not found. Ensure Expo export:embed ran during the build." >&2
      exit 1
    fi
    echo "Found release JS bundle at ${BUNDLE_PATH}"
  fi

  APK_PATH=$(find android/app/build/outputs/apk -type f -name "app-${APK_LABEL}.apk" | head -n 1)
  if [[ -z "${APK_PATH}" ]]; then
    APK_PATH=$(find android/app/build/outputs/apk -type f -name "${APK_GLOB}" | head -n 1)
  fi
  if [[ -z "${APK_PATH}" ]]; then
    APK_PATH=$(find android/app/build/outputs/apk -type f -name "*.apk" | head -n 1)
  fi

  AAB_PATH=$(find android/app/build/outputs/bundle -type f -name "app-${AAB_LABEL}.aab" | head -n 1)
  if [[ -z "${AAB_PATH}" ]]; then
    AAB_PATH=$(find android/app/build/outputs/bundle -type f -name "${AAB_GLOB}" | head -n 1)
  fi

  if [[ -z "${APK_PATH}" ]]; then
    echo "APK not found. Available outputs:" >&2
    find android/app/build/outputs -maxdepth 5 -type f | sed 's#^#- #' >&2
    exit 1
  fi
  if [[ -z "${AAB_PATH}" ]]; then
    echo "AAB not found. Available outputs:" >&2
    find android/app/build/outputs -maxdepth 5 -type f | sed 's#^#- #' >&2
    exit 1
  fi

  cp "${APK_PATH}" "/output/app-${APK_LABEL}.apk"
  cp "${AAB_PATH}" "/output/app-${AAB_LABEL}.aab"
  echo "APK copied to /output/app-${APK_LABEL}.apk"
  echo "AAB copied to /output/app-${AAB_LABEL}.aab"

popd >/dev/null
