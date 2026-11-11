import os
from PIL import Image, ImageDraw, ImageFont, ImageFilter

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ICON_PATH = os.path.join(BASE_DIR, "icon.png")
PACKAGE_DIR = os.path.join(BASE_DIR, "package")

def create_wizard_small():
    # 55x58 on white background
    w, h = 55, 58
    bg = Image.new("RGB", (w, h), (255, 255, 255))
    
    icon = Image.open(ICON_PATH).convert("RGBA")
    # Resize icon to 44x44
    icon_resized = icon.resize((44, 44), Image.Resampling.LANCZOS)
    
    # Center icon
    offset_x = (w - 44) // 2
    offset_y = (h - 44) // 2
    
    bg.paste(icon_resized, (offset_x, offset_y), icon_resized)
    
    out_bmp = os.path.join(PACKAGE_DIR, "wizard_small.bmp")
    bg.save(out_bmp, "BMP")
    print(f"[OK] Created {out_bmp}: {bg.size}")

def create_wizard_large():
    # 164x314
    w, h = 164, 314
    # Create smooth gradient from dark navy to medium kaola navy
    # Top: #132b55, Bottom: #0a1832
    bg = Image.new("RGBA", (w, h))
    draw = ImageDraw.Draw(bg)
    
    top_color = (22, 54, 105)
    bottom_color = (12, 28, 54)
    
    for y in range(h):
        ratio = y / (h - 1)
        r = int(top_color[0] * (1 - ratio) + bottom_color[0] * ratio)
        g = int(top_color[1] * (1 - ratio) + bottom_color[1] * ratio)
        b = int(top_color[2] * (1 - ratio) + bottom_color[2] * ratio)
        draw.line([(0, y), (w, y)], fill=(r, g, b, 255))
    
    # Add subtle decorative curved wave or ambient glow
    glow = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    glow_draw = ImageDraw.Draw(glow)
    glow_draw.ellipse([(-30, 40), (w + 30, 200)], fill=(40, 85, 155, 60))
    glow = glow.filter(ImageFilter.GaussianBlur(25))
    bg = Image.alpha_composite(bg, glow)
    
    # Load and place icon
    icon = Image.open(ICON_PATH).convert("RGBA")
    icon_size = 88
    icon_resized = icon.resize((icon_size, icon_size), Image.Resampling.LANCZOS)
    
    icon_x = (w - icon_size) // 2
    icon_y = 65
    
    # Add subtle drop shadow under icon
    shadow = Image.new("RGBA", (w, h), (0, 0, 0, 0))
    shadow_draw = ImageDraw.Draw(shadow)
    shadow_draw.rounded_rectangle(
        [icon_x + 4, icon_y + 8, icon_x + icon_size - 4, icon_y + icon_size + 4],
        radius=18,
        fill=(0, 0, 0, 90)
    )
    shadow = shadow.filter(ImageFilter.GaussianBlur(8))
    bg = Image.alpha_composite(bg, shadow)
    
    # Paste icon
    bg.paste(icon_resized, (icon_x, icon_y), icon_resized)
    
    # Add text
    draw = ImageDraw.Draw(bg)
    
    # Font setup
    font_title = None
    font_sub = None
    for font_name in ["segoeui.ttf", "arial.ttf", "calibri.ttf"]:
        try:
            font_title = ImageFont.truetype(f"C:/Windows/Fonts/{font_name}", 16)
            font_sub = ImageFont.truetype(f"C:/Windows/Fonts/{font_name}", 10)
            break
        except Exception:
            continue
    if not font_title:
        font_title = ImageFont.load_default()
        font_sub = ImageFont.load_default()
        
    title_text = "Kaola Office"
    sub_text = "Office Suite"
    
    # Measure text
    title_bbox = draw.textbbox((0, 0), title_text, font=font_title)
    title_w = title_bbox[2] - title_bbox[0]
    title_x = (w - title_w) // 2
    title_y = icon_y + icon_size + 18
    
    draw.text((title_x, title_y), title_text, font=font_title, fill=(255, 255, 255, 240))
    
    sub_bbox = draw.textbbox((0, 0), sub_text, font=font_sub)
    sub_w = sub_bbox[2] - sub_bbox[0]
    sub_x = (w - sub_w) // 2
    sub_y = title_y + 22
    
    draw.text((sub_x, sub_y), sub_text, font=font_sub, fill=(160, 195, 240, 200))
    
    # Subtle accent divider line
    line_w = 40
    line_x = (w - line_w) // 2
    line_y = sub_y + 20
    draw.line([(line_x, line_y), (line_x + line_w, line_y)], fill=(50, 100, 180, 180), width=2)
    
    final_rgb = bg.convert("RGB")
    out_bmp = os.path.join(PACKAGE_DIR, "wizard_large.bmp")
    final_rgb.save(out_bmp, "BMP")
    print(f"[OK] Created {out_bmp}: {final_rgb.size}")

if __name__ == "__main__":
    create_wizard_small()
    create_wizard_large()
