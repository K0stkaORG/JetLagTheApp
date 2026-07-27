#!/usr/bin/env bash
# Regenerates native Android launcher + splash image resources from the
# Expo source PNGs (which were derived from assets/images/logo.svg).
#
# Source images (1024x1024 unless noted):
#   icon.png                       -> legacy ic_launcher / ic_launcher_round
#   android-icon-foreground.png    -> adaptive ic_launcher_foreground (+ monochrome silhouette)
#   android-icon-background.png    -> adaptive ic_launcher_background (solid #213042)
#   splash-icon.png                -> drawable-*/splashscreen_logo.png
#
# Sizes follow the standard Android density buckets that Expo prebuild emits.
set -euo pipefail

IMG_DIR="apps/mobile/assets/images"
RES_DIR="apps/mobile/android/app/src/main/res"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

icon="$IMG_DIR/icon.png"
fg="$IMG_DIR/android-icon-foreground.png"
bg="$IMG_DIR/android-icon-background.png"
splash="$IMG_DIR/splash-icon.png"

# --- Build reusable 1024px intermediates -------------------------------------
# White silhouette of the foreground, for the themed/monochrome icon.
# -colorize replaces RGB with white while preserving the source alpha shape.
mono="$TMP/mono.png"
magick "$fg" -fill white -colorize 100 -alpha on "$mono"

# Circle-masked version of the square icon, for ic_launcher_round.
round="$TMP/round.png"
magick "$icon" \
    \( -size 1024x1024 xc:none -fill white -draw "circle 512,512 512,0" \) \
    -compose DstIn -composite "$round"

# --- Density buckets ---------------------------------------------------------
# legacy launcher px : mdpi 48  hdpi 72  xhdpi 96  xxhdpi 144  xxxhdpi 192
# adaptive fg/bg/mono: mdpi 108 hdpi 162 xhdpi 216 xxhdpi 324 xxxhdpi 432
# splash logo px     : mdpi 288 hdpi 432 xhdpi 576 xxhdpi 864 xxxhdpi 1152
legacy=(48 72 96 144 192)
adaptive=(108 162 216 324 432)
splashpx=(288 432 576 864 1152)
densities=(mdpi hdpi xhdpi xxhdpi xxxhdpi)

for i in "${!densities[@]}"; do
    d="${densities[$i]}"
    mip="$RES_DIR/mipmap-$d"
    draw="$RES_DIR/drawable-$d"

    # Legacy launcher icons (lossless webp for crisp edges).
    magick "$icon" -resize "${legacy[$i]}x${legacy[$i]}" -define webp:lossless=true "$mip/ic_launcher.webp"
    magick "$round" -resize "${legacy[$i]}x${legacy[$i]}" -define webp:lossless=true "$mip/ic_launcher_round.webp"

    # Adaptive icon foreground / background / monochrome.
    magick "$fg" -resize "${adaptive[$i]}x${adaptive[$i]}" -define webp:lossless=true "$mip/ic_launcher_foreground.webp"
    magick "$bg" -resize "${adaptive[$i]}x${adaptive[$i]}" -define webp:lossless=true "$mip/ic_launcher_background.webp"
    magick "$mono" -resize "${adaptive[$i]}x${adaptive[$i]}" -define webp:lossless=true "$mip/ic_launcher_monochrome.webp"

    # Splash logo (PNG, preserves transparency).
    magick "$splash" -resize "${splashpx[$i]}x${splashpx[$i]}" "$draw/splashscreen_logo.png"

    echo "  $d done"
done

echo "Native icon + splash resources regenerated."
