#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Kiểm thử tích hợp hệ thống Quản lý Quảng cáo & Telemetry trên KaolaWork SaaS
"""

import json
import os
import subprocess
import sys
import urllib.request

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

BASE_URL = "http://kaolawork.test"

def run_tests():
    total = 0
    passed = 0

    print("==================================================")
    print("   KIỂM THỬ MODULE QUẢNG CÁO & TELEMETRY TRÊN SAAS")
    print("   (KaolaWork Platform Admin /admin/ecosystem-ads)")
    print("==================================================")

    # Test 1: Kiểm tra API Kaola Office Client (/api/v1/office/init)
    total += 1
    dev1_id = "test_device_office_uuid_9999"
    url1 = f"{BASE_URL}/api/v1/office/init?v=1.0.0&device_id={dev1_id}&os=Windows&email=vip_customer@kaola.vn&is_vip=1"
    try:
        req = urllib.request.Request(url1, headers={'User-Agent': 'KaolaOfficeDesktop/1.0'})
        with urllib.request.urlopen(req, timeout=5) as res:
            data1 = json.loads(res.read().decode('utf-8'))
            if data1.get('status') == 'success' and 'ad' in data1 and 'update' in data1:
                print(f"[PASS] Test 1: Endpoint /api/v1/office/init phản hồi 200 JSON chuẩn xác.")
                passed += 1
            else:
                print(f"[FAIL] Test 1: JSON không đúng định dạng: {data1}")
    except Exception as e:
        print(f"[FAIL] Test 1: Lỗi kết nối {url1}: {e}")

    # Test 2: Kiểm tra API Đa Ứng dụng (/api/v1/desktop/init)
    total += 1
    dev2_id = "test_device_desktop_uuid_8888"
    url2 = f"{BASE_URL}/api/v1/desktop/init?v=1.0.0&device_id={dev2_id}&os=Windows"
    try:
        req = urllib.request.Request(url2, headers={'User-Agent': 'KaolaDesktopAI/1.0'})
        with urllib.request.urlopen(req, timeout=5) as res:
            data2 = json.loads(res.read().decode('utf-8'))
            if data2.get('status') == 'success' and data2.get('app_code') == 'desktop':
                print(f"[PASS] Test 2: Endpoint đa ứng dụng /api/v1/desktop/init hoạt động hoàn hảo.")
                passed += 1
            else:
                print(f"[FAIL] Test 2: Sai định dạng dữ liệu cho app desktop: {data2}")
    except Exception as e:
        print(f"[FAIL] Test 2: Lỗi kết nối {url2}: {e}")

    # Test 3: Kiểm tra ghi nhận Telemetry vào Database ecosystem_app_devices
    total += 1
    try:
        php_code = (
            '$pdo = new PDO("mysql:host=127.0.0.1;dbname=kaolawork;charset=utf8mb4", "root", ""); '
            '$c1 = $pdo->query("SELECT COUNT(*) FROM ecosystem_app_devices WHERE device_id = \'test_device_office_uuid_9999\' AND app_code = \'office\'")->fetchColumn(); '
            '$c2 = $pdo->query("SELECT COUNT(*) FROM ecosystem_app_devices WHERE device_id = \'test_device_desktop_uuid_8888\' AND app_code = \'desktop\'")->fetchColumn(); '
            'echo "$c1,$c2";'
        )
        proc = subprocess.run([
            'php', '-r', php_code
        ], capture_output=True, text=True, cwd="C:\\laragon\\www\\kaolawork")
        counts = proc.stdout.strip().split(',')
        if counts == ['1', '1']:
            print("[PASS] Test 3: Telemetry đã lưu thành công 2 thiết bị mới vào database ecosystem_app_devices.")
            passed += 1
        else:
            print(f"[FAIL] Test 3: Kết quả đếm trong DB không khớp: {counts} (stderr: {proc.stderr})")
    except Exception as e:
        print(f"[FAIL] Test 3: Lỗi truy vấn database: {e}")

    # Test 4: Kiểm tra sự hiện diện của Filament Admin Page EcosystemAdsHub
    total += 1
    try:
        proc = subprocess.run([
            'php', 'artisan', 'tinker', '--execute',
            'echo class_exists(App\\Filament\\Admin\\Pages\\EcosystemAdsHub::class) ? "YES" : "NO";'
        ], capture_output=True, text=True, cwd="C:\\laragon\\www\\kaolawork")
        if "YES" in proc.stdout:
            print("[PASS] Test 4: Lớp Filament Admin EcosystemAdsHub đã được đăng ký thành công vào SaaS /admin.")
            passed += 1
        else:
            print(f"[FAIL] Test 4: Không tìm thấy lớp EcosystemAdsHub: {proc.stdout}")
    except Exception as e:
        print(f"[FAIL] Test 4: Lỗi kiểm tra class: {e}")

    # Test 5: Kiểm tra cách ly phân quyền (Tenant Workspace không có quyền thấy module này)
    total += 1
    try:
        tinker_cmd = (
            '$appPages = array_keys(Filament\\Facades\\Filament::getPanel("app")->getPages()); '
            'echo in_array("App\\\\Filament\\\\Admin\\\\Pages\\\\EcosystemAdsHub", $appPages) ? "LEAKED" : "ISOLATED";'
        )
        proc = subprocess.run([
            'php', 'artisan', 'tinker', '--execute', tinker_cmd
        ], capture_output=True, text=True, cwd="C:\\laragon\\www\\kaolawork")
        if "ISOLATED" in proc.stdout:
            print("[PASS] Test 5: Xác nhận cách ly 100%: Tenant Panel (/app/{tenant}) không thể thấy trang quản trị này.")
            passed += 1
        else:
            print(f"[FAIL] Test 5: Rò rỉ trang vào tenant panel: {proc.stdout}")
    except Exception as e:
        print(f"[FAIL] Test 5: Lỗi kiểm tra cách ly: {e}")

    print("\n--------------------------------------------------")
    print(f"KẾT QUẢ: ĐÃ VƯỢT QUA {passed}/{total} BÀI KIỂM THỬ.")
    print("--------------------------------------------------")
    return passed == total

if __name__ == "__main__":
    success = run_tests()
    sys.exit(0 if success else 1)
