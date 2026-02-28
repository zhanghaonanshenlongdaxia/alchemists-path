#!/usr/bin/env python3
"""
生成 Alchemist's Path 游戏的应用图标
创建一个炼金术主题的图标，包含烧瓶和药水元素
"""

from PIL import Image, ImageDraw, ImageFont
import os
import sys

# 图标尺寸配置（Android 标准）
ICON_SIZES = {
    'mdpi': 48,
    'hdpi': 72,
    'xhdpi': 96,
    'xxhdpi': 144,
    'xxxhdpi': 192,
}

# 自适应图标尺寸（foreground 需要 108dp，但实际生成时使用更大的尺寸）
ADAPTIVE_FG_SIZE = 432  # 108dp * 4 for xxxhdpi
ADAPTIVE_BG_SIZE = 432

def create_icon(size, is_foreground=False):
    """创建图标"""
    # 创建透明背景
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    center_x, center_y = size // 2, size // 2
    
    if is_foreground:
        # 前景图标：烧瓶和药水
        # 绘制烧瓶主体
        flask_width = int(size * 0.4)
        flask_height = int(size * 0.6)
        flask_x = center_x - flask_width // 2
        flask_y = center_y - flask_height // 2 + int(size * 0.05)
        
        # 烧瓶底部（圆形）
        flask_bottom_radius = flask_width // 2
        flask_bottom_y = flask_y + flask_height - flask_bottom_radius
        draw.ellipse(
            [flask_x, flask_bottom_y - flask_bottom_radius,
             flask_x + flask_width, flask_bottom_y + flask_bottom_radius],
            fill=(100, 150, 255, 255),  # 蓝色药水
            outline=(60, 100, 200, 255),
            width=max(2, size // 48)
        )
        
        # 烧瓶颈部
        neck_width = int(flask_width * 0.35)
        neck_height = int(flask_height * 0.25)
        neck_x = center_x - neck_width // 2
        neck_y = flask_y
        draw.rectangle(
            [neck_x, neck_y, neck_x + neck_width, neck_y + neck_height],
            fill=(100, 150, 255, 255),
            outline=(60, 100, 200, 255),
            width=max(2, size // 48)
        )
        
        # 烧瓶口（小圆）
        mouth_radius = int(neck_width * 0.4)
        mouth_y = neck_y - mouth_radius
        draw.ellipse(
            [center_x - mouth_radius, mouth_y - mouth_radius,
             center_x + mouth_radius, mouth_y + mouth_radius],
            fill=(100, 150, 255, 255),
            outline=(60, 100, 200, 255),
            width=max(2, size // 48)
        )
        
        # 添加高光
        highlight_y = flask_bottom_y - int(flask_bottom_radius * 0.3)
        highlight_radius = int(flask_bottom_radius * 0.25)
        draw.ellipse(
            [center_x - highlight_radius, highlight_y - highlight_radius,
             center_x + highlight_radius, highlight_y + highlight_radius],
            fill=(150, 200, 255, 180)
        )
        
        # 添加气泡效果
        bubble_size = max(2, size // 32)
        for i in range(3):
            bubble_x = flask_x + int(flask_width * (0.2 + i * 0.3))
            bubble_y = flask_bottom_y - int(flask_bottom_radius * (0.5 + i * 0.2))
            draw.ellipse(
                [bubble_x - bubble_size, bubble_y - bubble_size,
                 bubble_x + bubble_size, bubble_y + bubble_size],
                fill=(200, 230, 255, 200)
            )
        
        # 添加炼金符号（简单的星星/星形）
        star_size = int(size * 0.15)
        star_points = 5
        import math
        for i in range(star_points * 2):
            angle = (i * math.pi) / star_points - math.pi / 2
            if i % 2 == 0:
                radius = star_size * 0.6
            else:
                radius = star_size * 0.3
            x = center_x + int(radius * math.cos(angle))
            y = center_y - int(size * 0.35) + int(radius * math.sin(angle))
            if i == 0:
                star_path = [(x, y)]
            else:
                star_path.append((x, y))
        if len(star_path) > 2:
            draw.polygon(star_path, fill=(255, 220, 100, 255), outline=(255, 200, 50, 255))
    else:
        # 普通图标：完整的烧瓶设计
        # 绘制背景圆形（深色）
        bg_radius = int(size * 0.48)
        draw.ellipse(
            [center_x - bg_radius, center_y - bg_radius,
             center_x + bg_radius, center_y + bg_radius],
            fill=(30, 40, 60, 255),  # 深蓝灰色背景
            outline=(50, 70, 100, 255),
            width=max(2, size // 48)
        )
        
        # 绘制烧瓶主体
        flask_width = int(size * 0.35)
        flask_height = int(size * 0.5)
        flask_x = center_x - flask_width // 2
        flask_y = center_y - flask_height // 2 + int(size * 0.05)
        
        # 烧瓶底部（圆形）
        flask_bottom_radius = flask_width // 2
        flask_bottom_y = flask_y + flask_height - flask_bottom_radius
        draw.ellipse(
            [flask_x, flask_bottom_y - flask_bottom_radius,
             flask_x + flask_width, flask_bottom_y + flask_bottom_radius],
            fill=(100, 150, 255, 255),  # 蓝色药水
            outline=(60, 100, 200, 255),
            width=max(2, size // 48)
        )
        
        # 烧瓶颈部
        neck_width = int(flask_width * 0.35)
        neck_height = int(flask_height * 0.25)
        neck_x = center_x - neck_width // 2
        neck_y = flask_y
        draw.rectangle(
            [neck_x, neck_y, neck_x + neck_width, neck_y + neck_height],
            fill=(100, 150, 255, 255),
            outline=(60, 100, 200, 255),
            width=max(2, size // 48)
        )
        
        # 烧瓶口
        mouth_radius = int(neck_width * 0.4)
        mouth_y = neck_y - mouth_radius
        draw.ellipse(
            [center_x - mouth_radius, mouth_y - mouth_radius,
             center_x + mouth_radius, mouth_y + mouth_radius],
            fill=(100, 150, 255, 255),
            outline=(60, 100, 200, 255),
            width=max(2, size // 48)
        )
        
        # 高光
        highlight_y = flask_bottom_y - int(flask_bottom_radius * 0.3)
        highlight_radius = int(flask_bottom_radius * 0.25)
        draw.ellipse(
            [center_x - highlight_radius, highlight_y - highlight_radius,
             center_x + highlight_radius, highlight_y + highlight_radius],
            fill=(150, 200, 255, 180)
        )
        
        # 气泡
        bubble_size = max(2, size // 32)
        for i in range(3):
            bubble_x = flask_x + int(flask_width * (0.2 + i * 0.3))
            bubble_y = flask_bottom_y - int(flask_bottom_radius * (0.5 + i * 0.2))
            draw.ellipse(
                [bubble_x - bubble_size, bubble_y - bubble_size,
                 bubble_x + bubble_size, bubble_y + bubble_size],
                fill=(200, 230, 255, 200)
            )
        
        # 炼金符号（星星）
        star_size = int(size * 0.12)
        import math
        star_points = 5
        for i in range(star_points * 2):
            angle = (i * math.pi) / star_points - math.pi / 2
            if i % 2 == 0:
                radius = star_size * 0.6
            else:
                radius = star_size * 0.3
            x = center_x + int(radius * math.cos(angle))
            y = center_y - int(size * 0.35) + int(radius * math.sin(angle))
            if i == 0:
                star_path = [(x, y)]
            else:
                star_path.append((x, y))
        if len(star_path) > 2:
            draw.polygon(star_path, fill=(255, 220, 100, 255), outline=(255, 200, 50, 255))
    
    return img

def create_adaptive_background(size):
    """创建自适应图标背景"""
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    center_x, center_y = size // 2, size // 2
    radius = int(size * 0.5)
    
    # 渐变背景（从深蓝到深紫）
    for i in range(radius):
        alpha = int(255 * (1 - i / radius))
        color_r = int(30 + (50 - 30) * (i / radius))
        color_g = int(40 + (60 - 40) * (i / radius))
        color_b = int(60 + (80 - 60) * (i / radius))
        draw.ellipse(
            [center_x - radius + i, center_y - radius + i,
             center_x + radius - i, center_y + radius - i],
            fill=(color_r, color_g, color_b, 255),
            outline=None
        )
    
    # 添加一些装饰性光晕
    for i in range(3):
        glow_radius = int(radius * (0.3 + i * 0.2))
        glow_alpha = 30 - i * 10
        draw.ellipse(
            [center_x - glow_radius, center_y - glow_radius,
             center_x + glow_radius, center_y + glow_radius],
            fill=(100, 150, 200, glow_alpha),
            outline=None
        )
    
    return img

def main():
    """主函数"""
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    android_res_dir = os.path.join(base_dir, 'android', 'app', 'src', 'main', 'res')
    
    print("生成 Alchemist's Path 应用图标...")
    
    # 生成标准图标
    for density, size in ICON_SIZES.items():
        mipmap_dir = os.path.join(android_res_dir, f'mipmap-{density}')
        os.makedirs(mipmap_dir, exist_ok=True)
        
        # 普通图标
        icon = create_icon(size, is_foreground=False)
        icon.save(os.path.join(mipmap_dir, 'ic_launcher.png'), 'PNG')
        print(f"  ✓ 生成 {density}/ic_launcher.png ({size}x{size})")
        
        # 圆形图标（使用相同的设计）
        round_icon = create_icon(size, is_foreground=False)
        # 圆形遮罩
        mask = Image.new('L', (size, size), 0)
        mask_draw = ImageDraw.Draw(mask)
        mask_draw.ellipse([0, 0, size, size], fill=255)
        round_icon.putalpha(mask)
        round_icon.save(os.path.join(mipmap_dir, 'ic_launcher_round.png'), 'PNG')
        print(f"  ✓ 生成 {density}/ic_launcher_round.png ({size}x{size})")
    
    # 生成自适应图标
    anydpi_dir = os.path.join(android_res_dir, 'mipmap-anydpi-v26')
    os.makedirs(anydpi_dir, exist_ok=True)
    
    # 前景图标（xxxhdpi 尺寸）
    fg_dir = os.path.join(android_res_dir, 'mipmap-xxxhdpi')
    os.makedirs(fg_dir, exist_ok=True)
    fg_icon = create_icon(ADAPTIVE_FG_SIZE, is_foreground=True)
    fg_icon.save(os.path.join(fg_dir, 'ic_launcher_foreground.png'), 'PNG')
    print(f"  ✓ 生成 xxxhdpi/ic_launcher_foreground.png ({ADAPTIVE_FG_SIZE}x{ADAPTIVE_FG_SIZE})")
    
    # 背景图标
    bg_icon = create_adaptive_background(ADAPTIVE_BG_SIZE)
    bg_icon.save(os.path.join(fg_dir, 'ic_launcher_background.png'), 'PNG')
    print(f"  ✓ 生成 xxxhdpi/ic_launcher_background.png ({ADAPTIVE_BG_SIZE}x{ADAPTIVE_BG_SIZE})")
    
    # 更新 XML 文件（如果需要）
    ic_launcher_xml = os.path.join(anydpi_dir, 'ic_launcher.xml')
    with open(ic_launcher_xml, 'w', encoding='utf-8') as f:
        f.write('''<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@mipmap/ic_launcher_background"/>
    <foreground android:drawable="@mipmap/ic_launcher_foreground"/>
</adaptive-icon>
''')
    print(f"  ✓ 更新 {ic_launcher_xml}")
    
    ic_launcher_round_xml = os.path.join(anydpi_dir, 'ic_launcher_round.xml')
    with open(ic_launcher_round_xml, 'w', encoding='utf-8') as f:
        f.write('''<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@mipmap/ic_launcher_background"/>
    <foreground android:drawable="@mipmap/ic_launcher_foreground"/>
</adaptive-icon>
''')
    print(f"  ✓ 更新 {ic_launcher_round_xml}")
    
    print("\n✅ 图标生成完成！")

if __name__ == '__main__':
    try:
        main()
    except ImportError:
        print("错误: 需要安装 Pillow 库")
        print("请运行: pip install Pillow")
        sys.exit(1)
    except Exception as e:
        print(f"错误: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
