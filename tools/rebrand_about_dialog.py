import os
import sys

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
APP_DIR = os.path.join(BASE_DIR, "app")
EDITORS_EXE = os.path.join(APP_DIR, "editors.exe")
INDEX_HTML = os.path.join(APP_DIR, "index.html")

def patch_index_html():
    print("--- 1. CẬP NHẬT GIAO DIỆN ABOUT TRONG INDEX.HTML ---")
    with open(INDEX_HTML, "r", encoding="utf-8") as f:
        content = f.read()

    modified = False

    # A. Cập nhật handler nhận thông tin app:version
    target_handler = 'o.arch&&(i+=o.arch),o.pkg&&(i+=` ${o.pkg}`),i.trim()&&(o.version+=` (${i.trim()})`),Zg(o),qg(!0)'
    old_replacement_handler = (
        'o.arch&&(i+=o.arch),o.pkg&&(i+=` ${o.pkg}`),i.trim()&&(o.version+=` (${i.trim()})`),'
        'o.appname="Kaola Office Enterprise",o.rights="© Kaola 2026. All rights reserved.",'
        'o.site="www.kaola.vn",o.link="https://www.kaola.vn",o.commercial=true,o.edition="Bản quyền Doanh nghiệp (www.kaola.vn)",'
        'Zg(o),qg(!0)'
    )
    new_replacement_handler = (
        'o.arch&&(i+=o.arch),o.pkg&&(i+=` ${o.pkg}`),i.trim()&&(o.version+=` (${i.trim()})`),'
        'o.appname="Kaola Office",o.rights="Dựa trên ONLYOFFICE Desktop Editors © Ascensio System SIA (GNU AGPL v3).",'
        'o.site="id.kaola.vn",o.link="https://id.kaola.vn",o.commercial=false,o.edition="Bản phát hành Miễn phí (GNU AGPL v3)",'
        'Zg(o),qg(!0)'
    )
    if target_handler in content:
        content = content.replace(target_handler, new_replacement_handler)
        modified = True
        print("[SUCCESS] Đã cập nhật đối tượng Version trong index.html: Kaola Office & id.kaola.vn")
    elif old_replacement_handler in content:
        content = content.replace(old_replacement_handler, new_replacement_handler)
        modified = True
        print("[SUCCESS] Đã cập nhật từ bản Enterprise cũ sang Kaola Office & id.kaola.vn")
    else:
        print("[SKIP] Handler đã được cập nhật chuẩn Kaola Office.")

    # B. Thay thế logo ONLYOFFICE trong symbol idx-logo thành Kaola Logo
    old_symbol_prefix = '<symbol id="idx-logo" width="52" height="45" viewBox="0 0 52 45" fill="none">'
    new_symbol = (
        '<symbol id="idx-logo" width="52" height="45" viewBox="0 0 52 45">'
        '<image href="kaola_logo.png" width="52" height="45" preserveAspectRatio="xMidYMid meet"/>'
    )
    if old_symbol_prefix in content:
        sym_start = content.find(old_symbol_prefix)
        sym_end = content.find('</symbol>', sym_start)
        if sym_start != -1 and sym_end != -1:
            content = content[:sym_start] + new_symbol + content[sym_end:]
            modified = True
            print("[SUCCESS] Đã thay thế icon ONLYOFFICE trong About dialog thành logo Kaola!")

    if modified:
        with open(INDEX_HTML, "w", encoding="utf-8") as f:
            f.write(content)
        print("[DONE] Đã lưu index.html thành công.")

def patch_editors_exe():
    print("\n--- 2. CẬP NHẬT FILE THỰC THI EDITORS.EXE (TIÊU ĐỀ & ABOUT STRINGS) ---")
    if not os.path.exists(EDITORS_EXE):
        print(f"[SKIP] Không tìm thấy file {EDITORS_EXE}")
        return
        
    import subprocess
    subprocess.run('powershell -Command "Get-Process *editor* -ErrorAction SilentlyContinue | Stop-Process -Force"', shell=True)

    with open(EDITORS_EXE, "rb") as f:
        data = bytearray(f.read())

    # A. Thay thế ONLYOFFICE ở thanh tiêu đề
    target_title = b"ONLYOFFICE\x00\x00\x00\x00\x00\x00"
    replace_title = b"Kaola Office\x00\x00\x00\x00"
    if target_title in data:
        data = data.replace(target_title, replace_title, 1)
        print("[SUCCESS] Đã đổi tên thanh tiêu đề 'ONLYOFFICE' -> 'Kaola Office'")

    # B. Thay thế link: http://www.onlyoffice.com -> https://id.kaola.vn
    target_link = b"http://www.onlyoffice.com\x00\x00\x00\x00\x00\x00\x00"
    replace_link = b"https://id.kaola.vn\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00"
    if target_link in data:
        data = data.replace(target_link, replace_link, 1)
        print("[SUCCESS] Đã đổi link website: 'https://id.kaola.vn'")

    with open(EDITORS_EXE, "wb") as f:
        f.write(data)
    print("[DONE] Đã lưu editors.exe thành công.")

def main():
    patch_index_html()
    patch_editors_exe()
    print("\n--- HOÀN TẤT ĐỔI TÊN THƯƠNG HIỆU KAOLA OFFICE & LINK ID.KAOLA.VN ---")

if __name__ == "__main__":
    main()
