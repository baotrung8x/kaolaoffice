#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Kiểm thử tính năng đồng bộ thời gian thực (Real-time Sync) giữa SaaS và App Client
"""

import json
import sys
import time
import urllib.request

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

BASE_URL = "http://kaolawork.test"

def test_realtime_sync():
    total = 0
    passed = 0

    print("==================================================")
    print("   KIỂM THỬ ĐỒNG BỘ QUẢNG CÁO REAL-TIME SAAS -> APP")
    print("==================================================")

    # 1. Lấy thông tin ad hiện tại
    total += 1
    init_url = f"{BASE_URL}/api/v1/office/init?_t={int(time.time()*1000)}"
    req = urllib.request.Request(init_url, headers={'Cache-Control': 'no-cache'})
    with urllib.request.urlopen(req) as resp:
        original_data = json.loads(resp.read().decode('utf-8'))
    original_title = original_data['ad']['title']
    print(f"[INFO] Tiêu đề quảng cáo ban đầu: '{original_title}'")
    passed += 1

    # 2. Giả lập Admin trên SaaS cập nhật mẫu quảng cáo mới
    total += 1
    test_id = f"ad_promo_test_{int(time.time())}"
    new_title = f"SIÊU ƯU ĐÃI TEST REALTIME [{int(time.time())}]"
    payload = {
        'ad': {
            'id': test_id,
            'badge': 'KHUYẾN MÃI NÓNG',
            'icon': '🔥',
            'title': new_title,
            'desc': 'Chương trình ưu đãi vừa được cập nhật trực tiếp từ SaaS.',
            'ctaText': 'Nhận quà ngay',
            'ctaUrl': 'https://kaola.vn/khuyen-mai-moi',
            'active': True
        }
    }
    raw_payload = json.dumps(payload).encode('utf-8')
    post_req = urllib.request.Request(
        f"{BASE_URL}/api/v1/office/config",
        data=raw_payload,
        headers={'Content-Type': 'application/json', 'Accept': 'application/json'}
    )
    with urllib.request.urlopen(post_req) as resp:
        post_res = json.loads(resp.read().decode('utf-8'))
    
    if post_res.get('status') == 'success':
        print(f"[PASS] Test 2: Admin đã lưu thành công mẫu quảng cáo mới trên SaaS: '{new_title}'")
        passed += 1
    else:
        print(f"[FAIL] Test 2: Lưu trên SaaS thất bại: {post_res}")

    # 3. Giả lập App Client tự động kiểm tra (nhịp tim / window focus / polling)
    total += 1
    client_check_url = f"{BASE_URL}/api/v1/office/init?v=1.0.0&device_id=test_realtime_dev&os=Windows&_t={int(time.time()*1000)}"
    client_req = urllib.request.Request(
        client_check_url, 
        headers={
            'Cache-Control': 'no-cache, no-store',
            'Pragma': 'no-cache',
            'User-Agent': 'KaolaOffice/1.0'
        }
    )
    with urllib.request.urlopen(client_req) as resp:
        # Kiểm tra headers phản hồi có no-store không
        cache_control = resp.headers.get('Cache-Control', '')
        client_data = json.loads(resp.read().decode('utf-8'))
    
    received_title = client_data.get('ad', {}).get('title', '')
    has_no_store = 'no-store' in cache_control and 'no-cache' in cache_control

    if received_title == new_title and has_no_store:
        print(f"[PASS] Test 3: App Client nhận ngay mẫu mới tức thì: '{received_title}' (Cache-Control: {cache_control}).")
        passed += 1
    else:
        print(f"[FAIL] Test 3: Tiêu đề nhận được không khớp ('{received_title}' vs '{new_title}') hoặc thiếu header no-store.")

    # 4. Khôi phục lại mẫu quảng cáo chuẩn
    restore_payload = {
        'ad': {
            'id': 'ad_bank_enterprise_01',
            'badge': 'ƯU ĐÃI DOANH NGHIỆP',
            'icon': '🏦',
            'title': 'Tài khoản Doanh nghiệp Số đẹp — Miễn 100% phí chuyển tiền',
            'desc': 'Mở tài khoản thanh toán online trong 5 phút. Tặng gói tín dụng ưu đãi độc quyền cho khách hàng Kaola Office.',
            'ctaText': 'Xem ưu đãi',
            'ctaUrl': 'https://kaola.vn/partners/promo',
            'active': True
        }
    }
    restore_req = urllib.request.Request(
        f"{BASE_URL}/api/v1/office/config",
        data=json.dumps(restore_payload).encode('utf-8'),
        headers={'Content-Type': 'application/json', 'Accept': 'application/json'}
    )
    with urllib.request.urlopen(restore_req) as resp:
        restore_res = json.loads(resp.read().decode('utf-8'))
    print(f"[INFO] Đã khôi phục lại mẫu quảng cáo chuẩn ban đầu.")

    print("\n--------------------------------------------------")
    print(f"KẾT QUẢ: ĐÃ VƯỢT QUA {passed}/{total} BÀI KIỂM THỬ.")
    print("--------------------------------------------------")
    return passed == total

if __name__ == "__main__":
    success = test_realtime_sync()
    sys.exit(0 if success else 1)
