#!/bin/bash
# ==============================================================
# Hướng dẫn kích hoạt mở Kaola Office trên macOS (Bypass Gatekeeper)
# Double-click file này nếu máy Mac báo "Ứng dụng bị hỏng" hoặc "Không xác định nhà phát triển"
# ==============================================================

clear
echo "=========================================================="
echo "          KAOLA OFFICE - CÔNG CỤ KÍCH HOẠT MACOS          "
echo "=========================================================="
echo ""
echo "Đang kiểm tra cài đặt Kaola Office trong thư mục /Applications..."

APP_PATH="/Applications/Kaola Office.app"

if [ ! -d "$APP_PATH" ]; then
    echo "[!] Chưa tìm thấy 'Kaola Office.app' trong thư mục /Applications."
    echo "    Vui lòng kéo 'Kaola Office' vào thư mục Applications trước khi chạy script này."
    echo ""
    read -p "Nhấn Enter để thoát..."
    exit 1
fi

echo "[*] Đang gỡ bỏ cờ kiểm dịch bảo mật Gatekeeper (Quarantine flag)..."
xattr -cr "$APP_PATH" 2>/dev/null

echo "[*] Đang cấp lại quyền thực thi..."
chmod -R 755 "$APP_PATH" 2>/dev/null

echo ""
echo "=========================================================="
echo " [SUCCESS] ĐÃ KÍCH HOẠT THÀNH CÔNG KAOLA OFFICE!"
echo " Bạn có thể mở ứng dụng ngay từ Launchpad hoặc Applications."
echo "=========================================================="
echo ""
read -p "Nhấn Enter để mở Kaola Office ngay..."
open "$APP_PATH"
