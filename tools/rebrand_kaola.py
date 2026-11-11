import os
import sys
import re

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
APP_DIR = os.path.join(BASE_DIR, "app")
INDEX_HTML = os.path.join(APP_DIR, "index.html")

def rebrand_html_titles():
    targets = [
        (INDEX_HTML, "<title>ONLYOFFICE Documents</title>", "<title>Kaola Office</title>"),
        (os.path.join(APP_DIR, "editors", "web-apps", "apps", "documenteditor", "main", "index.html"),
         "<title>ONLYOFFICE Document Editor</title>", "<title>Kaola Document Editor</title>"),
        (os.path.join(APP_DIR, "editors", "web-apps", "apps", "spreadsheeteditor", "main", "index.html"),
         "<title>ONLYOFFICE Spreadsheet Editor</title>", "<title>Kaola Spreadsheet Editor</title>"),
        (os.path.join(APP_DIR, "editors", "web-apps", "apps", "presentationeditor", "main", "index.html"),
         "<title>ONLYOFFICE Presentation Editor</title>", "<title>Kaola Presentation Editor</title>"),
        (os.path.join(APP_DIR, "editors", "web-apps", "apps", "pdfeditor", "main", "index.html"),
         "<title>ONLYOFFICE PDF Editor</title>", "<title>Kaola PDF Editor</title>"),
    ]
    
    for path, old_title, new_title in targets:
        if os.path.exists(path):
            with open(path, "r", encoding="utf-8") as f:
                content = f.read()
            if old_title in content:
                content = content.replace(old_title, new_title)
                with open(path, "w", encoding="utf-8") as f:
                    f.write(content)
                print(f"[REBRAND] Đã cập nhật tiêu đề cho: {os.path.basename(path)}")
            else:
                print(f"[SKIP] Tiêu đề đã được cập nhật hoặc không tìm thấy: {os.path.basename(path)}")

def rebrand_index_strings():
    if not os.path.exists(INDEX_HTML):
        print(f"[ERROR] Không tìm thấy {INDEX_HTML}")
        return

    with open(INDEX_HTML, "r", encoding="utf-8") as f:
        content = f.read()

    # Thay thế chuỗi chào mừng và giới thiệu tiếng Việt -> Kaola Office
    replacements = [
        ('Chào mừng bạn đến với ONLYOFFICE Desktop Editors!', 'Chào mừng bạn đến với Kaola Office!'),
        ('Chào mừng bạn đến với ONLYOFFICE Desktop Editors', 'Chào mừng bạn đến với Kaola Office'),
        ('Welcome to ONLYOFFICE Desktop Editors!', 'Welcome to Kaola Office!'),
        ('Welcome to ONLYOFFICE Desktop Editors', 'Welcome to Kaola Office'),
        ('ONLYOFFICE Desktop Editors', 'Kaola Office'),
        ('Kaola Office Enterprise', 'Kaola Office'),
        ('ONLYOFFICE Documents', 'Kaola Office'),
    ]

    modified = False
    for old_s, new_s in replacements:
        if old_s in content:
            content = content.replace(old_s, new_s)
            modified = True

    # Inject Kaola Account scripts nếu chưa có
    inject_tag = '<!-- KAOLA_ACCOUNT_MODULE -->'
    if inject_tag not in content:
        if '<!-- KAOLA_LICENSE_GUARD -->' in content:
            content = content.replace('<!-- KAOLA_LICENSE_GUARD -->', inject_tag)
            content = content.replace('kaola_license.css', 'kaola_account.css')
            content = content.replace('kaola_license.js', 'kaola_account.js')
            modified = True
        elif '</head>' in content:
            injection = f'''{inject_tag}
    <link rel="stylesheet" href="kaola_account.css">
    <script src="kaola_account.js"></script>
  <!-- KAOLA_ADS_MODULE -->
    <link rel="stylesheet" href="kaola_ads.css">
    <script src="kaola_ads.js"></script>
  </head>'''
            content = content.replace('</head>', injection)
            modified = True
            print("[INJECT] Đã tích hợp Kaola Account Module vào index.html")

    if modified:
        with open(INDEX_HTML, "w", encoding="utf-8") as f:
            f.write(content)
        print("[REBRAND] Đã cập nhật chuỗi giao diện cho index.html")
    else:
        print("[SKIP] index.html đã được rebrand chuẩn Kaola Office trước đó.")

def main():
    print("--- BẮT ĐẦU REBRANDING CHO KAOLA OFFICE ---")
    rebrand_html_titles()
    rebrand_index_strings()
    
    # Gọi patch_branding để cập nhật logo và tài nguyên binary
    try:
        from patch_branding import patch_editors_exe, patch_web_app_logos, patch_index_html
        patch_editors_exe()
        patch_web_app_logos()
        patch_index_html()
    except Exception as e:
        print(f"[WARN] Không thể chạy patch_branding: {e}")

    # Áp dụng cấu hình Tiếng Việt mặc định
    try:
        from patch_vietnamese import main as apply_vietnamese
        apply_vietnamese()
    except Exception as e:
        print(f"[WARN] Không thể cấu hình tiếng Việt: {e}")
        
    print("--- HOÀN TẤT REBRANDING ---")

if __name__ == "__main__":
    main()

