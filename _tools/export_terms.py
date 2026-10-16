# -*- coding: utf-8 -*-
"""一次性脚本：从 assets/translate.js 抽出 TERMS 词表，导出成 data/terms.json，
供 scrape_tool.py 的 Python 端复用同一套离线词表（避免两边词表不一致）。"""
import json
import os
import re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
JS = os.path.join(ROOT, 'assets', 'translate.js')
OUT = os.path.join(ROOT, 'data', 'terms.json')

src = open(JS, encoding='utf-8').read()

# 取 var TERMS = [ ... ]; 这一段
m = re.search(r'var TERMS = \[(.*?)\n  \];', src, re.S)
if not m:
    raise SystemExit('没有找到 TERMS 词表')
body = m.group(1)

# 逐条匹配 ['中文', '英文']
pairs = re.findall(r"\[\s*'((?:[^'\\]|\\.)*)'\s*,\s*'((?:[^'\\]|\\.)*)'\s*\]", body)

def unesc(s):
    return s.replace("\\'", "'").replace('\\\\', '\\')

terms = [[unesc(a), unesc(b)] for a, b in pairs]
# 去重（保留先出现的），并按中文长度倒序排（长词优先匹配）
seen = set()
uniq = []
for zh, en in terms:
    if zh in seen:
        continue
    seen.add(zh)
    uniq.append([zh, en])
uniq.sort(key=lambda p: -len(p[0]))

os.makedirs(os.path.dirname(OUT), exist_ok=True)
with open(OUT, 'w', encoding='utf-8') as f:
    json.dump({'version': 1, 'count': len(uniq), 'terms': uniq},
              f, ensure_ascii=False, indent=0, separators=(',', ':'))

print('导出 %d 个词条 -> %s (%d 字节)' % (len(uniq), OUT, os.path.getsize(OUT)))
