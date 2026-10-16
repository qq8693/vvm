/* ==========================================================================
   示例数据（供管理工具的「恢复示例数据」使用）
   --------------------------------------------------------------------------
   ⚠️ 这个文件由「管理工具 admin.html」自动生成，一般不需要手动改。
      改商品 → 打开 admin.html → 改完点「导出 products.js」→ 覆盖本文件 → 上传 GitHub。

   双语规则：
     - 每个文字字段都有中文版和带 En 后缀的英文版，例如 name / nameEn。
     - 英文留空时，英文界面会自动显示中文（反之亦然），所以可以慢慢补。
     - 价格：英文界面按 shop.i18n.rate 换算，并显示 shop.i18n.currency.en 的货币符号。
       （示例 rate = 0.14 是演示用的人民币→美元近似汇率，换成你自己的报价汇率即可。）
   ========================================================================== */
window.SHOP_DEMO = {
  "version": 3,
  "updatedAt": "2026-10-16T18:30:00",

  "shop": {
    "name": "拾光衣橱",
    "nameEn": "Shiguang Atelier",
    "logoText": "拾光",
    "logoTextEn": "SHIGUANG",
    "slogan": "简约日常 · 好穿好搭",
    "sloganEn": "Everyday essentials, made simple",

    "announcement": {
      "enabled": true,
      "text": "满 299 包邮 · 支持海外直邮 · 加微信备注「网站」领 10 元新客券",
      "textEn": "Free shipping over ¥299 · Worldwide shipping available · New customers get 10% off"
    },

    "hero": {
      "enabled": true,
      "title": "把喜欢的衣服\n穿成自己的样子",
      "titleEn": "Clothes you will actually\nwant to wear every day",
      "subtitle": "每一件都亲自挑过、上身试过。版型不含糊，价格不心疼。慢慢逛，不着急。",
      "subtitleEn": "Every piece is hand-picked and tried on before it goes up here. Honest cuts, fair prices. Take your time.",
      "buttonText": "看看这份清单",
      "buttonTextEn": "Browse the collection",
      "image": ""
    },

    "contact": {
      "title": "联系店主",
      "titleEn": "Get in Touch",
      "wechat": "shiguang_yichu",
      "wechatQr": "",
      "whatsapp": "+86 138 0000 0000",
      "phone": "138-0000-0000",
      "email": "hello@shiguang.example",
      "workingHours": "每天 10:00 - 22:00（GMT+8）",
      "workingHoursEn": "Mon-Sat 10:00-22:00 (GMT+8)",
      "note": "图片都是实拍，尺码拿不准可以直接问，我帮你参考。",
      "noteEn": "All photos are our own. If you are unsure about sizing, just ask - happy to help."
    },

    "footer": {
      "text": "一间开的很小的线上衣橱。只做自己会穿的款式，每季上新不多，但件件耐穿。",
      "textEn": "A tiny online wardrobe. We only make what we would wear ourselves - few pieces each season, but each one built to last.",
      "copyright": "",
      "copyrightEn": "",
      "extra": "本站图片均为实拍，盗图必究",
      "extraEn": "All images are our own work. Please do not reuse them."
    },

    "theme": {
      "ink": "#14161a",
      "accent": "#b0855b",
      "bg": "#ffffff",
      "bgSoft": "#f8f7f5",
      "line": "#ebe8e4",
      "radius": 14,
      "showSoldOutLast": true
    },

    "i18n": {
      "enabled": true,
      "default": "zh",
      "currency": { "zh": "¥", "en": "$" },
      "rate": 0.14
    }
  },

  "categories": [
    { "id": "coat", "name": "外套", "nameEn": "Outerwear", "order": 1 },
    { "id": "knit", "name": "针织上衣", "nameEn": "Knitwear", "order": 2 },
    { "id": "dress", "name": "连衣裙", "nameEn": "Dresses", "order": 3 },
    { "id": "pants", "name": "裤装", "nameEn": "Trousers", "order": 4 },
    { "id": "bag", "name": "包袋", "nameEn": "Bags", "order": 5 },
    { "id": "shoes", "name": "鞋履", "nameEn": "Shoes", "order": 6 },
    { "id": "accessory", "name": "配饰", "nameEn": "Accessories", "order": 7 }
  ],

  "products": [
    {
      "id": "p_demo_1",
      "name": "双面羊毛混纺大衣",
      "nameEn": "Double-Faced Wool Blend Coat",
      "category": "coat",
      "price": 899,
      "originalPrice": 1299,
      "unit": "件",
      "unitEn": "pc",
      "images": ["images/demo-coat.svg"],
      "description": "70% 羊毛混纺，双面呢工艺，两面都能穿。H 型直筒版型不挑身材，长度到膝盖上方，配长靴和牛仔裤都好看。\n领口做了双排扣的细节，扣起来利落，敞开穿又很松弛。",
      "descriptionEn": "70% wool blend with a double-faced finish - it can be worn on either side. The straight H-line silhouette suits most body types and falls just above the knee. Looks equally good with boots or jeans.\nDouble-breasted detailing at the collar: buttoned up it reads sharp, worn open it feels relaxed.",
      "sizes": ["S", "M", "L", "XL"],
      "sizesEn": [],
      "colors": [
        { "name": "驼色", "nameEn": "Camel", "hex": "#c8ab8a" },
        { "name": "炭灰", "nameEn": "Charcoal", "hex": "#4a4a4a" },
        { "name": "米白", "nameEn": "Oatmeal", "hex": "#efe9df" }
      ],
      "specs": [
        { "k": "材质", "kEn": "Material", "v": "70% 羊毛 / 30% 聚酯纤维", "vEn": "70% wool / 30% polyester" },
        { "k": "版型", "kEn": "Fit", "v": "H 型直筒，微宽松", "vEn": "Straight H-line, slightly loose" },
        { "k": "厚度", "kEn": "Weight", "v": "中等偏厚，适合 5-15℃", "vEn": "Mid-heavy, good for 5-15C" },
        { "k": "洗涤", "kEn": "Care", "v": "建议干洗，不可漂白", "vEn": "Dry clean recommended, do not bleach" },
        { "k": "模特身高", "kEn": "Model", "v": "168cm / 穿着 M 码", "vEn": "168cm, wearing size M" }
      ],
      "tags": ["新品", "热销"],
      "tagsEn": ["New", "Best Seller"],
      "stock": 12,
      "soldOut": false,
      "hidden": false,
      "featured": true,
      "order": 1,
      "createdAt": "2026-10-12"
    },
    {
      "id": "p_demo_2",
      "name": "高腰阔腿西装裤",
      "nameEn": "High-Waist Wide-Leg Suit Trousers",
      "category": "pants",
      "price": 329,
      "originalPrice": 459,
      "unit": "条",
      "unitEn": "pair",
      "images": ["images/demo-pants.svg"],
      "description": "垂感很好的斜纹西装料，不会皱得很难看。高腰 + 阔腿，视觉上把腿拉长一截，坐着站着都不会崩。\n裤长偏长，配平底鞋刚好拖地一点点，配短靴也合适。",
      "descriptionEn": "A twill suiting fabric with a lovely drape - it creases well rather than badly. The high waist plus a wide leg lengthens the silhouette, and it stays comfortable sitting or standing.\nCut slightly long: it grazes the floor with flats and looks great with ankle boots.",
      "sizes": ["S", "M", "L", "XL", "2XL"],
      "sizesEn": [],
      "colors": [
        { "name": "深灰", "nameEn": "Dark Grey", "hex": "#4b4b4b" },
        { "name": "黑色", "nameEn": "Black", "hex": "#1e1e1e" },
        { "name": "米杏", "nameEn": "Almond", "hex": "#ddd2c0" }
      ],
      "specs": [
        { "k": "材质", "kEn": "Material", "v": "78% 聚酯纤维 / 18% 粘纤 / 4% 氨纶", "vEn": "78% polyester / 18% viscose / 4% elastane" },
        { "k": "裤长", "kEn": "Length", "v": "长裤（M 码裤长 104cm）", "vEn": "Full length (size M: 104cm)" },
        { "k": "腰型", "kEn": "Waist", "v": "高腰，后腰松紧", "vEn": "High waist, elasticated back" },
        { "k": "口袋", "kEn": "Pockets", "v": "两侧斜插袋 + 后贴袋", "vEn": "Two side pockets, two back pockets" }
      ],
      "tags": ["热销"],
      "tagsEn": ["Best Seller"],
      "stock": 26,
      "soldOut": false,
      "hidden": false,
      "featured": false,
      "order": 2,
      "createdAt": "2026-10-10"
    },
    {
      "id": "p_demo_3",
      "name": "真丝印花方巾",
      "nameEn": "Pure Silk Twill Scarf",
      "category": "accessory",
      "price": 199,
      "originalPrice": null,
      "unit": "条",
      "unitEn": "pc",
      "images": ["images/demo-scarf.svg"],
      "description": "100% 桑蚕丝，53×53cm 经典方巾尺寸。系脖子、绑包带、当发带都可以。\n手边有一条好看的方巾，衣服会突然变得有心思。",
      "descriptionEn": "100% mulberry silk in the classic 53 x 53cm square. Wear it at the neck, tied to a bag handle, or as a headband.\nOne good scarf has a way of making a plain outfit look considered.",
      "sizes": ["53 × 53 cm"],
      "sizesEn": ["53 x 53 cm"],
      "colors": [
        { "name": "雾霾蓝", "nameEn": "Misty Blue", "hex": "#a8b8c8" },
        { "name": "焦糖棕", "nameEn": "Caramel", "hex": "#c2844f" }
      ],
      "specs": [
        { "k": "材质", "kEn": "Material", "v": "100% 桑蚕丝", "vEn": "100% mulberry silk" },
        { "k": "尺寸", "kEn": "Size", "v": "53 × 53 cm", "vEn": "53 x 53 cm" },
        { "k": "工艺", "kEn": "Finish", "v": "手工卷边", "vEn": "Hand-rolled edges" },
        { "k": "洗涤", "kEn": "Care", "v": "干洗或冷水手洗，阴干", "vEn": "Dry clean or hand wash cold, dry in shade" }
      ],
      "tags": ["新品"],
      "tagsEn": ["New"],
      "stock": 8,
      "soldOut": false,
      "hidden": false,
      "featured": true,
      "order": 3,
      "createdAt": "2026-10-14"
    },
    {
      "id": "p_demo_4",
      "name": "简约皮质托特包",
      "nameEn": "Minimalist Leather Tote",
      "category": "bag",
      "price": 680,
      "originalPrice": 880,
      "unit": "个",
      "unitEn": "pc",
      "images": ["images/demo-bag.svg"],
      "description": "头层牛皮的质地，越用越有光泽。容量能装下 14 寸笔记本 + 一把伞 + 化妆包，通勤和短途都能应付。\n内里三层分区，最里面有个拉链暗袋，钥匙和卡不会在里面翻半天。",
      "descriptionEn": "Top-grain leather that develops a soft sheen with use. Fits a 14-inch laptop, an umbrella and a makeup pouch - fine for the commute or a short trip.\nThree internal compartments, with a zipped pocket at the back so keys and cards do not disappear.",
      "sizes": ["均码 34 × 28 × 12 cm"],
      "sizesEn": ["One Size 34 x 28 x 12 cm"],
      "colors": [
        { "name": "黑色", "nameEn": "Black", "hex": "#1c1c1c" },
        { "name": "焦糖棕", "nameEn": "Caramel Brown", "hex": "#8b5e3c" }
      ],
      "specs": [
        { "k": "材质", "kEn": "Material", "v": "头层牛皮", "vEn": "Top-grain cowhide" },
        { "k": "尺寸", "kEn": "Dimensions", "v": "34 × 28 × 12 cm", "vEn": "34 x 28 x 12 cm" },
        { "k": "肩带", "kEn": "Strap", "v": "可拆可调，最短 32cm", "vEn": "Detachable and adjustable, from 32cm" },
        { "k": "内里", "kEn": "Interior", "v": "三层分区 + 一个拉链暗袋", "vEn": "Three compartments plus one zipped pocket" },
        { "k": "重量", "kEn": "Weight", "v": "约 620g", "vEn": "Approx. 620g" }
      ],
      "tags": ["热销", "店主推荐"],
      "tagsEn": ["Best Seller", "Staff Pick"],
      "stock": 5,
      "soldOut": false,
      "hidden": false,
      "featured": false,
      "order": 4,
      "createdAt": "2026-09-28"
    },
    {
      "id": "p_demo_5",
      "name": "复古厚底德训鞋",
      "nameEn": "Retro Chunky Trainer",
      "category": "shoes",
      "price": 459,
      "originalPrice": null,
      "unit": "双",
      "unitEn": "pair",
      "images": ["images/demo-shoe.svg"],
      "description": "真皮鞋面 + 3cm 厚底，显高又不累脚。鞋型偏窄，脚宽的建议选大一码。\n试了整整两个月才定下来这个鞋楦，走路不磨脚后跟。",
      "descriptionEn": "Leather upper with a 3cm chunky sole - a little extra height without the ache. The last runs narrow, so go one size up if you have wider feet.\nIt took two months of testing to settle on this last. No blisters on the heel.",
      "sizes": ["35", "36", "37", "38", "39", "40"],
      "sizesEn": [],
      "colors": [
        { "name": "米白", "nameEn": "Off White", "hex": "#f0ede8" },
        { "name": "灰蓝", "nameEn": "Slate Blue", "hex": "#9fb0bd" }
      ],
      "specs": [
        { "k": "鞋面", "kEn": "Upper", "v": "头层牛皮", "vEn": "Top-grain cowhide" },
        { "k": "鞋底", "kEn": "Sole", "v": "橡胶防滑底，厚度 3cm", "vEn": "Non-slip rubber, 3cm thick" },
        { "k": "内里", "kEn": "Lining", "v": "头层猪皮，透气", "vEn": "Pig leather, breathable" },
        { "k": "建议", "kEn": "Sizing", "v": "脚宽/脚背高建议选大一码", "vEn": "Go up one size for wide feet or a high instep" }
      ],
      "tags": ["新品"],
      "tagsEn": ["New"],
      "stock": 0,
      "soldOut": true,
      "hidden": false,
      "featured": false,
      "order": 5,
      "createdAt": "2026-10-05"
    },
    {
      "id": "p_demo_6",
      "name": "珍珠贝母耳钉",
      "nameEn": "Freshwater Pearl Stud Earrings",
      "category": "accessory",
      "price": 159,
      "originalPrice": 219,
      "unit": "对",
      "unitEn": "pair",
      "images": ["images/demo-earring.svg"],
      "description": "天然淡水珍珠搭配贝母，S925 银针不易过敏。直径 6mm，小而不寡淡，日常戴不夸张。",
      "descriptionEn": "Natural freshwater pearls with mother-of-pearl, set on S925 silver posts that are gentle on sensitive ears. At 6mm they are small but not plain - easy to wear every day.",
      "sizes": ["6 mm"],
      "sizesEn": ["6 mm"],
      "colors": [
        { "name": "金色", "nameEn": "Gold", "hex": "#d4af7a" },
        { "name": "银色", "nameEn": "Silver", "hex": "#c0c0c0" }
      ],
      "specs": [
        { "k": "珍珠", "kEn": "Pearl", "v": "天然淡水珍珠，直径约 6mm", "vEn": "Natural freshwater pearl, approx. 6mm" },
        { "k": "针材", "kEn": "Posts", "v": "S925 银针，镀 18K 金", "vEn": "S925 silver, 18K gold plated" },
        { "k": "重量", "kEn": "Weight", "v": "约 1.2g / 对", "vEn": "Approx. 1.2g per pair" },
        { "k": "包装", "kEn": "Packaging", "v": "含礼盒", "vEn": "Gift box included" }
      ],
      "tags": ["送礼首选"],
      "tagsEn": ["Gift Idea"],
      "stock": 30,
      "soldOut": false,
      "hidden": false,
      "featured": false,
      "order": 6,
      "createdAt": "2026-09-20"
    },
    {
      "id": "p_demo_7",
      "name": "马海毛混纺套头针织衫",
      "nameEn": "Mohair Blend Crewneck Sweater",
      "category": "knit",
      "price": 259,
      "originalPrice": 359,
      "unit": "件",
      "unitEn": "pc",
      "images": ["images/demo-knit.svg"],
      "description": "带一点点绒毛感的马海毛混纺，软、轻、不扎。领口和袖口都做了罗纹收口，垂坠感好。\n圆领基础款，三个颜色都是好搭的底色。",
      "descriptionEn": "A mohair blend with a soft halo - light, warm, never itchy. Ribbed neckline and cuffs with a nice natural drape.\nA plain crewneck in three easy base colours.",
      "sizes": ["S", "M", "L"],
      "sizesEn": [],
      "colors": [
        { "name": "燕麦", "nameEn": "Oat", "hex": "#e3d8c6" },
        { "name": "雾灰", "nameEn": "Fog Grey", "hex": "#b4b0aa" },
        { "name": "豆绿", "nameEn": "Sage", "hex": "#8f9c86" }
      ],
      "specs": [
        { "k": "材质", "kEn": "Material", "v": "35% 马海毛 / 40% 羊毛 / 25% 尼龙", "vEn": "35% mohair / 40% wool / 25% nylon" },
        { "k": "版型", "kEn": "Fit", "v": "微宽松，落肩", "vEn": "Relaxed, dropped shoulder" },
        { "k": "洗涤", "kEn": "Care", "v": "冷水手洗，平铺阴干", "vEn": "Hand wash cold, dry flat in shade" }
      ],
      "tags": [],
      "tagsEn": [],
      "stock": 18,
      "soldOut": false,
      "hidden": false,
      "featured": false,
      "order": 7,
      "createdAt": "2026-10-08"
    },
    {
      "id": "p_demo_8",
      "name": "法式收腰吊带连衣裙",
      "nameEn": "French Cinched-Waist Slip Dress",
      "category": "dress",
      "price": null,
      "originalPrice": null,
      "unit": "件",
      "unitEn": "pc",
      "images": ["images/demo-dress.svg"],
      "description": "这条是小批量定制，数量很少，先加微信问一下有没有你的码。\n收腰 A 字摆，腰线上提，显高。附一条同色系腰带。",
      "descriptionEn": "Made in a very small run - message us first to check whether your size is still available.\nA cinched waist with an A-line skirt and a raised waistline that reads taller. Comes with a matching belt.",
      "sizes": ["S", "M", "L"],
      "sizesEn": [],
      "colors": [
        { "name": "奶油白", "nameEn": "Cream", "hex": "#f1ece2" },
        { "name": "墨绿", "nameEn": "Forest Green", "hex": "#3f5348" }
      ],
      "specs": [
        { "k": "材质", "kEn": "Material", "v": "醋酸混纺", "vEn": "Acetate blend" },
        { "k": "版型", "kEn": "Fit", "v": "收腰 A 字，及踝", "vEn": "Cinched A-line, ankle length" },
        { "k": "备注", "kEn": "Note", "v": "小批量定制，建议先咨询", "vEn": "Small-batch production - please enquire first" }
      ],
      "tags": ["限量"],
      "tagsEn": ["Limited"],
      "stock": null,
      "soldOut": false,
      "hidden": false,
      "featured": true,
      "order": 8,
      "createdAt": "2026-10-15"
    }
  ]
};
