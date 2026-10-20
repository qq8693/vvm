# -*- coding: utf-8 -*-
"""
商品采集工具  scrape_tool.py
--------------------------------------------------------------------------
用途：粘贴上家（微商相册 / 微店 等）的商品链接，一键采集图片和文字描述，
      补充标题、价格、品类后，直接写进 data/products.js。

用法：双击同目录下的「启动采集工具.bat」，浏览器会自动打开操作界面。
      关闭黑色命令行窗口即停止工具。

依赖：只用 Python 标准库，不需要安装任何东西。
--------------------------------------------------------------------------
"""
import base64
import json
import os
import random
import re
import string
import sys
import threading
import time
import webbrowser
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib import parse as urlparse
from urllib import request as urlreq

# ------------------------------ 基础配置 ----------------------------------
ROOT = os.path.dirname(os.path.abspath(__file__))
DATA_FILE = os.path.join(ROOT, 'data', 'products.js')
IMAGES_DIR = os.path.join(ROOT, 'images')
PORT = 8765

# 离线翻译词表位置（由 assets/translate.js 导出成 JSON，供 Python 端复用同一套词表）
TERMS_FILE = os.path.join(ROOT, 'data', 'terms.json')

UA = ('Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) '
      'AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.6 Mobile/15E148 Safari/604.1')

KEY_MAP = {  # 中文 / 英文 / 关键字 -> 提示用的中文名
    'name': '标题', 'price': '价格', 'category': '品类',
}

HEADER = """/* ==========================================================================
   商品数据文件（中英双语）—— 由「商品管理工具 admin.html / 采集工具」自动生成
   生成时间：{time}
   修改商品请打开 admin.html，不要手改这个文件。
   带 En 后缀的是英文字段，留空时英文界面自动回退显示中文。
   ========================================================================== */
"""


# ------------------------------ 小工具 ------------------------------------
def log(*a):
    print(*a, flush=True)


def new_id():
    pool = string.ascii_lowercase + string.digits
    return 'p_' + ''.join(random.choice(pool) for _ in range(13))


def now_str():
    return time.strftime('%Y/%m/%d %H:%M:%S')


def human_size(n):
    if n >= 1048576:
        return '%.2f MB' % (n / 1048576.0)
    if n >= 1024:
        return '%.1f KB' % (n / 1024.0)
    return '%d B' % n


# --------------------------- 数据文件读写 ---------------------------------
def read_data():
    if not os.path.isfile(DATA_FILE):
        raise RuntimeError('找不到数据文件：%s' % DATA_FILE)
    text = open(DATA_FILE, encoding='utf-8').read()
    i, j = text.find('{'), text.rfind('}')
    if i < 0 or j < 0:
        raise RuntimeError('products.js 内容格式不对，请先用 admin.html 导出一次')
    body = text[i:j + 1]
    try:
        return json.loads(body)
    except Exception:
        # 容错：去掉对象里的块注释再试一次
        body2 = re.sub(r'/\*[\s\S]*?\*/', '', body)
        return json.loads(body2)


def backup_data():
    if os.path.isfile(DATA_FILE):
        bak = DATA_FILE + '.bak'
        try:
            with open(DATA_FILE, 'rb') as s, open(bak, 'wb') as d:
                d.write(s.read())
            return bak
        except Exception:
            return None
    return None


def write_data(d):
    d['updatedAt'] = time.strftime('%Y-%m-%dT%H:%M:%S')
    for i, p in enumerate(d.get('products', [])):
        p['order'] = i + 1
    out = (HEADER.format(time=now_str())
           + 'window.SHOP_DATA = '
           + json.dumps(d, ensure_ascii=False, indent=2)
           + ';\n')
    with open(DATA_FILE, 'w', encoding='utf-8', newline='\n') as f:
        f.write(out)
    return len(out.encode('utf-8'))


# ------------------------------- 采集 -------------------------------------
TOKEN_RE = re.compile(r'^_[A-Za-z0-9_\-]{8,}$')


def parse_shop_url(u):
    """从商品链接中解析出 host / albumId / itemId"""
    u = (u or '').strip()
    if not u:
        raise ValueError('请先粘贴商品链接')
    if not re.match(r'^https?://', u, re.I):
        u = 'https://' + u
    p = urlparse.urlparse(u)
    if not p.netloc:
        raise ValueError('这个链接看起来不完整，请复制店铺里的完整商品链接')
    host = '%s://%s' % (p.scheme, p.netloc)
    raw = (p.path or '') + '/#/' + (p.fragment or '')
    segs = [s for s in re.split(r'[/#?&]', raw) if s]
    toks = [s for s in segs if TOKEN_RE.match(s)]

    album = item = None
    for key in ('theme_detail', 'product', 'goods_detail', 'goods'):
        if key in segs:
            k = segs.index(key)
            rest = [s for s in segs[k + 1:] if TOKEN_RE.match(s)]
            if len(rest) >= 2:
                album, item = rest[0], rest[1]
                break
    if not album and len(toks) >= 2:
        album, item = toks[-2], toks[-1]
    if not album or not item:
        raise ValueError('没能从这个链接里找到商品编号。\n'
                         '请打开商品页面后，复制浏览器地址栏里完整的链接（通常以 /weshop/product/ 开头）。')
    return host, album, item


def http_get(url, timeout=45, referer=None, extra_headers=None):
    h = {'User-Agent': UA, 'Accept': '*/*'}
    if referer:
        h['Referer'] = referer
    if extra_headers:
        h.update(extra_headers)
    req = urlreq.Request(url, headers=h)
    with urlreq.urlopen(req, timeout=timeout) as r:
        return r.read()


def _rebuild_opener():
    """带 cookie 的 opener：先访问商品页拿到游客 token，再调接口"""
    import http.cookiejar
    cj = http.cookiejar.CookieJar()
    return urlreq.build_opener(urlreq.HTTPCookieProcessor(cj))


def fetch_product(page_url):
    host, album, item = parse_shop_url(page_url)
    opener = _rebuild_opener()
    page = '%s/weshop/product/%s/%s' % (host, album, item)

    # 1) 打开商品页，让服务器下发游客 token cookie
    try:
        req = urlreq.Request(page, headers={'User-Agent': UA})
        opener.open(req, timeout=45).read()
    except Exception as e:
        raise RuntimeError('打不开这个商品页：%s\n%s' % (e, page))

    # 2) 调商品详情接口
    api = ('%s/commodity/view?targetAlbumId=%s&itemId=%s&transLang=zh&auditPassword='
           % (host, album, item))
    req2 = urlreq.Request(api, headers={
        'User-Agent': UA,
        'Accept': 'application/json, text/plain, */*',
        'Referer': page,
    })
    raw = opener.open(req2, timeout=45).read()
    try:
        import gzip
        txt = gzip.decompress(raw).decode('utf-8')
    except Exception:
        txt = raw.decode('utf-8', 'replace')
    try:
        j = json.loads(txt)
    except Exception:
        raise RuntimeError('对方返回的内容无法解析，可能这个链接不是商品详情页。')

    if not j.get('success') or not j.get('result'):
        msg = j.get('errmsg') or j.get('message') or '未知错误'
        if '登录' in str(msg):
            raise RuntimeError('对方要求登录才能查看（%s）。\n'
                               '这种情况一般是店铺设置了「仅好友可见」，建议直接用微信打开该商品，'
                               '长按图片保存后手动上传。' % msg)
        raise RuntimeError('采集失败：%s' % msg)

    c = j['result']['commodity'] or {}
    title = (c.get('title') or '').strip()
    imgs = [u for u in (c.get('imgsSrc') or []) if u]
    if not imgs:
        imgs = [re.sub(r'\?.*$', '', u) for u in (c.get('imgs') or []) if u]
    tags = [t.get('tagName') for t in (c.get('tags') or []) if t.get('tagName')]

    lines = [l.strip() for l in title.split('\n') if l.strip()]
    first = lines[0] if lines else ''

    return {
        'host': host,
        'albumId': album,
        'itemId': item,
        'pageUrl': page,
        'shopName': c.get('shop_name') or '',
        'titleFull': title,
        'titleFirst': first,
        'images': imgs,
        'tags': tags,
        'publishTime': c.get('time') or '',
        'sizesGuess': guess_sizes(title),
    }


def guess_sizes(text):
    """从文案里猜尺码，只认比较明确的写法，猜不到就返回空"""
    if not text:
        return []
    pats = [
        r'(?:码数|尺码|尺寸|sizes?|size)\s*[:：]?\s*((?:\d{1,3}[\s,，、/·-]*)+\d{1,3})',
    ]
    for p in pats:
        m = re.search(p, text, re.I)
        if m:
            nums = re.findall(r'\d{1,3}', m.group(1))
            nums = [n for n in nums if 20 <= int(n) <= 60]
            if len(nums) >= 2:
                return nums[:12]
    return []


def add_ci_params(url, max_side, quality):
    """给图片地址加上腾讯云图片处理的缩放/压缩参数"""
    base = re.sub(r'\?.*$', '', url)
    if max_side <= 0:
        return url
    return '%s?imageMogr2/auto-orient/thumbnail/!%dx%dr/quality/%d/format/jpg' % (
        base, max_side, max_side, quality)


def ci_quality(max_side):
    if max_side >= 1200:
        return 85
    if max_side >= 900:
        return 80
    return 78


def save_data_uri(data_uri, key):
    """把 data:image/...;base64 的内容写进 images/ 文件夹，返回相对路径"""
    os.makedirs(IMAGES_DIR, exist_ok=True)
    m = re.match(r'^data:image/(png|jpeg|jpg|webp|gif);base64,(.*)$', data_uri, re.S)
    if not m:
        return None
    ext = {'jpeg': 'jpg', 'jpg': 'jpg', 'png': 'png', 'webp': 'webp', 'gif': 'gif'}.get(m.group(1), 'jpg')
    try:
        raw = base64.b64decode(m.group(2))
    except Exception:
        return None
    if len(raw) < 100:
        return None
    name = '%s.%s' % (key, ext)
    with open(os.path.join(IMAGES_DIR, name), 'wb') as f:
        f.write(raw)
    return 'images/' + name


# ------------------------------ 数据文件瘦身 -------------------------------
def compact_embedded_images():
    """把 products.js 里所有内嵌 base64 图片抽出来存成文件，返回统计"""
    d = read_data()
    n_prod, n_shop, skip = 0, 0, 0
    for i, p in enumerate(d.get('products', []), 1):
        key = re.sub(r'[^a-zA-Z0-9]', '', str(p.get('id') or 'p%d' % i))[-8:].lower()
        new_images = []
        changed = False
        for j, u in enumerate(p.get('images') or [], 1):
            if str(u).startswith('data:image'):
                path = save_data_uri(u, '%s_c%d' % (key, j))
                if path:
                    new_images.append(path)
                    n_prod += 1
                    changed = True
                    continue
                skip += 1
            new_images.append(u)
        if changed:
            p['images'] = new_images

    shop = d.get('shop') or {}
    hero = shop.get('hero') or {}
    if str(hero.get('image') or '').startswith('data:image'):
        path = save_data_uri(hero['image'], 'hero')
        if path:
            hero['image'] = path
            n_shop += 1
    contact = shop.get('contact') or {}
    if str(contact.get('wechatQr') or '').startswith('data:image'):
        path = save_data_uri(contact['wechatQr'], 'wechat-qr')
        if path:
            contact['wechatQr'] = path
            n_shop += 1

    backup_data()
    size = write_data(d)
    return {'converted': n_prod + n_shop, 'skipped': skip, 'size': size}



