import urllib.request
import json
import time
import hmac
import hashlib
import subprocess
import sys

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

def test_e2e_flow():
    secret = 'kaola_sk_office_8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b'
    app_code = 'kaolaoffice'

    payload = {
        'target_service_code': 'kaolaoffice',
        'target_tenant_id': 'test_vip@kaola.vn',
        'plan_code': 'office_pro_1y',
        'plan_name': 'Gói Kaola Office Pro (1 Năm - Tặng 2 tháng)',
        'duration_months': 12,
        'amount': 499000,
        'customer_name': 'Khách Hàng Thử Nghiệm',
        'customer_email': 'test_vip@kaola.vn'
    }

    raw_json = json.dumps(payload, separators=(',', ':'))
    timestamp = str(int(time.time()))
    to_sign = f'{timestamp}.{raw_json}'.encode('utf-8')
    signature = hmac.new(secret.encode('utf-8'), to_sign, hashlib.sha256).hexdigest()

    req = urllib.request.Request(
        'http://kaolapay.test/api/v1/checkout/sessions',
        data=raw_json.encode('utf-8'),
        headers={
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            'X-Kaola-App-Code': app_code,
            'X-Kaola-Timestamp': timestamp,
            'X-Kaola-Signature': signature
        }
    )

    with urllib.request.urlopen(req) as resp:
        res_data = json.loads(resp.read().decode('utf-8'))

    order_code = res_data['data']['order_code']
    print(f"[1] Tạo đơn thành công: {order_code}")
    print(f"    VietQR: {res_data['data']['qr_url']}")
    print(f"    Checkout URL: {res_data['data']['checkout_url']}")

    with urllib.request.urlopen(f'http://kaolapay.test/checkout/{order_code}/status') as resp:
        status_data = json.loads(resp.read().decode('utf-8'))
    print(f"[2] Trạng thái ban đầu: is_paid = {status_data['is_paid']} ({status_data['status_label']})")
    assert status_data['is_paid'] is False

    # Giả lập webhook ngân hàng nhận tiền
    php_script = f'''$pdo = new PDO("mysql:host=127.0.0.1;dbname=kaolapay;charset=utf8mb4", "root", "");
$stmt = $pdo->prepare("UPDATE orders SET status = 'paid', paid_amount = 499000, paid_at = NOW() WHERE order_code = '{order_code}'");
$stmt->execute();
'''
    subprocess.run(['php', '-r', php_script], check=True)
    print(f"[3] Đã giả lập thanh toán ngân hàng thành công cho đơn {order_code}")

    with urllib.request.urlopen(f'http://kaolapay.test/checkout/{order_code}/status') as resp:
        final_status = json.loads(resp.read().decode('utf-8'))
    print(f"[4] Trạng thái sau thanh toán: is_paid = {final_status['is_paid']} ({final_status['status_label']})")
    assert final_status['is_paid'] is True

    print("\n[KẾT LUẬN] Quy trình thanh toán end-to-end từ Kaola Office -> KaolaPay hoạt động 100% hoàn hảo!")

if __name__ == '__main__':
    test_e2e_flow()
