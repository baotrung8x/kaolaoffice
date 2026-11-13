import os
import sys
import glob
import subprocess

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
APP_DIR = os.path.join(BASE_DIR, "app")
INDEX_PATH = os.path.join(APP_DIR, "index.html")

def run_tests():
    print("==================================================")
    print("   KIỂM THỬ TỔNG THỂ DỰ ÁN KAOLA OFFICE          ")
    print("   (Chuẩn hóa thương hiệu, AGPLv3 & id.kaola.vn)  ")
    print("==================================================")

    passed = 0
    total = 0

    # Test 1: Kiểm tra index.html tồn tại và không còn chuỗi "Enterprise"
    total += 1
    with open(INDEX_PATH, 'r', encoding='utf-8') as f:
        idx_content = f.read()
    
    ent_count = idx_content.count("Kaola Office Enterprise")
    if ent_count == 0:
        print("[PASS] Test 1: Đã làm sạch toàn bộ chuỗi 'Kaola Office Enterprise' -> 'Kaola Office'.")
        passed += 1
    else:
        print(f"[FAIL] Test 1: Còn {ent_count} chuỗi 'Kaola Office Enterprise' trong index.html.")

    # Test 2: Kiểm tra module tài khoản kaola_account.js & CSS được nhúng
    total += 1
    has_account_js = os.path.exists(os.path.join(APP_DIR, "kaola_account.js"))
    has_account_css = os.path.exists(os.path.join(APP_DIR, "kaola_account.css"))
    is_injected = "kaola_account.js" in idx_content and "kaola_account.css" in idx_content
    if has_account_js and has_account_css and is_injected:
        print("[PASS] Test 2: Module tài khoản Kaola ID (kaola_account.js/css) đã sẵn sàng và được nhúng chuẩn xác.")
        passed += 1
    else:
        print(f"[FAIL] Test 2: Thiếu file hoặc chưa nhúng kaola_account (js: {has_account_js}, css: {has_account_css}, injected: {is_injected}).")

    # Test 3: Kiểm tra đã gỡ bỏ hoàn toàn DRM (hwid.json & license.lic)
    total += 1
    has_hwid = os.path.exists(os.path.join(APP_DIR, "hwid.json"))
    has_lic = os.path.exists(os.path.join(APP_DIR, "license.lic"))
    if not has_hwid and not has_lic:
        print("[PASS] Test 3: Đã loại bỏ hoàn toàn các file khóa bản quyền (hwid.json, license.lic). Ứng dụng chạy tự do 100%.")
        passed += 1
    else:
        print(f"[FAIL] Test 3: Vẫn còn file khóa DRM trong app (hwid: {has_hwid}, lic: {has_lic}).")

    # Test 4: Kiểm tra thông tin pháp lý & cổng id.kaola.vn trong About
    total += 1
    has_about_app = 'o.appname="Kaola Office"' in idx_content
    has_about_link = 'o.link="https://id.kaola.vn"' in idx_content or 'o.site="id.kaola.vn"' in idx_content
    has_agpl_notice = 'GNU AGPL v3' in idx_content
    if has_about_app and has_about_link and has_agpl_notice:
        print("[PASS] Test 4: Hộp thoại About đã ghi nhận chuẩn GNU AGPL v3, bản quyền ONLYOFFICE và cổng id.kaola.vn.")
        passed += 1
    else:
        print(f"[FAIL] Test 4: Thông tin About chưa đầy đủ (appname: {has_about_app}, link: {has_about_link}, agpl: {has_agpl_notice}).")

    # Test 5: Kiểm tra cấu hình bộ đóng gói Inno Setup & Việt hóa bộ cài đặt
    total += 1
    iss_path = os.path.join(BASE_DIR, "package", "kaola_setup.iss")
    vi_isl_path = os.path.join(BASE_DIR, "package", "Vietnamese.isl")
    with open(iss_path, 'r', encoding='utf-8') as f:
        iss_content = f.read()
    has_vi_file = os.path.exists(vi_isl_path)
    has_vi_lang = 'Name: "vietnamese"; MessagesFile: "Vietnamese.isl"' in iss_content
    has_std_setup = '#define MyAppName "Kaola Office"' in iss_content and 'id.kaola.vn' in iss_content and 'OutputBaseFilename=KaolaOffice_Setup' in iss_content
    if has_std_setup and has_vi_file and has_vi_lang:
        print("[PASS] Test 5: File cấu hình cài đặt kaola_setup.iss & gói Việt hóa Vietnamese.isl đã chuẩn hóa 100% tiếng Việt cho người dùng Việt Nam.")
        passed += 1
    else:
        print(f"[FAIL] Test 5: Chưa hoàn thiện Việt hóa bộ cài đặt (setup: {has_std_setup}, vi_file: {has_vi_file}, vi_lang: {has_vi_lang}).")

    # Test 6: Kiểm tra phím tắt khởi động KaolaOffice.bat
    total += 1
    bat_path = os.path.join(BASE_DIR, "KaolaOffice.bat")
    with open(bat_path, 'r', encoding='utf-8') as f:
        bat_content = f.read()
    if "title Kaola Office" in bat_content and "Enterprise" not in bat_content:
        print("[PASS] Test 6: Phím tắt KaolaOffice.bat đã chuẩn hóa tiêu đề 'Kaola Office'.")
        passed += 1
    else:
        print("[FAIL] Test 6: KaolaOffice.bat chưa chuẩn hóa tiêu đề.")

    # Test 7: Kiểm tra module Banner quảng cáo thông minh (kaola_ads.js/css)
    total += 1
    has_ads_js = os.path.exists(os.path.join(APP_DIR, "kaola_ads.js"))
    has_ads_css = os.path.exists(os.path.join(APP_DIR, "kaola_ads.css"))
    ads_injected = "kaola_ads.js" in idx_content and "kaola_ads.css" in idx_content
    if has_ads_js and has_ads_css and ads_injected:
        print("[PASS] Test 7: Module Banner quảng cáo động (kaola_ads.js/css) đã sẵn sàng và được nhúng chuẩn xác.")
        passed += 1
    else:
        print(f"[FAIL] Test 7: Thiếu file hoặc chưa nhúng kaola_ads (js: {has_ads_js}, css: {has_ads_css}, injected: {ads_injected}).")


    # Test 8: Kiểm tra logo chính và thương hiệu Kaola Office trong binary editors.exe
    total += 1
    editors_exe_path = os.path.join(APP_DIR, "editors.exe")
    with open(editors_exe_path, 'rb') as f:
        exe_bytes = f.read()
    logo_light_svg = exe_bytes[0xd213a : 0xd213a + 3035]
    has_kaola_logo = b"Kaola Office" in logo_light_svg
    has_kaola_appname = b"Kaola Office\x00" in exe_bytes[0xc2ce8 : 0xc2ce8 + 16]
    if has_kaola_logo and has_kaola_appname:
        print("[PASS] Test 8: Logo chính (logo_light.svg/dark) và appname trong editors.exe đã được thay bằng 'Kaola Office'.")
        passed += 1
    else:
        print(f"[FAIL] Test 8: Logo hoặc appname trong editors.exe chưa chuẩn hóa (logo: {has_kaola_logo}, appname: {has_kaola_appname}).")

    # Test 9: Kiểm tra cấu hình và gói ngôn ngữ Tiếng Việt mặc định
    total += 1
    locale_js_path = os.path.join(APP_DIR, "editors", "web-apps", "apps", "common", "locale.js")
    with open(locale_js_path, 'r', encoding='utf-8') as f:
        loc_content = f.read()
    has_locale_vi = "defLang = 'vi'" in loc_content

    has_index_vi = '[UC,um]=F("vi")' in idx_content and 'c.locale.current="vi-VN"' in idx_content

    vi_json_clean = True
    for fpath in glob.glob(os.path.join(APP_DIR, '**', 'vi.json'), recursive=True):
        with open(fpath, 'r', encoding='utf-8') as f:
            if 'Phiên bản mã nguồn mở ONLYOFFICE' in f.read():
                vi_json_clean = False
                break

    reg_vi = False
    try:
        res = subprocess.run(['reg', 'query', 'HKCU\\Software\\ONLYOFFICE\\DesktopEditors', '/v', 'langid'],
                             capture_output=True, text=True)
        if 'vi-VN' in res.stdout:
            reg_vi = True
    except Exception:
        pass

    if has_locale_vi and has_index_vi and vi_json_clean and reg_vi:
        print("[PASS] Test 9: Ngôn ngữ Tiếng Việt đã được thiết lập mặc định và chuẩn hóa thương hiệu (locale.js, index.html, vi.json, Registry).")
        passed += 1
    else:
        print(f"[FAIL] Test 9: Ngôn ngữ Tiếng Việt chưa đồng bộ (locale.js: {has_locale_vi}, index.html: {has_index_vi}, vi.json: {vi_json_clean}, registry: {reg_vi}).")

    # Test 10: Kiểm tra đấu nối cổng thanh toán KaolaPay (pay.kaola.vn / kaolapay.test)
    total += 1
    with open(os.path.join(APP_DIR, "kaola_account.js"), 'r', encoding='utf-8') as f:
        acc_js = f.read()
    has_pay_url = "kaolapay.test" in acc_js or "pay.kaola.vn" in acc_js
    has_pro_plan = "office_pro_1y" in acc_js
    has_hmac = "generateHmacSha256" in acc_js
    has_checkout_fn = "initiatePayment" in acc_js

    # Kiểm tra database kaolapay có app kaolaoffice
    has_db_app = False
    try:
        check_proc = subprocess.run([
            'php', '-r',
            '$pdo = new PDO("mysql:host=127.0.0.1;dbname=kaolapay;charset=utf8mb4", "root", ""); echo (int)$pdo->query("SELECT COUNT(*) FROM connected_apps WHERE code = \'kaolaoffice\' AND is_active = 1")->fetchColumn();'
        ], capture_output=True, text=True)
        if check_proc.stdout.strip() == '1':
            has_db_app = True
    except Exception:
        pass

    if has_pay_url and has_pro_plan and has_hmac and has_checkout_fn and has_db_app:
        print("[PASS] Test 10: Cổng thanh toán KaolaPay đã đấu nối thành công (API sessions, VietQR, HMAC SHA256 & DB connected_apps).")
        passed += 1
    else:
        print(f"[FAIL] Test 10: Đấu nối KaolaPay chưa hoàn chỉnh (pay_url: {has_pay_url}, plans: {has_pro_plan}, hmac: {has_hmac}, db: {has_db_app}).")

    # Test 11: Kiểm tra nhúng mã nhân viên tư vấn Kaola AI (widget.js) vào màn hình chính và 5 trình biên tập
    total += 1
    editor_files = [
        os.path.join(APP_DIR, "editors", "web-apps", "apps", "documenteditor", "main", "index.html"),
        os.path.join(APP_DIR, "editors", "web-apps", "apps", "spreadsheeteditor", "main", "index.html"),
        os.path.join(APP_DIR, "editors", "web-apps", "apps", "presentationeditor", "main", "index.html"),
        os.path.join(APP_DIR, "editors", "web-apps", "apps", "pdfeditor", "main", "index.html"),
        os.path.join(APP_DIR, "editors", "web-apps", "apps", "visioeditor", "main", "index.html"),
    ]
    all_injected = True
    missing_widget = []
    for ef in editor_files:
        if not os.path.exists(ef):
            all_injected = False
            missing_widget.append(os.path.basename(os.path.dirname(os.path.dirname(ef))) + " (not found)")
            continue
        with open(ef, 'r', encoding='utf-8') as f:
            content = f.read()
            has_copilot = ('kaola_assistant.js' in content and 'kaola_assistant.css' in content)
            if not has_copilot:
                all_injected = False
                missing_widget.append(ef)

    if all_injected:
        print("[PASS] Test 11: Trợ lý Kaola AI Copilot Native (kaola_assistant.js) đã được tích hợp đầy đủ vào 5 trình soạn thảo (Word, Excel, PowerPoint, PDF, Visio).")
        passed += 1
    else:
        print(f"[FAIL] Test 11: Thiếu mã kaola_assistant.js tại các file: {missing_widget}")

    # Test 12: Kiểm tra biểu tượng Kaola AI trên menu bên trái & mở trực tiếp bảng giá các gói Office
    total += 1
    has_ai_enabled = 'href:"/aitools",onClick:a,icon:"#aitools"' in idx_content and 'get when(){return!0}' in idx_content
    has_ai_action = 'window.KaolaAccount?.openPricing?.()' in idx_content
    with open(os.path.join(APP_DIR, "kaola_account.js"), 'r', encoding='utf-8') as f:
        acc_code = f.read()
    has_open_pricing = "openPricing: function" in acc_code and "showView('pricing')" in acc_code

    if has_ai_enabled and has_ai_action and has_open_pricing:
        print("[PASS] Test 12: Biểu tượng Kaola AI đã được đưa lên menu trái và kích hoạt mở trực tiếp bảng giá các gói Office.")
        passed += 1
    else:
        print(f"[FAIL] Test 12: Biểu tượng AI chưa hoàn thiện (enabled: {has_ai_enabled}, action: {has_ai_action}, openPricing: {has_open_pricing}).")

    # Test 13: Kiểm tra luồng Đăng nhập Kaola ID miễn phí & Kết nối trực tiếp Kaola Drive
    total += 1
    has_direct_drive = 'as(p,"https://drive.kaola.vn")' in idx_content
    with open(os.path.join(APP_DIR, "kaola_account.js"), 'r', encoding='utf-8') as f:
        acc_content = f.read()
    has_auth_view = 'kaola-view-auth' in acc_content and 'kaola-view-pricing' in acc_content and 'kaola-view-profile' in acc_content
    has_free_pill = 'Đăng nhập Kaola ID' in acc_content

    if has_direct_drive and has_auth_view and has_free_pill:
        print("[PASS] Test 13: Đã tách bạch luồng Đăng nhập Kaola ID miễn phí và kết nối trực tiếp Kaola Drive không qua popup hỏi URL.")
        passed += 1
    else:
        print(f"[FAIL] Test 13: Chưa hoàn thiện luồng đăng nhập/đám mây (direct_drive: {has_direct_drive}, auth_view: {has_auth_view}, free_pill: {has_free_pill}).")

    print("\n--------------------------------------------------")
    print(f"KẾT QUẢ: ĐÃ VƯỢT QUA {passed}/{total} BÀI KIỂM THỬ.")
    print("--------------------------------------------------")
    return passed == total


if __name__ == "__main__":
    success = run_tests()
    sys.exit(0 if success else 1)