def download_images(urls, item_id, max_side, quality):
    os.makedirs(IMAGES_DIR, exist_ok=True)
    key = re.sub(r'[^a-zA-Z0-9]', '', item_id)[-8:].lower() or 'item'
    saved, failed = [], []
    for i, u in enumerate(urls, 1):
        try:
            data = http_get(add_ci_params(u, max_side, quality), timeout=60,
                            referer='https://xcimg.szwego.com/')
            if len(data) < 200:
                raise RuntimeError('返回内容太小')
            name = '%s_%d.jpg' % (key, i)
            with open(os.path.join(IMAGES_DIR, name), 'wb') as f:
                f.write(data)
            saved.append('images/' + name)
        except Exception as e:
            failed.append('%s (%s)' % (u[:70], e))
    return saved, failed


# --------------------------- 离线翻译（纯本地） ----------------------------
# 词表与 assets/translate.js 共用同一份（导出到 data/terms.json）：
#   _tools/export_terms.py 改完 translate.js 后重新导出即可。
_TERMS_CACHE = {'mtime': None, 'sorted': [], 'dict': {}}

_CJK_RE = re.compile(r'[\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff]')
# 只有这些字符的行才叫「纯符号行」，是可以丢掉的
_JUNK_ONLY_RE = re.compile(r'^[\s,.;:!?·|+\-—_/\\\'"()\[\]{}~<>@#$%^&*=～！“”‘’（）【】《》，。；：？、]+$')

_CH_PUNC = {
    '，': ',', '。': '.', '、': ',', '；': ';', '：': ':', '？': '?', '！': '!',
    '（': ' (', '）': ')', '【': ' [', '】': ']', '《': ' "', '》': '"',
    '“': '"', '”': '"', '‘': "'", '’': "'", '～': '~', '·': ' · ',
}
# 标题里这些小词保持小写（与 translate.js 的 SMALL 保持一致）
_SMALL_WORDS = {'a', 'an', 'the', 'and', 'or', 'with', 'for', 'of', 'in', 'on', 'to'}
# 这些词在英文里按品牌/专有名词原样输出
_BRANDS = ['Gucci', 'Coach', 'Miu Miu', 'Dior', 'YSL', 'LV', 'Nike', 'FILA',
           'Adidas', 'Prada', 'Chanel', 'Hermes', 'Goyard', 'Bottega Veneta',
           'Burberry', 'Chloe', 'Loewe', 'Balenciaga', 'Celine', 'Givenchy',
           'Fendi', 'Valentino', 'New Balance', 'Air Jordan', 'Jordan',
           'Louis Vuitton', 'Saint Laurent', 'Air Force 1', 'Horsebit',
           'T-shirt', 'XS', 'One Size', 'Plus Size']

# 整句规则（在分词之前跑），处理「材质：牛皮」「尺码：26-35」这类写法
# 顺序有意义：具体规则在前，泛化规则在后。
_RULES = [
    (re.compile(r'尺码?\s*[：:]\s*(\d{2,3})\s*[-–~到]\s*(\d{2,3})'), r'Sizes: \1-\2'),
    (re.compile(r'码数\s*(\d{2,3})\s*[-–~到]\s*(\d{2,3})'), r'Sizes: \1-\2'),
    (re.compile(r'码数\s*([\d\s,，、]{3,})'), r'Sizes: \1'),
    (re.compile(r'尺码?\s*[：:]\s*([\d\s\-–~.,，、]+)'), r'Sizes: \1'),
    (re.compile(r'尺寸\s*[：:]\s*'), r'Size: '),
    (re.compile(r'尺寸\s*(\d{2,3})\s*[*xX×]\s*(\d{2,3})(?:\s*[*xX×]\s*(\d{2,3}))?'),
     None),   # 用函数单独处理
    (re.compile(r'材质\s*[：:]\s*'), r'Material: '),
    (re.compile(r'面料\s*[：:]\s*'), r'Fabric: '),
    (re.compile(r'颜色\s*[：:]\s*'), r'Colour: '),
    (re.compile(r'型号\s*[：:]\s*'), r'Model No. '),
    (re.compile(r'货号\s*[：:]\s*'), r'Style No. '),
    (re.compile(r'简介\s*[：:]\s*'), r''),
    (re.compile(r'官网飞机盒'), r'official mailer box'),
    # 「24年当季」->「2024 season」；25/26 同理（两位数年份补成 20xx）
    (re.compile(r'(\d{2})\s*年\s*当季'), r'20\1 season'),
    (re.compile(r'(\d{2})\s*年\s*(新款|新品|新)'), r'20\1 new'),
    (re.compile(r'(\d{4})\s*年\s*(新款|新品|当季|新)'), r'\1 new'),
]


def _size_rule(m):
    parts = [m.group(1), m.group(2)]
    if m.group(3):
        parts.append(m.group(3))
    return 'Size: ' + ' x '.join(parts)


def apply_rules(t):
    """先跑整句规则，命中就把中文原文换成英文（后续分词还会继续处理剩余中文）。"""
    for rx, rep in _RULES:
        if rep is None:
            t = rx.sub(_size_rule, t)
        else:
            t = rx.sub(rep, t)
    return t


def load_terms():
    """读词表（带 mtime 缓存）。文件不存在也不报错，只是翻译为空。"""
    try:
        mt = os.path.getmtime(TERMS_FILE)
    except OSError:
        _TERMS_CACHE.update({'mtime': None, 'sorted': [], 'dict': {}})
        return _TERMS_CACHE
    if _TERMS_CACHE['mtime'] == mt:
        return _TERMS_CACHE
    terms = []
    try:
        with open(TERMS_FILE, encoding='utf-8') as f:
            terms = json.load(f).get('terms', [])
    except Exception as e:
        log('  ! 词表读取失败（%s），这次不做自动翻译' % e)
    pairs = [(str(k), '' if v is None else str(v)) for k, v in terms if k]
    pairs.sort(key=lambda p: -len(p[0]))          # 长词优先
    _TERMS_CACHE.update({
        'mtime': mt,
        'sorted': pairs,
        'dict': dict(pairs),
    })
    return _TERMS_CACHE


def is_cjk(ch):
    return bool(_CJK_RE.match(ch))


def _has_cjk(s):
    return bool(_CJK_RE.search(s or ''))


def norm_en(s):
    s = s or ''
    # 「材质 : 牛皮」在多语言习惯里不该有空格，统一收一下
    s = re.sub(r'\s+:', ':', s)
    for k, v in _CH_PUNC.items():
        s = s.replace(k, v)
    s = re.sub(r'\\([^\\]|\$)', r'\1', s)
    # 冒号后面别多一个空格（"Material:  imported" -> "Material: imported"）
    s = re.sub(r':\s{2,}', ': ', s)
    # 标点前后不该有空格：". Logo" -> ".Logo" / "design ." -> "design."
    s = re.sub(r'\s+([,.;:!?])', r'\1', s)
    s = re.sub(r'([,.;:!?])(?=[A-Za-z\u4e00-\u9fff])', r'\1 ', s)
    s = re.sub(r'\s{2,}', ' ', s)
    return s.strip()


def _split_words(en):
    """把英文短语切成词，顺便把中文残留的空格清理掉。"""
    return [w for w in re.split(r'\s+', (en or '').strip()) if w]


def _title_case(en):
    """标题大小写：品牌原样，其余首字母大写，小词小写（首词除外）。"""
    if not en:
        return en
    holders = {}
    mark = '\x01'
    for b in _BRANDS:
        if b in en:
            key = mark + str(len(holders)) + mark
            holders[key] = b
            en = en.replace(b, key)
    parts = []
    for i, w in enumerate(_split_words(en)):
        key = w.strip()
        if key in holders:
            parts.append(holders[key])
        elif key.startswith(mark) and key.endswith(mark):
            parts.append(holders.get(key, key))
        elif i > 0 and key.lower() in _SMALL_WORDS:
            parts.append(key.lower())
        elif key[:1].islower() or key[:1].isupper():
            parts.append(key[:1].upper() + key[1:])
        else:
            parts.append(key)
        # 保持跟在持有符后面的标点
    out = ' '.join(parts)
    # 还原被拆分出来的品牌（可能夹在 token 里）
    for key, val in holders.items():
        out = out.replace(key, val)
    out = re.sub(r'\s+([,.;:!?)\]])', r'\1', out)
    return out.strip()


def _dedupe(en):
    """去掉相邻重复词：'Bag Bag' -> 'Bag'。"""
    words = _split_words(en)
    out = []
    for w in words:
        if out and out[-1].lower() == w.lower():
            continue
        out.append(w)
    return ' '.join(out)


def _translate_segment(seg):
    """正向最大匹配翻一个片段（可能中英混排，英文原样保留）。"""
    terms = load_terms()['sorted']
    i, n = 0, len(seg)
    out = []
    buf = []                                  # 连续的英文/符号先攒着

    def flush():
        s = ''.join(buf).strip()
        if s:
            out.append(s)
        del buf[:]

    while i < n:
        ch = seg[i]
        if is_cjk(ch):
            flush()
            hit = None
            for zh, en in terms:
                if seg.startswith(zh, i):
                    hit = (zh, en)
                    break
            if hit:
                if hit[1]:
                    out.append(hit[1])
                i += len(hit[0])
            else:
                i += 1                        # 没收录的中文跳过，避免中英混杂
        else:
            buf.append(ch)
            i += 1
    flush()
    return ' '.join(out)


def translate_text(text, title=False):
    """翻一行（title=True 时做标题大小写）。"""
    t = (text or '').replace('\u3000', ' ').strip()
    if not t:
        return ''
    if _JUNK_ONLY_RE.match(t):                # 纯标点/emoji 行丢掉
        return ''
    en = _translate_segment(apply_rules(t))
    en = norm_en(en)
    en = _dedupe(en)
    return _title_case(en) if title else en


def translate_desc(text):
    """翻多行描述：保留换行，丢掉空行与纯符号行。"""
    if not text:
        return ''
    lines = []
    for raw in str(text).replace('\r\n', '\n').replace('\r', '\n').split('\n'):
        en = translate_text(raw)
        if en:
            lines.append(en)
    # 每行首字母大写，看起来更像正经英文文案
    out = []
    for ln in lines:
        m = re.match(r'^([^A-Za-z]*)([a-z])', ln)
        if m:
            ln = m.group(1) + m.group(2).upper() + ln[m.end():]
        out.append(ln)
    return '\n'.join(out).strip()


