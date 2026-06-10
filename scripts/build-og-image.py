#!/usr/bin/env python3
"""
Generate the default Open Graph image (public/images/og-default.jpg).

Why: og:image is referenced by every page (BaseLayout) and by the
Organization schema. The image is built from the site's own self-hosted
fonts and design tokens so it stays on-brand: dark background #0B0A14,
primary/secondary glows, "The French Bot" in Mr Dafoe with the same
gradient as .gradient-text, subtitle in Space Grotesk.

Re-run only if the branding changes. Usage:
    pip install pillow fonttools brotli
    python3 scripts/build-og-image.py

Output: public/images/og-default.jpg (1200x630)
"""
from pathlib import Path
import io

from fontTools.ttLib import TTFont
from PIL import Image, ImageDraw, ImageFilter, ImageFont

ROOT = Path(__file__).resolve().parent.parent
FONTS = ROOT / "public" / "fonts"
OUT = ROOT / "public" / "images" / "og-default.jpg"

W, H = 1200, 630

# Design tokens (src/styles/globals.css)
BG = (11, 10, 20)            # --color-bg-base #0B0A14
PRIMARY = (53, 36, 232)      # --color-primary #3524E8
SECONDARY = (199, 0, 211)    # --color-secondary #C700D3
PRIMARY_LIGHT = (194, 193, 255)    # --color-primary-light #c2c1ff
SECONDARY_LIGHT = (255, 169, 251)  # --color-secondary-light #ffa9fb
TEXT_SECONDARY = (199, 196, 217)   # --color-text-secondary #c7c4d9
TEXT_MUTED = (144, 143, 162)       # --color-text-muted #908fa2


def load_font(woff2_name: str, size: int) -> ImageFont.FreeTypeFont:
    """Decompress one of the site's woff2 files in memory and load it in PIL."""
    font = TTFont(FONTS / woff2_name)
    font.flavor = None  # woff2 -> plain ttf
    buf = io.BytesIO()
    font.save(buf)
    buf.seek(0)
    return ImageFont.truetype(buf, size)


def glow(img: Image.Image, center: tuple[int, int], radius: int, color: tuple, alpha: int) -> None:
    """Blurred radial glow, same spirit as the blur-[120px] divs of the site."""
    layer = Image.new("RGBA", img.size, (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    x, y = center
    d.ellipse([x - radius, y - radius, x + radius, y + radius], fill=color + (alpha,))
    layer = layer.filter(ImageFilter.GaussianBlur(radius * 0.6))
    img.alpha_composite(layer)


def gradient_text(img: Image.Image, text: str, font: ImageFont.FreeTypeFont, center_x: int, top_y: int) -> int:
    """Draw text filled with the .gradient-text gradient. Returns bottom y."""
    bbox = font.getbbox(text)
    tw, th = bbox[2] - bbox[0], bbox[3] - bbox[1]
    pad = 60  # room for descenders/swashes of the script font
    mask = Image.new("L", (tw + pad * 2, th + pad * 2), 0)
    ImageDraw.Draw(mask).text((pad - bbox[0], pad - bbox[1]), text, font=font, fill=255)

    grad = Image.new("RGBA", mask.size)
    for gx in range(mask.size[0]):
        t = gx / max(1, mask.size[0] - 1)
        c = tuple(round(PRIMARY_LIGHT[i] + (SECONDARY_LIGHT[i] - PRIMARY_LIGHT[i]) * t) for i in range(3))
        ImageDraw.Draw(grad).line([(gx, 0), (gx, mask.size[1])], fill=c + (255,))

    img.alpha_composite(Image.composite(grad, Image.new("RGBA", grad.size, (0, 0, 0, 0)), mask),
                        (center_x - mask.size[0] // 2, top_y - pad))
    return top_y + th


def main() -> None:
    img = Image.new("RGBA", (W, H), BG + (255,))

    glow(img, (140, 120), 260, PRIMARY, 110)
    glow(img, (1080, 540), 260, SECONDARY, 95)
    glow(img, (600, 660), 200, PRIMARY, 60)

    script = load_font("mr-dafoe-400-latin.woff2", 130)
    headline = load_font("space-grotesk-700-latin.woff2", 34)
    body = load_font("outfit-400-latin.woff2", 26)

    d = ImageDraw.Draw(img)

    bottom = gradient_text(img, "The French Bot", script, W // 2, 180)

    subtitle = "FORMATION IA  ·  COACHING  ·  AUTOMATISATION"
    sb = headline.getbbox(subtitle)
    d.text(((W - (sb[2] - sb[0])) // 2, bottom + 92), subtitle, font=headline, fill=(255, 255, 255))

    tagline = "Pour dirigeants de TPE et PME — Claude, no-code, agents IA"
    tb = body.getbbox(tagline)
    d.text(((W - (tb[2] - tb[0])) // 2, bottom + 150), tagline, font=body, fill=TEXT_SECONDARY)

    # neural-trace style gradient line
    line_y, line_w = bottom + 230, 360
    for gx in range(line_w):
        t = gx / (line_w - 1)
        c = tuple(round(PRIMARY[i] + (SECONDARY[i] - PRIMARY[i]) * t) for i in range(3))
        edge = min(t, 1 - t) * 4  # fade in/out at both ends
        a = round(255 * min(1, edge))
        d.line([(W // 2 - line_w // 2 + gx, line_y), (W // 2 - line_w // 2 + gx, line_y + 2)], fill=c + (a,))

    site = "thefrenchbot.com"
    sb2 = body.getbbox(site)
    d.text(((W - (sb2[2] - sb2[0])) // 2, line_y + 28), site, font=body, fill=TEXT_MUTED)

    OUT.parent.mkdir(parents=True, exist_ok=True)
    img.convert("RGB").save(OUT, "JPEG", quality=88, optimize=True, progressive=True)
    print(f"OK {OUT} ({OUT.stat().st_size / 1024:.0f} KB)")


if __name__ == "__main__":
    main()
