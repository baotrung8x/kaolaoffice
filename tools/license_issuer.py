import os
import sys
import json
import base64
import hashlib
import time
import subprocess
from datetime import datetime, timedelta

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')
if hasattr(sys.stderr, 'reconfigure'):
    sys.stderr.reconfigure(encoding='utf-8')

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
KEYS_DIR = os.path.join(BASE_DIR, "keys")
PRIVATE_KEY_PATH = os.path.join(KEYS_DIR, "kaola_private.pem")
PUBLIC_KEY_PATH = os.path.join(KEYS_DIR, "kaola_public.pem")

def ensure_keys():
    os.makedirs(KEYS_DIR, exist_ok=True)
    if not os.path.exists(PRIVATE_KEY_PATH) or not os.path.exists(PUBLIC_KEY_PATH):
        print("Generating RSA 2048-bit keypair for Kaola Office...")
        # Try using python cryptography, fallback to openssl or pure python
        try:
            from cryptography.hazmat.primitives.asymmetric import rsa
            from cryptography.hazmat.primitives import serialization
            
            key = rsa.generate_private_key(public_exponent=65537, key_size=2048)
            private_pem = key.private_bytes(
                encoding=serialization.Encoding.PEM,
                format=serialization.PrivateFormat.PKCS8,
                encryption_algorithm=serialization.NoEncryption()
            )
            public_pem = key.public_key().public_bytes(
                encoding=serialization.Encoding.PEM,
                format=serialization.PublicFormat.SubjectPublicKeyInfo
            )
            with open(PRIVATE_KEY_PATH, "wb") as f:
                f.write(private_pem)
            with open(PUBLIC_KEY_PATH, "wb") as f:
                f.write(public_pem)
            print(f"Generated keys successfully:\n- {PRIVATE_KEY_PATH}\n- {PUBLIC_KEY_PATH}")
        except ImportError:
            # Fallback to OpenSSL or PowerShell certutil/openssl
            print("Python cryptography package not found. Attempting OpenSSL or PowerShell...")
            try:
                subprocess.run(f'openssl genrsa -out "{PRIVATE_KEY_PATH}" 2048', shell=True, check=True)
                subprocess.run(f'openssl rsa -in "{PRIVATE_KEY_PATH}" -pubout -out "{PUBLIC_KEY_PATH}"', shell=True, check=True)
                print("Generated keys using OpenSSL successfully.")
            except Exception as e:
                print(f"Please install cryptography (`pip install cryptography`) or openssl. Error: {e}")
                sys.exit(1)

def get_current_machine_hwid():
    """Lấy Hardware ID duy nhất của máy tính Windows hiện tại"""
    try:
        # Lấy UUID Mainboard
        cmd_uuid = 'powershell -NoProfile -Command "(Get-CimInstance Win32_ComputerSystemProduct).UUID"'
        uuid_str = subprocess.check_output(cmd_uuid, shell=True).decode('utf-8').strip()
        
        # Lấy CPU ID
        cmd_cpu = 'powershell -NoProfile -Command "(Get-CimInstance Win32_Processor).ProcessorId"'
        cpu_str = subprocess.check_output(cmd_cpu, shell=True).decode('utf-8').strip()

        raw_str = f"KAOLA_HWID_{uuid_str}_{cpu_str}".upper()
        h = hashlib.sha256(raw_str.encode('utf-8')).hexdigest().upper()
        
        # Định dạng chuẩn: KL-XXXX-XXXX-XXXX-XXXX
        hwid = f"KL-{h[0:4]}-{h[4:8]}-{h[8:12]}-{h[12:16]}"
        return hwid
    except Exception as e:
        print(f"Error getting HWID: {e}")
        return "KL-0000-0000-0000-0000"