def translate_coverage(text):
    """统计能识别多少（对用户提示用）。"""
    terms = load_terms()['sorted']
    total = hit = 0
    missed = []
    for ch in (text or ''):
        if not is_cjk(ch):
            continue
        total += 1
    i, n = 0, len(text or '')
    while i < n:
        if is_cjk(text[i]):
            found = None
            for zh, en in terms:
                if text.startswith(zh, i):
                    found = zh
                    break
            if found:
                hit += len(found)
                i += len(found)
                continue
            missed.append(text[i])
        i += 1
    rate = int(round(hit * 100.0 / total)) if total else 100
    # 未收录的字去重保序
    seen, uniq = set(), []
    for c in missed:
        if c not in seen:
            seen.add(c)
            uniq.append(c)
    return {'total': total, 'hit': hit, 'rate': rate, 'missed': uniq}


def auto_translate(title, desc):
    """返回 {"title", "desc", "engine", "rate", "missed"}。"""
    info = translate_coverage((title or '') + '\n' + (desc or ''))
    has_terms = bool(load_terms()['sorted'])
    return {
        'title': translate_text(title, title=True) if title else '',
        'desc': translate_desc(desc) if desc else '',
        'engine': '本地词典' if has_terms else '（词表缺失）',
        'rate': info['rate'],
        'missed': info['missed'][:12],
    }


# ---------------------------- 整店批量采集 --------------------------------
STORE_URL_RE = re.compile(r'/weshop/store/([A-Za-z0-9_\-]{6,})', re.I)
STORE_WORKERS = 6          # 同时抓几件（都是网络 IO，6 路比较稳）

# 批量任务状态，前端轮询这个
STORE_JOB = {
    'running': False, 'finished': False, 'phase': '',
    'total': 0, 'done': 0, 'added': 0, 'skipped': 0, 'failed': 0,
    'shopName': '', 'shopTotal': 0, 'current': '', 'error': '',
    'log': [], 'sizeText': '', 'startedAt': '',
}
_STORE_LOCK = threading.Lock()
_STORE_STOP = threading.Event()


def _job(**kw):
    with _STORE_LOCK:
        STORE_JOB.update(kw)


def _job_add(key, n=1):
    with _STORE_LOCK:
        STORE_JOB[key] = int(STORE_JOB.get(key) or 0) + n
        return STORE_JOB[key]


def _job_get(key):
    with _STORE_LOCK:
        return STORE_JOB.get(key)


def _job_log(line):
    with _STORE_LOCK:
        STORE_JOB['log'].append(line)
        if len(STORE_JOB['log']) > 80:
            STORE_JOB['log'] = STORE_JOB['log'][-80:]


def parse_store_url(u):
    """从店铺链接里解析出 (host, albumId)"""
    u = (u or '').strip()
    if not u:
        raise ValueError('请先粘贴店铺链接')
    if not re.match(r'^https?://', u, re.I):
        u = 'https://' + u
    p = urlparse.urlparse(u)
    if not p.netloc:
        raise ValueError('这个链接看起来不完整，请复制店铺首页的完整链接')
    host = '%s://%s' % (p.scheme, p.netloc)
    m = STORE_URL_RE.search(p.path or '')
    if m:
        return host, m.group(1)
    q = urlparse.parse_qs(p.query or '')
    for k in ('albumId', 'shopId', 'targetAlbumId'):
        if q.get(k):
            return host, q[k][0]
    raise ValueError('没能从链接里找到店铺编号。\n'
                     '请打开店铺首页，复制地址栏里的完整链接（通常形如 '
                     '/weshop/store/一串编号）。')


def _open_store(host, album_id):
    """新建一个带游客 cookie 的会话，并先访问店铺页拿到 token"""
    import http.cookiejar
    cj = http.cookiejar.CookieJar()
    op = urlreq.build_opener(urlreq.HTTPCookieProcessor(cj))
    page = '%s/weshop/store/%s' % (host, album_id)
    op.open(urlreq.Request(page, headers={'User-Agent': UA}), timeout=45).read()
    return op, page


def _store_json(op, url, referer, payload=None, timeout=45):
    h = {'User-Agent': UA, 'Accept': 'application/json, text/plain, */*',
         'Referer': referer}
    if payload is None:
        req = urlreq.Request(url, headers=h)
    else:
        h['Content-Type'] = 'application/json'
        req = urlreq.Request(url, data=json.dumps(payload).encode('utf-8'),
                             headers=h, method='POST')
    raw = op.open(req, timeout=timeout).read()
    try:
        import gzip
        txt = gzip.decompress(raw).decode('utf-8', 'replace')
    except Exception:
        txt = raw.decode('utf-8', 'replace')
    return json.loads(txt)


def fetch_store_page(op, host, album_id, cursor=None, referer=None):
    """拉店铺商品列表的一页（游标分页）"""
    q = 'albumId=%s&startDate=&endDate=&auditPassword=' % urlparse.quote(album_id)
    if cursor:
        q += '&slipType=1&timestamp=%s' % cursor
    q += '&requestDataType='
    url = '%s/album/personal/all?&%s' % (host, q)
    j = _store_json(op, url, referer or host, {})
    res = j.get('result') or {}
    pg = res.get('pagination') or {}
    return {
        'items': res.get('items') or [],
        'cursor': pg.get('pageTimestamp'),
        'more': bool(pg.get('isLoadMore')),
        'album': res.get('targetAlbum') or {},
    }


def fetch_store_info(store_url):
    """读店铺基本信息（店名、商品总数），用来确认链接没粘错"""
    host, album_id = parse_store_url(store_url)
    op, referer = _open_store(host, album_id)
    page = fetch_store_page(op, host, album_id, referer=referer)
    al = page['album']
    return {
        'host': host,
        'albumId': album_id,
        'shopName': al.get('name') or '',
        'total': al.get('totalItemCount') or 0,
        'albumToken': al.get('id') or '',
        'desc': (al.get('desc') or '').strip(),
        'firstPage': len(page['items']),
    }


def _store_detail(op, host, album_token, item_id, referer):
    """取单件商品的完整标题和多张原图"""
    url = ('%s/commodity/view?targetAlbumId=%s&itemId=%s&transLang=zh&auditPassword='
           % (host, album_token, item_id))
    j = _store_json(op, url, referer, timeout=30)
    if not j.get('success'):
        raise RuntimeError(j.get('errmsg') or '详情接口返回失败')
    c = (j.get('result') or {}).get('commodity') or {}
    title = (c.get('title') or '').strip()
    imgs = [u for u in (c.get('imgsSrc') or []) if u]
    if not imgs:
        imgs = [re.sub(r'\?.*$', '', u) for u in (c.get('imgs') or []) if u]
    tags = [t.get('tagName') for t in (c.get('tags') or []) if t.get('tagName')]
    lines = [l.strip() for l in title.split('\n') if l.strip()]
    return {
        'titleFull': title,
        'titleFirst': lines[0] if lines else '',
        'images': imgs,
        'tags': tags,
        'shopName': c.get('shop_name') or '',
    }


def _store_one(op, host, album_token, item, referer, max_side, use_tr, category,
               allow_empty=False):
    """处理一件商品：详情 → 下图 → 翻译 → 组装成 products.js 里的对象。

    返回 {'prod': {...}} / {'skip': '原因'} / {'fail': '原因'}，不抛异常。
    """
    item_id = item.get('goods_id') or item.get('selfGoodsId') or ''
    if not item_id:
        return {'skip': '没有商品编号'}
    try:
        det = _store_detail(op, host, album_token, item_id, referer)
    except Exception as e:
        return {'fail': '详情读取失败（%s）' % str(e)[:60]}

    title = det['titleFull']
    auto_name = False
    if not title:
        if not allow_empty:
            return {'skip': '没有文字描述'}
        auto_name = True                      # 只有图片，标题交给主线程编号
    if not det['images']:
        return {'skip': '没有图片'}

    saved, failed = download_images(det['images'], item_id, max_side, ci_quality(max_side))
    if not saved:
        return {'fail': '图片全部下载失败'}

    name = ''
    if title:
        name = det['titleFirst'] or title.split('\n')[0][:40]
    name_en = desc_en = ''
    if use_tr and title:
        tr = auto_translate(name, title)
        name_en, desc_en = tr['title'], tr['desc']

    return {'prod': {
        'id': new_id(),
        'name': name,
        'nameEn': name_en,
        'category': category,
        'price': None,
        'originalPrice': None,
        'unit': '',
        'unitEn': '',
        'images': saved,
        'description': title,
        'descriptionEn': desc_en,
        'sizes': guess_sizes(title),
        'sizesEn': [],
        'colors': [],
        'specs': [],
        'tags': det['tags'][:2],
        'tagsEn': [],
        'stock': None,
        'soldOut': False,
        'hidden': False,
        'featured': False,
        'order': 0,
        'createdAt': time.strftime('%Y-%m-%d'),
        'sourceUrl': '%s/weshop/product/%s/%s' % (host, album_token, item_id),
    }, 'title': name, 'imgs': len(saved), 'autoName': auto_name}


def _existing_item_ids(d):
    """已上架商品的来源 id 集合，用来跳过重复采集"""
    ids = set()
    for p in d.get('products', []):
        u = (p.get('sourceUrl') or '').rstrip('/')
        if u:
            ids.add(u.rsplit('/', 1)[-1])
    return ids


def _short_title(t, n=26):
    t = (t or '').replace('\n', ' ').strip()
    return t[:n] + ('…' if len(t) > n else '')


