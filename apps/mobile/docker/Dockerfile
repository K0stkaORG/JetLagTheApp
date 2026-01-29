FROM node:20-bullseye

ARG ANDROID_PLATFORM=android-34
ARG ANDROID_BUILD_TOOLS=34.0.0
ARG ANDROID_NDK=26.3.11579264
ARG ANDROID_CMDLINE_TOOLS=11076708

ENV ANDROID_SDK_ROOT=/opt/android-sdk \
    ANDROID_HOME=/opt/android-sdk \
    JAVA_HOME=/usr/lib/jvm/java-17-openjdk-amd64 \
    GRADLE_USER_HOME=/gradle \
    PNPM_HOME=/pnpm \
    PATH=/pnpm:/usr/lib/jvm/java-17-openjdk-amd64/bin:/opt/android-sdk/cmdline-tools/latest/bin:/opt/android-sdk/platform-tools:/opt/android-sdk/emulator:/opt/android-sdk/tools:/opt/android-sdk/tools/bin:/opt/android-sdk/ndk/${ANDROID_NDK}:$PATH

RUN apt-get update && apt-get install -y --no-install-recommends \
      openjdk-17-jdk \
      curl \
      git \
      unzip \
      zip \
      bash \
      python3 \
      build-essential \
      libglu1-mesa \
      ca-certificates \
      rsync \
    && rm -rf /var/lib/apt/lists/* \
    && corepack enable \
    && corepack prepare pnpm@9 --activate \
    && mkdir -p ${ANDROID_SDK_ROOT}/cmdline-tools /root/.android /gradle \
    && touch /root/.android/repositories.cfg \
    && curl -fsSL https://dl.google.com/android/repository/commandlinetools-linux-${ANDROID_CMDLINE_TOOLS}_latest.zip -o /tmp/cmdline-tools.zip \
    && unzip -q /tmp/cmdline-tools.zip -d ${ANDROID_SDK_ROOT}/cmdline-tools \
    && mv ${ANDROID_SDK_ROOT}/cmdline-tools/cmdline-tools ${ANDROID_SDK_ROOT}/cmdline-tools/latest \
    && rm /tmp/cmdline-tools.zip \
    && sdkmanager --sdk_root="${ANDROID_SDK_ROOT}" \
      "platform-tools" \
      "platforms;${ANDROID_PLATFORM}" \
      "build-tools;${ANDROID_BUILD_TOOLS}" \
      "ndk;${ANDROID_NDK}" \
    && yes | sdkmanager --sdk_root="${ANDROID_SDK_ROOT}" --licenses

WORKDIR /repo

COPY apps/mobile/docker/build-apk.sh /usr/local/bin/build-apk
RUN sed -i 's/\r$//' /usr/local/bin/build-apk \
    && chmod +x /usr/local/bin/build-apk

ENTRYPOINT ["/usr/local/bin/build-apk"]