def issue_license(customer_name, hwid, days_valid=365, license_type="enterprise", output_path=None):
    ensure_keys()
    
    now = datetime.now()
    expire_date = now + timedelta(days=days_valid)
    
    payload = {
        "issuer": "Kaola Office License Authority",
        "customer": customer_name,
        "hwid": hwid,
        "type": license_type,
        "issued_at": now.strftime("%Y-%m-%d %H:%M:%S"),
        "expires_at": expire_date.strftime("%Y-%m-%d %H:%M:%S"),
        "features": ["document", "spreadsheet", "presentation", "pdf", "unlimited_save", "enterprise_watermark"]
    }
    
    payload_json = json.dumps(payload, sort_keys=True, separators=(',', ':'))
    payload_bytes = payload_json.encode('utf-8')
    
    # Ký số payload bằng Private Key (SHA256withRSA)
    from cryptography.hazmat.primitives.asymmetric import padding
    from cryptography.hazmat.primitives import hashes, serialization
    
    with open(PRIVATE_KEY_PATH, "rb") as f:
        private_key = serialization.load_pem_private_key(f.read(), password=None)
        
    signature = private_key.sign(
        payload_bytes,
        padding.PKCS1v15(),
        hashes.SHA256()
    )
    
    # Đóng gói Token: Base64(payload) . Base64(signature)
    token = {
        "payload": base64.b64encode(payload_bytes).decode('ascii'),
        "signature": base64.b64encode(signature).decode('ascii')
    }
    
    token_str = json.dumps(token, indent=2)
    
    if not output_path:
        output_path = os.path.join(BASE_DIR, "license.lic")
        
    with open(output_path, "w", encoding="utf-8") as f:
        f.write(token_str)
        
    print(f"\n--- LICENSE ISSUED SUCCESSFULLY ---")
    print(f"Customer   : {customer_name}")
    print(f"HWID       : {hwid}")
    print(f"Type       : {license_type}")
    print(f"Expires At : {payload['expires_at']} ({days_valid} days)")
    print(f"File Saved : {output_path}")
    print(f"-----------------------------------\n")
    return output_path

def verify_license(lic_path, expected_hwid=None):
    ensure_keys()
    with open(lic_path, "r", encoding="utf-8") as f:
        token = json.load(f)
        
    payload_bytes = base64.b64decode(token["payload"])
    signature = base64.b64decode(token["signature"])
    
    from cryptography.hazmat.primitives.asymmetric import padding
    from cryptography.hazmat.primitives import hashes, serialization
    
    with open(PUBLIC_KEY_PATH, "rb") as f:
        public_key = serialization.load_pem_public_key(f.read())
        
    try:
        public_key.verify(
            signature,
            payload_bytes,
            padding.PKCS1v15(),
            hashes.SHA256()
        )
        print("[VERIFICATION] Chữ ký số RSA HỢP LỆ!")
    except Exception as e:
        print(f"[VERIFICATION FAILED] Chữ ký số KHÔNG HỢP LỆ! (Dữ liệu đã bị can thiệp trái phép): {e}")
        return False
        
    payload = json.loads(payload_bytes.decode('utf-8'))
    print(f"[DATA] Customer: {payload.get('customer')}")
    print(f"[DATA] HWID: {payload.get('hwid')}")
    print(f"[DATA] Expires: {payload.get('expires_at')}")
    
    # Kiểm tra hạn sử dụng
    expire_dt = datetime.strptime(payload.get('expires_at'), "%Y-%m-%d %H:%M:%S")
    if datetime.now() > expire_dt:
        print("[VERIFICATION FAILED] Bản quyền ĐÃ HẾT HẠN!")
        return False
        
    # Kiểm tra HWID
    if expected_hwid and payload.get('hwid') != expected_hwid:
        print(f"[VERIFICATION FAILED] HWID không khớp! License cho {payload.get('hwid')}, máy hiện tại là {expected_hwid}")
        return False
        
    print("[VERIFICATION SUCCESS] Bản quyền hoàn toàn HỢP LỆ cho thiết bị này!")
    return True

if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1] == "hwid":
        print(get_current_machine_hwid())
    elif len(sys.argv) > 1 and sys.argv[1] == "verify":
        lic_file = sys.argv[2] if len(sys.argv) > 2 else os.path.join(BASE_DIR, "license.lic")
        my_hwid = get_current_machine_hwid()
        verify_license(lic_file, my_hwid)
    else:
        # Default: Sinh license test cho chính máy tính này
        my_hwid = get_current_machine_hwid()
        print(f"Current Machine HWID: {my_hwid}")
        cust = sys.argv[1] if len(sys.argv) > 1 else "DOANH NGHIEP DEMO - KAOLA OFFICE"
        issue_license(cust, my_hwid, days_valid=365)
