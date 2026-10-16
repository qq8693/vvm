# -*- coding: utf-8 -*-
"""生成示例商品占位图（纯 SVG，无需任何依赖）。
用法：python make_placeholders.py
生成到 ../images/ 下。这些图仅用于演示，替换成你自己的商品照片即可。
"""
import os

OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "images")
os.makedirs(OUT, exist_ok=True)

W, H = 900, 1125  # 4:5 竖版，服装类电商标准比例

# 每张占位图：文件名, 浅色底, 深色描边, 图标路径(d), 中文标注, 英文标注
ITEMS = [
    (
        "demo-coat",
        "#F2EDE6", "#C7B49A", "#6B6157",
        '<path d="M450 330 L330 372 L276 470 L340 512 L372 462 L372 790 L528 790 L528 462 L560 512 L624 470 L570 372 Z"/>'
        '<path d="M450 330 L450 790"/>',
        "外套 / 大衣", "COAT",
    ),
    (
        "demo-bag",
        "#EFEFEE", "#B9B9B6", "#5A5A58",
        '<path d="M348 430 L552 430 L588 762 L312 762 Z"/>'
        '<path d="M392 430 C392 344 508 344 508 430"/>'
        '<path d="M348 520 L552 520"/>',
        "包袋", "BAG",
    ),
    (
        "demo-scarf",
        "#F4EEEA", "#D5BCAE", "#7A665C",
        '<path d="M330 360 C400 300 500 420 570 360"/>'
        '<path d="M330 360 L330 640 L400 700 L400 420"/>'
        '<path d="M570 360 L570 640 L500 700 L500 420"/>'
        '<path d="M348 470 L386 470 M548 470 L510 470"/>',
        "丝巾 / 配饰", "SCARF",
    ),
    (
        "demo-shoe",
        "#F1F1EF", "#C2C2BE", "#5C5C58",
        '<path d="M300 640 C300 560 360 552 396 540 L470 512 L520 596 L612 636 C628 644 628 664 612 664 L316 664 C304 664 300 656 300 640 Z"/>'
        '<path d="M470 512 L446 570 M520 596 L498 642"/>'
        '<path d="M300 608 L612 608" stroke-dasharray="10 9"/>',
        "鞋履", "SHOES",
    ),
    (
        "demo-pants",
        "#F0EFEA", "#BDBBB0", "#5C5B53",
        '<path d="M360 320 L540 320 L556 780 L470 780 L452 500 L448 500 L430 780 L344 780 Z"/>'
        '<path d="M360 320 L344 780 M540 320 L556 780"/>'
        '<path d="M352 400 L548 400"/>',
        "裤装", "PANTS",
    ),
    (
        "demo-earring",
        "#F5F0EE", "#D8C0B6", "#7C675E",
        '<circle cx="450" cy="560" r="76" fill="none"/>'
        '<path d="M450 356 L450 400" stroke-dasharray="8 8"/>'
        '<path d="M450 400 C398 424 398 476 450 484 C502 476 502 424 450 400 Z"/>'
        '<circle cx="450" cy="560" r="26"/>'
        '<path d="M330 700 C390 660 510 660 570 700" stroke-dasharray="6 10"/>',
        "首饰", "JEWELRY",
    ),
    (
        "demo-knit",
        "#F1EFEA", "#BFBCB2", "#5B5A53",
        '<path d="M354 400 L354 700 M546 400 L546 700"/>'
        '<path d="M354 400 L306 470 L334 500 L354 466"/>'
        '<path d="M546 400 L594 470 L566 500 L546 466"/>'
        '<path d="M354 400 L400 344 L500 344 L546 400"/>'
        '<path d="M354 400 L546 400 L546 700 L354 700 Z"/>'
        '<path d="M400 344 L400 700 M500 344 L500 700" stroke-dasharray="9 9"/>'
        '<path d="M354 700 L546 700"/>',
        "针织 / 上衣", "KNIT",
    ),
    (
        "demo-dress",
        "#F4F1EF", "#C9BDB8", "#655A56",
        '<path d="M396 340 L504 340 L522 404 L482 420 L482 500 L520 780 L380 780 L418 500 L418 420 L378 404 Z"/>'
        '<path d="M396 340 C420 372 480 372 504 340"/>'
        '<path d="M418 500 L482 500"/>'
        '<path d="M400 660 L500 660" stroke-dasharray="8 9"/>',
        "连衣裙", "DRESS",
    ),
]

TPL = '''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}" width="{w}" height="{h}" role="img" aria-label="{cn}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0.35" y2="1">
      <stop offset="0%" stop-color="#FFFFFF"/>
      <stop offset="55%" stop-color="{bg}"/>
      <stop offset="100%" stop-color="{deep}"/>
    </linearGradient>
    <radialGradient id="glow" cx="50%" cy="38%" r="62%">
      <stop offset="0%" stop-color="#FFFFFF" stop-opacity="0.95"/>
      <stop offset="100%" stop-color="#FFFFFF" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="{w}" height="{h}" fill="url(#bg)"/>
  <rect width="{w}" height="{h}" fill="url(#glow)"/>
  <circle cx="450" cy="470" r="286" fill="#FFFFFF" opacity="0.55"/>
  <circle cx="450" cy="470" r="286" fill="none" stroke="{accent}" stroke-opacity="0.35"/>
  <g fill="none" stroke="{ink}" stroke-width="9" stroke-linecap="round" stroke-linejoin="round" opacity="0.82">
    {icon}
  </g>
  <g font-family="'PingFang SC','Microsoft YaHei','Helvetica Neue',Helvetica,Arial,sans-serif" text-anchor="middle">
    <text x="450" y="930" font-size="34" letter-spacing="14" fill="{ink}" opacity="0.85">{en}</text>
    <text x="450" y="982" font-size="26" letter-spacing="3" fill="{ink}" opacity="0.5">{cn}</text>
    <text x="450" y="1032" font-size="21" letter-spacing="2" fill="{ink}" opacity="0.34">示例图片 · 请替换为你的商品照片</text>
  </g>
</svg>
'''

for name, bg, accent, ink, icon, cn, en in ITEMS:
    svg = TPL.format(w=W, h=H, bg=bg, deep=bg, accent=accent, ink=ink, icon=icon, cn=cn, en=en)
    path = os.path.join(OUT, name + ".svg")
    with open(path, "w", encoding="utf-8") as f:
        f.write(svg)
    print("wrote", os.path.relpath(path))
