import os
import sys
import json
import shutil

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
APP_DIR = os.path.join(BASE_DIR, "app")
from license_issuer import get_current_machine_hwid

def sync():
    hwid = get_current_machine_hwid()
    hwid_file = os.path.join(APP_DIR, "hwid.json")
    with open(hwid_file, "w", encoding="utf-8") as f:
        json.dump({"hwid": hwid}, f, indent=2)
    print(f"[SYNC] Đã cập nhật HWID máy ({hwid}) vào {hwid_file}")

    # Copy license.lic nếu có
    src_lic = os.path.join(BASE_DIR, "license.lic")
    dst_lic = os.path.join(APP_DIR, "license.lic")
    if os.path.exists(src_lic):
        shutil.copy2(src_lic, dst_lic)
        print(f"[SYNC] Đã đồng bộ {src_lic} sang {dst_lic}")

if __name__ == "__main__":
    sync()
