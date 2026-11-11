import os
import sys
import io
import struct
import zlib
import base64
from PIL import Image, ImageDraw, ImageFont

sys.stdout.reconfigure(encoding='utf-8')

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
APP_DIR = os.path.join(BASE_DIR, "app")
EDITORS_EXE = os.path.join(APP_DIR, "editors.exe")
INDEX_HTML = os.path.join(APP_DIR, "index.html")
ICON_PNG = os.path.join(BASE_DIR, "icon.png")
FONT_BOLD = r"C:\Windows\Fonts\segoeuib.ttf"
FONT_REG = r"C:\Windows\Fonts\segoeui.ttf"

def get_icon_b64(size):
    """Tạo chuỗi base64 PNG của icon Kaola theo kích thước size x size."""
    icon = Image.open(ICON_PNG).convert('RGBA')
    resized = icon.resize((size, size), Image.Resampling.LANCZOS)
    quantized = resized.quantize(colors=24, method=2)
    buf = io.BytesIO()
    quantized.save(buf, format='PNG', optimize=True)
    return base64.b64encode(buf.getvalue()).decode('ascii')

def make_png_logo(width, height, is_dark=False):
    """Tạo ảnh PNG logo tỉ lệ chuẩn 85x20 (hoặc nhân scale DPI), chữ to rõ, đậm nét, lấp đầy không gian."""
    scale = height / 20.0
    icon = Image.open(ICON_PNG).convert('RGBA')
    
    img = Image.new('RGBA', (width, height), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    icon_dim = max(14, int(16 * scale))
    icon_resized = icon.resize((icon_dim, icon_dim), Image.Resampling.LANCZOS)
    
    icon_x = max(1, int(1 * scale))
    icon_y = (height - icon_dim) // 2
    img.paste(icon_resized, (icon_x, icon_y), icon_resized)
    
    font_size_k = max(10, int(12.5 * scale))
    font_size_o = max(9, int(11 * scale))
    font_k = ImageFont.truetype(FONT_BOLD, font_size_k)
    font_o = ImageFont.truetype(FONT_BOLD, font_size_o)
    
    text_x = icon_x + icon_dim + max(2, int(3 * scale))
    bbox_k = font_k.getbbox("Kaola")
    h_k = bbox_k[3] - bbox_k[1]
    y_k = (height - h_k) // 2 - bbox_k[1]
    
    color_k = (255, 255, 255, 255) if is_dark else (15, 23, 42, 255)
    color_o = (226, 232, 240, 255) if is_dark else (51, 65, 85, 255)
    
    draw.text((text_x, y_k), "Kaola", font=font_k, fill=color_k)
    w_k = bbox_k[2] - bbox_k[0]
    
    bbox_o = font_o.getbbox("Office")
    h_o = bbox_o[3] - bbox_o[1]
    y_o = (height - h_o) // 2 - bbox_o[1]
    draw.text((text_x + w_k + max(2, int(2.5 * scale)), y_o), "Office", font=font_o, fill=color_o)
    
    return img

def pad_png(png_bytes, target_len):
    """Pad PNG với ancillary chunk tEXt để đạt chính xác target_len byte."""
    diff = target_len - len(png_bytes)
    if diff < 0:
        raise ValueError(f"PNG quá lớn: {len(png_bytes)} > {target_len}")
    if diff == 0:
        return png_bytes
    if diff < 12:
        raise ValueError(f"Khoảng trống quá nhỏ: {diff}")
    
    iend_pos = png_bytes.rfind(b'IEND') - 4
    header = png_bytes[:iend_pos]
    iend = png_bytes[iend_pos:]
    
    data_len = diff - 12
    chunk_type = b'tEXt'
    chunk_data = b'K\x00' + b' ' * (data_len - 2) if data_len >= 2 else b' ' * data_len
    crc = zlib.crc32(chunk_type + chunk_data) & 0xffffffff
    chunk = struct.pack('>I', data_len) + chunk_type + chunk_data + struct.pack('>I', crc)
    
    res = header + chunk + iend
    assert len(res) == target_len, f"Expected {target_len}, got {len(res)}"
    return res

def encode_fitted_png(img, target_len):
    """Thử nén PNG với các mức màu khác nhau để vừa target_len."""
    for colors in [48, 36, 28, 24, 20, 16, 12, 8]:
        buf = io.BytesIO()
        img_p = img.quantize(colors=colors, method=2)
        img_p.save(buf, format='PNG', optimize=True)
        raw = buf.getvalue()
        if len(raw) <= target_len - 12:
            return pad_png(raw, target_len)
    raise ValueError(f"Không thể nén PNG vừa {target_len} bytes")

def make_svg_logo(target_len, is_dark=False):
    """Tạo SVG chuẩn kích thước 85x20 cho logo_light.svg và logo_dark.svg trong editors.exe."""
    icon_b64 = get_icon_b64(16)
    color_k = "#ffffff" if is_dark else "#0f172a"
    color_o = "#e2e8f0" if is_dark else "#334155"
    
    svg_tmpl = (
        '<?xml version="1.0" encoding="UTF-8" standalone="no"?>\n'
        '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" '
        'width="85" height="20" viewBox="0 0 85 20">\n'
        f'  <image x="1" y="2" width="16" height="16" xlink:href="data:image/png;base64,{icon_b64}"/>\n'
        f'  <text x="20" y="14.5" font-family="\'-apple-system\', \'Segoe UI\', Roboto, Helvetica, sans-serif" '
        f'font-weight="bold" font-size="12" fill="{color_k}">Kaola</text>\n'
        f'  <text x="50.5" y="14.5" font-family="\'-apple-system\', \'Segoe UI\', Roboto, Helvetica, sans-serif" '
        f'font-weight="bold" font-size="11" fill="{color_o}">Office</text>\n'
        '  <!-- Kaola Office '
    )

    svg_close = ' -->\n</svg>'
    
    current = (svg_tmpl + svg_close).encode('utf-8')
    pad_needed = target_len - len(current)
    if pad_needed < 0:
        raise ValueError(f"SVG template quá lớn: {len(current)} > {target_len}")
    
    pad_str = ' ' * pad_needed
    full_svg = (svg_tmpl + pad_str + svg_close).encode('utf-8')
    assert len(full_svg) == target_len, f"Expected {target_len}, got {len(full_svg)}"
    return full_svg


def patch_editors_exe():
    print("--- 1. VÁ TÀI NGUYÊN LOGO TRONG EDITORS.EXE ---")
    with open(EDITORS_EXE, 'rb') as f:
        data = bytearray(f.read())
    
    # Danh sách SVG cần vá
    svg_targets = [
        ("logo_light.svg", 0xd213a, 3035, False),
        ("logo_dark.svg", 0xd6bc1, 3035, True),
    ]
    
    for name, offset, length, is_dark in svg_targets:
        svg_bytes = make_svg_logo(length, is_dark=is_dark)
        data[offset : offset + length] = svg_bytes
        print(f"[OK] Đã vá {name} ({length} bytes) tại {hex(offset)}")
    
    # Danh sách PNG fallback cần vá
    png_targets = [
        ("logo_light.png", 0xd6773, 561, (85, 20), False),
        ("logo_dark.png", 0xd79a9, 499, (85, 20), True),
        ("logo_light_1.25x.png", 0xe1a9a, 750, (106, 25), False),
        ("logo_dark_1.25x.png", 0xd45f3, 651, (106, 25), True),
        ("logo_light_1.5x.png", 0xdafe7, 824, (128, 30), False),
        ("logo_dark_1.5x.png", 0xdacfa, 745, (128, 30), True),
        ("logo_light_1.75x.png", 0xe73d2, 987, (149, 35), False),
        ("logo_dark_1.75x.png", 0xe06fc, 902, (149, 35), True),
    ]
    
    for name, offset, length, (w, h), is_dark in png_targets:
        img = make_png_logo(w, h, is_dark=is_dark)
        padded_png = encode_fitted_png(img, length)
        data[offset : offset + length] = padded_png
        print(f"[OK] Đã vá {name} ({length} bytes, {w}x{h}) tại {hex(offset)}")
    
    # Vá chuỗi ONLYOFFICE thành Kaola Office tại 0xc2ce8
    # 0xc2ce8: b"ONLYOFFICE\x00\x00\x00\x00\x00\x00" (16 bytes)
    old_str = b"ONLYOFFICE\x00\x00\x00\x00\x00\x00"
    new_str = b"Kaola Office\x00\x00\x00\x00"
    if data[0xc2ce8 : 0xc2ce8 + 16] == old_str:
        data[0xc2ce8 : 0xc2ce8 + 16] = new_str
        print(f"[OK] Đã thay thế chuỗi appname tại 0xc2ce8 -> 'Kaola Office'")
    elif data[0xc2ce8 : 0xc2ce8 + 16] == new_str:
        print(f"[SKIP] Chuỗi tại 0xc2ce8 đã là 'Kaola Office'")
    else:
        print(f"[WARN] Chuỗi tại 0xc2ce8: {data[0xc2ce8 : 0xc2ce8 + 16]}")
    
    # Vá link đăng ký OnlyOffice -> Kaola Drive (drive.kaola.vn) tại 0xc3258
    reg_url_offset = 0xc3258
    orig_reg_url = b"https://onlyoffice.com/registration.aspx?desktop=true"
    new_reg_url = b"https://drive.kaola.vn"
    if data[reg_url_offset : reg_url_offset + len(orig_reg_url)] == orig_reg_url:
        padded = new_reg_url + b"\x00" * (len(orig_reg_url) - len(new_reg_url))
        data[reg_url_offset : reg_url_offset + len(orig_reg_url)] = padded
        print(f"[OK] Đã vá registration link tại {hex(reg_url_offset)} -> '{new_reg_url.decode()}'")
    elif data[reg_url_offset : reg_url_offset + len(new_reg_url)] == new_reg_url:
        print(f"[SKIP] Registration link tại {hex(reg_url_offset)} đã là '{new_reg_url.decode()}'")
    
    with open(EDITORS_EXE, 'wb') as f:
        f.write(data)
    print(f"[SUCCESS] Đã lưu {EDITORS_EXE} thành công!")

def patch_web_app_logos():
    print("\n--- 2. VÁ CÁC TÀI NGUYÊN LOGO TRONG WEB-APPS & PROVIDERS ---")
    import json
    
    # A. Header Logos trong các trình soạn thảo (Document, Spreadsheet, Presentation, PDF)
    header_dir = os.path.join(APP_DIR, "editors", "web-apps", "apps", "common", "main", "resources", "img", "header")
    if os.path.exists(header_dir):
        icon_b64 = get_icon_b64(16)
        # header-logo_s.svg: Dùng cho nền màu/tối -> chữ trắng
        header_logo_svg = (
            '<?xml version="1.0" encoding="UTF-8"?>\n'
            '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" '
            'width="86" height="20" viewBox="0 0 86 20">\n'
            f'  <image x="1" y="2" width="16" height="16" xlink:href="data:image/png;base64,{icon_b64}"/>\n'
            '  <text x="20" y="14.5" font-family="\'-apple-system\', \'Segoe UI\', Roboto, Helvetica, sans-serif" '
            'font-weight="bold" font-size="12" fill="#ffffff">Kaola</text>\n'
            '  <text x="50.5" y="14.5" font-family="\'-apple-system\', \'Segoe UI\', Roboto, Helvetica, sans-serif" '
            'font-weight="bold" font-size="11" fill="#e2e8f0">Office</text>\n'
            '</svg>\n'
        )
        p_hl = os.path.join(header_dir, "header-logo_s.svg")
        with open(p_hl, "w", encoding="utf-8") as f:
            f.write(header_logo_svg)
        print(f"[OK] Đã cập nhật logo thanh Header soạn thảo: {os.path.basename(p_hl)}")

        # dark-logo_s.svg: Dùng cho nền sáng -> chữ sẫm
        dark_logo_svg = (
            '<?xml version="1.0" encoding="UTF-8"?>\n'
            '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" '
            'width="86" height="20" viewBox="0 0 86 20">\n'
            f'  <image x="1" y="2" width="16" height="16" xlink:href="data:image/png;base64,{icon_b64}"/>\n'
            '  <text x="20" y="14.5" font-family="\'-apple-system\', \'Segoe UI\', Roboto, Helvetica, sans-serif" '
            'font-weight="bold" font-size="12" fill="#0f172a">Kaola</text>\n'
            '  <text x="50.5" y="14.5" font-family="\'-apple-system\', \'Segoe UI\', Roboto, Helvetica, sans-serif" '
            'font-weight="bold" font-size="11" fill="#334155">Office</text>\n'
            '</svg>\n'
        )
        p_dl = os.path.join(header_dir, "dark-logo_s.svg")
        with open(p_dl, "w", encoding="utf-8") as f:
            f.write(dark_logo_svg)
        print(f"[OK] Đã cập nhật logo thanh Header soạn thảo (bản sáng): {os.path.basename(p_dl)}")

    # B. About Dialog Logos trong trình soạn thảo (File -> About)
    about_dir = os.path.join(APP_DIR, "editors", "web-apps", "apps", "common", "main", "resources", "img", "about")
    if os.path.exists(about_dir):
        icon_b64_36 = get_icon_b64(36)
        # logo_s.svg (nền sáng)
        about_logo_svg = (
            '<?xml version="1.0" encoding="UTF-8"?>\n'
            '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" '
            'width="245" height="45" viewBox="0 0 245 45">\n'
            f'  <image x="4" y="4.5" width="36" height="36" xlink:href="data:image/png;base64,{icon_b64_36}"/>\n'
            '  <text x="48" y="31" font-family="\'-apple-system\', \'Segoe UI\', Roboto, Helvetica, sans-serif" '
            'font-weight="bold" font-size="22" fill="#0f172a">Kaola</text>\n'
            '  <text x="112" y="31" font-family="\'-apple-system\', \'Segoe UI\', Roboto, Helvetica, sans-serif" '
            'font-weight="normal" font-size="20" fill="#64748b">Office</text>\n'
            '</svg>\n'
        )
        p_al = os.path.join(about_dir, "logo_s.svg")
        with open(p_al, "w", encoding="utf-8") as f:
            f.write(about_logo_svg)
        print(f"[OK] Đã cập nhật logo About dialog (logo_s.svg): {os.path.basename(p_al)}")

        # logo-white_s.svg (nền tối)
        about_logo_white_svg = (
            '<?xml version="1.0" encoding="UTF-8"?>\n'
            '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" '
            'width="245" height="45" viewBox="0 0 245 45">\n'
            f'  <image x="4" y="4.5" width="36" height="36" xlink:href="data:image/png;base64,{icon_b64_36}"/>\n'
            '  <text x="48" y="31" font-family="\'-apple-system\', \'Segoe UI\', Roboto, Helvetica, sans-serif" '
            'font-weight="bold" font-size="22" fill="#ffffff">Kaola</text>\n'
            '  <text x="112" y="31" font-family="\'-apple-system\', \'Segoe UI\', Roboto, Helvetica, sans-serif" '
            'font-weight="normal" font-size="20" fill="#cbd5e1">Office</text>\n'
            '</svg>\n'
        )
        p_awl = os.path.join(about_dir, "logo-white_s.svg")
        with open(p_awl, "w", encoding="utf-8") as f:
            f.write(about_logo_white_svg)
        print(f"[OK] Đã cập nhật logo About dialog (logo-white_s.svg): {os.path.basename(p_awl)}")

    # C. Cloud Providers (Connect to Cloud: app/providers/onlyoffice/assets)
    oo_provider_dir = os.path.join(APP_DIR, "providers", "onlyoffice")
    oo_assets_dir = os.path.join(oo_provider_dir, "assets")
    if os.path.exists(oo_assets_dir):
        icon_b64_24 = get_icon_b64(24)
        icon_b64_28 = get_icon_b64(28)
        
        # buttonlogo.svg (196x36)
        btn_logo_svg = (
            '<?xml version="1.0" encoding="UTF-8"?>\n'
            '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" '
            'width="196" height="36" viewBox="0 0 196 36">\n'
            f'  <image x="8" y="6" width="24" height="24" xlink:href="data:image/png;base64,{icon_b64_24}"/>\n'
            '  <text x="38" y="24" font-family="\'-apple-system\', \'Segoe UI\', Roboto, Helvetica, sans-serif" '
            'font-weight="bold" font-size="16" fill="#0f172a">Kaola</text>\n'
            '  <text x="86" y="24" font-family="\'-apple-system\', \'Segoe UI\', Roboto, Helvetica, sans-serif" '
            'font-weight="normal" font-size="15" fill="#64748b">Drive</text>\n'
            '</svg>\n'
        )
        p_btn = os.path.join(oo_assets_dir, "buttonlogo.svg")
        with open(p_btn, "w", encoding="utf-8") as f:
            f.write(btn_logo_svg)

        btn_logo_dark_svg = (
            '<?xml version="1.0" encoding="UTF-8"?>\n'
            '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" '
            'width="196" height="36" viewBox="0 0 196 36">\n'
            f'  <image x="8" y="6" width="24" height="24" xlink:href="data:image/png;base64,{icon_b64_24}"/>\n'
            '  <text x="38" y="24" font-family="\'-apple-system\', \'Segoe UI\', Roboto, Helvetica, sans-serif" '
            'font-weight="bold" font-size="16" fill="#ffffff">Kaola</text>\n'
            '  <text x="86" y="24" font-family="\'-apple-system\', \'Segoe UI\', Roboto, Helvetica, sans-serif" '
            'font-weight="normal" font-size="15" fill="#cbd5e1">Drive</text>\n'
            '</svg>\n'
        )
        p_btnd = os.path.join(oo_assets_dir, "buttonlogo_dark.svg")
        with open(p_btnd, "w", encoding="utf-8") as f:
            f.write(btn_logo_dark_svg)

        # listicon.svg (36x36)
        list_icon_svg = (
            '<?xml version="1.0" encoding="UTF-8"?>\n'
            '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" '
            'width="36" height="36" viewBox="0 0 36 36">\n'
            f'  <image x="4" y="4" width="28" height="28" xlink:href="data:image/png;base64,{icon_b64_28}"/>\n'
            '</svg>\n'
        )
        p_list = os.path.join(oo_assets_dir, "listicon.svg")
        with open(p_list, "w", encoding="utf-8") as f:
            f.write(list_icon_svg)

        p_listd = os.path.join(oo_assets_dir, "listicon_dark.svg")
        with open(p_listd, "w", encoding="utf-8") as f:
            f.write(list_icon_svg)

        print("[OK] Đã cập nhật toàn bộ assets nút bấm nhà cung cấp Cloud -> Kaola Drive")

    # D. Cập nhật tên provider trong config.json
    cfg_path = os.path.join(oo_provider_dir, "config.json")
    if os.path.exists(cfg_path):
        try:
            with open(cfg_path, "r", encoding="utf-8") as f:
                cfg = json.load(f)
            cfg["name"] = "Kaola Drive"
            cfg["entryPage"] = "https://drive.kaola.vn"
            cfg["startPage"] = "https://drive.kaola.vn"
            if "check" in cfg:
                del cfg["check"]
            with open(cfg_path, "w", encoding="utf-8") as f:
                json.dump(cfg, f, indent=4)
            print("[OK] Đã cập nhật provider name trong config.json -> 'Kaola Drive' (drive.kaola.vn)")
        except Exception as e:
            print(f"[WARN] Lỗi cập nhật config.json: {e}")

def patch_index_html():
    print("\n--- 3. VÁ CÁC CHUỖI GIAO DIỆN TRONG INDEX.HTML ---")
    if not os.path.exists(INDEX_HTML):
        print(f"[ERROR] Không tìm thấy {INDEX_HTML}")
        return
        
    with open(INDEX_HTML, 'r', encoding='utf-8') as f:
        content = f.read()
    
    replacements = [
        ('Chào mừng đến với ONLYOFFICE Editors cho máy tính!', 'Chào mừng đến với Kaola Office!'),
        ('Chào mừng bạn đến với ONLYOFFICE Editors cho máy tính', 'Chào mừng bạn đến với Kaola Office'),
        ('Chào mừng bạn đến với ONLYOFFICE Desktop Editors!', 'Chào mừng bạn đến với Kaola Office!'),
        ('Chào mừng bạn đến với ONLYOFFICE Desktop Editors', 'Chào mừng bạn đến với Kaola Office'),
        ('Tạo một đám mây ONLYOFFICE', 'Tạo tài khoản Kaola Drive'),
        ('Tạo ONLYOFFICE đám mây', 'Tạo tài khoản Kaola Drive'),
        ('Tạo đám mây Kaola Cloud', 'Tạo tài khoản Kaola Drive'),
        ('Dịch vụ Đám mây ONLYOFFICE', 'Dịch vụ Kaola Drive'),
        ('Dịch vụ Đám mây Kaola Cloud', 'Dịch vụ Kaola Drive'),
        ('đám mây ONLYOFFICE', 'Kaola Drive'),
        ('đám mây Kaola Cloud', 'Kaola Drive'),
        ('ONLYOFFICE Cloud Service', 'Kaola Drive Service'),
        ('Kaola Cloud Service', 'Kaola Drive Service'),
        ('ONLYOFFICE, ownCloud, Nextcloud', 'Kaola Drive, ownCloud, Nextcloud'),
        ('Kaola Cloud, ownCloud, Nextcloud', 'Kaola Drive, ownCloud, Nextcloud'),
        ('settRemoveAddon:"ONLYOFFICE AI Tools"', 'settRemoveAddon:"Kaola AI Copilot"'),
        ('ONLYOFFICE AI Tools: AI trên tất cả các trình soạn thảo', 'Kaola AI Copilot: Trợ lý AI trên tất cả các trình soạn thảo'),
        ("Don't have an ONLYOFFICE cloud? Create one", "Chưa có tài khoản Kaola Drive? Tạo ngay (drive.kaola.vn)"),
        ("Chưa có tài khoản Kaola Cloud? Tạo ngay", "Chưa có tài khoản Kaola Drive? Tạo ngay (drive.kaola.vn)"),
        ('actTemplates:"Mẫu",actPreviewTemplates:"Mẫu",actClouds:"Kaola Drive",actHome:"Trang chủ"', 'actTemplates:"Mẫu",actPreviewTemplates:"Mẫu",actClouds:"Đám mây",actHome:"Trang chủ"'),
        ('actClouds:"Kaola Drive"', 'actClouds:"Clouds"'),
        ('O(r,m(j,{get when(){return yo()},get children(){return m(ut,{href:"/aitools"', 'O(r,m(j,{get when(){return!0},get children(){return m(ut,{href:"/aitools"'),
        ('a=r=>{Ue.available?me()?.restart===!0?(r.preventDefault(),ue("addon:action","askrestart")):me()?.compatible===!1&&(r.preventDefault(),ue("addon:action","incompatible")):(r.preventDefault(),ue("addon:action","intro"))}', 'a=r=>{r.preventDefault(),window.KaolaAccount?.openPricing?.()}'),
        ('get label(){return D("actAiTools","AI Tools")}})}}),s)', 'get label(){return D("actAiTools","Kaola AI")}})}}),s)'),
        ('[yo,to]=F(B.useai)', '[yo,to]=F(!1)'),
        ('children:u=>m(FO,{provider:u,onConnect:t})', 'children:u=>m(FO,{provider:u,onConnect:p=>p?.provider==="onlyoffice"?as(p,"https://drive.kaola.vn"):t(p)})'),
    ]
    
    count = 0
    for old_s, new_s in replacements:
        if old_s in content:
            content = content.replace(old_s, new_s)
            count += 1
            print(f"[REPLACE] Đã thay: '{old_s[:40]}...' -> '{new_s[:40]}...'")
    
    if count > 0:
        with open(INDEX_HTML, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f"[SUCCESS] Đã cập nhật {count} cụm từ giao diện trong index.html")
    else:
        print("[SKIP] index.html đã được chuẩn hóa trước đó.")

def main():
    patch_editors_exe()
    
    # Vá tab icons (portal.svg & portal_light.svg)
    try:
        from patch_tab_icon import patch_icons
        print("\n--- 1.1 VÁ ICON TAB TRÌNH SOẠN THẢO (PORTAL.SVG) ---")
        patch_icons()
    except Exception as e:
        print(f"[WARN] Lỗi vá tab icon: {e}")
        
    # Vá window & taskbar icon (:/app.ico & AppUserModelID)
    try:
        from patch_app_icon import patch_editors_app_icon, patch_desktop_editors
        print("\n--- 1.2 VÁ ICON WINDOW & TASKBAR (:/app.ico & AppUserModelID) ---")
        patch_editors_app_icon()
        patch_desktop_editors()
    except Exception as e:
        print(f"[WARN] Lỗi vá app icon: {e}")

    patch_web_app_logos()
    patch_index_html()
    print("\n--- HOÀN TẤT TOÀN DIỆN PATCH BRANDING CHO KAOLA OFFICE ---")

if __name__ == "__main__":
    main()
