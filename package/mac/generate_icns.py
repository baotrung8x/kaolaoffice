import os
import sys
from PIL import Image

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

def generate_icns():
    base_dir = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
    icon_src = os.path.join(base_dir, "icon.png")
    out_icns = os.path.join(base_dir, "package", "mac", "KaolaOffice.icns")
    
    if not os.path.exists(icon_src):
        print(f"[ERROR] Không tìm thấy file nguồn: {icon_src}")
        return False
        
    print(f"[INFO] Đang tạo macOS ICNS từ: {icon_src}")
    im = Image.open(icon_src)
    im = im.convert("RGBA")
    
    sizes = [16, 32, 64, 128, 256, 512]
    images = []
    for s in sizes:
        resized = im.resize((s, s), Image.Resampling.LANCZOS)
        images.append(resized)
        
    im.save(out_icns, format="ICNS", append_images=images)
    print(f"[SUCCESS] Đã tạo thành công icon macOS: {out_icns} ({os.path.getsize(out_icns)} bytes)")
    return True

if __name__ == "__main__":
    generate_icns()