def store_worker(cfg):
    """后台线程：整店批量采集"""
    import concurrent.futures

    try:
        _job(running=True, finished=False, phase='连接店铺…', error='',
             total=0, done=0, added=0, skipped=0, failed=0,
             shopName='', shopTotal=0, current='', log=[], sizeText='',
             startedAt=time.strftime('%H:%M:%S'))

        count = max(1, min(int(cfg.get('count') or 20), 200))
        skip = max(0, int(cfg.get('skip') or 0))
        category = cfg.get('category') or ''
        use_tr = bool(cfg.get('translate'))
        skip_exist = bool(cfg.get('skipExisting'))
        allow_empty = bool(cfg.get('allowEmptyTitle'))
        max_side = int(cfg.get('maxSide') or 900)

        host, album_id = parse_store_url(cfg.get('url'))
        op, referer = _open_store(host, album_id)
        first = fetch_store_page(op, host, album_id, referer=referer)
        al = first['album']
        album_token = al.get('id') or ''
        total_all = al.get('totalItemCount') or 0
        _job(shopName=al.get('name') or '', shopTotal=total_all,
             total=count, phase='读取商品列表…',
             sizeText=human_size(os.path.getsize(DATA_FILE)))
        _job_log('店铺：%s（共 %s 件商品）'
                 % (al.get('name') or '未命名', total_all or '未知'))
        if skip:
            _job_log('跳过前 %d 件（通常是店铺公告）' % skip)

        # ---- 1. 预取商品列表：跳过头条公告 + 过滤已采过的 ----
        d = read_data()
        exist = _existing_item_ids(d) if skip_exist else set()
        if exist:
            _job_log('本地已有 %d 件商品，重复的会自动跳过' % len(exist))

        pool = []
        chunk = list(first['items'])
        cursor, more = first['cursor'], first['more']
        page_no = 1
        walked = 0        # 走过的原始条目数（用于实现「跳过前 N 件」）
        dup = 0
        while len(pool) < count and (chunk or more) and not _STORE_STOP.is_set():
            for it in chunk:
                walked += 1
                if walked <= skip:
                    continue
                iid = it.get('goods_id') or it.get('selfGoodsId') or ''
                if skip_exist and iid in exist:
                    dup += 1
                    continue
                pool.append(it)
                if len(pool) >= count:
                    break
            chunk = []
            if len(pool) >= count or not more:
                break
            page_no += 1
            _job(phase='读取第 %d 页商品…' % page_no)
            pg = fetch_store_page(op, host, album_id, cursor, referer)
            chunk = pg['items']
            cursor, more = pg['cursor'], pg['more']

        if dup:
            _job_log('列表里有 %d 件已经采过，直接跳过（不重复下载图片）' % dup)
            _job_add('skipped', dup)
        if not pool:
            raise RuntimeError('没有读到新商品。可能这个店铺的商品都已经采过了，'
                               '或者「跳过前几件」填太大了。')
        if len(pool) < count:
            _job(total=len(pool))
            _job_log('这个店铺能采的新商品只有 %d 件' % len(pool))

        # ---- 2. 逐批并发采集 ----
        backup_data()
        _job(phase='开始采集…')

        # 自动编号要接着已有的「新品 NN」往后排，避免重名
        auto_seq = 0
        for p in d.get('products', []):
            m = re.match(r'^新品 (\d+)$', p.get('name') or '')
            if m:
                auto_seq = max(auto_seq, int(m.group(1)))

        idx = 0
        while _job_get('added') < count and idx < len(pool) and not _STORE_STOP.is_set():
            batch = pool[idx:idx + STORE_WORKERS]
            idx += len(batch)

            def one(it):
                return _store_one(op, host, album_token, it, referer,
                                  max_side, use_tr, category, allow_empty)

            with concurrent.futures.ThreadPoolExecutor(
                    max_workers=min(STORE_WORKERS, len(batch))) as ex:
                results = list(ex.map(one, batch))

            for r in results:
                if _STORE_STOP.is_set() or _job_get('added') >= count:
                    break
                item_id = ''
                if 'prod' in r:
                    su = r['prod'].get('sourceUrl') or ''
                    item_id = su.rsplit('/', 1)[-1]
                    if item_id in exist:
                        _job_add('skipped')
                        _job_add('done')
                        _job_log('– 已存在，跳过：%s' % _short_title(r.get('title') or '（无标题）'))
                        continue
                    if r.get('autoName'):
                        auto_seq += 1
                        r['prod']['name'] = '新品 %02d' % auto_seq
                        if use_tr:
                            r['prod']['nameEn'] = 'New item %02d' % auto_seq
                        _job_log('· 这件没有文字，标题先用「新品 %02d」，之后可改' % auto_seq)
                    r['prod']['order'] = len(d['products']) + 1
                    d['products'].append(r['prod'])
                    exist.add(item_id)
                    _job_add('added')
                    _job_add('done')
                    ttl = r['prod'].get('name') or '（无标题）'
                    _job(current=_short_title(ttl))
                    _job_log('✓ %s（%d 张图）' % (_short_title(ttl), r['imgs']))
                    try:
                        write_data(d)
                        _job(sizeText=human_size(os.path.getsize(DATA_FILE)))
                    except Exception as e:
                        _job_log('! 写文件失败：%s' % e)
                elif 'skip' in r:
                    _job_add('skipped')
                    _job_add('done')
                    _job_log('– 跳过（%s）' % r['skip'])
                else:
                    _job_add('failed')
                    _job_add('done')
                    _job_log('× 失败：%s' % r.get('fail', '未知原因'))

        # ---- 3. 收尾 ----
        d['version'] = max(int(d.get('version') or 2), 3)
        write_data(d)
        size = os.path.getsize(DATA_FILE)
        added = _job_get('added')
        if _job_get('added') < count and not _STORE_STOP.is_set():
            _job_log('商品已经采完了（这次只采到 %d 件）' % added)
        _job(phase='完成', running=False, finished=True, current='',
             sizeText=human_size(size), total=added or count)
        _job_log('结束：新增 %d 件，跳过 %d 件，失败 %d 件'
                 % (added, _job_get('skipped'), _job_get('failed')))

    except Exception as e:
        _job(phase='出错', running=False, finished=True,
             error='%s: %s' % (type(e).__name__, e))
        _job_log('× ' + str(e))


def start_store_job(cfg):
    with _STORE_LOCK:
        if STORE_JOB.get('running'):
            raise RuntimeError('已经有一个采集任务在跑了，请等它结束或先点停止。')
    _STORE_STOP.clear()
    t = threading.Thread(target=store_worker, args=(cfg,), daemon=True)
    t.start()
    return True


