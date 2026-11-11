import os
from PIL import Image, ImageDraw, ImageFont, ImageFilter

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
APP_DIR = os.path.join(BASE_DIR, 'app')
ICONS_DIR = os.path.join(APP_DIR, 'icons')

os.makedirs(ICONS_DIR, exist_ok=True)

def draw_sheet_icon(size, color, letter, sub_text):
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    s = size / 256.0
    
    margin_x = int(36 * s)
    margin_top = int(20 * s)
    margin_bottom = int(236 * s)
    margin_right = int(220 * s)
    fold_size = int(54 * s)
    
    # Drop shadow
    shadow = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    s_draw = ImageDraw.Draw(shadow)
    s_poly = [
        (margin_x, margin_top + int(6 * s)),
        (margin_right - fold_size, margin_top + int(6 * s)),
        (margin_right, margin_top + fold_size + int(6 * s)),
        (margin_right, margin_bottom + int(6 * s)),
        (margin_x, margin_bottom + int(6 * s)),
    ]
    s_draw.polygon(s_poly, fill=(0, 0, 0, 75))
    shadow = shadow.filter(ImageFilter.GaussianBlur(max(1, int(8 * s))))
    img = Image.alpha_composite(img, shadow)
    draw = ImageDraw.Draw(img)
    
    # Main sheet polygon
    poly = [
        (margin_x, margin_top),
        (margin_right - fold_size, margin_top),
        (margin_right, margin_top + fold_size),
        (margin_right, margin_bottom),
        (margin_x, margin_bottom),
    ]
    draw.polygon(poly, fill=color)
    
    # Subtle highlights
    draw.line([(margin_x, margin_top), (margin_right - fold_size, margin_top)], fill=(255, 255, 255, 110), width=max(1, int(2 * s)))
    draw.line([(margin_x, margin_top), (margin_x, margin_bottom)], fill=(255, 255, 255, 80), width=max(1, int(2 * s)))
    
    # Flap
    flap_poly = [
        (margin_right - fold_size, margin_top),
        (margin_right, margin_top + fold_size),
        (margin_right - fold_size, margin_top + fold_size),
    ]
    flap_color = tuple(min(255, int(c * 1.35)) for c in color[:3]) + (255,)
    draw.polygon(flap_poly, fill=flap_color)
    draw.line([(margin_right - fold_size, margin_top), (margin_right, margin_top + fold_size)], fill=(0, 0, 0, 45), width=max(1, int(2 * s)))
    
    # Typography
    font_main = None
    font_sub = None
    font_names = ['segoeuib.ttf', 'arialbd.ttf', 'trebucbd.ttf', 'calibrib.ttf']
    main_size = max(10, int(76 * s) if len(letter) <= 2 else int(52 * s))
    sub_size = max(6, int(22 * s))
    
    for fn in font_names:
        p = f'C:/Windows/Fonts/{fn}'
        if os.path.exists(p):
            try:
                font_main = ImageFont.truetype(p, main_size)
                font_sub = ImageFont.truetype(p, sub_size)
                break
            except Exception:
                continue
    if not font_main:
        font_main = ImageFont.load_default()
        font_sub = ImageFont.load_default()
        
    center_x = (margin_x + margin_right) // 2
    center_y = int(122 * s)
    
    bbox = draw.textbbox((0, 0), letter, font=font_main)
    w = bbox[2] - bbox[0]
    h = bbox[3] - bbox[1]
    draw.text((center_x - w // 2, center_y - h // 2), letter, font=font_main, fill=(255, 255, 255, 255))
    
    sub_y = int(184 * s)
    s_bbox = draw.textbbox((0, 0), sub_text, font=font_sub)
    sw = s_bbox[2] - s_bbox[0]
    draw.text((center_x - sw // 2, sub_y), sub_text, font=font_sub, fill=(255, 255, 255, 230))
    
    return img

def main():
    print('--- TAO BO BIEU TUONG TAI LIEU WINDOWS (.ICO) CHO KAOLA OFFICE ---')
    configs = [
        ('docx', (24, 90, 189, 255), 'W', 'DOCX'),
        ('xlsx', (16, 124, 65, 255), 'X', 'XLSX'),
        ('pptx', (216, 59, 1, 255), 'P', 'PPTX'),
        ('pdf', (196, 49, 24, 255), 'PDF', 'DOCUMENT'),
    ]
    sizes = [(16, 16), (20, 20), (24, 24), (32, 32), (40, 40), (48, 48), (64, 64), (128, 128), (256, 256)]
    for name, color, letter, sub in configs:
        master = draw_sheet_icon(512, color, letter, sub)
        png_path = os.path.join(ICONS_DIR, f'{name}.png')
        img_256 = master.resize((256, 256), Image.Resampling.LANCZOS)
        img_256.save(png_path, 'PNG')
        ico_path = os.path.join(ICONS_DIR, f'{name}.ico')
        img_256.save(ico_path, format='ICO', sizes=sizes)
        print(f'[OK] Da tao: {os.path.relpath(ico_path, BASE_DIR)} ({os.path.getsize(ico_path):,} bytes) va {os.path.relpath(png_path, BASE_DIR)}')

if __name__ == '__main__':
    main()
