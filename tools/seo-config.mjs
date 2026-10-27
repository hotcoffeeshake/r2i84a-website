// SEO 全站配置。品牌名、小程序名改动只改这里，然后运行 `node tools/apply-seo.mjs`。

export const SITE_URL = "https://r2i84a.chat";
export const SITE_BRAND = "情商练习有事问AI";
export const MINIPROGRAM_NAME = "练爱导师";
export const PUBLISHER = "鹿子野 AI Studio";
export const SEO_UPDATED = "2026-10-27";

// 偏题或标题擦边的文章：保留页面，但 noindex，并从 sitemap、llms.txt、列表页移除。
export const NOINDEX_POSTS = [
  "qinggan-005", // 考前技巧答疑
  "qinggan-008", // 从夯到拉锐评男人口活
  "qinggan-012", // 硅谷天价陪聊
  "qinggan-013", // 国外也流行天价彩礼吗
  "qinggan-017", // SpaceX上市
  "qinggan-018", // 魅魔速成语录1.0
  "qinggan-020", // 不同工资男人回家的待遇
  "qinggan-026", // 魅魔语录2.0
  "qinggan-028", // 世界杯太太团颜值排名
  "qinggan-033", // 社畜能遇到山田小姐吗
  "qinggan-034", // 压抑的女大学生
  "qinggan-038", // 对付渣男比他还渣
  "qinggan-039", // 压抑男大的校园生活
  "qinggan-043", // 热干面与彩礼
  "qinggan-044", // 15年氵查女自述
  "qinggan-051", // 字节炒股三千万
  "qinggan-056", // 顶着这张脸说夫妻相处之道
  "qinggan-059", // 坏男人必学语录
  "qinggan-065", // 乖乖女都被黄毛收割了
  "qinggan-015", // 鹅腿阿姨恋爱顾问面经
  "qinggan-016", // 过山车式的聊天，让女生欲罢不能
  "qinggan-035", // 高！手！把！妹！
  "qinggan-036", // 钓系把妹王语录1.0
  "qinggan-045", // 千万男人的情感焦虑生意
  "qinggan-050", // 和adhd女友聊天（正文只有引子）
  "qinggan-060", // 我不是变渣了
];

// 正文和另一篇完全相同的文章：canonical 指向保留的那篇，本篇不进 sitemap。
export const DUPLICATE_POSTS = {
  "qinggan-058": "qinggan-064", // 两篇正文一致，保留 064
};

// 正文少于 THIN_TEXT_LENGTH 字（多为纯图片发布）且不在 POST_OVERRIDES 里的文章，也自动 noindex。
export const THIN_TEXT_LENGTH = 80;

// 以前用过的品牌名。改 SITE_BRAND 时把旧名加进来，apply-seo 会把页面里的旧名替换掉。
export const PREVIOUS_BRANDS = [];