# ------------------------------ 网页界面 ----------------------------------
PAGE = r"""<!doctype html>
<html lang="zh-CN"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>商品采集工具</title>
<style>
:root{
  --ink:#1d2127;--ink2:#4d5561;--ink3:#8a929e;--line:#e5e7eb;--line2:#f1f3f5;
  --bg:#f6f7f9;--card:#fff;--pri:#2f6fed;--pri-d:#2559c9;--ok:#12805c;--warn:#b45309;--dan:#c0392b;
  --r:10px;--r-sm:7px;--sh:0 1px 2px rgba(16,24,40,.05),0 1px 3px rgba(16,24,40,.06);
  --font:"PingFang SC","Microsoft YaHei",-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Arial,sans-serif;
}
*{box-sizing:border-box}
body{margin:0;font-family:var(--font);font-size:14px;line-height:1.6;color:var(--ink);background:var(--bg)}
img{max-width:100%;display:block}
button{font:inherit;color:inherit;cursor:pointer;border:0;background:none}
input,select,textarea{font:inherit;color:inherit}
[hidden]{display:none!important}
.wrap{max-width:1180px;margin:0 auto;padding:0 22px}
header{background:#fff;border-bottom:1px solid var(--line);position:sticky;top:0;z-index:20}
.hd{height:60px;display:flex;align-items:center;gap:14px}
.logo{width:30px;height:30px;border-radius:8px;background:linear-gradient(135deg,#2f6fed,#5b9bff);
  display:grid;place-items:center;color:#fff;font-weight:700;font-size:13px;letter-spacing:.5px}
h1{font-size:16px;font-weight:600;margin:0}
.sub{font-size:12px;color:var(--ink3)}
.spacer{flex:1}
.stat{font-size:12.5px;color:var(--ink2);background:var(--line2);border-radius:99px;padding:5px 12px}
.main{padding:22px 0 60px}
.card{background:var(--card);border:1px solid var(--line);border-radius:var(--r);box-shadow:var(--sh);padding:20px}
.card+.card{margin-top:16px}
h3{font-size:14.5px;font-weight:600;margin:0 0 4px}
.hint{font-size:12.5px;color:var(--ink3);margin:0 0 14px}
.urlrow{display:flex;gap:10px;align-items:stretch}
input.inp,select.inp,textarea.inp{width:100%;border:1px solid var(--line);border-radius:var(--r-sm);
  padding:9px 12px;background:#fff;outline:none;transition:border-color .15s,box-shadow .15s}
input.inp:focus,select.inp:focus,textarea.inp:focus{border-color:var(--pri);box-shadow:0 0 0 3px rgba(47,111,237,.1)}
textarea.inp{resize:vertical;line-height:1.65}
.btn{border-radius:var(--r-sm);padding:9px 18px;font-weight:500;background:var(--pri);color:#fff;
  white-space:nowrap;transition:background .15s,transform .1s}
.btn:hover{background:var(--pri-d)}
.btn:active{transform:translateY(1px)}
.btn:disabled{opacity:.5;cursor:not-allowed}
.btn.ghost{background:#fff;border:1px solid var(--line);color:var(--ink2)}
.btn.ghost:hover{background:var(--line2)}
.btn.ok{background:var(--ok)}
.btn.ok:hover{background:#0d6b4c}
.btn.big{padding:11px 26px;font-size:15px}
.grid2{display:grid;grid-template-columns:minmax(0,1fr) 400px;gap:18px;align-items:start}
@media(max-width:980px){.grid2{grid-template-columns:1fr}}
.fgroup{margin-bottom:13px}
.fgroup>label{display:block;font-size:12.5px;color:var(--ink2);margin-bottom:5px;font-weight:500}
.fgroup>label b{color:var(--dan);font-weight:600}
.fgroup>label .h{font-weight:400;color:var(--ink3);margin-left:6px;font-size:11.5px}
.row2{display:grid;grid-template-columns:1fr 1fr;gap:12px}
.row3{display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px}
@media(max-width:560px){.row2,.row3{grid-template-columns:1fr}}
.imgs{display:grid;grid-template-columns:repeat(auto-fill,minmax(112px,1fr));gap:10px}
.im{position:relative;border:2px solid var(--line);border-radius:9px;overflow:hidden;background:#fafbfc;cursor:pointer}
.im.on{border-color:var(--pri);box-shadow:0 0 0 3px rgba(47,111,237,.12)}
.im img{width:100%;height:112px;object-fit:cover;pointer-events:none;background:#f3f4f6}
.im .idx{position:absolute;left:6px;top:6px;background:rgba(29,33,39,.62);color:#fff;font-size:11px;
  border-radius:99px;min-width:19px;height:19px;line-height:19px;text-align:center;padding:0 5px}
.im .tick{position:absolute;right:6px;top:6px;width:20px;height:20px;border-radius:50%;background:var(--pri);
  color:#fff;font-size:12px;display:grid;place-items:center;opacity:0;transition:opacity .12s}
.im.on .tick{opacity:1}
.im .del{position:absolute;right:6px;bottom:6px;background:rgba(192,57,43,.88);color:#fff;font-size:11px;
  border-radius:6px;padding:2px 8px;opacity:0;transition:opacity .12s}
.im:hover .del{opacity:1}
.imgsbar{display:flex;align-items:center;gap:10px;margin-bottom:11px;flex-wrap:wrap}
.imgsbar .n{font-size:12.5px;color:var(--ink2)}
.mini{font-size:12.5px;color:var(--pri);padding:3px 9px;border-radius:6px}
.mini:hover{background:rgba(47,111,237,.08)}
.trrow{display:flex;align-items:center;gap:10px;margin-bottom:7px}
.trinfo{flex:1;font-size:12px;color:var(--ink3);line-height:1.5}
.chips{display:flex;flex-wrap:wrap;gap:7px;margin-top:6px}
.chip{font-size:12px;color:var(--ink2);background:var(--line2);border:1px solid var(--line);
  border-radius:99px;padding:3px 11px}
.chip:hover{background:#e8ebf0;color:var(--pri)}
.chip.on{background:rgba(47,111,237,.1);border-color:rgba(47,111,237,.35);color:var(--pri)}
.radios{display:flex;gap:9px;flex-wrap:wrap}
.radio{border:1px solid var(--line);border-radius:var(--r-sm);padding:9px 13px;cursor:pointer;flex:1;min-width:150px;
  transition:border-color .15s,background .15s}
.radio.on{border-color:var(--pri);background:rgba(47,111,237,.05)}
.radio .t{font-weight:500;font-size:13px;display:flex;align-items:center;gap:7px}
.radio .d{font-size:11.5px;color:var(--ink3);margin-top:3px;line-height:1.5}
.dot{width:15px;height:15px;border-radius:50%;border:1.5px solid #c7ccd4;display:inline-block;position:relative;flex:none}
.radio.on .dot{border-color:var(--pri)}
.radio.on .dot:after{content:'';position:absolute;inset:3px;border-radius:50%;background:var(--pri)}
.alert{border-radius:var(--r-sm);padding:11px 14px;font-size:13px;margin-bottom:14px;white-space:pre-wrap;line-height:1.65}
.alert.err{background:#fdf1f0;border:1px solid #f5d2ce;color:#9b2c20}
.alert.ok{background:#eefaf4;border:1px solid #c7ecdb;color:#0d6b4c}
.alert.info{background:#eef4ff;border:1px solid #d3e0fb;color:#2559c9}
.alert.warn{background:#fff8ec;border:1px solid #f6e2bf;color:#8a5a06}
.foot{font-size:12px;color:var(--ink3);text-align:center;padding:8px 0 0}
.spin{width:15px;height:15px;border:2px solid rgba(255,255,255,.35);border-top-color:#fff;border-radius:50%;
  display:inline-block;vertical-align:-2px;animation:sp .7s linear infinite}
@keyframes sp{to{transform:rotate(360deg)}}
.loading{display:flex;align-items:center;gap:11px;color:var(--ink2);font-size:13.5px;padding:12px 0}
.loading .sp2{width:17px;height:17px;border:2px solid #dfe3e9;border-top-color:var(--pri);border-radius:50%;
  animation:sp .7s linear infinite}
kbd{background:var(--line2);border:1px solid var(--line);border-bottom-width:2px;border-radius:5px;
  padding:1px 6px;font-size:11.5px;font-family:inherit}
/* ---- 整店批量采集 ---- */
.tabs{display:inline-flex;gap:4px;background:var(--line2);border-radius:9px;padding:4px;margin-bottom:16px}
.tab{font-size:13.5px;padding:6px 18px;border-radius:7px;color:var(--ink2);transition:background .15s}
.tab:hover{color:var(--ink)}
.tab.is-on{background:#fff;color:var(--ink);box-shadow:var(--sh);font-weight:500}
.srow{display:grid;grid-template-columns:1fr 1fr 1.3fr;gap:12px}
@media(max-width:640px){.srow{grid-template-columns:1fr}}
.chk{display:flex;align-items:center;gap:8px;font-size:13px;color:var(--ink2);margin:9px 0;cursor:pointer}
.chk input{width:15px;height:15px;accent-color:var(--pri);margin:0}
.est{font-size:12.5px;color:var(--ink3);background:var(--line2);border-radius:8px;
  padding:9px 12px;margin:14px 0 12px;line-height:1.7}
.est b{color:var(--ink2);font-weight:600}
.sinfo{display:none;margin-top:14px;font-size:13px;background:#f2f7ff;border:1px solid #cfe0ff;
  border-radius:8px;padding:11px 13px;line-height:1.7}
.sinfo.on{display:block}
.sinfo .nm{font-weight:600}
.sinfo .tag{display:inline-block;font-size:11.5px;background:#fff;border:1px solid #cfe0ff;
  border-radius:99px;padding:1px 9px;margin:4px 5px 0 0;color:var(--ink2)}
.pbar{height:8px;background:var(--line2);border-radius:99px;overflow:hidden;margin:12px 0 10px}
.pbar i{display:block;height:100%;background:var(--pri);border-radius:99px;transition:width .35s}
.pstat{display:flex;gap:16px;flex-wrap:wrap;font-size:12.5px;color:var(--ink2)}
.pstat b{font-weight:600;color:var(--ink)}
.pstat .ok{color:var(--ok)}
.pstat .sk{color:var(--warn)}
.pstat .no{color:var(--dan)}
.plog{font-size:12px;line-height:1.8;color:var(--ink2);background:#fbfcfd;border:1px solid var(--line);
  border-radius:8px;padding:10px 12px;margin-top:12px;max-height:240px;overflow:auto;
  white-space:pre-wrap;font-family:ui-monospace,Menlo,Consolas,monospace}
</style></head>
<body>
<header><div class="wrap hd">
  <div class="logo">采</div>
  <div><h1>商品采集工具</h1><div class="sub">粘贴上家链接 → 采集图文 → 补充价格品类 → 写入 products.js</div></div>
  <div class="spacer"></div>
  <div class="stat" id="stat">读取中…</div>
</div></header>

<div class="wrap main">

  <div class="card">
    <div class="tabs">
      <button class="tab is-on" data-tab="one">单个商品</button>
      <button class="tab" data-tab="store">整个店铺</button>
    </div>

    <div id="tabOne">
      <h3>1. 粘贴商品链接</h3>
      <p class="hint">在上家店铺里打开某个商品，复制浏览器地址栏的链接（通常长这样：
        …wgstores.com/weshop/product/<span style="color:var(--ink3)">一串编号</span>/<span style="color:var(--ink3)">一串编号</span>）</p>
      <div class="urlrow">
        <input class="inp" id="url" placeholder="把商品链接粘贴到这里，然后点右边「开始采集」" spellcheck="false">
        <button class="btn" id="go">开始采集</button>
      </div>
      <div id="err1"></div>
    </div>

    <div id="tabStore" hidden>
      <h3>1. 粘贴店铺链接</h3>
      <p class="hint">打开上家的店铺首页，复制地址栏链接（形如
        …wecatalog.cn/weshop/store/<span style="color:var(--ink3)">一串编号</span>）。
        会先读出店名和商品总数，确认没粘错再开始。</p>
      <div class="urlrow">
        <input class="inp" id="sUrl" placeholder="把店铺首页链接粘贴到这里" spellcheck="false">
        <button class="btn ghost" id="sCheck">读取店铺</button>
      </div>
      <div class="sinfo" id="sInfo"></div>

      <hr style="border:0;border-top:1px solid var(--line);margin:18px 0 16px">

      <h3>2. 采集设置</h3>
      <p class="hint">按「最新发布」的顺序采集。上家店铺最上面通常有几张公告图（下单方式、尺码表之类），
        用「跳过前几件」可以绕开。</p>
      <div class="srow">
        <div class="fgroup"><label>采集数量<span class="h">1–200</span></label>
          <input class="inp" id="sCount" type="number" min="1" max="200" value="20"></div>
        <div class="fgroup"><label>跳过前几件<span class="h">公告图</span></label>
          <input class="inp" id="sSkip" type="number" min="0" max="200" value="0"></div>
        <div class="fgroup"><label>归到分类<span class="h">你网站的分类</span></label>
          <select class="inp" id="sCat"></select></div>
      </div>

      <label class="chk"><input type="checkbox" id="sSkipExist" checked> 跳过已经上架过的商品（避免重复）</label>
      <label class="chk"><input type="checkbox" id="sTranslate" checked> 采集时自动翻译成英文</label>
      <label class="chk"><input type="checkbox" id="sEmpty" checked> 上家没写文字的商品也采（标题自动编成「新品 01」，可再改）</label>

      <div class="est" id="sEst">填好数量后，这里会显示预计耗时和占用空间。</div>

      <button class="btn big ok" id="sGo" style="width:100%">开始批量采集</button>
      <div id="sErr"></div>
    </div>
  </div>

  <div id="storeRun" class="card" hidden>
    <h3>3. 采集进度 <span id="sPhase" style="font-size:12.5px;color:var(--ink3);font-weight:400"></span></h3>
    <div class="pbar"><i id="sBar" style="width:0%"></i></div>
    <div class="pstat" id="sStat"></div>
    <div class="plog" id="sLog"></div>
    <div style="margin-top:14px">
      <button class="btn ghost" id="sStop">停止采集</button>
    </div>
  </div>

  <div id="loading" class="card" hidden>
    <div class="loading"><span class="sp2"></span><span id="loadTxt">正在读取商品信息…</span></div>
  </div>

  <div id="result" hidden>
    <div class="grid2">
      <div class="card">
        <h3>2. 选择要用的图片</h3>
        <p class="hint">点一下图片可以「不要它」。默认全选，正在用的会带蓝框。</p>
        <div class="imgsbar">
          <span class="n" id="imgCount"></span>
          <button class="mini" id="selAll">全选</button>
          <button class="mini" id="selNone">全不选</button>
          <button class="mini" id="selRev">反选</button>
        </div>
        <div class="imgs" id="imgs"></div>
      </div>

      <div class="card">
        <h3>3. 补充信息</h3>
        <p class="hint">采集到的文字已经在下面了，改一改就行。价格必须自己填。</p>
        <div id="err2"></div>

        <div class="fgroup"><label>标题 <b>*</b><span class="h">客户看到的名字</span></label>
          <input class="inp" id="fName" placeholder="例如：儿童走秀款小靴子"></div>

        <div class="fgroup"><label>描述<span class="h">上家原文，可删掉不要的广告语</span></label>
          <textarea class="inp" id="fDesc" style="min-height:104px"></textarea></div>

        <div class="row3">
          <div class="fgroup"><label>售价（元）</label><input class="inp" id="fPrice" type="number" step="0.01" placeholder="留空=面议"></div>
          <div class="fgroup"><label>原价</label><input class="inp" id="fOrig" type="number" step="0.01" placeholder="划线价"></div>
          <div class="fgroup"><label>单位</label><input class="inp" id="fUnit" placeholder="件/双/个"></div>
        </div>

        <div class="fgroup"><label>品类</label><select class="inp" id="fCat"></select></div>

        <div class="fgroup"><label>尺码<span class="h">逗号分隔</span></label>
          <input class="inp" id="fSizes" placeholder="例如：26,27,28,29"></div>

        <div class="fgroup"><label>角标标签<span class="h">最多显示 2 个</span></label>
          <input class="inp" id="fTags" placeholder="例如：新品,热销">
          <div class="chips" id="tagChips"></div></div>

        <div class="fgroup"><label>英文标题 / 描述<span class="h">采集后自动翻译，可以手动改</span></label>
          <div class="trrow">
            <span class="trinfo" id="trInfo">自动翻译</span>
            <button class="mini" id="trAgain">重新翻译</button>
          </div>
          <input class="inp" id="fNameEn" placeholder="English title (optional)" style="margin-bottom:8px">
          <textarea class="inp" id="fDescEn" style="min-height:70px" placeholder="English description (optional)"></textarea></div>

        <hr style="border:0;border-top:1px solid var(--line);margin:16px 0">

        <div class="fgroup"><label>图片怎么放？</label>
          <div class="radios">
            <label class="radio on" data-mode="local"><div class="t"><span class="dot"></span>下载到本地</div>
              <div class="d">存进 images/ 文件夹，网页加载快、不依赖上家。上传时记得连图片一起传。</div></label>
            <label class="radio" data-mode="remote"><div class="t"><span class="dot"></span>直接用上家原图</div>
              <div class="d">只改 products.js 一个文件，但上家删图或防盗链时你的图会挂。</div></label>
          </div>
          <div id="sizeBox" style="margin-top:10px">
            <label style="font-size:12.5px;color:var(--ink2);display:block;margin-bottom:5px">图片尺寸</label>
            <select class="inp" id="fSize">
              <option value="700">小（700px，最省空间）</option>
              <option value="900" selected>中（900px，推荐）</option>
              <option value="1200">大（1200px，最清晰）</option>
              <option value="0">不压缩，用原图</option>
            </select>
          </div>
        </div>

        <button class="btn ok big" id="save" style="width:100%;margin-top:6px">写入 products.js</button>
        <div class="foot" id="saveNote"></div>
      </div>
    </div>
  </div>

  <div class="card" style="margin-top:16px">
    <h3>使用小抄</h3>
    <p class="hint" style="margin-bottom:8px">· 每次采集完点一次「写入 products.js」，可以连续采很多个，最后一起上传 GitHub。</p>
    <p class="hint" style="margin-bottom:8px">· 采集只拿得到<b>图片和文字</b>，价格必须自己填（上家不公开价格）。</p>
    <p class="hint" style="margin-bottom:12px">· 想把采集来的商品改一改、删掉、调顺序，之后再打开 <kbd>admin.html</kbd> 就行，两边数据是同一个文件。</p>
    <div id="compactBox" style="border-top:1px solid var(--line);padding-top:14px">
      <div class="fgroup" style="margin-bottom:8px">
        <label style="font-size:13px;font-weight:500">数据文件太大了？（一键瘦身）</label>
        <div class="hint" style="margin-bottom:9px" id="compactHint"></div>
        <button class="btn ghost" id="compact">把内嵌图片转换成文件</button>
        <div id="compactResult"></div>
      </div>
    </div>
  </div>
</div>

<script>
var S = { scraped: null, picked: [], mode: 'local', cats: [] };

function $(s, r){ return (r||document).querySelector(s); }
function $$(s, r){ return Array.prototype.slice.call((r||document).querySelectorAll(s)); }
function esc(s){ return String(s==null?'':s).replace(/[&<>"']/g, function(c){
  return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]; }); }
function api(path, body){
  return fetch(path, body ? {method:'POST', headers:{'Content-Type':'application/json'},
    body: JSON.stringify(body)} : {}).then(function(r){ return r.json(); });
}
function showErr(el, msg, cls){ el.innerHTML = msg ? '<div class="alert '+(cls||'err')+'">'+esc(msg)+'</div>' : ''; }

/* ---------- 自动翻译（服务端本地词典优先，失败就用浏览器内置词典） ---------- */
function hasTT(){ return window.TT && typeof window.TT.title === 'function'; }

var trTimer = null;
function autoTranslate(manual){
  var zh = ($('#fName').value || '').trim();
  var desc = ($('#fDesc').value || '').trim();
  if (!zh && !desc) { $('#trInfo').textContent = '自动翻译（中文填好后自动进行）'; return; }
  $('#trInfo').innerHTML = '<b>翻译中…</b>';
  api('/api/translate', { text: zh, lines: desc.split('\n') }).then(function(j){
    if (j.ok && (j.title || j.desc)) {
      $('#fNameEn').value = j.title || '';
      $('#fDescEn').value = j.desc || '';
      var note = '已用' + esc(j.engine) + '翻译，覆盖 ' + j.rate + '%';
      if (j.rate < 70 && j.missed && j.missed.length)
        note += '（没收录：' + esc(j.missed.join('')) + '）';
      note += '，可以手动改';
      $('#trInfo').innerHTML = esc(note);
      return;
    }
    localTranslate(zh, desc, j.error);
  }).catch(function(){ localTranslate(zh, desc); });
}

function scheduleTranslate(){
  if (trTimer) clearTimeout(trTimer);
  trTimer = setTimeout(function(){ autoTranslate(); }, 700);
}

function localTranslate(zh, desc, why){
  if (!hasTT()) { $('#trInfo').innerHTML = '<b>翻译模块没加载</b>，请手动填英文'; return; }
  var t = zh ? TT.title(zh) : '';
  var d = desc ? TT.desc(desc) : '';
  $('#fNameEn').value = t;
  $('#fDescEn').value = d;
  var cv = TT.coverage(zh + '\n' + desc);
  var note = '已用本地词典翻译，覆盖 ' + cv.rate + '%';
  if (cv.rate < 70 && cv.missed.length) note += '（没收录：' + cv.missed.slice(0, 12).join('') + '）';
  note += '，可以手动改';
  $('#trInfo').innerHTML = esc(note);
}

$('#trAgain').onclick = function(){ autoTranslate(true); };

function refreshStat(){  api('/api/state').then(function(j){
    if (!j.ok) { $('#stat').textContent = j.error || '读取失败'; return; }
    $('#stat').textContent = j.count + ' 件商品 · ' + j.sizeText +
      (j.embedded ? '（' + j.embedded + ' 张图内嵌）' : '');
    $('#compactHint').innerHTML = j.embedded
      ? ('<b style="color:var(--dan)">发现 ' + j.embedded + ' 张图片是内嵌进数据文件里的，'
         + '所以 products.js 才有 ' + esc(j.sizeText) + '。</b>'
         + 'GitHub 网页上传单个文件不能超过 25 MB，点下面的按钮可以把它变回几百 KB，转换前会自动备份。')
      : '如果上面的商品图片当初是「内嵌」进数据文件里的，products.js 会变得非常大（GitHub 网页上传单文件上限 25 MB）。'
        + '点这个按钮可以把所有内嵌图片抽出来存到 images/ 文件夹，数据文件瞬间变小。转换前会自动备份。';
    $('#compactBox').style.display = j.embedded ? 'block' : 'none';
    S.cats = j.categories || [];
    var html = '<option value="">未分类</option>' + S.cats.map(function(c){
      return '<option value="'+esc(c.id)+'">'+esc(c.name)+(c.nameEn&&c.nameEn!==c.name?' / '+esc(c.nameEn):'')+'</option>';
    }).join('');
    var sel = $('#fCat'), cur = sel.value;
    sel.innerHTML = html;
    if (cur) sel.value = cur;
    var sel2 = $('#sCat'); if (sel2) { var cur2 = sel2.value; sel2.innerHTML = html; if (cur2) sel2.value = cur2; }
  });
}

/* ---------- 采集 ---------- */
$('#go').onclick = function(){
  var u = $('#url').value.trim();
  if (!u) { showErr($('#err1'), '请先粘贴商品链接'); $('#url').focus(); return; }
  showErr($('#err1'), '');
  var btn = $('#go');
  btn.disabled = true; btn.innerHTML = '<span class="spin"></span> 采集中…';
  $('#loading').hidden = false; $('#result').hidden = true;
  $('#loadTxt').textContent = '正在打开商品页并读取图片、文字…';

  api('/api/fetch', {url: u}).then(function(j){
    btn.disabled = false; btn.textContent = '开始采集';
    $('#loading').hidden = true;
    if (!j.ok) { showErr($('#err1'), j.error || '采集失败'); return; }
    S.scraped = j.data;
    S.picked = j.data.images.map(function(u2, i){ return u2; });
    fillForm(j.data);
    $('#result').hidden = false;
    $('#result').scrollIntoView({behavior:'smooth', block:'start'});
  }).catch(function(e){
    btn.disabled = false; btn.textContent = '开始采集';
    $('#loading').hidden = true;
    showErr($('#err1'), '本地服务没有响应，请确认黑色命令行窗口还开着。\n' + e);
  });
};
$('#url').addEventListener('keydown', function(e){ if (e.key === 'Enter') $('#go').click(); });

/* 中文改动后自动重翻英文（防抖 700ms），英文栏一旦手动改过就不再自动覆盖 */
var enTouched = false;
$('#fNameEn').addEventListener('input', function(){ enTouched = true; });
$('#fDescEn').addEventListener('input', function(){ enTouched = true; });
$('#fName').addEventListener('input', function(){ if (!enTouched) scheduleTranslate(); });
$('#fDesc').addEventListener('input', function(){ if (!enTouched) scheduleTranslate(); });

function fillForm(d){
  enTouched = false;
  $('#fName').value = d.titleFirst || '';
  $('#fDesc').value = d.titleFull || '';
  autoTranslate();
  $('#fPrice').value = ''; $('#fOrig').value = ''; $('#fUnit').value = '';
  $('#fSizes').value = (d.sizesGuess || []).join(',');
  $('#fTags').value = '';
  showErr($('#err2'), '');

  // 上家标签：显示成可点的 chip
  var sup = d.tags || [];
  $('#tagChips').innerHTML = sup.length
    ? '<span style="font-size:12px;color:var(--ink3);align-self:center">上家分类：</span>' +
      sup.map(function(t){ return '<button class="chip" data-sup="'+esc(t)+'">+ '+esc(t)+'</button>'; }).join('')
    : '';

  // 尝试自动匹配品类
  var sel = $('#fCat'); sel.value = '';
  for (var i = 0; i < S.cats.length && !sel.value; i++){
    var c = S.cats[i];
    for (var k = 0; k < sup.length; k++){
      var s = String(sup[k]).toLowerCase();
      if (s === String(c.id).toLowerCase() || s === String(c.nameEn||'').toLowerCase()
          || s === String(c.name||'').toLowerCase() || s.indexOf(String(c.id).toLowerCase()) >= 0){
        sel.value = c.id; break;
      }
    }
  }

  renderImgs();
  var note = [];
  if (d.shopName) note.push('来自店铺：' + d.shopName);
  if (d.publishTime) note.push('上家发布：' + d.publishTime);
  $('#saveNote').textContent = note.join(' · ');
}

function renderImgs(){
  var all = S.scraped ? S.scraped.images : [];
  $('#imgCount').textContent = '已选 ' + S.picked.length + ' / ' + all.length + ' 张';
  $('#imgs').innerHTML = all.map(function(u, i){
    var on = S.picked.indexOf(u) >= 0;
    return '<div class="im'+(on?' on':'')+'" data-i="'+i+'">' +
      '<img loading="lazy" src="/api/img?u=' + encodeURIComponent(u) + '" alt="">' +
      '<span class="idx">'+(i+1)+'</span><span class="tick">✓</span>' +
      '<button class="del" data-del="'+i+'">不要</button></div>';
  }).join('');
}
$('#imgs').addEventListener('click', function(e){
  var del = e.target.closest('[data-del]');
  if (del){ e.stopPropagation(); }
  var box = e.target.closest('.im'); if (!box) return;
  var u = S.scraped.images[Number(box.dataset.i)];
  var k = S.picked.indexOf(u);
  if (k >= 0) S.picked.splice(k, 1); else S.picked.push(u);
  renderImgs();
  e.stopPropagation();
});
$('#selAll').onclick = function(){ S.picked = S.scraped.images.slice(); renderImgs(); };
$('#selNone').onclick = function(){ S.picked = []; renderImgs(); };
$('#selRev').onclick = function(){
  S.picked = S.scraped.images.filter(function(u){ return S.picked.indexOf(u) < 0; }); renderImgs(); };
$('#tagChips').addEventListener('click', function(e){
  var b = e.target.closest('[data-sup]'); if (!b) return;
  var cur = $('#fTags').value.split(',').map(function(x){ return x.trim(); }).filter(Boolean);
  if (cur.indexOf(b.dataset.sup) < 0) cur.push(b.dataset.sup);
  $('#fTags').value = cur.join(',');
  b.classList.add('on');
});

$$('.radio').forEach(function(r){
  r.onclick = function(){
    $$('.radio').forEach(function(x){ x.classList.toggle('on', x === r); });
    S.mode = r.dataset.mode;
    $('#sizeBox').hidden = (S.mode !== 'local');
  };
});

$('#save').onclick = function(){
  if (!S.scraped) return;
  var name = $('#fName').value.trim();
  if (!name) { showErr($('#err2'), '标题不能为空'); $('#fName').focus(); return; }
  if (!S.picked.length) { showErr($('#err2'), '至少要留一张图片'); return; }
  var btn = $('#save');
  btn.disabled = true; btn.innerHTML = '<span class="spin"></span> 正在写入…';
  showErr($('#err2'), '');

  api('/api/save', {
    source: {itemId: S.scraped.itemId, pageUrl: S.scraped.pageUrl, shopName: S.scraped.shopName},
    title: name,
    titleEn: $('#fNameEn').value.trim(),
    description: $('#fDesc').value,
    descriptionEn: $('#fDescEn').value,
    price: $('#fPrice').value,
    originalPrice: $('#fOrig').value,
    unit: $('#fUnit').value.trim(),
    category: $('#fCat').value,
    sizes: $('#fSizes').value.split(',').map(function(x){ return x.trim(); }).filter(Boolean),
    tags: $('#fTags').value.split(',').map(function(x){ return x.trim(); }).filter(Boolean),
    images: S.picked,
    mode: S.mode,
    maxSide: Number($('#fSize').value)
  }).then(function(j){
    btn.disabled = false; btn.textContent = '写入 products.js';
    if (!j.ok) { showErr($('#err2'), j.error || '写入失败'); return; }
    var msg = '已写入！现在共 ' + j.count + ' 件商品，数据文件 ' + j.sizeText + '。\n' +
      '图片：' + j.imgMsg + '\n' +
      '接着可以把上面链接换成下一个商品，继续采集。';
    showErr($('#err2'), msg, j.warn ? 'warn' : 'ok');
    refreshStat();
    $('#url').value = ''; $('#url').focus();
  }).catch(function(e){
    btn.disabled = false; btn.textContent = '写入 products.js';
    showErr($('#err2'), '写入时出错：' + e);
  });
};

$('#compact').onclick = function(){
  var b = $('#compact');
  b.disabled = true; b.innerHTML = '<span class="spin" style="border-color:#dfe3e9;border-top-color:var(--ink3)"></span> 正在转换…';
  $('#compactResult').innerHTML = '';
  api('/api/compact').then(function(j){
    b.disabled = false; b.textContent = '把内嵌图片转换成文件';
    if (!j.ok) { $('#compactResult').innerHTML = '<div class="alert err">'+esc(j.error)+'</div>'; return; }
    $('#compactResult').innerHTML =
      '<div class="alert '+(j.converted?'ok':'info')+'">转换了 ' + j.converted + ' 张图片' +
      (j.skipped ? ('（' + j.skipped + ' 张因为格式问题跳过）') : '') +
      '，数据文件现在只有 <b>' + esc(j.sizeText) + '</b>。' +
      (j.converted ? '\n记得把 images 文件夹里的新图片也一起上传到 GitHub。' : '') + '</div>';
    refreshStat();
  }).catch(function(e){
    b.disabled = false; b.textContent = '把内嵌图片转换成文件';
    $('#compactResult').innerHTML = '<div class="alert err">'+esc(e)+'</div>';
  });
};

/* ---------- 整店批量采集 ---------- */
var STORE = { timer: null, job: null };

Array.prototype.forEach.call(document.querySelectorAll('.tab'), function(b){
  b.onclick = function(){
    Array.prototype.forEach.call(document.querySelectorAll('.tab'), function(x){
      x.classList.toggle('is-on', x === b);
    });
    $('#tabOne').hidden = b.dataset.tab !== 'one';
    $('#tabStore').hidden = b.dataset.tab !== 'store';
  };
});

function fmtSec(s){
  return s < 60 ? (s + ' 秒') : (Math.round(s / 60) + ' 分钟');
}

function sEstimate(){
  var n = parseInt($('#sCount').value, 10) || 0;
  if (n <= 0) { $('#sEst').textContent = '填好数量后，这里会显示预计耗时和占用空间。'; return; }
  var mb = n * 0.9;
  var sec = Math.max(5, Math.round(n * 1.3));
  var html = '预计 <b>' + n + '</b> 件，用时约 <b>' + fmtSec(sec) + '</b>，'
    + '图片约 <b>' + mb.toFixed(0) + ' MB</b>。';
  if (n > 100) html += '<br><span style="color:var(--dan)">数量较多，采集和上传都会比较慢，建议分几次采。</span>';
  $('#sEst').innerHTML = html;
}
$('#sCount').oninput = sEstimate;
$('#sCount').onchange = sEstimate;

$('#sCheck').onclick = function(){
  var u = $('#sUrl').value.trim();
  if (!u) { showErr($('#sErr'), '请先粘贴店铺链接'); $('#sUrl').focus(); return; }
  showErr($('#sErr'), '');
  var b = $('#sCheck');
  b.disabled = true; b.textContent = '读取中…';
  api('/api/store/info', { url: u }).then(function(j){
    b.disabled = false; b.textContent = '读取店铺';
    if (!j.ok) {
      showErr($('#sErr'), j.error || '读不到这个店铺');
      $('#sInfo').classList.remove('on');
      return;
    }
    var i = j.info || {};
    $('#sInfo').innerHTML =
      '<div><span class="nm">' + esc(i.shopName || '未命名店铺') + '</span>'
      + (i.total ? '　共 <b>' + String(i.total).replace(/\B(?=(\d{3})+(?!\d))/g, ',') + '</b> 件商品' : '')
      + '</div>'
      + (i.desc ? '<div style="color:var(--ink3);margin-top:4px">' + esc(i.desc) + '</div>' : '')
      + '<div style="color:var(--ink3);margin-top:7px;font-size:12px">按「最新发布」顺序采集，第一页读到 '
      + (i.firstPage || 0) + ' 件</div>';
    $('#sInfo').classList.add('on');
    sEstimate();
  }).catch(function(e){
    b.disabled = false; b.textContent = '读取店铺';
    showErr($('#sErr'), '读取失败：' + e.message);
  });
};

$('#sUrl').addEventListener('keydown', function(e){
  if (e.key === 'Enter') $('#sCheck').click();
});

$('#sGo').onclick = function(){
  var u = $('#sUrl').value.trim();
  if (!u) { showErr($('#sErr'), '请先粘贴店铺链接'); $('#sUrl').focus(); return; }
  var n = parseInt($('#sCount').value, 10);
  if (!(n >= 1 && n <= 200)) { showErr($('#sErr'), '采集数量请填 1–200 之间的数字'); $('#sCount').focus(); return; }
  showErr($('#sErr'), '');
  var b = $('#sGo');
  b.disabled = true; b.textContent = '正在启动…';
  api('/api/store/start', {
    url: u,
    count: n,
    skip: parseInt($('#sSkip').value, 10) || 0,
    category: $('#sCat').value,
    skipExisting: $('#sSkipExist').checked,
    translate: $('#sTranslate').checked,
    allowEmptyTitle: $('#sEmpty').checked,
    maxSide: 900
  }).then(function(j){
    if (!j.ok) {
      b.disabled = false; b.textContent = '开始批量采集';
      showErr($('#sErr'), j.error || '启动失败');
      return;
    }
    $('#storeRun').hidden = false;
    $('#sLog').textContent = '';
    $('#sBar').style.width = '0%';
    $('#sPhase').textContent = '· 连接店铺…';
    if (STORE.timer) clearInterval(STORE.timer);
    pollStore();
    STORE.timer = setInterval(pollStore, 800);
  }).catch(function(e){
    b.disabled = false; b.textContent = '开始批量采集';
    showErr($('#sErr'), '启动失败：' + e.message);
  });
};

function pollStore(){
  api('/api/store/progress').then(function(j){
    if (!j.ok) return;
    var job = j.job || {};
    STORE.job = job;
    renderStore(job);
    if (!job.running) {
      if (STORE.timer) { clearInterval(STORE.timer); STORE.timer = null; }
      var b = $('#sGo');
      b.disabled = false; b.textContent = '开始批量采集';
      refreshStat();
    }
  }).catch(function(){});
}

function renderStore(job){
  var total = job.total || 0, done = job.done || 0;
  var pct = total ? Math.min(100, Math.round(done / total * 100)) : 0;
  $('#sBar').style.width = pct + '%';
  $('#sPhase').textContent = job.phase ? '· ' + job.phase : '';
  $('#sStat').innerHTML =
    '<span>进度 <b>' + done + ' / ' + total + '</b></span>'
    + '<span class="ok">新增 <b>' + (job.added || 0) + '</b></span>'
    + '<span class="sk">跳过 <b>' + (job.skipped || 0) + '</b></span>'
    + '<span class="no">失败 <b>' + (job.failed || 0) + '</b></span>'
    + (job.sizeText ? '<span>数据文件 <b>' + esc(job.sizeText) + '</b></span>' : '');
  var el = $('#sLog');
  var log = job.log || [];
  var atBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 30;
  el.textContent = log.join('\n');
  if (atBottom) el.scrollTop = el.scrollHeight;
  $('#sStop').disabled = !job.running;
  if (job.error) showErr($('#sErr'), job.error);
}

$('#sStop').onclick = function(){
  var b = this;
  b.disabled = true;
  api('/api/store/stop', {}).then(function(){
    $('#sPhase').textContent = '· 正在停止，已采到的会保留…';
  });
};

refreshStat();
</script>
<script src="assets/translate.js"></script>
</body></html>
"""


