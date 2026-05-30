#!/usr/bin/env python3
"""
Generate a tiny self-hosted subset of the Material Symbols Outlined icon font.

Why: the full variable icon font served by Google Fonts is ~1.12 MB and is
render-blocking. The site only uses ~60 icons, so we ship a subset (~17 KB)
that keeps the exact same ligature markup (<span class="material-symbols-outlined">home</span>)
and the variable axes (FILL, wght) used for the active-nav animation.

IMPORTANT: if you start using a NEW icon name anywhere in src/, re-run this
script, otherwise that icon will be blank. Usage:

    python3 -m venv .venv && source .venv/bin/activate
    pip install fonttools brotli
    python scripts/build-icon-font.py

Output: public/fonts/material-symbols-subset.woff2
"""
import re
import sys
import urllib.request
from pathlib import Path

try:
    from fontTools.ttLib import TTFont
    from fontTools.subset import Subsetter, Options
except ImportError:
    sys.exit("Missing deps. Run: pip install fonttools brotli")

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "src"
OUT = ROOT / "public" / "fonts" / "material-symbols-subset.woff2"
# Full variable axes so FILL 0..1 and wght 100..700 keep working.
CSS_URL = ("https://fonts.googleapis.com/css2?"
           "family=Material+Symbols+Outlined:wght,FILL@100..700,0..1")
UA = ("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 "
      "(KHTML, like Gecko) Chrome/120.0 Safari/537.36")


def get(url: str) -> bytes:
    req = urllib.request.Request(url, headers={"User-Agent": UA})
    with urllib.request.urlopen(req) as r:
        return r.read()


def used_icon_names() -> list[str]:
    """Collect every Material Symbols ligature name referenced in src/.

    Two sources, because icons are used both ways:
      1. Literal text in spans: <span class="material-symbols-outlined">home</span>
      2. Data-driven values rendered dynamically: icon: 'build'  ->  {item.icon}
    """
    names: set[str] = set()
    span = re.compile(r'material-symbols-outlined[^>]*>\s*([a-z_]+)\s*<')
    field = re.compile(r'\bicon"?\s*:\s*[\'"]([a-z_]+)[\'"]')
    for path in SRC.rglob("*"):
        if path.is_file() and path.suffix in {".astro", ".html", ".ts", ".js", ".json", ".md"}:
            text = path.read_text(encoding="utf-8")
            names.update(span.findall(text))
            names.update(field.findall(text))
    return sorted(n for n in names if 2 <= len(n) <= 40)


def main() -> None:
    names = used_icon_names()
    print(f"Found {len(names)} unique icons in src/")

    print("Downloading Material Symbols variable font…")
    css = get(CSS_URL).decode()
    woff2_url = re.search(r"https://[^)]+\.woff2", css).group(0)
    src_path = ROOT / "scripts" / ".material-symbols-full.woff2"
    src_path.write_bytes(get(woff2_url))
    full_kb = src_path.stat().st_size / 1024
    print(f"  full font: {full_kb:.0f} KB")

    font = TTFont(src_path)
    cmap = font.getBestCmap()

    # Resolve each icon name -> output glyph through the ligature (liga) table.
    def gname(ch: str):
        return cmap.get(ord(ch))

    def subtables(gsub):
        for lookup in gsub.LookupList.Lookup:
            for st in lookup.SubTable:
                yield st.ExtSubTable if lookup.LookupType == 7 else st

    ligmap = {}
    for st in subtables(font["GSUB"].table):
        if st.__class__.__name__ == "LigatureSubst":
            for first, ligset in st.ligatures.items():
                for lig in ligset:
                    ligmap[(first, *lig.Component)] = lig.LigGlyph

    icon_glyphs = set()
    missing = []
    for n in names:
        comps = tuple(gname(c) for c in n)
        out = None if None in comps else ligmap.get(comps)
        (icon_glyphs.add(out) if out else missing.append(n))
    if missing:
        print(f"  WARNING: {len(missing)} icon(s) not found in font: {missing}")

    # Drop every ligature that does NOT output one of our icons, so the
    # subsetter's layout closure can't drag in the other ~4000 icons.
    for st in subtables(font["GSUB"].table):
        if st.__class__.__name__ == "LigatureSubst":
            st.ligatures = {
                first: keep
                for first, ligset in st.ligatures.items()
                if (keep := [l for l in ligset if l.LigGlyph in icon_glyphs])
            }

    # Subset by the icon names (letters + underscore) keeping ligature features.
    opts = Options()
    opts.flavor = "woff2"
    opts.layout_features = ["liga", "clig", "calt", "ccmp", "rlig", "locl"]
    opts.hinting = False
    opts.desubroutinize = True
    opts.name_IDs = ["*"]
    sub = Subsetter(options=opts)
    sub.populate(text="".join(names))
    sub.subset(font)

    OUT.parent.mkdir(parents=True, exist_ok=True)
    font.save(OUT)
    src_path.unlink(missing_ok=True)
    out_kb = OUT.stat().st_size / 1024
    print(f"Wrote {OUT.relative_to(ROOT)} — {out_kb:.1f} KB "
          f"({full_kb / out_kb:.0f}x smaller, {len(icon_glyphs)} icons)")


if __name__ == "__main__":
    main()
