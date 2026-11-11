#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Kiểm thử tính toàn vẹn và hợp lệ của WordPress Plugin: Kaola Ads & App Hub
"""

import os
import sys
import subprocess
import zipfile

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PLUGIN_DIR = os.path.join(BASE_DIR, "package", "wordpress", "kaola-ads-manager")
ZIP_PATH = os.path.join(BASE_DIR, "package", "wordpress", "kaola-ads-manager.zip")
APP_ADS_JS = os.path.join(BASE_DIR, "app", "kaola_ads.js")

def test_plugin_integrity():
    total = 0
    passed = 0

    print("==================================================")
    print("   KIỂM THỬ WORDPRESS PLUGIN: KAOLA ADS & APP HUB ")
    print("   (Đa ứng dụng, Telemetry DAU/MAU & Smart Cache)  ")
    print("==================================================")

    # 1. Kiểm tra cấu trúc file cốt lõi của Plugin
    total += 1
    required_files = [
        "kaola-ads-manager.php",
        "includes/class-database.php",
        "includes/class-config.php",
        "includes/class-analytics.php",
        "includes/class-api.php",
        "includes/class-admin.php",
        "templates/admin-dashboard.php",
        "templates/admin-ads.php",
        "templates/admin-updates.php",
        "templates/admin-settings.php",
        "assets/css/admin.css",
        "assets/js/admin.js"
    ]
    missing = [f for f in required_files if not os.path.exists(os.path.join(PLUGIN_DIR, f))]
    if not missing:
        print("[PASS] Test 1: Đầy đủ 12/12 file và thư mục cốt lõi của WordPress Plugin.")
        passed += 1
    else:
        print(f"[FAIL] Test 1: Thiếu các file: {missing}")

    # 2. Kiểm tra cú pháp PHP (php -l) toàn bộ các file
    total += 1
    php_files = []
    for root, _, files in os.walk(PLUGIN_DIR):
        for f in files:
            if f.endswith('.php'):
                php_files.append(os.path.join(root, f))
    
    syntax_errors = []
    for php_file in php_files:
        res = subprocess.run(['php', '-l', php_file], capture_output=True, text=True)
        if res.returncode != 0 or 'No syntax errors detected' not in res.stdout:
            syntax_errors.append((php_file, res.stderr or res.stdout))

    if not syntax_errors:
        print(f"[PASS] Test 2: Toàn bộ {len(php_files)} file PHP đều hợp lệ 100% (No syntax errors).")
        passed += 1
    else:
        print(f"[FAIL] Test 2: Có lỗi cú pháp PHP: {syntax_errors}")

    # 3. Kiểm tra file ZIP cài đặt
    total += 1
    if os.path.exists(ZIP_PATH) and os.path.getsize(ZIP_PATH) > 5000:
        try:
            with zipfile.ZipFile(ZIP_PATH, 'r') as z:
                names = z.namelist()
                has_main = any('kaola-ads-manager/kaola-ads-manager.php' in n.replace('\\', '/') for n in names)
                has_templates = any('templates/admin-dashboard.php' in n.replace('\\', '/') for n in names)
                if has_main and has_templates:
                    print(f"[PASS] Test 3: File ZIP cài đặt chuẩn ({os.path.getsize(ZIP_PATH)/1024:.1f} KB) chứa đúng cấu trúc thư mục WordPress.")
                    passed += 1
                else:
                    print("[FAIL] Test 3: Cấu trúc file bên trong ZIP không đúng định dạng.")
        except Exception as e:
            print(f"[FAIL] Test 3: Không thể đọc file ZIP: {e}")
    else:
        print(f"[FAIL] Test 3: File ZIP chưa được tạo hoặc dung lượng bất thường.")

    # 4. Kiểm tra client Kaola Office đã bổ sung Telemetry device_id
    total += 1
    with open(APP_ADS_JS, 'r', encoding='utf-8') as f:
        js_content = f.read()
    
    has_device_id = "kaola_office_device_id" in js_content and "getDeviceId" in js_content
    has_telemetry_query = "buildTelemetryQuery" in js_content and "device_id=" in js_content
    if has_device_id and has_telemetry_query:
        print("[PASS] Test 4: Kaola Office Desktop đã nhúng mã định danh ẩn danh device_id & telemetry query.")
        passed += 1
    else:
        print("[FAIL] Test 4: kaola_ads.js chưa có mã định danh device_id.")

    # 5. Kiểm tra tính năng đa ứng dụng (Multi-App) trong Config
    total += 1
    with open(os.path.join(PLUGIN_DIR, "includes", "class-config.php"), 'r', encoding='utf-8') as f:
        config_content = f.read()
    has_multi_app = "office" in config_content and "desktop" in config_content and "chat" in config_content
    has_cache = "generate_cache_file" in config_content and "get_fast_cached_response" in config_content
    if has_multi_app and has_cache:
        print("[PASS] Test 5: Module Config hỗ trợ đa ứng dụng (Office, Desktop, Chat, Tools) & Smart JSON Cache.")
        passed += 1
    else:
        print("[FAIL] Test 5: Thiếu cấu hình đa ứng dụng hoặc smart cache.")

    print("\n--------------------------------------------------")
    print(f"KẾT QUẢ: ĐÃ VƯỢT QUA {passed}/{total} BÀI KIỂM THỬ.")
    print("--------------------------------------------------")
    return passed == total

if __name__ == "__main__":
    success = test_plugin_integrity()
    sys.exit(0 if success else 1)
