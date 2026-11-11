import os
import sys
import io
import base64
from PIL import Image

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
APP_DIR = os.path.join(BASE_DIR, "app")
EDITORS_EXE = os.path.join(APP_DIR, "editors.exe")
ICON_PNG = os.path.join(BASE_DIR, "icon.png")

def make_svg(target_len, b64_data):
    header = '<svg width="15px" height="15px" viewBox="0 0 32 32" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">\n  <image width="32" height="32" xlink:href="data:image/png;base64,'
    middle = '" href="data:image/png;base64,' + b64_data + '"/>\n  <!-- '
    footer = ' -->\n</svg>'
    
    current = header + b64_data + middle + footer
    needed_pad = target_len - len(current.encode('utf-8'))
    if needed_pad < 0:
        raise ValueError(f"SVG too large by {-needed_pad} bytes!")
    
    pad_str = ' ' * needed_pad
    result = header + b64_data + middle + pad_str + footer
    result_bytes = result.encode('utf-8')
    assert len(result_bytes) == target_len, f"Expected {target_len}, got {len(result_bytes)}"
    return result_bytes

def patch_icons():
    print("--- 1. TẠO DỮ LIỆU ICON 32x32 CHUẨN ---")
    im = Image.open(ICON_PNG)
    im32 = im.resize((32, 32), Image.Resampling.LANCZOS)
    im32_p = im32.quantize(colors=32, method=2)
    buf = io.BytesIO()
    im32_p.save(buf, format='PNG', optimize=True)
    b64_data = base64.b64encode(buf.getvalue()).decode('ascii')
    print(f"Base64 length: {len(b64_data)} chars")

    with open(EDITORS_EXE, 'rb') as f:
        data = bytearray(f.read())

    # Range for portal.svg: 0x1d7ab9 to 0x1d89ec (3891 bytes)
    s1, e1 = 0x1d7ab9, 0x1d89ec
    len1 = e1 - s1
    svg1 = make_svg(len1, b64_data)
    data[s1:e1] = svg1
    print(f"[OK] Đã vá portal.svg ({len1} bytes) tại 0x{s1:x}")

    # Range for portal_light.svg: 0x1d917a to 0x1da098 (3870 bytes)
    s2, e2 = 0x1d917a, 0x1da098
    len2 = e2 - s2
    svg2 = make_svg(len2, b64_data)
    data[s2:e2] = svg2
    print(f"[OK] Đã vá portal_light.svg ({len2} bytes) tại 0x{s2:x}")

    with open(EDITORS_EXE, 'wb') as f:
        f.write(data)
    print("[SUCCESS] Đã lưu editors.exe thành công!")

if __name__ == "__main__":
    patch_icons()
