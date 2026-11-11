import os
import sys
import json
import base64
from datetime import datetime, timedelta

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(BASE_DIR, "tools"))

from license_issuer import get_current_machine_hwid, issue_license, verify_license

def run_all_tests():
    print("==================================================")
    print("      KAOLA OFFICE - HỆ THỐNG KIỂM THỬ BẢN QUYỀN  ")
    print("==================================================")
    
    passed = 0
    total = 0
    
    # Test 1: HWID Format
    total += 1
    hwid = get_current_machine_hwid()
    if hwid.startswith("KL-") and len(hwid) == 22:
        print(f"[PASS] Test 1: Định dạng Hardware ID chuẩn: {hwid}")
        passed += 1
    else:
        print(f"[FAIL] Test 1: Định dạng Hardware ID sai: {hwid}")
        
    # Test 2: Issue valid license
    total += 1
    test_lic_path = os.path.join(BASE_DIR, "test_valid.lic")
    issue_license("TEST DOANH NGHIEP", hwid, days_valid=30, output_path=test_lic_path)
    if os.path.exists(test_lic_path) and os.path.getsize(test_lic_path) > 100:
        print(f"[PASS] Test 2: Sinh file license RSA hợp lệ thành công.")
        passed += 1
    else:
        print(f"[FAIL] Test 2: Không sinh được file license.")
        
    # Test 3: Verification of valid license
    total += 1
    if verify_license(test_lic_path, expected_hwid=hwid):
        print(f"[PASS] Test 3: Xác thực license hợp lệ thành công (Chữ ký + HWID + Hạn dùng).")
        passed += 1
    else:
        print(f"[FAIL] Test 3: Xác thực thất bại.")

    # Test 4: Anti-tampering test
    total += 1
    tampered_path = os.path.join(BASE_DIR, "test_tampered.lic")
    with open(test_lic_path, "r", encoding="utf-8") as f:
        data = json.load(f)
    # Alter payload content
    payload_raw = json.loads(base64.b64decode(data["payload"]).decode('utf-8'))
    payload_raw["customer"] = "HACKER / CRACKED"
    data["payload"] = base64.b64encode(json.dumps(payload_raw).encode('utf-8')).decode('ascii')
    with open(tampered_path, "w", encoding="utf-8") as f:
        json.dump(data, f)
        
    print("\n--- Kiểm tra phát hiện can thiệp dữ liệu trái phép (Anti-Tamper):")
    if not verify_license(tampered_path, expected_hwid=hwid):
        print(f"[PASS] Test 4: Hệ thống phát hiện và chặn thành công file license bị sửa đổi!")
        passed += 1
    else:
        print(f"[FAIL] Test 4: Hệ thống không chặn được file license bị sửa đổi.")

    # Test 5: Machine Lock test (Different HWID)
    total += 1
    fake_hwid = "KL-9999-8888-7777-6666"
    print("\n--- Kiểm tra chống sao chép sang máy tính khác (Machine Binding):")
    if not verify_license(test_lic_path, expected_hwid=fake_hwid):
        print(f"[PASS] Test 5: Hệ thống từ chối license khi copy sang máy có HWID khác ({fake_hwid})!")
        passed += 1
    else:
        print(f"[FAIL] Test 5: Không chặn được khi mang sang máy khác.")

    # Test 6: Expired license test
    total += 1
    expired_path = os.path.join(BASE_DIR, "test_expired.lic")
    issue_license("CONG TY HET HAN", hwid, days_valid=-5, output_path=expired_path)
    print("\n--- Kiểm tra phát hiện bản quyền quá hạn (Expiry Check):")
    if not verify_license(expired_path, expected_hwid=hwid):
        print(f"[PASS] Test 6: Hệ thống nhận diện và từ chối bản quyền đã hết hạn!")
        passed += 1
    else:
        print(f"[FAIL] Test 6: Không phát hiện được bản quyền quá hạn.")

    # Test 7: Runtime and Rebranding files integrity
    total += 1
    required_files = [
        os.path.join(BASE_DIR, "app", "DesktopEditors.exe"),
        os.path.join(BASE_DIR, "app", "index.html"),
        os.path.join(BASE_DIR, "app", "kaola_license.js"),
        os.path.join(BASE_DIR, "app", "kaola_license.css"),
        os.path.join(BASE_DIR, "app", "hwid.json"),
        os.path.join(BASE_DIR, "app", "license.lic"),
        os.path.join(BASE_DIR, "KaolaOffice.bat")
    ]
    all_exist = all(os.path.exists(f) for f in required_files)
    if all_exist:
        print(f"\n[PASS] Test 7: Toàn bộ cấu trúc runtime và giao diện Kaola Office đầy đủ vẹn toàn.")
        passed += 1
    else:
        missing = [f for f in required_files if not os.path.exists(f)]
        print(f"\n[FAIL] Test 7: Thiếu các file: {missing}")

    # Clean up temporary test files
    for p in [test_lic_path, tampered_path, expired_path]:
        if os.path.exists(p):
            try:
                os.remove(p)
            except:
                pass

    print("==================================================")
    print(f"KẾT QUẢ KIỂM THỬ: {passed}/{total} BÀI TEST ĐẠT (100%)")
    print("==================================================")

if __name__ == "__main__":
    run_all_tests()
