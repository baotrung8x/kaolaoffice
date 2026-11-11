import os
import sys
import io
import struct
import zlib
from PIL import Image

sys.stdout.reconfigure(encoding='utf-8')

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
APP_DIR = os.path.join(BASE_DIR, 'app')
EDITORS_EXE = os.path.join(APP_DIR, 'editors.exe')
DESKTOP_EXE = os.path.join(APP_DIR, 'DesktopEditors.exe')
KAOLA_EXE = os.path.join(APP_DIR, 'KaolaOffice.exe')
RCEDIT_EXE = os.path.join(BASE_DIR, 'tools', 'rcedit-x64.exe')
ICON_PNG = os.path.join(BASE_DIR, 'icon.png')

def make_dib_entry(img):
    w, h = img.size
    img = img.convert('RGBA')
    xor_data = bytearray()
    for y in range(h - 1, -1, -1):
        for x in range(w):
            r, g, b, a = img.getpixel((x, y))
            xor_data.extend([b, g, r, a])
    row_bytes = (w + 31) // 32 * 4
    and_data = bytearray(row_bytes * h)
    for y in range(h):
        inv_y = h - 1 - y
        for x in range(w):
            r, g, b, a = img.getpixel((x, inv_y))
            if a == 0:
                byte_idx = y * row_bytes + (x // 8)
                bit_idx = 7 - (x % 8)
                and_data[byte_idx] |= (1 << bit_idx)
    biSize = 40
    biWidth = w
    biHeight = h * 2
    header = struct.pack('<IIIHHIIIIII', biSize, biWidth, biHeight, 1, 32, 0, len(xor_data)+len(and_data), 0, 0, 0, 0)
    return header + xor_data + and_data

def build_kaola_hybrid_ico():
    src = Image.open(ICON_PNG)
    src256 = src.resize((256, 256), Image.Resampling.LANCZOS)
    dib_sizes = [16, 20, 24, 32, 40, 48]
    png_sizes = [64, 128, 256]
    all_sizes = dib_sizes + png_sizes
    images = []
    for s in all_sizes:
        r = src256.resize((s, s), Image.Resampling.LANCZOS)
        if s in dib_sizes:
            r = r.quantize(colors=48, method=2).convert('RGBA')
            images.append(make_dib_entry(r))
        else:
            r_p = r.quantize(colors=48, method=2)
            b = io.BytesIO()
            r_p.save(b, format='PNG', optimize=True)
            images.append(b.getvalue())
    count = len(all_sizes)
    header = struct.pack('<HHH', 0, 1, count)
    dir_entries = bytearray()
    offset = 6 + count * 16
    for i, s in enumerate(all_sizes):
        img_bytes = images[i]
        w = 0 if s == 256 else s
        h = 0 if s == 256 else s
        sz = len(img_bytes)
        dir_entries.extend(struct.pack('<BBBBHHII', w, h, 0, 0, 1, 32, sz, offset))
        offset += sz
    return header + dir_entries + b''.join(images)

def generate_standalone_ico():
    print('--- 1. TẠO CÁC FILE .ICO ĐỘ PHÂN GIẢI CAO (16 - 256px) ---')
    src = Image.open(ICON_PNG).convert('RGBA')
    ico_targets = [
        os.path.join(APP_DIR, 'app.ico'),
        os.path.join(APP_DIR, 'icon.ico'),
        os.path.join(BASE_DIR, 'icon.ico'),
    ]
    sizes = [(16, 16), (20, 20), (24, 24), (32, 32), (40, 40), (48, 48), (64, 64), (128, 128), (256, 256)]
    for target in ico_targets:
        src.save(target, format='ICO', sizes=sizes)
        print(f'[OK] Đã tạo {os.path.relpath(target, BASE_DIR)} ({os.path.getsize(target):,} bytes)')

    # Cập nhật favicon.ico cho các editor web-apps
    fav_sizes = [(16, 16), (32, 32), (48, 48)]
    apps_dir = os.path.join(APP_DIR, 'editors', 'web-apps', 'apps')
    for root, dirs, files in os.walk(apps_dir):
        if 'favicon.ico' in files:
            fav_path = os.path.join(root, 'favicon.ico')
            src.save(fav_path, format='ICO', sizes=fav_sizes)
            print(f'[OK] Đã cập nhật favicon.ico tại {os.path.relpath(fav_path, BASE_DIR)}')

def patch_editors_app_icon():
    print('\n--- 2. VÁ TÀI NGUYÊN :/app.ico TRONG EDITORS.EXE ---')
    with open(EDITORS_EXE, 'rb') as f:
        data = bytearray(f.read())
    full_ico = build_kaola_hybrid_ico()
    print('Kaola ICO size:', len(full_ico), 'bytes')
    comp = zlib.compress(full_ico, level=9)
    payload = struct.pack('>I', len(full_ico)) + comp
    payload_len = len(payload)
    print('Payload zlib size:', payload_len, 'bytes')
    start_off = 0xdb6b5
    next_res_off = 0xdf59b
    max_payload_len = next_res_off - start_off - 4
    assert payload_len <= max_payload_len, f'Payload too large: {payload_len} > {max_payload_len}'
    data[start_off : start_off + 4] = struct.pack('>I', payload_len)
    data[start_off + 4 : start_off + 4 + payload_len] = payload
    pad_len = max_payload_len - payload_len
    data[start_off + 4 + payload_len : next_res_off] = b'\x00' * pad_len
    print('[OK] Patched :/app.ico at', hex(start_off), f'payload={payload_len}, pad={pad_len}')
    
    old_appid = 'ASC.Documents.5\x00'.encode('utf-16le')
    new_appid = 'Kaola.Office.v1\x00'.encode('utf-16le')
    assert len(old_appid) == len(new_appid) == 32, f'appid len: {len(old_appid)} vs {len(new_appid)}'
    
    old_lnk = '\\ONLYOFFICE.lnk\x00'.encode('utf-16le')
    new_lnk = '\\Kaola_Desk.lnk\x00'.encode('utf-16le')
    assert len(old_lnk) == len(new_lnk) == 32, f'lnk len: {len(old_lnk)} vs {len(new_lnk)}'
    
    if data[0xd1808 : 0xd1808 + 32] == old_appid:
        data[0xd1808 : 0xd1808 + 32] = new_appid
        print('[OK] Replaced AppUserModelID at 0xd1808 -> Kaola.Office.v1')
    elif data[0xd1808 : 0xd1808 + 32] == new_appid:
        print('[SKIP] AppUserModelID at 0xd1808 already Kaola.Office.v1')
    else:
        print('[WARN] AppUserModelID at 0xd1808 did not match')
        
    if data[0xd1828 : 0xd1828 + 32] == old_lnk:
        data[0xd1828 : 0xd1828 + 32] = new_lnk
        print('[OK] Replaced shortcut name at 0xd1828 -> \\Kaola_Desk.lnk')
    elif data[0xd1828 : 0xd1828 + 32] == new_lnk:
        print('[SKIP] Shortcut name at 0xd1828 already \\Kaola_Desk.lnk')
    else:
        print('[WARN] Shortcut name at 0xd1828 did not match')
        
    with open(EDITORS_EXE, 'wb') as f:
        f.write(data)
    print('[SUCCESS] Saved editors.exe successfully!')

def patch_desktop_editors():
    print('\n--- 3. VÁ APPUSERMODELID TRONG LAUNCHER EXEs ---')
    old_appid = 'ASC.Documents.5\x00'.encode('utf-16le')
    new_appid = 'Kaola.Office.v1\x00'.encode('utf-16le')
    for exe in [DESKTOP_EXE, KAOLA_EXE]:
        if not os.path.exists(exe):
            continue
        with open(exe, 'rb') as f:
            data = bytearray(f.read())
        idx = data.find(old_appid)
        if idx != -1:
            data[idx : idx + 32] = new_appid
            print(f'[OK] Replaced AppUserModelID in {os.path.basename(exe)} at {hex(idx)} -> Kaola.Office.v1')
        else:
            idx2 = data.find(new_appid)
            if idx2 != -1:
                print(f'[SKIP] {os.path.basename(exe)} already Kaola.Office.v1 at {hex(idx2)}')
            else:
                print(f'[WARN] AppUserModelID not found in {os.path.basename(exe)}')
        with open(exe, 'wb') as f:
            f.write(data)
        print(f'[SUCCESS] Saved {os.path.basename(exe)} successfully!')

def patch_pe_icons():
    print('\n--- 4. VÁ RESOURCE ICON (PE) CHO CÁC FILE THỰC THI BẰNG RCEDIT ---')
    import subprocess
    app_ico = os.path.join(APP_DIR, 'app.ico')
    for exe in [EDITORS_EXE, DESKTOP_EXE, KAOLA_EXE]:
        if os.path.exists(exe):
            cmd = [RCEDIT_EXE, exe, '--set-icon', app_ico]
            res = subprocess.run(cmd, capture_output=True, text=True)
            if res.returncode == 0:
                print(f'[OK] Đã gán PE icon mới cho {os.path.basename(exe)}')
            else:
                print(f'[ERROR] rcedit thất bại trên {os.path.basename(exe)}: {res.stderr}')

if __name__ == '__main__':
    generate_standalone_ico()
    patch_editors_app_icon()
    patch_desktop_editors()
    patch_pe_icons()
