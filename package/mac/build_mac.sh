#!/bin/bash
# ==============================================================
# SCRIPT TỰ ĐỘNG ĐÓNG GÓI BỘ CÀI ĐẶT KAOLA OFFICE CHO MACOS (.DMG)
# Chạy trên macOS (máy tính Mac hoặc GitHub Actions runner)
# Hỗ trợ cả Apple Silicon (M1/M2/M3/M4) và Intel (x86_64)
# ==============================================================

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BASE_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"
OUTPUT_DIR="$SCRIPT_DIR/Output"
BUILD_TMP="/tmp/kaola_mac_build"

ARCH="${1:-arm64}" # Mặc định là arm64 (Apple Silicon). Các lựa chọn: arm64 | x86_64 | all

mkdir -p "$OUTPUT_DIR"
mkdir -p "$BUILD_TMP"

echo "=========================================================="
echo "        KAOLA OFFICE MACOS PACKAGER (RELEASE BUILD)       "
echo "=========================================================="
echo "Thư mục gốc: $BASE_DIR"
echo "Kiến trúc mục tiêu: $ARCH"
echo "Thư mục xuất file: $OUTPUT_DIR"
echo ""

build_for_arch() {
    local TARGET_ARCH="$1"
    local DOWNLOAD_URL=""
    local DMG_NAME="ONLYOFFICE_${TARGET_ARCH}.dmg"
    local DMG_PATH="$BUILD_TMP/$DMG_NAME"
    local FINAL_DMG="$OUTPUT_DIR/KaolaOffice_macOS_${TARGET_ARCH}.dmg"

    if [ "$TARGET_ARCH" == "arm64" ]; then
        echo "[1/5] Tải bộ cài ONLYOFFICE gốc cho Apple Silicon (ARM64)..."
        DOWNLOAD_URL="https://github.com/ONLYOFFICE/DesktopEditors/releases/latest/download/ONLYOFFICE-arm.dmg"
    else
        echo "[1/5] Tải bộ cài ONLYOFFICE gốc cho Mac Intel (x86_64)..."
        DOWNLOAD_URL="https://github.com/ONLYOFFICE/DesktopEditors/releases/latest/download/ONLYOFFICE-x86_64.dmg"
    fi

    if [ ! -f "$DMG_PATH" ]; then
        curl -L --progress-bar "$DOWNLOAD_URL" -o "$DMG_PATH"
    else
        echo "  [CACHE] Đã có sẵn file tải về: $DMG_PATH"
    fi

    echo "[2/5] Trích xuất file ONLYOFFICE.app từ DMG..."
    local MOUNT_DIR="$BUILD_TMP/mount_${TARGET_ARCH}"
    local APP_EXTRACT="$BUILD_TMP/app_${TARGET_ARCH}"
    
    mkdir -p "$MOUNT_DIR"
    rm -rf "$APP_EXTRACT"
    mkdir -p "$APP_EXTRACT"

    hdiutil attach -nobrowse -readonly "$DMG_PATH" -mountpoint "$MOUNT_DIR"
    cp -R "$MOUNT_DIR/ONLYOFFICE.app" "$APP_EXTRACT/"
    hdiutil detach "$MOUNT_DIR" || true
    rm -rf "$MOUNT_DIR"

    echo "[3/5] Áp dụng nhận diện thương hiệu và module Kaola Office..."
    python3 "$SCRIPT_DIR/patch_mac_app.py" "$APP_EXTRACT/ONLYOFFICE.app"

    local TARGET_APP="$APP_EXTRACT/Kaola Office.app"
    if [ ! -d "$TARGET_APP" ]; then
        echo "[ERROR] Không tìm thấy Kaola Office.app sau khi patch!"
        exit 1
    fi

    echo "[4/5] Chuẩn bị cấu trúc thư mục đĩa cài đặt DMG..."
    local DMG_STAGING="$BUILD_TMP/dmg_staging_${TARGET_ARCH}"
    rm -rf "$DMG_STAGING"
    mkdir -p "$DMG_STAGING"

    cp -R "$TARGET_APP" "$DMG_STAGING/"
    ln -s /Applications "$DMG_STAGING/Applications"
    cp "$SCRIPT_DIR/fix_gatekeeper.command" "$DMG_STAGING/Kích_Hoạt_Mở_App.command"
    chmod +x "$DMG_STAGING/Kích_Hoạt_Mở_App.command"

    echo "[5/5] Đóng gói file DMG chuẩn macOS..."
    rm -f "$FINAL_DMG"
    hdiutil create -volname "Kaola Office" -srcfolder "$DMG_STAGING" -ov -format UDZO "$FINAL_DMG"

    echo ""
    echo "[SUCCESS] Đã tạo thành công bộ cài đặt macOS (${TARGET_ARCH}):"
    echo "          $FINAL_DMG"
    ls -lh "$FINAL_DMG"
    echo ""
}

if [ "$ARCH" == "all" ]; then
    build_for_arch "arm64"
    build_for_arch "x86_64"
else
    build_for_arch "$ARCH"
fi

echo "=========================================================="
echo "   HOÀN TẤT TOÀN BỘ TIẾN TRÌNH ĐÓNG GÓI CHO MACOS!        "
echo "=========================================================="