// 改为搜索词标题和语义化 URL 的文章。key 是原始 slug（qinggan-XXX），旧 URL 会 301 到新 slug。
export const POST_OVERRIDES = {
  "qinggan-002": {
    slug: "why-guys-dont-know-what-to-say",
    title: "不知道怎么回她？男生聊天嘴笨的真正原因",
    description: "明明在乎却总回得很冷、关键时刻说不出话，常和回避型依恋有关：怕显得太在乎，就选了看似安全的回复。说明原因和改善方向。",
  },
  "qinggan-009": {
    slug: "chat-opening-lines",
    title: "和女生聊天开场白怎么说？4招让她愿意回",
    description: "别再用“在吗”“你好漂亮”开场。用引发好奇、反向定义、夸奖加反问等方法开口，附可以直接套用的开场句式。",
  },
  "qinggan-011": {
    slug: "why-she-doesnt-chat",
    title: "女生不爱和你聊天的7个原因（附改法）",
    description: "女生不爱和你聊天，常见原因是话题没法接、尬夸、连续提问像查户口、负面情绪太多。逐条说明问题在哪、怎么改。",
  },
  "qinggan-014": {
    slug: "how-to-continue-conversation",
    title: "和女生聊天怎么接话？接话技巧和例句",
    description: "和女生聊天总是接不住话？接话的关键是抓住她话里的情绪和细节再往下延展，附几组接话前后对比例句。",
  },
  "qinggan-019": {
    slug: "rejected-by-her",
    title: "被女生拒绝了怎么办？委婉拒绝和明确拒绝分别怎么回",
    description: "被拒绝后最糟的做法是追问为什么、反复劝说。先分清是委婉拒绝还是明确拒绝，再决定降低频率、体面收尾还是直接放下。",
  },
  "qinggan-031": {
    slug: "she-replies-en",
    title: "女生回“嗯”是什么意思？3种情况怎么回",
    description: "女生回一个“嗯”，可能是在忙、你的话题没法接，或者在看你慌不慌。分三种情况说明怎么判断、下一句怎么接。",
  },
  "qinggan-032": {
    slug: "replies-that-kill-the-chat",
    title: "和女生聊天千万别说的5句话（附替代说法）",
    description: "“你开心就好”这类回复，你觉得大度，她听到的是阴阳怪气。列出5句最容易把天聊死的回复，以及每句可以换成怎么说。",
  },
  "qinggan-037": {
    slug: "chats-but-no-date",
    title: "女生一直聊天却不答应约会，是在养鱼吗？",
    description: "聊了几个月，她天天和你分享生活，却一次次推掉约会。说明“养鱼”常见的几个信号，以及怎么判断该继续还是止损。",
  },
  "qinggan-047": {
    slug: "mbti-nt-nf",
    title: "怎么追NT型和NF型女生？按MBTI选聊天方式",
    description: "同样的嘘寒问暖，有的女生感动，有的直接拒绝。按MBTI拆解NT型和NF型女生各自看重什么、该怎么聊、哪些做法最减分。",
  },
  "qinggan-048": {
    slug: "mbti-sj-sp",
    title: "怎么追SJ型和SP型女生？按MBTI选聊天方式",
    description: "SJ型女生看重靠谱和言行一致，SP型女生看重新鲜和行动力。按MBTI拆解这两类女生的追法、聊天方式和约会安排。",
  },
  "qinggan-049": {
    slug: "chat-gone-quiet",
    title: "和女生聊着聊着没话说了怎么办？冷场急救方法",
    description: "对话停在“哈哈哈”好几分钟，最忌讳发“在吗”“你怎么不说话了”。说明冷场时不要做的事，以及几种自然重启话题的方法。",
  },
  "qinggan-052": {
    slug: "she-says-nothing-much",
    title: "女生说“没干嘛”怎么回？别让话题断掉",
    description: "你问她在干嘛，她说没干嘛，话题就断了。问题出在“在干嘛”本身。说明为什么会冷场，以及几种接得下去的回法。",
  },
  "qinggan-054": {
    slug: "first-date-topics",
    title: "第一次约会聊什么？线下见面聊天公式",
    description: "线上聊得好，一见面就冷场？用开放式话题代替封闭式提问，让她说六成、你说四成，再配合3个冷场急救技巧。",
  },
  "qinggan-061": {
    slug: "she-says-no-feeling",
    title: "女生说对你“没感觉”是什么意思？还有机会吗",
    description: "女生说没感觉，很多时候是你聊得太正经：只会问在干嘛、吃了吗。说明怎么从查户口改成表达感受，让聊天有起伏。",
  },
  "qinggan-062": {
    slug: "60-chat-topics",
    title: "和女生聊天的60个话题，从破冰到暧昧",
    description: "别再用“在干嘛”开头了。按破冰、熟悉、升温、暧昧四个阶段整理60个和女生聊天的话题，每个都能自然聊下去。",
  },  "qinggan-007": {
    slug: "why-her-messages-hard-to-reply",
    title: "不会回女生消息怎么办？先读懂她没说出口的潜台词",
    description: "她发“在干嘛”，回刚睡醒显得无聊，回想你显得油腻，不回又像装死。每条消息背后都有潜台词，先读懂再回。",
  },
  "qinggan-010": {
    slug: "chat-basic-principles",
    title: "和女生聊天的底层逻辑：3条原则让她愿意回你",
    description: "聊天前先想清楚她想要什么、你想要什么：求安慰、分享快乐还是求建议，各给一句可以直接用的回复。",
  },
  "qinggan-023": {
    slug: "men-women-chat-thinking",
    title: "男生女生聊天思维差在哪？她要的是回应不是答案",
    description: "她说好累，你认真帮她分析，她却更不开心。男生目的导向、女生过程导向，说明几处关键差异和怎么接。",
  },
  "qinggan-025": {
    slug: "show-yourself-to-her",
    title: "在女生面前怎么展示自己？3个不吹牛的方法",
    description: "别像简历一样硬吹。通过一件事、身边的人、一个故事，让她自己得出你不错的结论，附错误和正确说法对比。",
  },
  "qinggan-029": {
    slug: "books-for-social-skills",
    title: "男生提升情商看什么书？5本社交进阶书",
    description: "从不敢开口到会说话、能读懂人，5本书按顺序读：搭讪圣经、蔡康永的说话之道、冷读术等，各附一句核心观点。",
  },
  "qinggan-040": {
    slug: "are-pretty-girls-harder-to-chase",
    title: "漂亮女生真的更难追吗？",
    description: "长得好看的女生习惯了被捧，最缺的是被正常对待和被理解。说明为什么普通男生反而有机会，以及该怎么相处。",
  },
  "qinggan-063": {
    slug: "chase-by-her-personality",
    title: "追女生没有万能话术：7种性格的女生分别怎么追",
    description: "乖乖女、感情小白、缺安全感、富家女……用同一套方法追所有人一定碰壁。按7种常见性格说明各自的相处方式。",
  },
  "qinggan-064": {
    slug: "tong-jincheng-reading-emotions",
    title: "童锦程为什么受欢迎？拆了上百个名场面后的结论",
    description: "他强的不是会撩，是先判断她现在是什么情绪，再接住。把女生的回复分成5种反馈，各配一种接法。",
  },
  "qinggan-066": {
    slug: "entp-girlfriend",
    title: "ENTP女生怎么相处？吵不过就换个方式",
    description: "ENTP女朋友爱怼人、点子多、会突然消失。说明这些行为背后是什么意思，怎么接住她又不被带着走。",
  },
};

// 学习页及文章库优先阅读，保留编辑选定的顺序；暂不收录时隐藏，恢复收录后自动回来。
export const PRIORITY_POST_IDS = [
  "qinggan-025", "qinggan-009", "qinggan-010",
  "qinggan-048", "qinggan-014", "qinggan-047",
];
