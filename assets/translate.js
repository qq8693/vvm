/* ==========================================================================
   中文 -> 英文 离线翻译（不联网、不依赖任何库）
   --------------------------------------------------------------------------
   定位：外贸小店够用就行，重点讲清「是什么 + 什么材质 + 卖点」。
   想调效果直接改下面的词表，不用动逻辑。

   - TERMS     中文词 -> 英文（长的排前面，优先匹配长词）
   - RULES     整句规则，处理「码数26 27」这类口语写法
   - 品牌名原样保留；整行只有 emoji 的行丢掉；行话（老花/对版/原单）单独映射

   对外接口：
     TT.title(text)  标题翻译（每个词首字母大写，品牌不动）
     TT.desc(text)   描述翻译（保留换行，逐行翻）
     TT.text(text)   通用
     TT.coverage(s)  返回能识别多少、哪些词没收录（用来提示用户）
   ========================================================================== */
(function (global) {
  'use strict';

  /* ---------------------------- 一、词表 --------------------------------- */
  var TERMS = [
    /* ---- 品牌（只规范大小写，不翻译） ---- */
    ['gucci', 'Gucci'], ['酷奇', 'Gucci'], ['蔻驰', 'Coach'], ['coach', 'Coach'],
    ['miumiu', 'Miu Miu'], ['缪缪', 'Miu Miu'], ['dior', 'Dior'], ['迪奥', 'Dior'],
    ['ysl', 'YSL'], ['圣罗兰', 'Saint Laurent'], ['y s l', 'YSL'], ['lv', 'LV'],
    ['路易威登', 'Louis Vuitton'], ['nike', 'Nike'], ['耐克', 'Nike'],
    ['fila', 'FILA'], ['斐乐', 'FILA'], ['adidas', 'Adidas'], ['阿迪达斯', 'Adidas'],
    ['new balance', 'New Balance'], ['新百伦', 'New Balance'],
    ['air jordan', 'Air Jordan'], ['乔丹', 'Jordan'],
    ['prada', 'Prada'], ['普拉达', 'Prada'], ['chanel', 'Chanel'], ['香奈儿', 'Chanel'],
    ['hermes', 'Hermes'], ['爱马仕', 'Hermes'], ['戈雅', 'Goyard'], ['goyard', 'Goyard'],
    ['bottega', 'Bottega Veneta'], ['burberry', 'Burberry'], ['巴宝莉', 'Burberry'],
    ['chloe', 'Chloe'], ['loewe', 'Loewe'], ['罗意威', 'Loewe'],
    ['balenciaga', 'Balenciaga'], ['celine', 'Celine'], ['思琳', 'Celine'],
    ['givenchy', 'Givenchy'], ['fendi', 'Fendi'], ['芬迪', 'Fendi'],
    ['valentino', 'Valentino'], ['michael kors', 'Michael Kors'],
    ['lululemon', 'Lululemon'], ['the north face', 'The North Face'],
    ['salomon', 'Salomon'], ['asics', 'ASICS'], ['puma', 'Puma'],
    ['converse', 'Converse'], ['vans', 'Vans'], ['ugg', 'UGG'],

    /* ---- 包型 ---- */
    ['小号肩背包', 'small shoulder bag'], ['肩背包', 'shoulder bag'],
    ['单肩包', 'shoulder bag'], ['斜挎包', 'crossbody bag'], ['斜跨包', 'crossbody bag'],
    ['腋下包', 'underarm bag'], ['手提包', 'handbag'], ['手拎包', 'top-handle bag'],
    ['大tote', 'large tote'], ['tote包', 'tote bag'], ['购物袋', 'shopping tote'],
    ['托特包', 'tote bag'], ['子母包', 'mother-and-child bag'],
    ['保龄球包', 'bowling bag'], ['公文包', 'briefcase'], ['贝壳包', 'shell bag'],
    ['水桶包', 'bucket bag'], ['桶包', 'bucket bag'], ['化妆包', 'makeup bag'],
    ['化妆桶', 'vanity case'], ['发财筒', 'Prosperity cylinder bag'],
    ['发财桶', 'Prosperity cylinder bag'], ['圆筒包', 'cylinder bag'],
    ['钱包', 'wallet'], ['卡包', 'card holder'], ['手拿包', 'clutch'],
    ['腰包', 'belt bag'], ['胸包', 'chest bag'], ['双肩包', 'backpack'],
    ['背包', 'backpack'], ['链条包', 'chain bag'], ['方包', 'box bag'],
    ['小废包', 'mini bag'], ['手袋', 'handbag'], ['包包', 'bag'], ['包', 'bag'],

    /* ---- 鞋类 ---- */
    ['空军一号', 'Air Force 1'], ['贝壳头', 'shell toe'], ['低帮', 'low-top'],
    ['中帮', 'mid-top'], ['高帮', 'high-top'], ['板鞋', 'sneakers'],
    ['运动鞋', 'sneakers'], ['休闲鞋', 'casual shoes'], ['小靴子', 'ankle boots'],
    /* ---- 补充：常见鞋靴 / 童装话术 ---- */
    ['马丁靴', 'Martens boots'], ['马丁', 'Martens'], ['雪地靴', 'snow boots'],
    ['长靴', 'long boots'], ['短靴', 'ankle boots'], ['雨靴', 'rain boots'],
    ['凉鞋', 'sandals'], ['拖鞋', 'slippers'], ['皮鞋', 'leather shoes'],
    ['帆布鞋', 'canvas shoes'], ['板鞋', 'skate shoes'], ['老爹鞋', 'chunky sneakers'],
    ['童鞋', 'kids shoes'], ['男鞋', 'men shoes'], ['女鞋', 'women shoes'],
    ['童装', 'kids clothing'], ['童', 'kids'], ['儿童', 'kids'],
    ['亲子', 'parent-child'], ['宝宝', 'baby'], ['婴儿', 'infant'],
    ['必备', 'a must-have'], ['常备', 'everyday staple'], ['推荐', 'recommended'],
    ['爆款', 'best-seller'], ['热卖', 'hot sale'], ['新款', 'new style'],
    ['现货', 'in stock'], ['补货', 'restocked'], ['包邮', 'free shipping'],
    /* ---- 补充：老花 / 小百搭 等在 emoji 断开后残留的单字 ---- */
    ['老年', 'aged'], ['老旧', 'aged'], ['小百搭', 'versatile'],
    ['小百', 'little versatile'], ['老花', 'monogram'],
    ['短靴', 'ankle boots'], ['长靴', 'tall boots'], ['雪地靴', 'snow boots'],
    ['靴子', 'boots'], ['凉鞋', 'sandals'], ['拖鞋', 'slippers'],
    ['乐福鞋', 'loafers'], ['单鞋', 'flats'], ['户外鞋', 'outdoor shoes'],
    ['功能鞋', 'performance shoes'], ['靴', 'boots'], ['鞋', 'shoes'],

    /* ---- 服装 ---- */
    ['针织上衣', 'knit top'], ['羊绒衫', 'cashmere sweater'], ['针织衫', 'knitwear'],
    ['卫衣', 'hoodie'], ['毛衣', 'sweater'], ['大衣', 'coat'],
    ['风衣', 'trench coat'], ['羽绒服', 'down jacket'], ['棉服', 'padded jacket'],
    ['夹克', 'jacket'], ['西装', 'blazer'], ['衬衫', 'shirt'],
    ['短袖', 'short-sleeve tee'], ['t恤', 'T-shirt'], ['T恤', 'T-shirt'],
    ['牛仔裤', 'jeans'], ['裤子', 'pants'], ['半身裙', 'skirt'],
    ['吊带裙', 'slip dress'], ['连衣裙', 'dress'], ['套装', 'two-piece set'],
    ['polo领', 'polo collar'], ['外套', 'outerwear'], ['内搭', 'base layer'],
    ['上衣', 'top'], ['童装', 'kids clothing'], ['儿童', 'kids'],
    ['亲子', 'parent-child'], ['男女同款', 'unisex'], ['情侣款', 'couple style'],
    ['衣服', 'clothing'], ['服装', 'clothing'], ['配饰', 'accessories'],

    /* ---- 材质 / 工艺 ---- */
    ['光面皮革', 'polished leather'], ['磨砂皮', 'nubuck leather'],
    ['麂皮绒', 'suede'], ['麂皮', 'suede'], ['头层牛皮', 'top-grain cowhide'],
    ['进口牛皮', 'imported cowhide'], ['牛皮', 'cowhide'], ['小羊皮', 'lambskin'],
    ['羊皮', 'lambskin'], ['真皮', 'genuine leather'], ['全皮面料', 'full-leather material'],
    ['全皮', 'full leather'], ['皮革', 'leather'], ['涂层帆布', 'coated canvas'],
    ['帆布', 'canvas'], ['尼龙', 'nylon'], ['羊毛混纺', 'wool blend'],
    ['羊毛', 'wool'], ['羊绒', 'cashmere'], ['纯棉', 'pure cotton'],
    ['棉质', 'cotton'], ['桑蚕丝', 'mulberry silk'], ['真丝', 'silk'],
    ['醋酸', 'acetate'], ['涤纶', 'polyester'], ['腈纶', 'acrylic'],
    ['加绒', 'fleece-lined'], ['加厚', 'thickened'], ['透气', 'breathable'],
    ['耐磨', 'wear-resistant'], ['耐撕抗造', 'tear-resistant'],
    ['防泼水', 'water-repellent'], ['防水', 'water-resistant'],
    ['软糯', 'soft and cozy'], ['细腻', 'fine'], ['光泽', 'lustre'],
    ['老花', 'monogram'], ['印花', 'print'], ['刺绣', 'embroidered'],
    ['绗缝', 'quilted'], ['压花', 'embossed'], ['暗纹', 'subtle emboss'],
    ['撞色', 'colour-block'], ['拼色', 'two-tone'], ['拼接', 'panelled'],
    ['立体', 'structured'], ['绞花纹', 'cable knit'], ['罗纹', 'ribbed'],
    ['毛边', 'raw edge'], ['五金', 'hardware'], ['对版', 'replicated 1:1'],
    ['原单版', 'original-factory grade'], ['原单', 'original-factory grade'],
    ['原版', 'original version'], ['专柜质感', 'boutique-grade'],
    ['专柜', 'boutique-grade'], ['高版本', 'premium grade'],
    ['高定', 'haute couture'], ['最高品质', 'top quality'], ['纯黑色系', 'all-black'],
    ['撞色细腻', 'fine colour-block'],

    /* ---- 部位 / 结构 ---- */
    ['半马衔扣', 'half-Horsebit'], ['马衔扣', 'Horsebit'], ['搭扣', 'clasp'],
    ['磁性扣', 'magnetic closure'], ['拉链口袋', 'zipped pocket'], ['拉链', 'zip'],
    ['三层接档', 'three compartments'], ['接档', 'compartment'],
    ['隔层', 'compartment'], ['内衬', 'lining'], ['内里', 'interior'],
    ['手提柄', 'top handle'], ['手柄', 'handle'], ['提手', 'top handle'],
    ['肩带', 'shoulder strap'], ['可脱卸', 'detachable'], ['可拆卸', 'detachable'],
    ['链条', 'chain'], ['织带', 'webbing strap'], ['鞋面', 'upper'],
    ['大底', 'outsole'], ['中底', 'midsole'], ['鞋底', 'sole'],
    ['气垫', 'air cushion'], ['鞋头防撞', 'reinforced toe cap'],
    ['弹性束带', 'elastic strap'], ['束带设计', 'strap design'],
    ['魔术贴', 'hook-and-loop strap'], ['松紧自如', 'adjustable fit'],
    ['便捷调节', 'easy adjustment'], ['礼盒包装', 'gift-box packaging'],
    ['折叠礼盒', 'folded gift box'], ['礼盒', 'gift box'],
    ['飞机盒', 'mailer box'], ['包装', 'packaging'], ['挂件', 'charm'],
    ['吊牌', 'hang tag'], ['芯片版', 'with chip'], ['芯片', 'chip'],

    /* ---- 状态 / 卖点 ---- */
    ['现货发售', 'In stock now'], ['现货发', 'Ships immediately'], ['现货', 'in stock'],
    ['预售', 'pre-order'], ['限量', 'limited edition'], ['新品', 'new arrival'],
    ['热销', 'best seller'], ['爆款', 'hot item'], ['断码', 'assorted sizes'],
    ['清仓', 'clearance'], ['包邮', 'free shipping'], ['只换码', 'size exchange only'],
    ['当季', 'this season'], ['基础款', 'basic style'], ['经典款', 'classic style'],
    ['百搭', 'versatile'], ['简约', 'minimalist'], ['大方', 'understated'],
    ['优雅', 'elegant'], ['精致', 'refined'], ['高级感', 'premium feel'],
    ['颜值', 'good looks'], ['时尚', 'stylish'], ['复古', 'vintage'],
    ['俏皮', 'playful'], ['温柔', 'soft'], ['轻盈', 'lightweight'],
    ['轻便', 'lightweight'], ['容量', 'capacity'], ['实用', 'functional'],
    ['品质', 'quality'], ['做工', 'craftsmanship'], ['质感', 'texture'],
    ['版型', 'fit'], ['辨识度', 'instantly recognisable'],
    ['回头率', 'head-turning'], ['人手必备', 'a must-have'],
    ['必备单品', 'a must-have piece'], ['主推系列', 'featured collection'],
    ['主推', 'featured'], ['走秀款', 'runway style'], ['走秀', 'runway'],
    ['超精致', 'exquisite'], ['超赞', 'excellent'], ['超百搭', 'ultra-versatile'],
    ['太温柔', 'so soft'], ['很难不爱', 'hard to resist'], ['心动', 'heart-stopping'],
    ['满满的高级感', 'full of premium feel'], ['不张扬', 'understated'],
    ['不容错过', 'not to be missed'], ['高级', 'premium'], ['质感细腻', 'fine texture'],
    ['简单', 'simple'], ['好看', 'good-looking'], ['美腻', 'gorgeous'],
    ['小公主', 'little princess'], ['富婆', 'fashion lover'],

    /* ---- 尺码 ---- */
    ['均码', 'One Size'], ['加长', 'Extended'], ['大码', 'Plus Size'],
    ['小码', 'XS'], ['码数', 'Sizes'], ['尺码', 'Sizes'], ['尺寸', 'Size'],
    ['长度', 'Length'], ['身高', 'Height'], ['体重', 'Weight'],

    /* ---- 颜色 ---- */
    ['米棕', 'beige-brown'], ['银灰', 'silver grey'], ['墨绿', 'dark green'],
    ['军绿', 'army green'], ['藏青', 'navy'], ['牛仔蓝', 'denim blue'],
    ['雾霾蓝', 'haze blue'], ['酒红', 'burgundy'], ['藕粉', 'dusty pink'],
    ['姜黄', 'turmeric yellow'], ['玫瑰金', 'rose gold'], ['黑金', 'black and gold'],
    ['米白', 'off-white'], ['黑色', 'black'], ['白色', 'white'],
    ['米色', 'beige'], ['杏色', 'apricot'], ['驼色', 'camel'],
    ['棕色', 'brown'], ['咖色', 'coffee'], ['灰色', 'grey'],
    ['绿色', 'green'], ['蓝色', 'blue'], ['红色', 'red'],
    ['粉色', 'pink'], ['紫色', 'purple'], ['黄色', 'yellow'],
    ['橙色', 'orange'], ['金色', 'gold-tone'], ['银色', 'silver-tone'],

    /* ---- 度量 ---- */
    ['厘米', 'cm'], ['公分', 'cm'], ['毫米', 'mm'], ['英寸', 'inch'],
    ['千克', 'kg'],

    /* ---- 常用名词 ---- */
    ['系列', 'Collection'], ['款式', 'style'], ['颜色', 'colour'],
    ['材质', 'material'], ['面料', 'fabric'], ['配件', 'hardware'],
    ['细节', 'detail'], ['设计', 'design'], ['风格', 'style'],
    ['元素', 'element'], ['背面', 'back side'], ['正面', 'front'],
    ['外部', 'exterior'], ['型号', 'Model No.'], ['货号', 'Style No.'],
    ['编号', 'No.'], ['图片', 'image'], ['实拍', 'actual photo'],
    ['配色', 'colourway'], ['集图', 'swatch set'], ['上脚', 'on foot'],
    ['上身', 'on the body'], ['效果', 'effect'], ['上市', 'release'],
    ['发售', 'release'], ['同款', 'same style'], ['官网', 'official site'],

    /* ---- 补充词表 ---- */
    ['标志性', 'iconic'],
    ['演变', 'evolution'],
    ['延续', 'continues'],
    ['经典', 'classic'],
    ['这一', 'this'],
    ['源自', 'originating in'],
    ['世纪', 'century'],
    ['年代', 's'],
    ['选用', 'crafted from'],
    ['匠心', 'artisanal'],
    ['打造', 'craftsmanship'],
    ['挺括', 'structured'],
    ['造型', 'silhouette'],
    ['融蕴', 'drawing on'],
    ['精细', 'fine'],
    ['采用', 'made of'],
    ['面料', 'fabric'],
    ['纹路', 'grain'],
    ['清晰', 'clear'],
    ['易见', 'visible'],
    ['打磨', 'polished'],
    ['这款', 'this'],
    ['内衬', 'lining'],
    ['设有', 'with'],
    ['内部', 'interior'],
    ['搭配', 'paired with'],
    ['配有', 'comes with'],
    ['装饰', 'accent'],
    ['点缀', 'accent'],
    ['线条', 'lines'],
    ['圆润', 'rounded'],
    ['流畅', 'flowing'],
    ['自带', 'with a natural'],
    ['调性', 'character'],
    ['包身', 'body'],
    ['字母', 'lettering'],
    ['满印', 'all-over print'],
    ['皮质', 'leather'],
    ['金属', 'metal'],
    ['双', 'double '],
    ['个拉链', 'a zipped'],
    ['口袋', 'pocket'],
    ['个', ''],
    ['的', ''],
    ['了', ''],
    ['这', ''],
    ['那', ''],
    ['是', ''],
    ['有', ''],
    ['为', ''],
    ['也', ''],
    ['很', ''],
    ['都', ''],
    ['最', ''],
    ['和', ''],
    ['与', ''],
    ['及', ''],
    ['或', ''],
    ['不', ''],
    ['可', ''],
    ['能', ''],
    ['使', ''],
    ['让', ''],
    ['更', ''],
    ['超', ''],
    ['极', 'extremely '],
    ['高级', 'premium'],
    ['级感', 'premium feel'],
    ['级', 'grade'],
    ['年度', 'year'],
    ['秋冬', 'Fall/Winter'],
    ['春夏', 'Spring/Summer'],
    ['新款', 'new style'],
    ['款', ''],
    ['版', ''],
    ['款式', 'style'],
    ['单品', 'piece'],
    ['人手', 'everyone'],
    ['绝对', 'absolutely'],
    ['作为', 'as'],
    ['入门级', 'entry level'],
    ['入门', 'entry-level'],
    ['实用性', 'practicality'],
    ['实用性强', 'highly practical'],
    ['容量', 'capacity'],
    ['足足', 'generous'],
    ['杠杠滴', 'excellent'],
    ['造型满分', 'great silhouette'],
    ['满分', 'outstanding'],
    ['不只', 'not only'],
    ['其', ''],
    ['强', 'strong'],
    ['亮点', 'highlight'],
    ['十足', 'full of'],
    ['雅致', 'refined'],
    ['时尚', 'stylish'],
    ['混合', 'blended'],
    ['旅行用品', 'travel goods'],
    ['致敬', 'a tribute to'],
    ['复古风', 'retro trend'],
    ['当道', 'in vogue'],
    ['风', 'style'],
    ['继续', 'continues'],
    ['经典款', 'classic style'],
    ['手提肩挎', 'carry by hand or shoulder'],
    ['一步到位', 'versatile carry'],
    ['配有手柄', 'with a handle'],
    ['柔软', 'soft'],
    ['新月形', 'crescent shape'],
    ['包型', 'silhouette'],
    ['纵向', 'vertically'],
    ['贯穿', 'running through'],
    ['正面', 'front'],
    ['一条', 'a'],
    ['红绿相间', 'green-red-green'],
    ['最具', 'most'],
    ['设计元素', 'design element'],
    ['之一', 'one of'],
    ['覆满', 'covered in'],
    ['基调', 'undertone'],
    ['米棕色', 'beige-brown'],
    ['圆桶', 'barrel'],
    ['桶', 'case'],
    ['质感细腻', 'fine texture'],
    ['最高品质', 'top quality'],
    ['纹路清晰易见', 'clear visible grain'],
    ['精细光面皮革', 'fine polished leather'],
    ['挺括造型', 'structured silhouette'],
    ['标志性元素', 'iconic element'],
    ['细节版型设计', 'detail and fit'],
    ['绝对是最百搭', 'absolutely the most versatile'],
    ['人手必备', 'everyone needs one'],
    ['超百搭', 'ultra versatile'],
    ['超赞', 'excellent'],
    ['很难不爱', 'hard not to love'],
    ['简直', 'simply'],
    ['辨识度', 'recognisability'],
    ['很有点东西', 'has real substance'],
    ['随便背', 'works with anything'],
    ['能装', 'roomy'],
    ['好打理', 'easy to care for'],
    ['甜度刚好', 'just the right sweetness'],
    ['手拎', 'hand-carry'],
    ['出场', 'stepping out'],
    ['线条圆润流畅', 'smooth rounded lines'],
    ['富婆', 'fashion lovers'],
    ['贵妇', 'elegant women'],
    ['礼盒包装', 'gift-box packaging'],
    ['礼盒', 'gift box'],
    ['包装', 'packaging'],
    ['送挂件', 'charm included'],
    ['挂件', 'charm'],
    ['官网飞机盒', 'official mailer box'],
    ['发货', 'ships'],
    ['现货发出', 'ships in stock'],
    ['现货', 'in stock'],
    ['码数', 'sizes'],
    ['尺码', 'sizes'],
    ['尺寸', 'size'],
    ['身高', 'height'],
    ['体重', 'weight'],
    ['半码', 'half sizes'],
    ['换码', 'size exchange'],
    ['只换码', 'size exchange only'],
    ['高版本', 'premium grade'],
    ['原单', 'original-factory grade'],
    ['对版', 'replicated 1:1'],
    ['五金', 'hardware'],
    ['女装', "women's"],
    ['男装', "men's"],
    ['童装', 'kids clothing'],
    ['袜子', 'socks'],
    ['帽子', 'hat'],
    ['围巾', 'scarf'],
    ['手套', 'gloves'],
    ['眼镜', 'eyewear'],
    ['墨镜', 'sunglasses'],
    ['手表', 'watch'],
    ['首饰', 'jewellery'],
    ['项链', 'necklace'],
    ['耳环', 'earrings'],
    ['手链', 'bracelet'],
    ['戒指', 'ring'],
    ['皮带', 'belt'],
    ['腰带', 'belt'],
    ['行李箱', 'suitcase'],
    ['雨伞', 'umbrella'],
    ['香水', 'perfume'],
    ['加大', 'XL'],
    ['小号', 'small'],
    ['中号', 'medium'],
    ['大号', 'large'],
    ['特大', 'extra large'],
    ['精致', 'refined'],
    ['细腻', 'fine'],
    ['光泽', 'lustre'],
    ['光滑', 'smooth'],
    ['舒适', 'comfortable'],
    ['舒适度', 'comfort'],
    ['百搭款', 'versatile style'],
    ['不张扬', 'understated'],
    ['低调', 'understated'],
    ['亮眼', 'eye-catching'],
    ['吸睛', 'eye-catching'],
    ['耐看', 'timeless'],
    ['耐造', 'hard-wearing'],
    ['耐穿', 'durable'],
    ['抗造', 'rugged'],
    ['轻质', 'lightweight'],
    ['柔软舒适', 'soft and comfortable'],
    ['松紧', 'elastic'],
    ['束带', 'strap'],
    ['束带设计', 'strap design'],
    ['鞋头', 'toe cap'],
    ['防撞', 'anti-collision'],
    ['橡胶', 'rubber'],
    ['橡胶大底', 'rubber outsole'],
    ['搭载', 'equipped with'],
    ['柔能科技', 'soft-energy technology'],
    ['科技', 'technology'],
    ['全掌', 'full-length'],
    ['原楦', 'original last'],
    ['原纸板', 'original board'],
    ['纯正', 'authentic'],
    ['柔云', 'soft cloud'],
    ['户外', 'outdoor'],
    ['透气', 'breathable'],
    ['轻盈', 'lightweight'],
    ['便捷', 'easy'],
    ['调节', 'adjustment'],
    ['自如', 'freely'],
    ['设计', 'design'],
    ['专利', 'patented'],
    
    /* ---- 补充词表 2 ---- */
    ['戴妃三格', 'Three-Compartment Lady Bag'],
    ['戴妃', 'Lady'],
    ['三格', 'Three-Compartment'],
    ['再看一眼', 'one more look'],
    ['还是会', 'still'],
    ['凡而', 'and'],
    ['磨砂', 'matte'],
    ['怎么背', 'however you carry it'],
    ['并存', 'together'],
    ['过时', 'out of date'],
    ['有点东西', 'has real substance'],
    ['东西', 'substance'],
    ['涂层', 'coated'],
    ['怪', 'wonder'],
    ['保龄球', 'bowling'],
    ['斜挎', 'crossbody'],
    ['轮廓', 'contour'],
    ['松弛自然', 'relaxed'],
    ['松弛', 'relaxed'],
    ['慵懒', 'laid-back'],
    ['随意', 'effortless'],
    ['出彩', 'stand out'],
    ['长', 'long'],
    ['年代感', 'retro feel'],
    ['小百搭', 'versatile'],
    ['孩', 'kids'],
    ['爆开', 'off the charts'],
    ['调剂', 'accent'],
    ['按扣', 'snap closure'],
    ['宽', 'width'],
    ['深', 'depth'],
    ['高度', 'height'],
    ['约', 'approx.'],
    ['利落', 'clean-lined'],
    ['创作', 'created'],
    ['领', 'collar'],
    ['纱线', 'yarn'],
    ['精心', 'carefully'],
    ['制作', 'made'],
    ['手感', 'hand feel'],
    ['超好', 'excellent'],
    ['别致', 'distinctive'],
    ['左侧', 'left side'],
    ['气质', 'elegance'],
    ['非常', 'very'],
    ['休闲', 'casual'],
    ['内置', 'built-in'],
    ['阔腿', 'wide-leg'],
    ['连衣裙', 'dress'],
    ['短裤', 'shorts'],
    ['卫裤', 'sweatpants'],
    ['打底', 'base layer'],
    ['马甲', 'vest'],
    ['皮衣', 'leather jacket'],
    ['貂皮', 'mink'],
    ['皮草', 'fur'],
    ['围脖', 'neck warmer'],
    ['贝雷帽', 'beret'],
    ['棒球帽', 'cap'],
    ['旅行箱', 'suitcase'],
    ['登机箱', 'carry-on'],
    ['双肩背', 'backpack'],
    ['小挎包', 'mini crossbody'],
    ['拖鞋', 'slippers'],
    ['洞洞鞋', 'clogs'],
    ['帆布鞋', 'canvas shoes'],
    ['老爹鞋', 'chunky sneakers'],
    ['松糕鞋', 'platform shoes'],
    ['高跟', 'high heel'],
    ['粗跟', 'block heel'],
    ['细跟', 'stiletto'],
    ['尖头', 'pointed toe'],
    ['圆头', 'round toe'],
    ['方头', 'square toe'],
    ['真皮底', 'leather sole'],
    ['复合底', 'composite sole'],
    ['一件代发', 'dropshipping'],
    ['批发', 'wholesale'],
    ['支持验货', 'inspection welcome'],
    ['七天', 'seven days'],
    ['无理由', 'no reason'],
    ['退货', 'returns'],
    ['换货', 'exchanges'],
    ['售后', 'after-sales'],
    ['客服', 'customer service'],
    ['下单', 'place an order'],
    ['咨询', 'enquire'],
    ['微信', 'WeChat'],
    ['实拍图', 'actual photos'],
    ['细节图', 'detail photos'],
    ['多角度', 'multiple angles'],
    ['可挑款', 'choice of styles'],
    ['支持', 'supports'],
    ['可退换', 'returnable'],
    ['原包装', 'original packaging'],
    ['全套', 'full set'],
    ['齐全', 'complete'],
    ['配件齐全', 'complete accessories'],
    ['礼袋', 'gift bag'],
    ['送人', 'gift-ready'],
    ['自用', 'for personal use'],
    ['象牙白', 'ivory'],
    ['奶油色', 'cream'],
    ['香芋紫', 'taro purple'],
    ['薄荷绿', 'mint'],
    ['抹茶绿', 'matcha green'],
    ['天蓝', 'sky blue'],
    ['宝蓝', 'royal blue'],
    ['枣红', 'claret'],
    ['砖红', 'brick red'],
    ['焦糖', 'caramel'],
    ['摩卡', 'mocha'],
    ['卡其', 'khaki'],
    ['奶茶', 'milk tea'],
    ['浅灰', 'light grey'],
    ['深灰', 'dark grey'],
    ['均码适合', 'One size fits'],
    ['偏小', 'runs small'],
    ['偏大', 'runs large'],
    ['建议', 'recommended'],
    ['参考', 'reference'],
    ['对照表', 'size chart'],
    ['头层', 'top-grain'],
    ['二层', 'split leather'],
    ['超纤', 'microfibre'],
    ['pu皮', 'PU leather'],
    ['PVC', 'PVC'],
    ['漆皮', 'patent leather'],
    ['压纹', 'grained'],
    ['荔枝纹', 'pebbled grain'],
    ['小牛皮', 'calfskin'],
    ['山羊皮', 'goatskin'],
    ['猪皮', 'pigskin'],
    ['帆布材质', 'canvas material'],
    ['绒面', 'napped'],
    ['毛呢', 'wool-blend fabric'],
    ['腈纶混纺', 'acrylic blend'],
    ['弹力', 'stretch'],
    ['四面弹', '4-way stretch'],
    ['子母', 'mother-and-child'],
    ['腋下', 'underarm'],
    ['廓形', 'silhouette'],
    ['形', 'shape'],
    ['混', 'blended'],
    ['色', 'colour'],
    ['调', 'tone'],
    ['衬里', 'lining'],
    ['层', 'layer'],
    ['码', 'size'],
    ['空军', 'Air Force'],
    ['帮', 'top'],
    ['球', 'ball'], ['潮', 'trendy'], ['搭', 'match']
  ];

  /* ------------------------- 整句规则（先跑） --------------------------- */
  var RULES = [
    [/尺码?\s*[：:]\s*(\d{2,3})\s*[-–~到]\s*(\d{2,3})/g, 'Sizes: $1-$2'],
    [/码数\s*(\d{2,3})\s*[-–~到]\s*(\d{2,3})/g, 'Sizes: $1-$2'],
    [/码数\s*([\d\s,，、]{3,})/g, 'Sizes: $1'],
    [/尺码?\s*[：:]\s*([\d\s\-–~.,，、]+)/g, 'Sizes: $1'],
    [/\b[Ss][Ii][Zz][Ee]\s*[：:]\s*([\d\s\-–~.]+)/g, 'Sizes: $1'],
    [/尺寸\s*(\d{2,3})\s*[*xX×]\s*(\d{2,3})(\s*[*xX×]\s*(\d{2,3}))?/g,
      function (m) { return 'Size: ' + [m[1], m[2], m[4]].filter(Boolean).join(' x '); }],
    [/尺寸\s*[：:]\s*/g, 'Size: '],
    // 注意：冒号要跟着一起产出，否则后面分词时会被当成标点吃掉
    [/材质\s*[：:]\s*/g, 'Material: '],
    [/面料\s*[：:]\s*/g, 'Fabric: '],
    [/颜色\s*[：:]\s*/g, 'Colour: '],
    [/型号\s*[：:]\s*/g, 'Model No. '],
    [/货号\s*[：:]\s*/g, 'Style No. '],
    [/简介\s*[：:]\s*/g, ''],
    // 「24年当季」->「2024 season」
    [/(\d{2})\s*年\s*当季/g, '20$1 season'],
    [/(\d{2})\s*年\s*(新款|新品|新)/g, '20$1 new'],
    [/(\d{4})\s*年\s*(新款|新品|当季|新)/g, '$1 new'],
    [/^[—\-–\s]*[^，。！]{0,12}(集图|配色集|合集)[^，。！]{0,12}[—\-–\s]*$/g, ''],
    [/官网飞机盒/g, 'official mailer box']
  ];

  /* --------------------------- emoji / 清洗 ---------------------------- */
  var EMOJI_RE = /[\uD800-\uDBFF][\uDC00-\uDFFF]|[\u2600-\u27BF\u2B00-\u2BFF\uFE0F\u200D\u20E3\u3030\u303D\u00A9\u00AE\u2122\u25AA-\u25FF]/g;
  var NOISE_RE = /[\u200B-\u200D\uFEFF\u00A0]/g;
  var CH_PUNC = {
    '，': ', ', '。': '. ', '、': ', ', '；': '; ', '：': ': ', '！': '! ',
    '？': '? ', '（': ' (', '）': ') ', '【': ' [', '】': '] ',
    '“': '"', '”': '"', '‘': "'", '’': "'", '～': '~', '｜': ' | ',
    '·': ' · ', '／': '/', '　': ' ', '➕': '+', '&': ' & '
  };

  function clean(s) {
    return String(s == null ? '' : s).replace(NOISE_RE, '').replace(EMOJI_RE, '');
  }

  /* 中文标点转英文（在分词之后做，避免标点干扰匹配） */
  function punct(s) {
    return s.replace(/[，。、；：！？（）【】“”‘’～｜·／　➕]/g, function (c) {
      return CH_PUNC[c] || ' ';
    });
  }

  /* 去掉相邻重复词：如 "Bag Bag" / "Tote Shopping Tote" 里的重复 */
  function dedupe(s) {
    var parts = s.split(' ');
    var out = [], seen = {};
    for (var i = 0; i < parts.length; i++) {
      var w = parts[i];
      var lw = w.toLowerCase().replace(/[^a-z0-9]/g, '');
      if (lw && lw === String(out[out.length - 1] || '').toLowerCase().replace(/[^a-z0-9]/g, '')) {
        continue;                       // 与前一个词完全相同 -> 丢
      }
      out.push(w);
    }
    return out.join(' ');
  }

  function isCJK(ch) {
    var c = ch.charCodeAt(0);
    return (c >= 0x4e00 && c <= 0x9fff) || (c >= 0x3400 && c <= 0x4dbf);
  }

  function onlyEmoji(s) {
    // 注意：不能用 /[\s\W]/,JS 的 \W 在非 unicode 模式下会把中文也当成非单词字符
    return clean(s).replace(/[\s,.;:!?·|+\-—_/\\'"()\[\]{}~<>@#$%^&*=]+/g, '').length === 0;
  }

  /* --------------------------- 建索引（长词优先） ----------------------- */
  var SORTED = TERMS.slice().sort(function (a, b) { return b[0].length - a[0].length; });
  var LOWER = {};
  for (var i = 0; i < TERMS.length; i++) {
    var k = TERMS[i][0].toLowerCase();
    if (!(k in LOWER)) LOWER[k] = TERMS[i][1];
  }

  /* ----------------------------- 核心翻译 ------------------------------ */
  function applyRules(s) {
    for (var i = 0; i < RULES.length; i++) {
      s = s.replace(RULES[i][0], RULES[i][1]);
    }
    return s;
  }

  function stripPunct(s) {
    // 注意：冒号不能去掉，否则 "Material: " 会被削成 "Material"
    return s.replace(/^[\s,.;!?·|]+/, '').replace(/[\s,.;!?·|]+$/, '').trim();
  }

  function translateSegment(raw) {
    var seg = clean(raw).trim();
    if (!seg) return '';
    seg = applyRules(seg);
    if (!seg.trim()) return '';

    var out = [], latin = '';
    function flush() {
      var s = stripPunct(latin);
      latin = '';
      if (!s) return;
      var low = s.toLowerCase();
      if (Object.prototype.hasOwnProperty.call(LOWER, low)) out.push(LOWER[low]);
      else out.push(s);
    }

    var i = 0, n = seg.length;
    while (i < n) {
      var ch = seg.charAt(i);
      if (isCJK(ch)) {
        flush();
        // 正向最大匹配：从长到短试，命中即用
        var hit = null;
        for (var j = 0; j < SORTED.length; j++) {
          var key = SORTED[j][0];
          if (seg.substr(i, key.length) === key) { hit = SORTED[j]; break; }
        }
        if (hit) {
          if (hit[1]) out.push(hit[1]);   // 翻译成空串的词（如「的」）直接吞掉
          i += hit[0].length;
        } else {
          i += 1;                          // 未收录的中文字跳过，避免中英混杂
        }
      } else {
        latin += ch;
        i += 1;
      }
    }
    flush();

    var res = punct(out.filter(function (x) { return x !== ''; }).join(' '));
    // 与 scrape_tool.py 的 norm_en() 保持一致：收空格、修标点
    res = res.replace(/\s+:/g, ':');            // "材质 :" -> ":"
    res = res.replace(/:\s{2,}/g, ': ');        // "Material:  x" -> "Material: x"
    res = res.replace(/\s+([,.;:!?])/g, '$1');  // "design ." -> "design."
    res = res.replace(/([,.;:!?])(?=[A-Za-z])/g, '$1 ');
    res = res.replace(/\s{2,}/g, ' ');
    res = dedupe(res);
    return stripPunct(res);
  }

  function translateText(text, keepLines) {
    if (!text) return '';
    var lines = String(text).replace(/\r\n?/g, '\n').split('\n');
    var out = [];
    for (var i = 0; i < lines.length; i++) {
      var line = lines[i];
      if (onlyEmoji(line)) { if (keepLines) out.push(''); continue; }
      var t = translateSegment(line);
      if (!t) continue;
      // 每行首字母大写，看起来更像正经英文文案（与 scrape_tool.py 一致）
      t = t.replace(/^([^A-Za-z]*)([a-z])/, function (m, p, c) { return p + c.toUpperCase(); });
      out.push(t);
    }
    if (keepLines) {
      var s = out.join('\n').replace(/\n{3,}/g, '\n\n');
      return s.trim();
    }
    return out.join(' ').replace(/\s{2,}/g, ' ').trim();
  }

  /* --------------------------- 标题大小写 ------------------------------ */
  var BRANDS = ['Gucci', 'Coach', 'Miu Miu', 'Dior', 'YSL', 'LV', 'Nike', 'FILA',
    'Adidas', 'Prada', 'Chanel', 'Hermes', 'Goyard', 'Bottega Veneta', 'Burberry',
    'Chloe', 'Loewe', 'Balenciaga', 'Celine', 'Givenchy', 'Fendi', 'Valentino',
    'New Balance', 'Air Jordan', 'Jordan', 'Louis Vuitton', 'Saint Laurent',
    'Air Force 1', 'Horsebit', 'T-shirt', 'XS', 'One Size', 'Plus Size'];
  var SMALL = { a: 1, an: 1, the: 1, and: 1, or: 1, with: 1, for: 1, of: 1, in: 1, on: 1, to: 1 };

  function titleCase(s) {
    if (!s) return s;
    var holders = {}, mark = '\u0001';
    BRANDS.forEach(function (b) {
      if (s.indexOf(b) >= 0) {
        var key = mark + Object.keys(holders).length + mark;
        holders[key] = b;
        s = s.split(b).join(key);
      }
    });
    var parts = s.split(' ');
    for (var i = 0; i < parts.length; i++) {
      var w = parts[i];
      if (!w || w.indexOf(mark) === 0) continue;
      if (/\d/.test(w)) continue;
      var lw = w.toLowerCase();
      if (i > 0 && SMALL[lw]) parts[i] = lw;
      else parts[i] = w.charAt(0).toUpperCase() + w.slice(1);
    }
    s = parts.join(' ');
    Object.keys(holders).forEach(function (k) { s = s.split(k).join(holders[k]); });
    return s;
  }

  /* ---------------------------- 覆盖率分析 ----------------------------- */
  /* 返回没被收录的中文字，用来提示用户「这些词没翻译出来」 */
  function unknownChars(text) {
    var found = {}, order = [];
    var lines = String(text || '').replace(/\r\n?/g, '\n').split('\n');
    lines.forEach(function (line) {
      var seg = clean(line).trim();
      if (!seg) return;
      seg = applyRules(seg);
      var i = 0;
      while (i < seg.length) {
        var ch = seg.charAt(i);
        if (isCJK(ch)) {
          var hit = false;
          for (var j = 0; j < SORTED.length; j++) {
            var key = SORTED[j][0];
            if (seg.substr(i, key.length) === key) { i += key.length; hit = true; break; }
          }
          if (!hit) {
            if (!found[ch]) { found[ch] = 1; order.push(ch); }
            else found[ch]++;
            i += 1;
          }
        } else { i += 1; }
      }
    });
    return order;
  }

  function coverage(text) {
    var total = (String(text || '').match(/[\u4e00-\u9fff]/g) || []).length;
    var miss = unknownChars(text);
    var missCount = miss.reduce(function (a, c) { return a + (c ? 1 : 0); }, 0);
    var missCharTotal = 0;
    var lines = String(text || '').replace(/\r\n?/g, '\n').split('\n');
    lines.forEach(function (l) {
      var seg = applyRules(clean(l).trim());
      if (!seg) return;
      for (var i = 0; i < seg.length; i++) {
        var ch = seg.charAt(i);
        if (!isCJK(ch)) continue;
        var hit = false;
        for (var j = 0; j < SORTED.length; j++) {
          if (seg.substr(i, SORTED[j][0].length) === SORTED[j][0]) { hit = true; break; }
        }
        if (!hit) missCharTotal++;
      }
    });
    var ok = Math.max(0, total - missCharTotal);
    return {
      total: total,
      hit: ok,
      missed: miss,
      rate: total ? Math.round(ok * 100 / total) : 100
    };
  }

  global.TT = {
    title: function (t) { return titleCase(translateText(t, false)); },
    desc: function (t) { return translateText(t, true); },
    text: function (t) { return translateText(t, true); },
    coverage: coverage,
    unknownChars: unknownChars,
    _terms: TERMS
  };
})(typeof window !== 'undefined' ? window : this);
