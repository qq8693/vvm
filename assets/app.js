/* ==========================================================================
   商品展示站 · 前端逻辑（原生 JS，无任何依赖）
   数据来源：data/products.js 里的 window.SHOP_DATA
             （如果没找到，会尝试读取 data/products.json）

   双语说明：
   - 所有界面文案都有中英两套，见下面的 I18N。
   - 商品的英文字段（*En）留空时，会自动回退显示中文；反之亦然。
   - 语言优先级：用户上次的选择（本地存储）→ 店铺设置的默认语言 → 浏览器语言
   ========================================================================== */
(function () {
  'use strict';

  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  /* ============================== 界面文案 ============================== */
  var I18N = {
    zh: {
      'lang.switch': 'English',
      'nav.all': '全部商品',
      'search.title': '搜索',
      'search.ph': '搜索商品名称、颜色、尺码…',
      'search.clear': '清空',
      'fav.only': '只看收藏',
      'contact.btn': '联系店主',
      'contact.title': '联系店主',
      'contact.sub': '扫码或复制联系方式，欢迎咨询',
      'contact.copy': '复制',
      'contact.open': '打开',
      'contact.copyPre': '复制商品信息发给店主',
      'contact.qrPh': '在管理工具里上传你的<br>微信二维码图片',
      'contact.hours': '营业时间',
      'hero.eyebrow': '在线店铺',
      'hero.contact': '直接联系',
      'hero.browse': '浏览全部商品',
      'stats.onsale': '在售商品',
      'stats.cats': '商品分类',
      'stats.featured': '本周推荐',
      'section.all': '全部商品',
      'section.count': '共 {n} 件商品',
      'sort.default': '推荐排序',
      'sort.new': '最新上架',
      'sort.asc': '价格从低到高',
      'sort.desc': '价格从高到低',
      'updated.at': '更新于 {d}',
      'more': '加载更多',
      'more.n': '加载更多（还有 {n} 件）',
      'pager.prev': '上一页',
      'pager.next': '下一页',
      'pager.info': '共 {total} 件商品',
      'gallery.of': '{a} / {b}',
      'empty.nomatch': '没有找到符合条件的商品',
      'empty.usereset': '换个关键词或分类试试',
      'empty.reset': '清除筛选条件',
      'empty.nofav': '还没有收藏任何商品',
      'empty.nofav.hint': '看到喜欢的点右上角小心心',
      'empty.none': '还没有上架商品',
      'empty.none.hint': '用管理工具添加第一件吧',
      'price.inquire': '面议',
      'price.per': '/{u}',
      'save.off': '省{amount}',
      'badge.out': '已售罄',
      'badge.last': '仅剩 {n} 件',
      'card.sizes': '{n} 个尺码',
      'detail.sizes': '尺码',
      'detail.colors': '颜色',
      'detail.specs': '商品参数',
      'detail.zoom': '点击图片放大',
      'detail.soldout': '该商品暂时缺货，可以联系店主问问什么时候补货',
      'detail.stock': '库存 <b>{n}</b> 件',
      'detail.stock.low': '（快没了）',
      'detail.ask': '联系店主下单',
      'detail.ask.out': '问问什么时候到货',
      'detail.copyinfo': '复制商品信息',
      'footer.contact': '联系方式',
      'footer.cats': '商品分类',
      'footer.qr': '查看二维码 / 复制',
      'footer.empty': '在「店铺设置」里填写你的联系方式',
      'toast.favAdd': '已加入收藏',
      'toast.favDel': '已取消收藏',
      'toast.copied': '已复制',
      'toast.copyFail': '复制失败，请手动选择文本',
      'toast.langZh': '已切换为中文',
      'toast.langEn': 'Switched to English',
      'toast.preview': '预览模式 · 显示的是管理工具里的草稿，未上传到网站',
      'foot.copyDefault': '© {y} {name} 保留所有权利',
      'ask.tpl': '你好，我想咨询这件商品：{name}{opt}，价格 {price}',
      'opt.size': '（尺码：{v}）',
      'opt.color': '（颜色：{v}）',
      'img.none': '暂无图片',
      'hero.imgPh': '在这里放一张主视觉图<br>（店铺设置里可换）'
    },
    en: {
      'lang.switch': '中文',
      'nav.all': 'All Products',
      'search.title': 'Search',
      'search.ph': 'Search by name, color, size…',
      'search.clear': 'Clear',
      'fav.only': 'Favorites',
      'contact.btn': 'Contact',
      'contact.title': 'Contact Us',
      'contact.sub': 'Scan the QR code or copy our contact details',
      'contact.copy': 'Copy',
      'contact.open': 'Open',
      'contact.copyPre': 'Copy details and send to us',
      'contact.qrPh': 'Upload your<br>WeChat QR code in the admin tool',
      'contact.hours': 'Hours',
      'hero.eyebrow': 'Online Store',
      'hero.contact': 'Contact Directly',
      'hero.browse': 'Browse Products',
      'stats.onsale': 'Products',
      'stats.cats': 'Categories',
      'stats.featured': 'Featured',
      'section.all': 'All Products',
      'section.count': '{n} products',
      'sort.default': 'Recommended',
      'sort.new': 'Newest First',
      'sort.asc': 'Price: Low to High',
      'sort.desc': 'Price: High to Low',
      'updated.at': 'Updated {d}',
      'more': 'Load More',
      'more.n': 'Load More ({n} left)',
      'pager.prev': 'Prev',
      'pager.next': 'Next',
      'pager.info': '{total} items',
      'gallery.of': '{a} / {b}',
      'empty.nomatch': 'No products found',
      'empty.usereset': 'Try a different keyword or category',
      'empty.reset': 'Clear filters',
      'empty.nofav': 'No favorites yet',
      'empty.nofav.hint': 'Tap the heart on any product you like',
      'empty.none': 'No products yet',
      'empty.none.hint': 'Add your first item with the admin tool',
      'price.inquire': 'Ask for price',
      'price.per': '/{u}',
      'save.off': 'Save {amount}',
      'badge.out': 'Sold Out',
      'badge.last': 'Only {n} left',
      'card.sizes': '{n} sizes',
      'detail.sizes': 'Size',
      'detail.colors': 'Color',
      'detail.specs': 'Specifications',
      'detail.zoom': 'Click to zoom',
      'detail.soldout': 'This item is out of stock. Contact us to ask about restock.',
      'detail.stock': 'In stock: <b>{n}</b>',
      'detail.stock.low': ' (almost gone)',
      'detail.ask': 'Contact to Order',
      'detail.ask.out': 'Ask About Restock',
      'detail.copyinfo': 'Copy product info',
      'footer.contact': 'Contact',
      'footer.cats': 'Categories',
      'footer.qr': 'QR code / Copy',
      'footer.empty': 'Add your contact details in Shop Settings',
      'toast.favAdd': 'Added to favorites',
      'toast.favDel': 'Removed from favorites',
      'toast.copied': 'Copied',
      'toast.copyFail': 'Copy failed, please select the text manually',
      'toast.langZh': '已切换为中文',
      'toast.langEn': 'Switched to English',
      'toast.preview': 'Preview mode · showing the draft from the admin tool, not uploaded yet',
      'foot.copyDefault': '© {y} {name}. All rights reserved.',
      'ask.tpl': 'Hello, I would like to ask about: {name}{opt} - price {price}',
      'opt.size': ' (Size: {v})',
      'opt.color': ' (Color: {v})',
      'img.none': 'No image',
      'hero.imgPh': 'Put your main visual here<br>(change it in Shop Settings)'
    }
  };

  /* 常见中文尺码词的英文对照（英文界面下的兜底翻译） */
  var SIZE_MAP = {
    '均码': 'One Size',
    '加长': 'Long',
    '常规': 'Regular',
    '小码': 'Small',
    '大码': 'Large',
    '定制': 'Custom',
    '单件': 'Single',
    '套装': 'Set'
  };

  function t(key, vars) {
    var s = (I18N[STATE.lang] && I18N[STATE.lang][key]);
    if (s == null) s = I18N.zh[key];
    if (s == null) s = key;
    if (vars) {
      Object.keys(vars).forEach(function (k) { s = s.split('{' + k + '}').join(vars[k]); });
    }
    return s;
  }

  /* 中英成对取值：英文界面优先英文，空了回退中文；中文界面反之 */
  function pair(zh, en) {
    var a = zh == null ? '' : String(zh);
    var b = en == null ? '' : String(en);
    if (STATE.lang === 'en') return b.trim() ? b : a;
    return a.trim() ? a : b;
  }
  function pick(obj, base) {
    return obj ? pair(obj[base], obj[base + 'En']) : '';
  }

  /* ============================== 基础工具 ============================== */
  function esc(v) {
    return String(v == null ? '' : v)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  }
  var escA = esc;

  function safeSrc(v) {
    var s = String(v == null ? '' : v).trim();
    if (!s) return '';
    if (/^(https?:|data:image\/|\.\.?\/|[a-zA-Z0-9_\-.]+\/)/i.test(s)) return s;
    return '';
  }

  function money(n) {
    var v = Number(n);
    if (!isFinite(v)) return '--';
    var s = v.toFixed(2).replace(/\.00$/, '').replace(/(\.\d)0$/, '$1');
    return s.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }

  function fallbackImg() {
    var svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 500">' +
      '<rect width="400" height="500" fill="#f4f2ef"/>' +
      '<circle cx="200" cy="220" r="86" fill="none" stroke="#d6d1c9" stroke-width="3"/>' +
      '<path d="M148 268 L200 200 L252 268" fill="none" stroke="#d6d1c9" stroke-width="3" stroke-linejoin="round"/>' +
      '<text x="200" y="360" text-anchor="middle" font-family="sans-serif" font-size="19" fill="#b6b9be">' +
      (STATE.lang === 'en' ? 'No image' : '暂无图片') + '</text></svg>';
    return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
  }

  /* ============================== 状态 ================================== */
  var STATE = {
    data: null,
    lang: 'zh',
    cat: 'all',
    kw: '',
    sort: 'default',
    favOnly: false,
    favs: [],
    page: 1,
    perPage: 24
  };

  var LANG_KEY = 'shop_lang';

  function readLang() {
    var saved = null;
    try { saved = localStorage.getItem(LANG_KEY); } catch (e) {}
    var sc = window.SHOP_DATA && window.SHOP_DATA.shop && window.SHOP_DATA.shop.i18n;
    if (saved === 'zh' || saved === 'en') return saved;
    if (sc && (sc.default === 'en' || sc.default === 'zh')) return sc.default;
    var nav = (navigator.language || navigator.userLanguage || 'zh').toLowerCase();
    return nav.indexOf('zh') === 0 ? 'zh' : 'en';
  }
  function saveLang() { try { localStorage.setItem(LANG_KEY, STATE.lang); } catch (e) {} }

  function langEnabled() {
    return !STATE.data || STATE.data.shop.i18n.enabled !== false;
  }

  function readFavs() {
    try { return JSON.parse(localStorage.getItem('shop_favs') || '[]'); } catch (e) { return []; }
  }
  function writeFavs() {
    try { localStorage.setItem('shop_favs', JSON.stringify(STATE.favs)); } catch (e) {}
    var c = $('#favCount');
    if (c) { c.textContent = STATE.favs.length; c.hidden = !STATE.favs.length; }
  }

  var DEFAULT_DATA = {
    shop: {
      name: '我的小店', logoText: '小店', slogan: '精选好物',
      announcement: { enabled: false, text: '' },
      hero: { enabled: true, title: '精选好物，慢慢挑', subtitle: '', buttonText: '' },
      contact: {}, footer: {}, theme: {}, i18n: {}
    },
    categories: [], products: []
  };

  /* ============================== 数据整理 ============================== */
  function normalize(raw) {
    var d = raw && typeof raw === 'object' ? raw : {};
    var shop = Object.assign({}, DEFAULT_DATA.shop, d.shop || {});
    ['announcement', 'hero', 'contact', 'footer', 'theme', 'i18n'].forEach(function (k) {
      shop[k] = Object.assign({}, DEFAULT_DATA.shop[k] || {}, shop[k] || {});
    });
    shop.i18n.enabled = shop.i18n.enabled !== false;
    if (shop.i18n.default !== 'en') shop.i18n.default = 'zh';
    shop.i18n.currency = Object.assign({ zh: '¥', en: '¥' }, shop.i18n.currency || {});
    shop.i18n.rate = Number(shop.i18n.rate) > 0 ? Number(shop.i18n.rate) : 1;

    var cats = (Array.isArray(d.categories) ? d.categories : [])
      .filter(function (c) { return c && c.id; })
      .map(function (c, i) {
        return {
          id: String(c.id),
          name: String(c.name || c.id),
          nameEn: String(c.nameEn || ''),
          order: Number(c.order) || i + 1
        };
      })
      .sort(function (a, b) { return a.order - b.order; });
    var catById = {};
    cats.forEach(function (c) { catById[c.id] = c; });

    var list = (Array.isArray(d.products) ? d.products : [])
      .filter(function (p) { return p && (p.name || p.nameEn || p.title); })
      .map(function (p, i) {
        return {
          id: String(p.id || ('p' + (i + 1))),
          name: String(p.name || p.title || ''),
          nameEn: String(p.nameEn || ''),
          category: p.category ? String(p.category) : '',
          categoryObj: catById[p.category] || null,
          price: p.price === '' || p.price == null ? null : Number(p.price),
          originalPrice: p.originalPrice ? Number(p.originalPrice) : null,
          unit: String(p.unit || ''),
          unitEn: String(p.unitEn || ''),
          images: (Array.isArray(p.images) ? p.images : []).map(safeSrc).filter(Boolean),
          description: String(p.description || ''),
          descriptionEn: String(p.descriptionEn || ''),
          sizes: (Array.isArray(p.sizes) ? p.sizes : []).map(String).filter(Boolean),
          sizesEn: (Array.isArray(p.sizesEn) ? p.sizesEn : []).map(String).filter(Boolean),
          colors: (Array.isArray(p.colors) ? p.colors : []).map(function (x) {
            if (typeof x === 'string') return { name: x, nameEn: '', hex: '' };
            return {
              name: String((x && x.name) || ''),
              nameEn: String((x && x.nameEn) || ''),
              hex: String((x && x.hex) || '')
            };
          }).filter(function (x) { return x.name || x.nameEn; }),
          specs: (Array.isArray(p.specs) ? p.specs : []).map(function (s) {
            if (!s) return null;
            if (Array.isArray(s)) return { k: String(s[0] || ''), kEn: '', v: String(s[1] || ''), vEn: '' };
            return {
              k: String(s.k || s.key || s.name || ''),
              kEn: String(s.kEn || ''),
              v: String(s.v || s.value || ''),
              vEn: String(s.vEn || '')
            };
          }).filter(function (s) { return s && (s.k || s.kEn); }),
          tags: (Array.isArray(p.tags) ? p.tags : []).map(String).filter(Boolean),
          tagsEn: (Array.isArray(p.tagsEn) ? p.tagsEn : []).map(String).filter(Boolean),
          stock: p.stock == null || p.stock === '' ? null : Number(p.stock),
          soldOut: !!p.soldOut,
          hidden: !!p.hidden,
          featured: !!p.featured,
          order: Number(p.order) || i + 1,
          createdAt: p.createdAt || ''
        };
      })
      .filter(function (p) { return !p.hidden; })
      .sort(function (a, b) { return a.order - b.order; });

    return { shop: shop, categories: cats, products: list, updatedAt: d.updatedAt || '' };
  }

  /* ============================== 主题 / 货币 ============================ */
  function applyTheme(th) {
    th = th || {};
    var map = { '--ink': th.ink, '--accent': th.accent, '--bg': th.bg, '--bg-soft': th.bgSoft, '--line': th.line };
    Object.keys(map).forEach(function (k) {
      if (map[k]) document.documentElement.style.setProperty(k, map[k]);
    });
    if (th.radius != null && th.radius !== '') {
      var r = Number(th.radius);
      if (isFinite(r)) {
        document.documentElement.style.setProperty('--r', r + 'px');
        document.documentElement.style.setProperty('--r-lg', (r + 4) + 'px');
        document.documentElement.style.setProperty('--r-sm', Math.max(4, r - 5) + 'px');
      }
    }
  }

  function curSym() {
    var c = (STATE.data && STATE.data.shop.i18n.currency) || {};
    var s = STATE.lang === 'en' ? (c.en || c.zh) : (c.zh || c.en);
    return s || '¥';
  }
  function conv(v) {
    var r = Number(STATE.data && STATE.data.shop.i18n.rate);
    if (STATE.lang === 'en' && isFinite(r) && r > 0 && r !== 1) return Number(v) * r;
    return Number(v);
  }
  function fmtNum(v) {
    var n = conv(v);
    if (!isFinite(n)) return '--';
    // 非人民币符号时保留两位小数（$12.50 这种）
    if (!/^[¥￥]/.test(curSym())) return money(n.toFixed(2));
    return money(n);
  }
  function fmtMoney(v) { return esc(curSym()) + fmtNum(v); }

  /* ============================== 静态文案填充 ========================== */
  function applyStaticI18n() {
    document.documentElement.lang = STATE.lang === 'zh' ? 'zh-CN' : 'en';
    $$('[data-i18n]').forEach(function (el) { el.textContent = t(el.getAttribute('data-i18n')); });
    $$('[data-i18n-ph]').forEach(function (el) { el.setAttribute('placeholder', t(el.getAttribute('data-i18n-ph'))); });
    $$('[data-i18n-title]').forEach(function (el) {
      var v = t(el.getAttribute('data-i18n-title'));
      el.setAttribute('title', v);
      el.setAttribute('aria-label', v);
    });
  }

  function syncMeta() {
    var m = document.querySelector('meta[name="theme-color"]');
    if (m) m.content = (getComputedStyle(document.documentElement).getPropertyValue('--bg').trim() || '#fff');
    var s = STATE.data.shop;
    var nm = pair(s.name, s.nameEn);
    var sl = pair(s.slogan, s.sloganEn);
    var desc = document.querySelector('meta[name="description"]');
    if (desc) desc.setAttribute('content', nm + (sl ? ' · ' + sl : ''));
    var og = document.querySelector('meta[property="og:title"]');
    if (og) og.setAttribute('content', nm);
    var ogd = document.querySelector('meta[property="og:description"]');
    if (ogd) ogd.setAttribute('content', sl || nm);
  }

  /* ============================== 顶部渲染 ============================== */
  function renderChrome() {
    var s = STATE.data.shop;
    var ps = STATE.data.products;

    var nm = pair(s.name, s.nameEn);
    var sl = pair(s.slogan, s.sloganEn);
    document.title = nm + (sl ? ' · ' + sl : '');

    var ab = $('#announce');
    var annText = pick(s.announcement, 'text');
    if (s.announcement.enabled && annText) {
      ab.innerHTML = '<span>' + esc(annText) + '</span>';
      ab.hidden = false;
    } else { ab.hidden = true; }

    $('#brandName').textContent = pair(s.logoText, s.logoTextEn) || nm || (STATE.lang === 'en' ? 'My Shop' : '我的小店');
    var sub = $('#brandSub');
    sub.textContent = sl || '';
    sub.hidden = !sub.textContent;

    var lb = $('#langBtn');
    lb.hidden = !langEnabled();
    lb.textContent = t('lang.switch');

    var catHTML = STATE.data.categories.map(function (c) {
      var n = ps.filter(function (p) { return p.category === c.id; }).length;
      return '<a href="#' + esc(c.id) + '" data-cat="' + esc(c.id) + '"' + (STATE.cat === c.id ? ' class="is-active"' : '') + '>' +
        esc(pick(c, 'name')) + (n ? ' <small style="opacity:.5">' + n + '</small>' : '') + '</a>';
    }).join('');
    $('#nav').innerHTML = '<a href="#all" data-cat="all"' + (STATE.cat === 'all' ? ' class="is-active"' : '') + '>' +
      t('nav.all') + '</a>' + catHTML;

    var hero = $('#hero');
    if (s.hero.enabled !== false) {
      var ht = pair(s.hero.title, s.hero.titleEn);
      $('#heroTitle').innerHTML = ht ? esc(ht).replace(/\n/g, '<br>') : '';
      var hsub = pair(s.hero.subtitle, s.hero.subtitleEn);
      var hp = $('#heroSub');
      hp.textContent = hsub;
      hp.hidden = !hsub;
      $('#heroBtn').textContent = pair(s.hero.buttonText, s.hero.buttonTextEn) || t('hero.browse');
      var hv = $('#heroVisual');
      var hi = safeSrc(s.hero.image);
      if (hi) hv.innerHTML = '<img src="' + escA(hi) + '" alt="">';
      else hv.innerHTML = '<div class="ph">' + t('hero.imgPh') + '</div>';

      var stat = [
        [ps.length, t('stats.onsale')],
        [STATE.data.categories.length, t('stats.cats')],
        [ps.filter(function (p) { return p.featured; }).length, t('stats.featured')]
      ].filter(function (x) { return x[0] > 0; });
      $('#heroStats').innerHTML = stat.map(function (x) {
        return '<div><b>' + x[0] + '</b><span>' + x[1] + '</span></div>';
      }).join('');
      $('#heroStats').hidden = !stat.length;
      hero.hidden = false;
    } else { hero.hidden = true; }

    var hc = hasContact();
    $('#contactBtn').hidden = !hc;
    var cb2 = $('#contactBtn2');
    if (cb2) cb2.hidden = !hc;
    $('#footContactBtn').hidden = !hc;

    var f = s.footer || {};
    $('#footBrand').textContent = pair(s.logoText, s.logoTextEn) || nm;
    $('#footDesc').textContent = pair(f.text, f.textEn) || sl || '';
    $('#footContact').innerHTML = footContactHTML();
    $('#footLinks').innerHTML = STATE.data.categories.slice(0, 8).map(function (c) {
      return '<li><a href="#' + esc(c.id) + '" data-cat="' + esc(c.id) + '">' + esc(pick(c, 'name')) + '</a></li>';
    }).join('') || '<li><a href="#all">' + t('nav.all') + '</a></li>';

    var copy = pair(f.copyright, f.copyrightEn);
    $('#footCopy').textContent = copy || t('foot.copyDefault', { y: new Date().getFullYear(), name: nm });
    var extra = pair(f.extra, f.extraEn);
    var fExtra = $('#footExtra');
    fExtra.textContent = extra || '';
    fExtra.hidden = !extra;

    $('#updated').textContent = STATE.data.updatedAt
      ? t('updated.at', { d: String(STATE.data.updatedAt).replace('T', ' ').slice(0, 16) })
      : '';
  }

  function footContactHTML() {
    var c = STATE.data.shop.contact || {};
    var en = STATE.lang === 'en';
    var rows = [];
    if (c.wechat) rows.push((en ? 'WeChat: ' : '微信：') + c.wechat);
    if (c.whatsapp) rows.push('WhatsApp: ' + c.whatsapp);
    if (c.phone) rows.push((en ? 'Phone: ' : '电话：') + c.phone);
    if (c.email) rows.push((en ? 'Email: ' : '邮箱：') + c.email);
    var hrs = pick(c, 'workingHours');
    if (hrs) rows.push(t('contact.hours') + (en ? ': ' : '：') + hrs);
    return rows.length
      ? rows.map(function (r) { return '<li>' + esc(r) + '</li>'; }).join('')
      : '<li style="color:var(--ink-3)">' + t('footer.empty') + '</li>';
  }

  function hasContact() {
    var c = STATE.data.shop.contact || {};
    return !!(c.wechat || c.whatsapp || c.phone || c.email || c.wechatQr);
  }

  /* ============================== 列表渲染 ============================== */
  function visible() {
    var kw = STATE.kw.trim().toLowerCase();
    var out = STATE.data.products.filter(function (p) {
      if (STATE.cat !== 'all' && p.category !== STATE.cat) return false;
      if (STATE.favOnly && STATE.favs.indexOf(p.id) < 0) return false;
      if (!kw) return true;
      var hay = [
        p.name, p.nameEn, p.description, p.descriptionEn,
        p.categoryObj ? p.categoryObj.name : '', p.categoryObj ? p.categoryObj.nameEn : '',
        p.tags.join(' '), p.tagsEn.join(' '),
        p.specs.map(function (s) { return s.k + s.v + s.kEn + s.vEn; }).join(' '),
        p.colors.map(function (c) { return c.name + ' ' + c.nameEn; }).join(' '),
        p.sizes.join(' '), p.sizesEn.join(' ')
      ].join(' ').toLowerCase();
      return hay.indexOf(kw) >= 0;
    });

    if (STATE.sort === 'price-asc') {
      out.sort(function (a, b) { return (a.price == null ? 1e15 : a.price) - (b.price == null ? 1e15 : b.price); });
    } else if (STATE.sort === 'price-desc') {
      out.sort(function (a, b) { return (b.price == null ? -1 : b.price) - (a.price == null ? -1 : a.price); });
    } else if (STATE.sort === 'new') {
      out.sort(function (a, b) { return String(b.createdAt).localeCompare(String(a.createdAt)) || a.order - b.order; });
    } else {
      out.sort(function (a, b) { return ((a.featured ? 0 : 1) - (b.featured ? 0 : 1)) || a.order - b.order; });
    }
    if (STATE.data.shop.theme.showSoldOutLast !== false) {
      out.sort(function (a, b) { return (a.soldOut ? 1 : 0) - (b.soldOut ? 1 : 0); });
    }
    return out;
  }

  function itemTags(p) {
    return (STATE.lang === 'en' && p.tagsEn.length) ? p.tagsEn : p.tags;
  }
  function itemSizes(p) {
    if (STATE.lang === 'en') {
      if (p.sizesEn.length) return p.sizesEn;
      return p.sizes.map(function (s) { return SIZE_MAP[s] || s; });
    }
    return p.sizes;
  }
  function badgeCls(tg) {
    if (/新|new/i.test(tg)) return 'new';
    if (/热|hot|爆|sale|best/i.test(tg)) return 'hot';
    return '';
  }

  function cardHTML(p, idx) {
    var nm = pick(p, 'name');
    var img0 = p.images[0] || fallbackImg();
    var img1 = p.images[1] || '';
    var badges = [];
    if (p.soldOut) badges.push('<span class="badge out">' + t('badge.out') + '</span>');
    itemTags(p).slice(0, 2).forEach(function (tg) {
      badges.push('<span class="badge ' + badgeCls(tg) + '">' + esc(tg) + '</span>');
    });
    if (p.stock != null && p.stock > 0 && p.stock <= 3 && !p.soldOut) {
      badges.push('<span class="badge">' + t('badge.last', { n: p.stock }) + '</span>');
    }

    var off = '';
    if (p.originalPrice && p.price != null && p.originalPrice > p.price) {
      off = '<span class="save">' + t('save.off', { amount: curSym() + fmtNum(p.originalPrice - p.price) }) + '</span>';
    }

    var unit = pair(p.unit, p.unitEn);
    var sizes = itemSizes(p);
    var catName = p.categoryObj ? pick(p.categoryObj, 'name') : '';

    return '<article class="card' + (p.soldOut ? ' is-sold' : '') + '" data-id="' + esc(p.id) + '" ' +
        'style="animation-delay:' + Math.min(idx * 22, 420) + 'ms">' +
      '<div class="card-media">' +
        '<img loading="lazy" src="' + escA(img0) + '" alt="' + escA(nm) + '" data-fb="' + escA(nm) + '">' +
        (img1 ? '<img class="alt" loading="lazy" src="' + escA(img1) + '" alt="" aria-hidden="true">' : '') +
        (badges.length ? '<div class="badges">' + badges.join('') + '</div>' : '') +
        '<button class="fav' + (STATE.favs.indexOf(p.id) >= 0 ? ' is-on' : '') + '" data-fav="' + esc(p.id) + '" title="' + escA(t('fav.only')) + '" aria-label="' + escA(t('fav.only')) + '">' +
          heartSVG() + '</button>' +
      '</div>' +
      '<div class="card-body">' +
        '<h3 class="card-title">' + esc(nm) + '</h3>' +
        '<div class="card-meta">' +
          (p.price == null
            ? '<span class="price" style="font-size:15px">' + t('price.inquire') + '</span>'
            : '<span class="price"><span class="cur">' + esc(curSym()) + '</span>' + fmtNum(p.price) +
              (unit ? '<span style="font-size:12px;font-weight:500;color:var(--ink-3)">' + t('price.per', { u: esc(unit) }) + '</span>' : '') + '</span>') +
          (p.originalPrice ? '<span class="price-old">' + fmtMoney(p.originalPrice) + '</span>' : '') +
          off +
        '</div>' +
        '<div class="card-sub">' +
          (catName ? '<span>' + esc(catName) + '</span>' : '') +
          (sizes.length ? (catName ? '<span class="dot">·</span>' : '') + '<span>' + t('card.sizes', { n: sizes.length }) + '</span>' : '') +
          (p.colors.length ? '<span class="swatches">' + p.colors.slice(0, 4).map(function (c) {
            return '<i class="sw" style="background:' + escA(c.hex || '#ddd') + '"></i>';
          }).join('') + '</span>' : '') +
        '</div>' +
      '</div>' +
    '</article>';
  }

  function heartSVG() {
    return '<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1L12 21.2l7.7-7.8 1.1-1a5.5 5.5 0 0 0 0-7.8z"/></svg>';
  }

  function renderChips() {
    var ps = STATE.data.products;
    var html = '<button class="chip' + (STATE.cat === 'all' ? ' is-active' : '') + '" data-cat="all">' +
      t('nav.all') + '<small>' + ps.length + '</small></button>';
    STATE.data.categories.forEach(function (c) {
      var n = ps.filter(function (p) { return p.category === c.id; }).length;
      html += '<button class="chip' + (STATE.cat === c.id ? ' is-active' : '') + '" data-cat="' + esc(c.id) + '">' +
        esc(pick(c, 'name')) + '<small>' + n + '</small></button>';
    });
    $('#chips').innerHTML = html;
  }

  function renderGrid() {
    var list = visible();
    renderChips();

    if (!list.length) {
      var isFilter = STATE.kw || STATE.cat !== 'all' || STATE.favOnly;
      $('#grid').innerHTML = '';
      var e = $('#empty');
      e.hidden = false;
      e.innerHTML =
        '<svg width="46" height="46" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></svg>' +
        '<h3>' + (STATE.favOnly ? t('empty.nofav') : (isFilter ? t('empty.nomatch') : t('empty.none'))) + '</h3>' +
        '<p>' + (STATE.favOnly ? t('empty.nofav.hint') : (isFilter ? t('empty.usereset') : t('empty.none.hint'))) + '</p>' +
        (isFilter && !STATE.favOnly ? '<button class="btn btn-ghost btn-sm" id="resetFilter">' + t('empty.reset') + '</button>' : '');
      var rf = $('#resetFilter');
      if (rf) rf.onclick = function () {
        STATE.kw = ''; STATE.cat = 'all'; STATE.favOnly = false; STATE.sort = 'default';
        $('#q').value = ''; $('#sort').value = 'default';
        if (location.hash && location.hash !== '#all') location.hash = '#all';
        else { renderChrome(); renderGrid(); }
      };
    } else {
      $('#empty').hidden = true;
      var maxPage = Math.max(1, Math.ceil(list.length / STATE.perPage));
      if (STATE.page > maxPage) STATE.page = maxPage;
      var start = (STATE.page - 1) * STATE.perPage;
      $('#grid').innerHTML = list.slice(start, start + STATE.perPage).map(cardHTML).join('');
    }

    $('#countText').textContent = list.length ? t('section.count', { n: list.length }) : '';
    $('#secTitle').textContent = STATE.cat === 'all' ? t('section.all') : (function () {
      var c = STATE.data.categories.filter(function (x) { return x.id === STATE.cat; })[0];
      return c ? pick(c, 'name') : t('section.all');
    })();
    renderPager(list.length);
  }

  /* ------------------------------ 分页条 ------------------------------- */
  function pageItems(cur, total) {
    /* 生成页码数组：1 … (c-1) c (c+1) … total，中间最多 5 个 */
    var out = [];
    for (var i = 1; i <= total; i++) {
      if (i === 1 || i === total || Math.abs(i - cur) <= 1) { out.push(i); continue; }
      if (out[out.length - 1] !== '…') out.push('…');
    }
    return out;
  }

  function renderPager(total) {
    var box = $('#pager');
    var pages = Math.max(1, Math.ceil(total / STATE.perPage));
    if (pages <= 1) { box.hidden = true; box.innerHTML = ''; return; }
    if (STATE.page > pages) STATE.page = pages;

    var btn = function (label, page, cls, disabled, aria) {
      return '<button class="' + cls + '"' + (disabled ? ' disabled' : '') +
        (aria ? ' aria-label="' + escA(aria) + '"' : '') +
        ' data-page="' + page + '">' + label + '</button>';
    };
    var html = btn('<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 18l-6-6 6-6"/></svg>',
        STATE.page - 1, 'pg-nav', STATE.page <= 1, t('pager.prev'));
    pageItems(STATE.page, pages).forEach(function (it) {
      if (it === '…') { html += '<span class="pg-dots">…</span>'; return; }
      html += btn(String(it), it, 'pg-num' + (it === STATE.page ? ' is-active' : ''), false);
    });
    html += btn('<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 6l6 6-6 6"/></svg>',
        STATE.page + 1, 'pg-nav', STATE.page >= pages, t('pager.next'));

    box.innerHTML = html +
      '<span class="pg-info">' + t('pager.info', { total: total }) + '</span>';
    box.hidden = false;
  }

  function gotoPage(p) {
    STATE.page = p;
    renderGrid();
    var anchor = $('#products').offsetTop - 80;
    window.scrollTo({ top: anchor < 0 ? 0 : anchor, behavior: 'smooth' });
  }

  /* ============================== 详情弹层 ============================== */
  var MODAL = { id: null, size: '', color: '' };
  var galleryKeys = null;   // 弹窗内的 ←/→ 翻图监听（关闭时移除）

  function openDetail(id) {
    var p = STATE.data.products.filter(function (x) { return x.id === id; })[0];
    if (!p) return;
    MODAL.id = id;
    var sizes = itemSizes(p);
    MODAL.size = sizes[0] || '';
    MODAL.color = p.colors[0] ? pick(p.colors[0], 'name') : '';

    var nm = pick(p, 'name');
    var imgs = p.images.length ? p.images : [fallbackImg()];
    var tags = itemTags(p);
    var en = p.specs;

    var badges = '';
    if (p.soldOut) badges = '<span class="badge out">' + t('badge.out') + '</span>';
    else if (tags.length) badges = tags.slice(0, 2).map(function (tg) {
      return '<span class="badge ' + badgeCls(tg) + '">' + esc(tg) + '</span>';
    }).join('');

    var priceHTML = p.price == null
      ? '<span class="price" style="font-size:22px">' + t('price.inquire') + '</span>'
      : '<span class="price"><span class="cur">' + esc(curSym()) + '</span>' + fmtNum(p.price) + '</span>' +
        (p.originalPrice ? '<span class="price-old" style="font-size:16px">' + fmtMoney(p.originalPrice) + '</span>' : '');

    var optHTML = '';
    if (sizes.length) {
      optHTML += '<div class="opt"><div class="opt-label"><span>' + t('detail.sizes') + '</span><b id="sizeEcho">' + esc(MODAL.size) + '</b></div><div class="opt-list">' +
        sizes.map(function (s) {
          return '<button class="opt-item' + (s === MODAL.size ? ' is-active' : '') + '" data-size="' + escA(s) + '">' + esc(s) + '</button>';
        }).join('') + '</div></div>';
    }
    if (p.colors.length) {
      optHTML += '<div class="opt"><div class="opt-label"><span>' + t('detail.colors') + '</span><b id="colorEcho">' + esc(MODAL.color) + '</b></div><div class="opt-list">' +
        p.colors.map(function (c) {
          var cn = pick(c, 'name');
          return '<button class="opt-item' + (cn === MODAL.color ? ' is-active' : '') + '" data-color="' + escA(cn) + '">' +
            (c.hex ? '<i class="sw" style="background:' + escA(c.hex) + '"></i>' : '') + esc(cn) + '</button>';
        }).join('') + '</div></div>';
    }

    var specsHTML = en.length
      ? '<div class="rule"></div><div class="opt-label" style="margin-bottom:14px">' + t('detail.specs') + '</div><dl class="specs">' +
        en.map(function (s) {
          return '<dt>' + esc(pair(s.k, s.kEn)) + '</dt><dd>' + esc(pair(s.v, s.vEn)) + '</dd>';
        }).join('') + '</dl>'
      : '';

    var stockHTML = p.soldOut
      ? '<div class="sold-out-note">' +
          '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><circle cx="12" cy="12" r="9"/><path d="M12 8v5M12 16.5v.01"/></svg>' +
          '<span>' + t('detail.soldout') + '</span></div>'
      : (p.stock != null ? '<div class="stock">' + t('detail.stock', { n: p.stock }) + (p.stock <= 3 && p.stock > 0 ? t('detail.stock.low') : '') + '</div>' : '');

    var desc = pair(p.description, p.descriptionEn);
    var catName = p.categoryObj ? pick(p.categoryObj, 'name') : '';
    var shownPrice = p.price == null ? t('price.inquire') : curSym() + fmtNum(p.price);
    var askText = t('ask.tpl', {
      name: nm,
      opt: (MODAL.size ? t('opt.size', { v: MODAL.size }) : '') + (MODAL.color ? t('opt.color', { v: MODAL.color }) : ''),
      price: shownPrice
    });

    $('#modalBody').innerHTML =
      '<div class="gallery">' +
        '<div class="gallery-main" id="gMain">' +
          '<div class="gallery-track" id="gTrack">' +
            imgs.map(function (u) {
              return '<img src="' + escA(u) + '" alt="' + escA(nm) + '" draggable="false">';
            }).join('') +
          '</div>' +
          (badges ? '<div class="badges" style="top:auto;bottom:56px;left:12px">' + badges + '</div>' : '') +
          (imgs.length > 1 ? '<button class="g-nav g-prev" id="gPrev" aria-label="prev">' +
            '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 18l-6-6 6-6"/></svg></button>' +
            '<button class="g-nav g-next" id="gNext" aria-label="next">' +
            '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 6l6 6-6 6"/></svg></button>' +
            '<span class="g-count" id="gCount"></span>' : '') +
          '<span class="zoom-hint">' + t('detail.zoom') + '</span>' +
        '</div>' +
        (imgs.length > 1 ? '<div class="thumbs" id="gThumbs">' + imgs.map(function (u, i) {
          return '<button class="' + (i === 0 ? 'is-active' : '') + '" data-i="' + i + '"><img src="' + escA(u) + '" alt=""></button>';
        }).join('') + '</div>' : '') +
      '</div>' +
      '<div class="detail">' +
        (catName ? '<div class="hero-eyebrow" style="margin-bottom:12px">' + esc(catName) + '</div>' : '') +
        '<h2>' + esc(nm) + '</h2>' +
        '<div class="price-row">' + priceHTML + '</div>' +
        (tags.length ? '<div class="tags">' + tags.map(function (tg) { return '<span class="tag">' + esc(tg) + '</span>'; }).join('') + '</div>' : '') +
        (desc ? '<p class="desc">' + esc(desc) + '</p>' : '') +
        (optHTML ? '<div class="rule"></div>' + optHTML : '') +
        specsHTML +
        stockHTML +
        '<div class="detail-foot">' +
          '<button class="btn ' + (p.soldOut ? 'btn-ghost' : 'btn-primary') + ' btn-block" id="askBtn">' +
            (p.soldOut ? t('detail.ask.out') : (hasContact() ? t('detail.ask') : t('detail.copyinfo'))) + '</button>' +
          '<button class="btn btn-ghost" id="favBtn" style="padding:0 16px" title="' + escA(t('fav.only')) + '">' + heartSVG() + '</button>' +
        '</div>' +
      '</div>';

    var main = $('#gMain'), track = $('#gTrack'), cur = 0;
    var thumbs = $('#gThumbs');
    var gCount = $('#gCount'), gPrev = $('#gPrev'), gNext = $('#gNext');

    main.onclick = function (e) {
      if (e.target.closest('.g-nav')) return;   // 点箭头不算缩放
      main.classList.toggle('is-zoom');
    };

    /* 把轨道滚到第 i 张（smooth），滚动事件里会自动同步计数器和缩略图 */
    function goSlide(i) {
      if (!track) return;
      cur = Math.max(0, Math.min(imgs.length - 1, i));
      track.scrollTo({ left: cur * track.clientWidth, behavior: 'smooth' });
    }

    function syncSlide() {
      if (!track) return;
      var w = Math.max(1, track.clientWidth);
      var i = Math.round(track.scrollLeft / w);
      if (i !== cur) cur = Math.max(0, Math.min(imgs.length - 1, i));
      if (gCount) gCount.textContent = t('gallery.of', { a: cur + 1, b: imgs.length });
      if (thumbs) $$('button', thumbs).forEach(function (x, idx) {
        x.classList.toggle('is-active', idx === cur);
      });
      if (gPrev) gPrev.disabled = cur <= 0;
      if (gNext) gNext.disabled = cur >= imgs.length - 1;
    }

    if (track) {
      track.addEventListener('scroll', function () { requestAnimationFrame(syncSlide); }, { passive: true });
      track.addEventListener('keydown', function () {}); // 防止滚动容器抢焦点后失灵
      window.addEventListener('resize', function () {
        track.scrollTo({ left: cur * track.clientWidth });
      });
    }
    if (gPrev) gPrev.onclick = function () { main.classList.remove('is-zoom'); goSlide(cur - 1); };
    if (gNext) gNext.onclick = function () { main.classList.remove('is-zoom'); goSlide(cur + 1); };
    if (thumbs) {
      thumbs.onclick = function (e) {
        var b = e.target.closest('button[data-i]');
        if (!b) return;
        main.classList.remove('is-zoom');
        goSlide(Number(b.dataset.i));
      };
    }
    /* 键盘左右键翻图（弹窗打开时） */
    galleryKeys = function (e) {
      if ($('#modal').hidden) return;
      if (e.key === 'ArrowLeft') goSlide(cur - 1);
      else if (e.key === 'ArrowRight') goSlide(cur + 1);
    };
    document.addEventListener('keydown', galleryKeys);
    syncSlide();
    if (imgs.length > 1) syncSlide();  // 布局稳定后再同步一次宽度
    $$('[data-size]', $('#modalBody')).forEach(function (b) {
      b.onclick = function () {
        MODAL.size = b.dataset.size;
        $$('[data-size]', $('#modalBody')).forEach(function (x) { x.classList.toggle('is-active', x === b); });
        $('#sizeEcho').textContent = MODAL.size;
      };
    });
    $$('[data-color]', $('#modalBody')).forEach(function (b) {
      b.onclick = function () {
        MODAL.color = b.dataset.color;
        $$('[data-color]', $('#modalBody')).forEach(function (x) { x.classList.toggle('is-active', x === b); });
        $('#colorEcho').textContent = MODAL.color;
      };
    });
    var fb = $('#favBtn');
    fb.classList.toggle('is-on', STATE.favs.indexOf(p.id) >= 0);
    fb.onclick = function () {
      toggleFav(p.id);
      fb.classList.toggle('is-on', STATE.favs.indexOf(p.id) >= 0);
      var c = $('#grid').querySelector('[data-fav="' + p.id + '"]');
      if (c) c.classList.toggle('is-on', STATE.favs.indexOf(p.id) >= 0);
    };
    $('#askBtn').onclick = function () {
      if (hasContact()) openContact(askText);
      else copy(askText, t('toast.copied'));
    };

    $('#modal').hidden = false;
    document.body.style.overflow = 'hidden';
    history.replaceState(null, '', location.pathname + location.search + '#p=' + encodeURIComponent(id));
  }

  function closeModal() {
    $('#modal').hidden = true;
    document.body.style.overflow = '';
    if (galleryKeys) { document.removeEventListener('keydown', galleryKeys); galleryKeys = null; }
    if (location.hash.indexOf('#p=') === 0) {
      history.replaceState(null, '', location.pathname + location.search + (STATE.cat !== 'all' ? '#' + STATE.cat : ''));
    }
  }

  function toggleFav(id) {
    var i = STATE.favs.indexOf(id);
    if (i < 0) { STATE.favs.push(id); toast(t('toast.favAdd')); }
    else { STATE.favs.splice(i, 1); toast(t('toast.favDel')); }
    writeFavs();
    if (STATE.favOnly) renderGrid();
  }

  /* ============================== 联系弹层 ============================== */
  function waLink(v) {
    var d = String(v || '').replace(/[^\d]/g, '');
    return d ? 'https://wa.me/' + d : '';
  }

  function openContact(pretext) {
    var c = STATE.data.shop.contact || {};
    var en = STATE.lang === 'en';
    var qr = safeSrc(c.wechatQr);

    var rows = [];
    if (c.wechat) rows.push([en ? 'WeChat' : '微信号', c.wechat, '']);
    if (c.whatsapp) rows.push(['WhatsApp', c.whatsapp, waLink(c.whatsapp)]);
    if (c.phone) rows.push([en ? 'Phone' : '电话', c.phone, 'tel:' + String(c.phone).replace(/[^\d+]/g, '')]);
    if (c.email) rows.push([en ? 'Email' : '邮箱', c.email, 'mailto:' + c.email]);
    var hrs = pick(c, 'workingHours');
    if (hrs) rows.push([t('contact.hours'), hrs, '']);

    $('#contactBody').innerHTML =
      '<h3>' + esc(pair(c.title, c.titleEn) || t('contact.title')) + '</h3>' +
      '<div class="sub">' + esc(pair(c.note, c.noteEn) || t('contact.sub')) + '</div>' +
      '<div class="qr">' + (qr ? '<img src="' + escA(qr) + '" alt="QR">' : t('contact.qrPh')) + '</div>' +
      (rows.length ? '<div class="contact-rows">' + rows.map(function (r) {
        if (r[2]) {
          return '<a class="contact-row" href="' + escA(r[2]) + '"' + (/^https?:/.test(r[2]) ? ' target="_blank" rel="noopener"' : '') + '>' +
              '<span class="k">' + esc(r[0]) + '</span><span class="v">' + esc(r[1]) + '</span>' +
              '<span class="copy">' + t('contact.open') + '</span></a>';
        }
        return '<button class="contact-row" data-copy="' + escA(r[1]) + '">' +
          '<span class="k">' + esc(r[0]) + '</span><span class="v">' + esc(r[1]) + '</span>' +
          '<span class="copy">' + t('contact.copy') + '</span></button>';
      }).join('') + '</div>' : '') +
      (pretext ? '<div class="contact-note">' + esc(pretext) + '</div>' : '') +
      (pretext ? '<button class="btn btn-primary btn-block" style="margin-top:16px" id="copyPre">' + t('contact.copyPre') + '</button>' : '');

    $$('[data-copy]', $('#contactBody')).forEach(function (b) {
      b.onclick = function () { copy(b.dataset.copy, t('toast.copied')); };
    });
    var cp = $('#copyPre');
    if (cp) cp.onclick = function () { copy(pretext, t('toast.copied')); };

    $('#contact').hidden = false;
    document.body.style.overflow = 'hidden';
  }

  function closeContact() {
    $('#contact').hidden = true;
    document.body.style.overflow = '';
  }

  function copy(text, msg) {
    var done = function () { toast(msg || t('toast.copied')); };
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text).then(done, function () { legacyCopy(text, done); });
    } else { legacyCopy(text, done); }
  }
  function legacyCopy(text, cb) {
    var ta = document.createElement('textarea');
    ta.value = text;
    ta.style.cssText = 'position:fixed;top:-1000px;opacity:0';
    document.body.appendChild(ta);
    ta.select();
    try { document.execCommand('copy'); cb(); } catch (e) { toast(t('toast.copyFail')); }
    document.body.removeChild(ta);
  }

  var toastTimer;
  function toast(msg) {
    var el = $('#toast');
    el.textContent = msg;
    el.classList.add('is-on');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { el.classList.remove('is-on'); }, 1900);
  }

  /* ============================== 语言切换 ============================== */
  function setLang(lang, announce) {
    if (lang !== 'zh' && lang !== 'en') return;
    var changed = STATE.lang !== lang;
    STATE.lang = lang;
    saveLang();
    $('#modal').hidden = true;
    $('#contact').hidden = true;
    document.body.style.overflow = '';
    if (STATE.data) {
      applyStaticI18n();
      renderChrome();
      renderGrid();
      syncMeta();
    }
    if (changed && announce !== false) toast(t(lang === 'en' ? 'toast.langEn' : 'toast.langZh'));
  }

  /* ============================== 事件绑定 ============================== */
  function bind() {
    document.addEventListener('error', function (e) {
      var el = e.target;
      if (el && el.tagName === 'IMG' && !el.dataset.fbDone) {
        el.dataset.fbDone = '1';
        el.src = fallbackImg();
      }
    }, true);

    document.addEventListener('click', function (e) {
      if (e.target.closest('#langBtn')) { setLang(STATE.lang === 'zh' ? 'en' : 'zh'); return; }

      var a = e.target.closest('[data-cat]');
      if (a) {
        var c = a.dataset.cat;
        if (location.hash !== '#' + c) location.hash = '#' + c;
        else applyCat(c);
        if ($('#nav').classList.contains('is-open')) $('#nav').classList.remove('is-open');
        e.preventDefault();
        return;
      }
      var f = e.target.closest('[data-fav]');
      if (f) { e.stopPropagation(); toggleFav(f.dataset.fav); return; }

      var card = e.target.closest('.card');
      if (card) { openDetail(card.dataset.id); return; }
      if (e.target.closest('#contactBtn') || e.target.closest('#contactBtn2') || e.target.closest('#footContactBtn')) { openContact(''); }
    });

    $('#chips').addEventListener('click', function (e) {
      var b = e.target.closest('.chip');
      if (!b) return;
      var c = b.dataset.cat;
      if (location.hash !== '#' + c) location.hash = '#' + c; else applyCat(c);
    });

    $('#q').addEventListener('input', function () {
      STATE.kw = this.value;
      STATE.page = 1;
      renderGrid();
      $('#clearQ').hidden = !this.value;
    });
    $('#clearQ').onclick = function () {
      $('#q').value = ''; STATE.kw = ''; STATE.page = 1;
      this.hidden = true; renderGrid();
    };
    $('#searchBtn').onclick = function () {
      var row = $('#searchRow');
      row.classList.toggle('is-open');
      if (row.classList.contains('is-open')) $('#q').focus();
      else { $('#q').value = ''; $('#clearQ').hidden = true; if (STATE.kw) { STATE.kw = ''; STATE.page = 1; renderGrid(); } }
    };

    $('#sort').addEventListener('change', function () {
      STATE.sort = this.value; STATE.page = 1; renderGrid();
    });

    $('#favToggle').onclick = function () {
      STATE.favOnly = !STATE.favOnly;
      this.classList.toggle('is-on', STATE.favOnly);
      renderGrid();
    };

    $('#menuBtn').onclick = function () {
      var nav = $('#nav');
      nav.classList.toggle('is-open');
      if (nav.classList.contains('is-open')) {
        // 手机菜单是固定定位的，公告条会让页头变高，展开时对齐到页头底部
        nav.style.top = document.querySelector('.site-header').getBoundingClientRect().bottom + 'px';
      }
    };

    $('#modalBg').onclick = closeModal;
    $('#modalClose').onclick = closeModal;
    $('#contactBg').onclick = closeContact;
    $('#contactClose').onclick = closeContact;
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') { closeModal(); closeContact(); $('#nav').classList.remove('is-open'); }
    });

    var onScroll = function () {
      $('.site-header').classList.toggle('is-stuck', window.scrollY > 8);
      $('#toTop').classList.toggle('is-on', window.scrollY > 700);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    $('#toTop').onclick = function () { window.scrollTo({ top: 0, behavior: 'smooth' }); };

    $('#pager').addEventListener('click', function (e) {
      var b = e.target.closest('button[data-page]');
      if (!b || b.disabled) return;
      gotoPage(Number(b.dataset.page));
    });
    window.addEventListener('hashchange', onHash);
  }

  function applyCat(c) {
    STATE.cat = c || 'all';
    STATE.page = 1;
    renderChrome();
    renderGrid();
    var anchor = $('#products').offsetTop - 80;
    window.scrollTo({ top: anchor < 0 ? 0 : anchor, behavior: 'smooth' });
  }

  function onHash() {
    var h = decodeURIComponent((location.hash || '').replace(/^#/, ''));
    if (h.indexOf('p=') === 0) { openDetail(h.slice(2)); return; }
    if (!h) return;
    if (h === 'all') { applyCat('all'); return; }
    /* 只有真实存在的分类 id 才切换过滤；#products、#contact 这类
       页面锚点只负责滚动定位，绝不能当成分类（否则清单会变空） */
    var isCat = STATE.data.categories.some(function (x) { return x.id === h; });
    if (isCat) applyCat(h);
  }

  /* ============================== 启动 ================================== */
  function boot(data, lang) {
    STATE.lang = lang || readLang();
    STATE.data = normalize(data);
    if (!langEnabled() && STATE.lang === 'en') STATE.lang = STATE.data.shop.i18n.default || 'zh';
    STATE.favs = readFavs();
    applyTheme(STATE.data.shop.theme);
    applyStaticI18n();
    renderChrome();
    writeFavs();
    bind();
    renderGrid();
    syncMeta();
    $('#loading').hidden = true;
    onHash();
  }

  function fail() {
    $('#loading').hidden = true;
    $('#empty').hidden = false;
  }

  function bannerPreview() {
    var b = document.createElement('div');
    b.style.cssText = 'position:fixed;left:50%;bottom:22px;transform:translateX(-50%);z-index:500;' +
      'background:#b0855b;color:#fff;font-size:12.5px;padding:9px 18px;border-radius:999px;' +
      'box-shadow:0 8px 28px rgba(0,0,0,.2);letter-spacing:.02em;max-width:88vw;text-align:center';
    b.textContent = t('toast.preview');
    document.body.appendChild(b);
    setTimeout(function () { b.style.transition = 'opacity .4s'; b.style.opacity = '0'; }, 5200);
    setTimeout(function () { if (b.parentNode) b.parentNode.removeChild(b); }, 5800);
  }

  function start() {
    if (/[?&]preview=1/.test(location.search)) {
      try {
        var pv = localStorage.getItem('shop_preview');
        if (pv) { boot(JSON.parse(pv)); bannerPreview(); return; }
      } catch (e) {}
    }
    if (window.SHOP_DATA) { boot(window.SHOP_DATA); return; }
    fetch('./data/products.json', { cache: 'no-store' })
      .then(function (r) { if (!r.ok) throw new Error('404'); return r.json(); })
      .then(function (j) { boot(j); })
      .catch(function () {
        if (window.SHOP_DATA_FALLBACK) { boot(window.SHOP_DATA_FALLBACK); return; }
        boot(DEFAULT_DATA);
        fail();
      });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
