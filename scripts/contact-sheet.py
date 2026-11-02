#!/usr/bin/env python3
"""Tile QA stills into labelled contact sheets: out/stills/sheet-<prefix>-N.png"""
import sys, glob
from pathlib import Path
from PIL import Image, ImageDraw
prefix = sys.argv[1] if len(sys.argv) > 1 else "film"
cols = int(sys.argv[2]) if len(sys.argv) > 2 else 3
per = int(sys.argv[3]) if len(sys.argv) > 3 else 9
files = sorted(glob.glob(f"out/stills/{prefix}-[0-9]*.png"))
for s in range(0, len(files), per):
    group = files[s:s+per]
    ims = [Image.open(f).convert("RGB") for f in group]
    w, h = ims[0].size
    tw = 640 if w > h else 300
    th = int(h * tw / w)
    rows = (len(ims) + cols - 1) // cols
    sheet = Image.new("RGB", (cols * tw + (cols + 1) * 6, rows * th + (rows + 1) * 6), (40, 40, 40))
    for i, (im, f) in enumerate(zip(ims, group)):
        im = im.resize((tw, th), Image.LANCZOS)
        x, y = 6 + (i % cols) * (tw + 6), 6 + (i // cols) * (th + 6)
        sheet.paste(im, (x, y))
        d = ImageDraw.Draw(sheet)
        fr = int(Path(f).stem.split("-")[-1])
        d.rectangle([x, y, x + 120, y + 20], fill=(255, 210, 0))
        d.text((x + 4, y + 4), f"f{fr} {fr/30:.2f}s", fill=(0, 0, 0))
    out = f"out/stills/sheet-{prefix}-{s // per + 1}.png"
    sheet.save(out)
    print(out)
