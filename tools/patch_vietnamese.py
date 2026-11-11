import os
import sys
import glob

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
APP_DIR = os.path.join(BASE_DIR, "app")
INDEX_PATH = os.path.join(APP_DIR, "index.html")

def patch_index_html():
    print("[1] Kiểm tra và cập nhật app/index.html...")
    if not os.path.exists(INDEX_PATH):
        print(f"    [ERROR] Không tìm thấy {INDEX_PATH}")
        return False

    with open(INDEX_PATH, 'r', encoding='utf-8') as f:
        text = f.read()

    modified = False

    # Patch 1: Ensure Solid signal and dictionary init fallback to vi
    old_init = '[UC,um]=F("en-US");function pm(){const e=ht?.en??{};zs({...e});const t=cm();Ms(t.lang||"en-US")}'
    new_init = '[UC,um]=F("vi");function pm(){const e=ht?.vi??ht?.en??{};zs({...e});const t=cm();Ms(t.lang||"vi")}'
    if old_init in text:
        text = text.replace(old_init, new_init)
        modified = True
        print("    [PATCH] Đã cập nhật fallback ngôn ngữ mặc định trong pm() sang Tiếng Việt ('vi').")
    elif new_init in text:
        print("    [OK] pm() đã có cấu hình mặc định 'vi'.")

    # Patch 2: settings:init fallback to vi / vi-VN
    target1 = 'if(c.locale?.langs){const u=Object.entries(c.locale.langs).map(([p,g])=>({code:p,name:g.name,enname:g.enname}));if(u.length>0&&gg(u),c.locale?.current&&!c.locale.langs[c.locale.current]){let p=Object.keys(c.locale.langs).find(g=>g.startsWith(c.locale.current)||c.locale.current.startsWith(g));if(p)c.locale.current=p;else{const g="en-US";p=Object.keys(c.locale.langs).find(f=>f.startsWith(g)||g.startsWith(f)),p&&(c.locale.current=p)}}}'
    replacement1 = 'if(c.locale?.langs){if(!c.locale.current)c.locale.current="vi-VN";const u=Object.entries(c.locale.langs).map(([p,g])=>({code:p,name:g.name,enname:g.enname}));if(u.length>0&&gg(u),c.locale?.current&&!c.locale.langs[c.locale.current]){let p=Object.keys(c.locale.langs).find(g=>g.startsWith(c.locale.current)||c.locale.current.startsWith(g));if(p)c.locale.current=p;else{const g="vi";p=Object.keys(c.locale.langs).find(f=>f.startsWith(g)||g.startsWith(f)),p&&(c.locale.current=p)}}}'
    if target1 in text:
        text = text.replace(target1, replacement1)
        modified = True
        print("    [PATCH] Đã cập nhật settings:init fallback sang vi-VN.")
    elif replacement1 in text:
        print("    [OK] settings:init đã có fallback vi-VN.")

    # Patch 3: kl() navigator locale fallback
    target2 = 'function kl(){let e=typeof navigator<"u"&&(navigator.language||navigator.userLanguage)||"en-US";try{Intl.DateTimeFormat.supportedLocalesOf([e])}catch{e="en-US"}return{locale:e,direction:lf(e)}}'
    replacement2 = 'function kl(){let e=typeof navigator<"u"&&(navigator.language||navigator.userLanguage)||"vi-VN";try{Intl.DateTimeFormat.supportedLocalesOf([e])}catch{e="vi-VN"}return{locale:e,direction:lf(e)}}'
    if target2 in text:
        text = text.replace(target2, replacement2)
        modified = True
        print("    [PATCH] Đã cập nhật kl() Intl locale fallback sang vi-VN.")
    elif replacement2 in text:
        print("    [OK] kl() đã có fallback vi-VN.")

    if modified:
        with open(INDEX_PATH, 'w', encoding='utf-8') as f:
            f.write(text)
        print("    -> Đã ghi thay đổi vào app/index.html")
    return True

def patch_editor_locale_js():
    print("[2] Kiểm tra app/editors/web-apps/apps/common/locale.js...")
    locale_js_path = os.path.join(APP_DIR, "editors", "web-apps", "apps", "common", "locale.js")
    if not os.path.exists(locale_js_path):
        print(f"    [ERROR] Không tìm thấy {locale_js_path}")
        return False

    with open(locale_js_path, 'r', encoding='utf-8') as f:
        content = f.read()

    modified = False
    if "defLang = 'en'" in content:
        content = content.replace("defLang = 'en'", "defLang = 'vi'")
        modified = True
    if "currentLang = defLang = 'en'" in content:
        content = content.replace("currentLang = defLang = 'en'", "currentLang = defLang = 'vi'")
        modified = True

    if modified:
        with open(locale_js_path, 'w', encoding='utf-8') as f:
            f.write(content)
        print("    [PATCH] Đã đặt defLang = 'vi' trong locale.js cho tất cả trình soạn thảo.")
    else:
        print("    [OK] locale.js đã có defLang = 'vi'.")
    return True

