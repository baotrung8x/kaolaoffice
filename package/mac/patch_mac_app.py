#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Tool tự động tích hợp mã nguồn Kaola Office vào ứng dụng ONLYOFFICE Desktop Editors trên macOS (.app)
Hỗ trợ chạy trên cả Windows, Linux và macOS.
"""

import os
import sys
import shutil
import plistlib
import argparse

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

def patch_info_plist(plist_path):
    if not os.path.exists(plist_path):
        print(f"[WARN] Không tìm thấy {plist_path}")
        return False
        
    print(f"[INFO] Đang cập nhật Info.plist: {plist_path}")
    try:
        with open(plist_path, 'rb') as fp:
            pl = plistlib.load(fp)
            
        pl['CFBundleName'] = 'Kaola Office'
        pl['CFBundleDisplayName'] = 'Kaola Office'
        pl['CFBundleIdentifier'] = 'vn.kaola.office'
        pl['CFBundleVersion'] = '1.0.0'
        pl['CFBundleShortVersionString'] = '1.0.0'
        pl['NSHumanReadableCopyright'] = 'Bản quyền © 2026 Kaola Platform & Ascensio System SIA (GNU AGPL v3)'
        pl['CFBundleGetInfoString'] = 'Kaola Office 1.0.0 (Bộ ứng dụng văn phòng thông minh Việt Nam)'
        
        with open(plist_path, 'wb') as fp:
            plistlib.dump(pl, fp)
            
        print("[SUCCESS] Đã cập nhật định danh Info.plist chuẩn 'Kaola Office' (vn.kaola.office).")
        return True
    except Exception as e:
        print(f"[ERROR] Lỗi khi xử lý Info.plist: {e}")
        return False

def copy_resource_file(src, dst):
    if os.path.exists(src):
        os.makedirs(os.path.dirname(dst), exist_ok=True)
        shutil.copy2(src, dst)
        print(f"  [COPIED] {os.path.basename(src)} -> {dst}")

def copy_resource_tree(src, dst):
    if os.path.exists(src):
        if os.path.exists(dst):
            shutil.rmtree(dst)
        shutil.copytree(src, dst)
        print(f"  [COPIED DIR] {os.path.basename(src)} -> {dst}")

def patch_mac_app(app_path):
    if not os.path.exists(app_path):
        print(f"[ERROR] Đường dẫn ứng dụng không tồn tại: {app_path}")
        return False

    base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    app_source = os.path.join(base_dir, "app")
    mac_package_dir = os.path.join(base_dir, "package", "mac")
    icns_path = os.path.join(mac_package_dir, "KaolaOffice.icns")

    contents_dir = os.path.join(app_path, "Contents")
    if not os.path.exists(contents_dir):
        # Trường hợp người dùng truyền đường dẫn tới thư mục con
        if os.path.basename(app_path) == "Contents":
            contents_dir = app_path
        else:
            print(f"[ERROR] Không tìm thấy thư mục Contents bên trong {app_path}")
            return False

    resources_dir = os.path.join(contents_dir, "Resources")
    plist_path = os.path.join(contents_dir, "Info.plist")

    print(f"\n==================================================")
    print(f"   BẮT ĐẦU CHUYỂN GIAO KAOLA OFFICE CHO MACOS     ")
    print(f"   Target: {app_path}")
    print(f"==================================================")

    # 1. Cập nhật Info.plist
    patch_info_plist(plist_path)

    # 2. Cập nhật biểu tượng macOS (.icns)
    if os.path.exists(icns_path):
        target_icns = os.path.join(resources_dir, "app.icns")
        copy_resource_file(icns_path, target_icns)
        # Đồng bộ các biến thể icon khác nếu có
        for extra_icns in ["desktopeditors.icns", "editors.icns", "icon.icns"]:
            extra_path = os.path.join(resources_dir, extra_icns)
            if os.path.exists(extra_path):
                copy_resource_file(icns_path, extra_path)

    # 3. Sao chép các tệp giao diện & module tùy biến Kaola
    print("\n[INFO] Đang sao chép mã nguồn giao diện & Kaola ID / Copilot...")
    custom_files = [
        "index.html",
        "kaola_account.js",
        "kaola_account.css",
        "kaola_assistant.js",
        "kaola_assistant.css",
        "kaola_assistant_avatar.png",
        "kaola_assistant_avatar_full.png",
        "kaola_ads.js",
        "kaola_ads.css",
        "kaola_broadcast.js",
        "kaola_broadcast.css",
        "kaola_logo.png",
        "kaola-logo.png",
        "favicon.png",
        "favicon.svg",
        "LICENSE.txt",
    ]
    for fname in custom_files:
        src = os.path.join(app_source, fname)
        dst = os.path.join(resources_dir, fname)
        copy_resource_file(src, dst)

    # 4. Sao chép thư mục templates văn bản hành chính & doanh nghiệp
    templates_src = os.path.join(app_source, "templates")
    templates_dst = os.path.join(resources_dir, "templates")
    copy_resource_tree(templates_src, templates_dst)

    # 5. Sao chép plugin AI Copilot
    plugins_src = os.path.join(app_source, "editors", "sdkjs-plugins")
    plugins_dst = os.path.join(resources_dir, "editors", "sdkjs-plugins")
    copy_resource_tree(plugins_src, plugins_dst)

    # 6. Đổi tên ứng dụng thành "Kaola Office.app" nếu cần
    parent_dir = os.path.dirname(app_path)
    cur_name = os.path.basename(app_path)
    final_app_path = app_path
    if cur_name.endswith(".app") and cur_name != "Kaola Office.app":
        new_app_path = os.path.join(parent_dir, "Kaola Office.app")
        if os.path.exists(new_app_path):
            shutil.rmtree(new_app_path)
        try:
            os.rename(app_path, new_app_path)
            final_app_path = new_app_path
            print(f"\n[RENAME] Đã đổi tên ứng dụng: {cur_name} -> Kaola Office.app")
        except Exception as e:
            print(f"[WARN] Không thể đổi tên bundle tự động: {e}")

    # 7. Tự động Ký số mã nội bộ (Ad-hoc Code Signing) nếu đang chạy trên macOS
    if sys.platform == "darwin":
        print("\n[INFO] Đang thực hiện ký số nội bộ (ad-hoc codesign) trên macOS...")
        import subprocess
        try:
            subprocess.run(["codesign", "--force", "--deep", "--sign", "-", final_app_path], check=True)
            print("[SUCCESS] Đã hoàn tất ký số nội bộ (ad-hoc signature) để tránh lỗi crash Gatekeeper.")
        except Exception as e:
            print(f"[WARN] Lỗi khi gọi codesign: {e}")

    print("\n==================================================")
    print("   HOÀN TẤT CHUYỂN GIAO KAOLA OFFICE CHO MACOS!   ")
    print(f"   Vị trí: {final_app_path}")
    print("==================================================")
    return True

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Chuyển đổi ONLYOFFICE macOS thành Kaola Office cho máy Mac.")
    parser.add_argument("app_path", nargs="?", default="", help="Đường dẫn đến ONLYOFFICE.app hoặc thư mục Contents")
    args = parser.parse_args()

    if not args.app_path:
        # Mặc định tìm kiếm ONLYOFFICE.app trong cùng thư mục
        default_candidate = os.path.join(os.path.dirname(__file__), "ONLYOFFICE.app")
        if os.path.exists(default_candidate):
            args.app_path = default_candidate
        else:
            print("Cách dùng: python patch_mac_app.py /path/to/ONLYOFFICE.app")
            sys.exit(1)

    patch_mac_app(args.app_path)
