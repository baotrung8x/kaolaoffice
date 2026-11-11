import urllib.request
import json
import os
import sys

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

API_URL = "http://kaolawork.test/api/v1/office/init"
CONFIG_FILE = "C:/laragon/www/kaolawork/storage/app/office_config.json"

def test_api_sync():
    print("==================================================")
    print("   KIỂM THỬ ĐỒNG BỘ QUẢNG CÁO & DÒ PHIÊN BẢN MỚI   ")
    print("==================================================")

    # 1. Test kết nối API
    req = urllib.request.Request(API_URL, headers={"User-Agent": "KaolaOffice/1.0.0"})
    with urllib.request.urlopen(req, timeout=5) as response:
        assert response.status == 200, f"HTTP Status: {response.status}"
        data = json.loads(response.read().decode('utf-8'))

    print("[PASS] 1. API GET /api/v1/office/init trả về HTTP 200 OK.")
    assert "ad" in data, "Thiếu trường 'ad'"
    assert "update" in data, "Thiếu trường 'update'"
    print(f"       -> Ad Title: {data['ad']['title']}")
    print(f"       -> Ad Badge: {data['ad']['badge']}")
    print(f"       -> Latest Version: {data['update']['latest_version']}")
    print(f"       -> Download URL: {data['update']['download_url']}")

    # 2. Test quản lý file cấu hình
    assert os.path.exists(CONFIG_FILE), "File office_config.json không tồn tại"
    print(f"[PASS] 2. File cấu hình máy chủ tồn tại tại: {CONFIG_FILE}")

    # 3. Test logic so sánh phiên bản
    def compare_version(v1, v2):
        p1 = [int(x) for x in v1.replace('v', '').split('.')]
        p2 = [int(x) for x in v2.replace('v', '').split('.')]
        for i in range(max(len(p1), len(p2))):
            n1 = p1[i] if i < len(p1) else 0
            n2 = p2[i] if i < len(p2) else 0
            if n1 > n2: return 1
            if n1 < n2: return -1
        return 0

    assert compare_version("1.0.1", "1.0.0") == 1
    assert compare_version("1.0.0", "1.0.0") == 0
    assert compare_version("0.9.9", "1.0.0") == -1
    print("[PASS] 3. Thuật toán so khớp phiên bản hoạt động chuẩn xác 100%.")

    # 4. Test trang quản trị
    req_manage = urllib.request.Request("http://kaolawork.test/office/ads/manage")
    with urllib.request.urlopen(req_manage, timeout=5) as response:
        assert response.status == 200, f"HTTP Status: {response.status}"
        html = response.read().decode('utf-8')
        assert "Trung tâm Điều khiển Kaola Office" in html
        assert "Xem trước giao diện" in html
    print("[PASS] 4. Giao diện Quản trị /office/ads/manage tải thành công (HTTP 200).")

    print("\n--------------------------------------------------")
    print("TẤT CẢ CÁC BÀI TEST ĐỒNG BỘ ĐÃ THÀNH CÔNG RỰC RỠ!")
    print("--------------------------------------------------")
    return True

if __name__ == "__main__":
    test_api_sync()
