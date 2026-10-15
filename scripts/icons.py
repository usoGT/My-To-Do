# Uygulama ikonlarını ve açılış ekranlarını üretir (Pillow gerekir: pip install pillow).
# Çalıştırma: python3 scripts/icons.py   — ürettiği dosyalar depoda olduğu için normalde gerekmez.
import os
from PIL import Image, ImageDraw

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PRIMARY = (79, 70, 229, 255)
BG = (246, 246, 243, 255)

def glyph(draw, W, cx, cy, scale, color='white'):
    # 512'lik çizim alanındaki takvim + onay işaretini (cx, cy) merkezli ve scale ölçekli çizer
    def p(v, c): return c + (v - 256) / 512 * W * scale
    lw = max(1, int(32 / 512 * W * scale))
    d = draw
    d.rounded_rectangle([p(120, cx), p(138, cy), p(392, cx), p(390, cy)], radius=int(40 / 512 * W * scale), outline=color, width=lw)
    for x in (184, 328):
        d.line([p(x, cx), p(106, cy), p(x, cx), p(158, cy)], fill=color, width=lw)
    d.line([(p(196, cx), p(270, cy)), (p(240, cx), p(314, cy)), (p(324, cx), p(222, cy))], fill=color, width=lw, joint='curve')
    r = lw / 2
    for (x, y) in [(184, 106), (328, 106), (184, 158), (328, 158), (196, 270), (324, 222), (240, 314)]:
        d.ellipse([p(x, cx) - r, p(y, cy) - r, p(x, cx) + r, p(y, cy) + r], fill=color)

def icon(size, *, rounded=False, full_bleed=True, scale=0.78, transparent_bg=False, color='white', bg=PRIMARY):
    S = 4
    W = size * S
    img = Image.new('RGBA', (W, W), (0, 0, 0, 0) if (rounded or transparent_bg) else bg)
    d = ImageDraw.Draw(img)
    if rounded:
        d.rounded_rectangle([0, 0, W - 1, W - 1], radius=int(W * 0.22), fill=bg)
    glyph(d, W, W / 2, W / 2, scale, color)
    return img.resize((size, size), Image.LANCZOS)

def splash(size, logo=640):
    img = Image.new('RGBA', (size, size), BG)
    ic = icon(logo, rounded=True, scale=0.9)
    img.paste(ic, ((size - logo) // 2, (size - logo) // 2), ic)
    return img

def save(img, rel, rgb=False):
    path = os.path.join(ROOT, rel)
    if not os.path.isdir(os.path.dirname(path)):
        return False
    (img.convert('RGB') if rgb else img).save(path)
    return True

# --- iOS (saydamlık olmamalı; köşeleri iOS yuvarlar)
save(icon(1024, scale=0.72), 'ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-512@2x.png', rgb=True)
for n in ['splash-2732x2732.png', 'splash-2732x2732-1.png', 'splash-2732x2732-2.png']:
    save(splash(2732), f'ios/App/App/Assets.xcassets/Splash.imageset/{n}', rgb=True)

# --- Android
dens = {'mdpi': 1, 'hdpi': 1.5, 'xhdpi': 2, 'xxhdpi': 3, 'xxxhdpi': 4}
for name, f in dens.items():
    base = f'android/app/src/main/res/mipmap-{name}'
    save(icon(int(48 * f), rounded=True, scale=0.8), f'{base}/ic_launcher.png')
    # Yuvarlak ikon
    s = int(48 * f) * 4
    r = Image.new('RGBA', (s, s), (0, 0, 0, 0))
    ImageDraw.Draw(r).ellipse([0, 0, s - 1, s - 1], fill=PRIMARY)
    glyph(ImageDraw.Draw(r), s, s / 2, s / 2, 0.62)
    save(r.resize((int(48 * f), int(48 * f)), Image.LANCZOS), f'{base}/ic_launcher_round.png')
    # Uyarlanabilir ikon ön yüzü (108dp, ortadaki 72dp güvenli alan)
    save(icon(int(108 * f), transparent_bg=True, scale=0.5), f'{base}/ic_launcher_foreground.png')
    # Bildirim çubuğu ikonu (beyaz, saydam zemin; 24dp)
    save(icon(int(24 * f), transparent_bg=True, scale=1.0), f'android/app/src/main/res/drawable-{name}/ic_stat_planlayici.png') if os.path.isdir(os.path.join(ROOT, f'android/app/src/main/res/drawable-{name}')) else None
for d in ['drawable', 'drawable-port-mdpi', 'drawable-port-hdpi', 'drawable-port-xhdpi', 'drawable-port-xxhdpi', 'drawable-port-xxxhdpi', 'drawable-land-mdpi', 'drawable-land-hdpi', 'drawable-land-xhdpi', 'drawable-land-xxhdpi', 'drawable-land-xxxhdpi']:
    p = os.path.join(ROOT, f'android/app/src/main/res/{d}/splash.png')
    if os.path.exists(p):
        w, h = Image.open(p).size
        img = Image.new('RGBA', (w, h), BG)
        logo = int(min(w, h) * 0.28)
        ic = icon(logo, rounded=True, scale=0.9)
        img.paste(ic, ((w - logo) // 2, (h - logo) // 2), ic)
        img.convert('RGB').save(p)

# --- Masaüstü (Electron): 1024 yuvarlatılmış
save(icon(1024, rounded=True, scale=0.78), 'build/icon.png')
print('İkonlar üretildi.')
