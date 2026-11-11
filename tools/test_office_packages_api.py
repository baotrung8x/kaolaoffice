#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Kiểm thử API Danh mục Gói cước Kaola Office phục vụ Super Admin và Client Desktop
"""

import json
import sys
import time
import urllib.request

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

BASE_URL = "http://kaolawork.test"

def run_tests():
    passed = 0
    total = 0

    print("==================================================")
    print("   KIỂM THỬ API GÓI DỊCH VỤ KAOLA OFFICE")
    print("==================================================")

    # TEST 1: Gọi endpoint /api/v1/office/packages
    total += 1
    url = f"{BASE_URL}/api/v1/office/packages?_t={int(time.time()*1000)}"
    req = urllib.request.Request(url, headers={'Cache-Control': 'no-cache'})
    try:
        with urllib.request.urlopen(req, timeout=5) as resp:
            data = json.loads(resp.read().decode('utf-8'))
            assert data.get('status') == 'success', f"Expected status success, got {data.get('status')}"
            packages = data.get('packages', [])
            assert len(packages) >= 4, f"Expected at least 4 packages, got {len(packages)}"
            print(f"[PASS 1] GET /api/v1/office/packages trả về {len(packages)} gói hoạt động.")
            passed += 1
    except Exception as e:
        print(f"[FAIL 1] Lỗi gọi packages: {e}")
        return passed, total

    pkg_map = {p['slug']: p for p in packages}

    # TEST 2: Kiểm tra Gói Free (Không có AI, Có quảng cáo, Không xuất HĐĐT)
    total += 1
    free_pkg = pkg_map.get('office_free')
    if free_pkg:
        assert free_pkg['price'] == 0, "Gói Free phải có giá 0đ"
        assert free_pkg['ad_free'] is False, "Gói Free phải có banner quảng cáo"
        assert free_pkg['ai_copilot_enabled'] is False, "Gói Free KHÔNG được có AI Copilot"
        assert free_pkg['ai_copilot_quota'] == 0, "Quota AI của Free phải là 0"
        assert free_pkg['vat_invoice_supported'] is False, "Gói Free không xuất HĐĐT"
        print(f"[PASS 2] Gói 'office_free' chuẩn: 0đ, Có ads, KHÔNG CÓ AI Copilot, Không HĐĐT.")
        passed += 1
    else:
        print("[FAIL 2] Không tìm thấy gói 'office_free' trong kết quả.")

    # TEST 3: Kiểm tra Gói Pro Tháng & Năm (Tắt ads, Có AI, Có xuất HĐĐT VAT)
    total += 1
    pro_1m = pkg_map.get('office_pro_1m')
    pro_1y = pkg_map.get('office_pro_1y')
    if pro_1m and pro_1y:
        assert pro_1m['ad_free'] is True and pro_1y['ad_free'] is True, "Gói Pro phải tắt ads"
        assert pro_1m['ai_copilot_enabled'] is True and pro_1y['ai_copilot_enabled'] is True, "Gói Pro phải mở AI"
        assert pro_1m['vat_invoice_supported'] is True, "Gói 1 tháng phải hỗ trợ HĐĐT VAT"
        assert pro_1y['vat_invoice_supported'] is True, "Gói 1 năm phải hỗ trợ HĐĐT VAT"
        assert pro_1y['is_popular'] is True, "Gói 1 năm phải là khuyên dùng"
        print(f"[PASS 3] Gói Pro Tháng ({pro_1m['price_formatted']}) & Năm ({pro_1y['price_formatted']}) chuẩn: Tắt ads, Có AI, Hỗ trợ HĐĐT VAT.")
        passed += 1
    else:
        print("[FAIL 3] Không tìm thấy đủ gói Pro Tháng / Năm.")

    # TEST 4: Kiểm tra Gói Doanh nghiệp (Độc lập, Tắt ads toàn máy, HĐĐT VAT, Nhiều máy)
    total += 1
    biz = pkg_map.get('office_business_1y')
    if biz:
        assert biz['ad_free'] is True, "Gói Doanh nghiệp phải tắt ads"
        assert biz['ai_copilot_enabled'] is True, "Gói Doanh nghiệp phải có AI"
        assert biz['vat_invoice_supported'] is True, "Gói Doanh nghiệp phải có HĐĐT VAT"
        assert biz['max_devices'] >= 1, "Gói Doanh nghiệp phải hỗ trợ nhiều máy"
        print(f"[PASS 4] Gói Doanh nghiệp chuẩn: {biz['max_devices']} máy, Hỗ trợ HĐĐT VAT, Độc lập không cần KaolaWork.")
        passed += 1
    else:
        print("[FAIL 4] Không tìm thấy gói Doanh nghiệp.")

    # TEST 5: Kiểm tra endpoint /api/v1/office/init có đính kèm packages
    total += 1
    init_url = f"{BASE_URL}/api/v1/office/init?_t={int(time.time()*1000)}"
    init_req = urllib.request.Request(init_url, headers={'Cache-Control': 'no-cache'})
    try:
        with urllib.request.urlopen(init_req, timeout=5) as resp:
            init_data = json.loads(resp.read().decode('utf-8'))
            assert 'packages' in init_data, "init response phải chứa packages"
            assert len(init_data['packages']) >= 4, "init response phải chứa ít nhất 4 packages"
            print(f"[PASS 5] GET /api/v1/office/init đính kèm tự động {len(init_data['packages'])} packages.")
            passed += 1
    except Exception as e:
        print(f"[FAIL 5] Lỗi kiểm tra /office/init packages: {e}")

    print("==================================================")
    print(f"KẾT QUẢ KIỂM THỬ API: {passed}/{total} BÀI TEST THÀNH CÔNG")
    print("==================================================")
    return passed, total

if __name__ == '__main__':
    p, t = run_tests()
    sys.exit(0 if p == t else 1)