# ------------------------------ 服务端 ------------------------------------
class Handler(BaseHTTPRequestHandler):
    server_version = 'ScrapeTool/1.0'

    def log_message(self, fmt, *args):
        pass  # 静音，避免刷屏

    # ---- 输出helper ----
    def _send(self, code, body, ctype='application/json; charset=utf-8'):
        if isinstance(body, str):
            body = body.encode('utf-8')
        self.send_response(code)
        self.send_header('Content-Type', ctype)
        self.send_header('Content-Length', str(len(body)))
        self.send_header('Cache-Control', 'no-store')
        self.end_headers()
        try:
            self.wfile.write(body)
        except Exception:
            pass

    def _json(self, obj, code=200):
        self._send(code, json.dumps(obj, ensure_ascii=False))

    def _read_body(self):
        n = int(self.headers.get('Content-Length') or 0)
        if not n:
            return {}
        raw = self.rfile.read(n)
        try:
            return json.loads(raw.decode('utf-8'))
        except Exception:
            return {}

    # ---- 路由 ----
    def do_GET(self):
        p = urlparse.urlparse(self.path)
        q = urlparse.parse_qs(p.query)
        try:
            if p.path in ('/', '/index.html'):
                return self._send(200, PAGE, 'text/html; charset=utf-8')
            if p.path == '/api/state':
                return self._state()
            if p.path == '/api/img':
                return self._proxy_img(q.get('u', [''])[0])
            if p.path == '/api/store/progress':
                with _STORE_LOCK:
                    job = dict(STORE_JOB)
                    job['log'] = list(STORE_JOB['log'])
                return self._json({'ok': True, 'job': job})
            if p.path.startswith('/assets/') or p.path.startswith('/images/'):
                return self._static(p.path)
            return self._json({'ok': False, 'error': 'not found'}, 404)
        except Exception as e:
            return self._json({'ok': False, 'error': '%s: %s' % (type(e).__name__, e)})

    def do_POST(self):
        p = urlparse.urlparse(self.path)
        try:
            if p.path == '/api/fetch':
                return self._do_fetch()
            if p.path == '/api/save':
                return self._do_save()
            if p.path == '/api/compact':
                return self._do_compact()
            if p.path == '/api/translate':
                return self._do_translate()
            if p.path == '/api/store/info':
                return self._do_store_info()
            if p.path == '/api/store/start':
                return self._do_store_start()
            if p.path == '/api/store/stop':
                return self._do_store_stop()
            return self._json({'ok': False, 'error': 'not found'}, 404)
        except Exception as e:
            return self._json({'ok': False, 'error': '%s: %s' % (type(e).__name__, e)})

    # ---- 具体处理 ----
    def _state(self):
        d = read_data()
        raw = open(DATA_FILE, 'rb').read()
        embedded = 0
        for pr in d.get('products', []):
            for u in pr.get('images', []) or []:
                if str(u).startswith('data:'):
                    embedded += 1
        return self._json({
            'ok': True,
            'count': len(d.get('products', [])),
            'size': len(raw),
            'sizeText': human_size(len(raw)),
            'embedded': embedded,
            'categories': d.get('categories', []),
        })

    def _static(self, rel):
        """只允许读 assets/ 和 images/ 下的普通文件，防目录穿越。"""
        rel = urlparse.unquote(rel).lstrip('/')
        full = os.path.normpath(os.path.join(ROOT, rel))
        allowed = (os.path.join(ROOT, 'assets'), os.path.join(ROOT, 'images'))
        if not full.startswith(allowed) or not os.path.isfile(full):
            return self._json({'ok': False, 'error': 'not found'}, 404)
        ext = os.path.splitext(full)[1].lower()
        ctype = {
            '.js': 'application/javascript; charset=utf-8',
            '.css': 'text/css; charset=utf-8',
            '.json': 'application/json; charset=utf-8',
            '.svg': 'image/svg+xml; charset=utf-8',
            '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
            '.gif': 'image/gif', '.webp': 'image/webp', '.ico': 'image/x-icon',
        }.get(ext, 'application/octet-stream')
        with open(full, 'rb') as f:
            return self._send(200, f.read(), ctype)

    def _proxy_img(self, u):
        if not u:
            return self._send(404, b'', 'image/jpeg')
        try:
            data = http_get(add_ci_params(u, 700, 80), timeout=30,
                            referer='https://xcimg.szwego.com/')
        except Exception:
            # 失败就返回一个占位图，避免页面破图太难看
            svg = ('<svg xmlns="http://www.w3.org/2000/svg" width="220" height="220">'
                   '<rect width="220" height="220" fill="#f3f4f6"/>'
                   '<text x="110" y="115" text-anchor="middle" font-size="13" fill="#b0b6bf">'
                   '图片读取失败</text></svg>')
            return self._send(200, svg, 'image/svg+xml; charset=utf-8')
        self._send(200, data, 'image/jpeg')

    def _do_fetch(self):
        body = self._read_body()
        url = (body.get('url') or '').strip()
        try:
            data = fetch_product(url)
        except ValueError as e:
            return self._json({'ok': False, 'error': str(e)})
        except Exception as e:
            return self._json({'ok': False, 'error': '%s' % e})
        log('  采集成功：%s ｜ %d 张图 ｜ %s' %
            (data['titleFirst'][:30], len(data['images']), data['shopName']))
        return self._json({'ok': True, 'data': data})

    def _do_translate(self):
        b = self._read_body()
        title = (b.get('text') or '').strip()
        lines = b.get('lines')
        if lines is None:
            lines = b.get('desc') or ''
        if isinstance(lines, list):
            desc = '\n'.join(str(x) for x in lines)
        else:
            desc = str(lines)
        if not title and not desc.strip():
            return self._json({'ok': False, 'error': '没有可翻译的内容'})
        r = auto_translate(title, desc)
        if not r['title'] and not r['desc']:
            return self._json({'ok': False, 'error': '词表为空，请检查 data/terms.json'})
        return self._json({
            'ok': True,
            'title': r['title'],
            'desc': r['desc'],
            'engine': r['engine'],
            'rate': r['rate'],
            'missed': r['missed'],
        })

    def _do_store_info(self):
        b = self._read_body()
        try:
            info = fetch_store_info(b.get('url'))
            return self._json({'ok': True, 'info': info})
        except Exception as e:
            return self._json({'ok': False, 'error': str(e)})

    def _do_store_start(self):
        b = self._read_body()
        try:
            start_store_job({
                'url': b.get('url'),
                'count': b.get('count'),
                'skip': b.get('skip'),
                'category': b.get('category'),
                'translate': b.get('translate'),
                'skipExisting': b.get('skipExisting'),
                'allowEmptyTitle': b.get('allowEmptyTitle'),
                'maxSide': b.get('maxSide'),
            })
            return self._json({'ok': True})
        except Exception as e:
            return self._json({'ok': False, 'error': str(e)})

    def _do_store_stop(self):
        _STORE_STOP.set()
        _job_log('… 收到停止指令，正在收尾（已采的会保留）')
        return self._json({'ok': True})

    def _do_compact(self):
        try:
            r = compact_embedded_images()
        except Exception as e:
            return self._json({'ok': False, 'error': '%s' % e})
        log('  瘦身完成：转换 %d 张图片，文件变为 %s' % (r['converted'], human_size(r['size'])))
        return self._json({
            'ok': True,
            'converted': r['converted'],
            'skipped': r['skipped'],
            'size': r['size'],
            'sizeText': human_size(r['size']),
        })

    def _do_save(self):
        b = self._read_body()
        title = (b.get('title') or '').strip()
        if not title:
            return self._json({'ok': False, 'error': '标题不能为空'})
        images = [u for u in (b.get('images') or []) if u]
        if not images:
            return self._json({'ok': False, 'error': '至少要留一张图片'})

        d = read_data()
        src = b.get('source') or {}
        item_id = src.get('itemId') or new_id()

        warn = False
        img_msg = ''
        if b.get('mode') == 'local':
            max_side = int(b.get('maxSide') or 900)
            log('  正在下载 %d 张图片…' % len(images))
            saved, failed = download_images(images, item_id, max_side, ci_quality(max_side))
            if not saved:
                return self._json({'ok': False, 'error':
                                   '图片下载失败了，可能是网络问题。可以改成「直接用上家原图」再试。\n'
                                   + '\n'.join(failed[:3])})
            images = saved
            img_msg = '已下载 %d 张到 images/ 文件夹' % len(saved)
            if failed:
                img_msg += '，%d 张失败已跳过' % len(failed)
                warn = True
            if max_side == 0:
                img_msg += '（未压缩）'
            else:
                img_msg += '（最长边 %dpx）' % max_side
        else:
            img_msg = '直接引用了上家原图链接（共 %d 张）' % len(images)

        def num(v):
            v = ('' if v is None else str(v)).strip()
            if not v:
                return None
            try:
                return float(v)
            except Exception:
                return None

        price = num(b.get('price'))
        if price is not None and price == int(price):
            price = int(price)
        orig = num(b.get('originalPrice'))
        if orig is not None and orig == int(orig):
            orig = int(orig)

        cat = b.get('category') or ''
        cat_ids = [c.get('id') for c in d.get('categories', [])]
        if cat and cat not in cat_ids:
            cat = ''

        prod = {
            'id': new_id(),
            'name': title,
            'nameEn': (b.get('titleEn') or '').strip(),
            'category': cat,
            'price': price,
            'originalPrice': orig,
            'unit': (b.get('unit') or '').strip(),
            'unitEn': '',
            'images': images,
            'description': (b.get('description') or '').strip(),
            'descriptionEn': (b.get('descriptionEn') or '').strip(),
            'sizes': [s for s in (b.get('sizes') or []) if s],
            'sizesEn': [],
            'colors': [],
            'specs': [],
            'tags': [t for t in (b.get('tags') or []) if t],
            'tagsEn': [],
            'stock': None,
            'soldOut': False,
            'hidden': False,
            'featured': False,
            'order': len(d.get('products', [])) + 1,
            'createdAt': time.strftime('%Y-%m-%d'),
            'sourceUrl': src.get('pageUrl') or '',
        }

        d.setdefault('products', []).append(prod)
        d['version'] = max(int(d.get('version') or 2), 3)

        bak = backup_data()
        size = write_data(d)
        log('  已写入 products.js（共 %d 件商品，%s）' % (len(d['products']), human_size(size)))
        if bak:
            log('  旧文件已备份到 %s' % os.path.basename(bak))

        if size > 25 * 1048576:
            warn = True

        return self._json({
            'ok': True,
            'count': len(d['products']),
            'size': size,
            'sizeText': human_size(size),
            'imgMsg': img_msg,
            'warn': warn,
        })


# ------------------------------ 启动 --------------------------------------
def pick_port(start=PORT):
    import socket
    for p in range(start, start + 12):
        s = socket.socket()
        try:
            s.bind(('127.0.0.1', p))
            s.close()
            return p
        except OSError:
            s.close()
            continue
    return start


def main():
    if not os.path.isfile(DATA_FILE):
        log('× 找不到数据文件：%s' % DATA_FILE)
        log('  请把这个工具放在 shop 文件夹里（和 index.html 同级）。')
        input('按回车关闭…')
        return
    port = pick_port()
    url = 'http://127.0.0.1:%d/' % port
    log('=' * 56)
    log('  商品采集工具已启动')
    log('  操作界面：%s' % url)
    log('  数据文件：%s' % DATA_FILE)
    log('')
    log('  浏览器如果没有自动打开，手动复制上面的地址访问即可。')
    log('  用完后直接关闭这个窗口，工具就停了。')
    log('=' * 56)

    httpd = ThreadingHTTPServer(('127.0.0.1', port), Handler)
    if not os.environ.get('SCRAPE_NO_BROWSER'):
        threading.Timer(0.8, lambda: webbrowser.open(url)).start()
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        log('\n已停止。')


if __name__ == '__main__':
    main()