def patch_vi_json_branding():
    print("[3] Kiểm tra các tệp từ điển vi.json của các trình soạn thảo...")
    old_str = "Phiên bản mã nguồn mở ONLYOFFICE"
    new_str = "Phiên bản Kaola Office Miễn phí (Mã nguồn mở)"

    count = 0
    for fpath in glob.glob(os.path.join(APP_DIR, '**', 'vi.json'), recursive=True):
        with open(fpath, 'r', encoding='utf-8') as f:
            content = f.read()
        if old_str in content:
            content = content.replace(old_str, new_str)
            with open(fpath, 'w', encoding='utf-8') as f:
                f.write(content)
            count += 1
            print(f"    [PATCH] Đã cập nhật chuỗi thương hiệu trong: {os.path.relpath(fpath, BASE_DIR)}")
    if count == 0:
        print("    [OK] Tất cả các tệp vi.json đã được chuẩn hóa thương hiệu.")
    return True

def patch_launcher_bat():
    print("[4] Kiểm tra phím tắt khởi động KaolaOffice.bat...")
    bat_path = os.path.join(BASE_DIR, "KaolaOffice.bat")
    if not os.path.exists(bat_path):
        print(f"    [ERROR] Không tìm thấy {bat_path}")
        return False

    with open(bat_path, 'r', encoding='utf-8') as f:
        bat_content = f.read()

    reg_command = 'reg query "HKCU\\Software\\ONLYOFFICE\\DesktopEditors" /v "langid"'
    if reg_command not in bat_content:
        new_content = """@echo off
title Kaola Office
set CURRENT_DIR=%~dp0

:: Dam bao ngon ngu mac dinh la Tieng Viet (vi-VN)
reg query "HKCU\\Software\\ONLYOFFICE\\DesktopEditors" /v "langid" >nul 2>&1
if %errorlevel% neq 0 (
    reg add "HKCU\\Software\\ONLYOFFICE\\DesktopEditors" /v "langid" /t REG_SZ /d "vi-VN" /f >nul 2>&1
)

cd /d "%CURRENT_DIR%app"
start "" "DesktopEditors.exe" %*
"""
        with open(bat_path, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print("    [PATCH] Đã thêm cơ chế tự động thiết lập vi-VN vào KaolaOffice.bat.")
    else:
        print("    [OK] KaolaOffice.bat đã có cơ chế cấu hình vi-VN.")
    return True

def patch_inno_setup():
    print("[5] Kiểm tra cấu hình cài đặt package/kaola_setup.iss...")
    iss_path = os.path.join(BASE_DIR, "package", "kaola_setup.iss")
    if not os.path.exists(iss_path):
        print(f"    [ERROR] Không tìm thấy {iss_path}")
        return False

    with open(iss_path, 'r', encoding='utf-8') as f:
        content = f.read()

    reg_lang = 'Root: HKCU; Subkey: "Software\\ONLYOFFICE\\DesktopEditors"; ValueType: string; ValueName: "langid"; ValueData: "vi-VN"'
    if reg_lang not in content:
        target = '[Registry]\n'
        addition = '''; Cài đặt ngôn ngữ mặc định là Tiếng Việt (vi-VN)
Root: HKCU; Subkey: "Software\\ONLYOFFICE\\DesktopEditors"; ValueType: string; ValueName: "langid"; ValueData: "vi-VN"; Flags: createvalueifdoesntexist

'''
        if target in content:
            content = content.replace(target, target + addition)
            with open(iss_path, 'w', encoding='utf-8') as f:
                f.write(content)
            print("    [PATCH] Đã thêm cấu hình registry langid vi-VN vào package/kaola_setup.iss.")
    else:
        print("    [OK] kaola_setup.iss đã có cấu hình registry langid vi-VN.")
    return True

def configure_user_registry():
    print("[6] Kiểm tra registry hiện tại của người dùng...")
    import subprocess
    try:
        res = subprocess.run(['reg', 'query', 'HKCU\\Software\\ONLYOFFICE\\DesktopEditors', '/v', 'langid'],
                             capture_output=True, text=True)
        if 'vi-VN' in res.stdout:
            print("    [OK] Registry HKCU:\\Software\\ONLYOFFICE\\DesktopEditors\\langid đã là 'vi-VN'.")
        else:
            subprocess.run(['reg', 'add', 'HKCU\\Software\\ONLYOFFICE\\DesktopEditors', '/v', 'langid',
                            '/t', 'REG_SZ', '/d', 'vi-VN', '/f'], check=True)
            print("    [PATCH] Đã ghi 'vi-VN' vào HKCU:\\Software\\ONLYOFFICE\\DesktopEditors\\langid.")
    except Exception as e:
        print(f"    [WARN] Không thể thao tác registry: {e}")
    return True

def main():
    print("==================================================")
    print("  ÁP DỤNG NGÔN NGỮ TIẾNG VIỆT MẶC ĐỊNH CHO KAOLA  ")
    print("==================================================")
    patch_index_html()
    patch_editor_locale_js()
    patch_vi_json_branding()
    patch_launcher_bat()
    patch_inno_setup()
    configure_user_registry()
    print("\n[THÀNH CÔNG] Toàn bộ hệ thống Kaola Office đã được cấu hình Tiếng Việt mặc định.")

if __name__ == "__main__":
    main()
