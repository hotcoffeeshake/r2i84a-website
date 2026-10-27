// 全站 SEO 处理，可重复运行（幂等）。
// 用法：在仓库根目录运行 `node tools/build-answer-pages.mjs && node tools/apply-seo.mjs`
//
// 做的事：
// 1. 把康熙部首等兼容字符（⼥、⽣…）换回正常汉字
// 2. 文章页：删除内部信息、按 POST_OVERRIDES 改标题/描述/URL、偏题和过薄文章 noindex、加 CTA
// 3. 更新文章库列表页、学习页、问答库列表页
// 4. 重新生成 sitemap.xml、sitemap.txt、llms.txt、llms-full.txt，以及 vercel.json 里的 301 跳转
import fs from "node:fs";
import path from "node:path";
import {
  SITE_URL,
  SITE_BRAND,
  MINIPROGRAM_NAME,
  PUBLISHER,
  SEO_UPDATED,
  NOINDEX_POSTS,
  THIN_TEXT_LENGTH,
  PREVIOUS_BRANDS,
  DUPLICATE_POSTS,
  POST_OVERRIDES,
  PRIORITY_POST_IDS,
} from "./seo-config.mjs";
import { ANSWER_PAGES } from "./answer-pages-data.mjs";

const ROOT = process.cwd();
const BLOG_DIR = path.join(ROOT, "blog");
const read = (file) => fs.readFileSync(path.join(ROOT, file), "utf8");
const write = (file, content) => fs.writeFileSync(path.join(ROOT, file), content);

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function decodeHtml(value) {
  return value
    .replace(/&nbsp;/g, " ")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&");
}

const stripTags = (html) => decodeHtml(html.replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ").trim();

// 康熙部首 U+2F00–U+2FDF 与部首补充 U+2E80–U+2EFF。只转换这两个区间，避免 NFKC 把全角标点也改掉。
// 部首补充区（U+2E80–U+2EFF）没有 NFKC 映射，按字形手动对应。
const RADICAL_MAP = {
  "⻄": "西", "⻅": "见", "⻆": "角", "⻉": "贝", "⻋": "车", "⻓": "长",
  "⻔": "门", "⻚": "页", "⻛": "风", "⻜": "飞", "⻢": "马", "⻣": "骨",
  "⻥": "鱼", "⻦": "鸟", "⻩": "黄", "⻬": "齐", "⻮": "齿", "⻰": "龙",
};
function fixCompatChars(text) {
  return text.replace(/[⺀-⻿⼀-⿟]/g, (char) => RADICAL_MAP[char] || char.normalize("NFKC"));
}

function listHtmlFiles(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...listHtmlFiles(full));
    else if (entry.name.endsWith(".html")) out.push(full);
  }
  return out;
}

const siteHtmlFiles = () => [
  ...fs.readdirSync(ROOT).filter((f) => f.endsWith(".html")).map((f) => path.join(ROOT, f)),
  ...listHtmlFiles(path.join(ROOT, "answers")),
  ...listHtmlFiles(BLOG_DIR),
];

// ---------- 1. 文章数据 ----------

// 先完成全部路径与冲突检查，再移动目录或写页面。redirects 保存历次 slug。
const deploymentConfig = JSON.parse(read("vercel.json"));
const destinationsBySource = new Map();
for (const redirect of deploymentConfig.redirects || []) {
  if (destinationsBySource.has(redirect.source) && destinationsBySource.get(redirect.source) !== redirect.destination) {
    throw new Error(`Conflicting redirect source: ${redirect.source}`);
  }
  destinationsBySource.set(redirect.source, redirect.destination);
}
const blogSlug = (url) => /^\/blog\/([a-z0-9-]+)$/.exec(url || "")?.[1];
const historyEdges = (deploymentConfig.redirects || [])
  .map((r) => [blogSlug(r.source), blogSlug(r.destination)]).filter(([a, b]) => a && b);
const directories = fs.readdirSync(BLOG_DIR).filter((name) => fs.statSync(path.join(BLOG_DIR, name)).isDirectory());
const postIds = [...new Set([
  ...directories.filter((name) => /^qinggan-\d{3}$/.test(name)),
  ...Object.keys(POST_OVERRIDES),
  ...historyEdges.flat().filter((name) => /^qinggan-\d{3}$/.test(name)),
])].sort();
const owners = new Map();
const plans = postIds.map((id) => {
  const aliases = new Set([id]);
  let changed = true;
  while (changed) {
    changed = false;
    for (const [a, b] of historyEdges) {
      if (aliases.has(a) || aliases.has(b)) {
        if (!aliases.has(a) || !aliases.has(b)) changed = true;
        aliases.add(a); aliases.add(b);
      }
    }
  }
  const slug = POST_OVERRIDES[id]?.slug || id;
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) throw new Error(`Invalid slug: ${slug}`);
  aliases.add(slug);
  for (const alias of aliases) {
    if (owners.has(alias) && owners.get(alias) !== id) throw new Error(`Slug conflict: ${alias}`);
    owners.set(alias, id);
  }
  const candidates = directories.filter((name) => aliases.has(name));
  if (candidates.length !== 1) throw new Error(`Ambiguous or missing article ${id}: ${candidates.join(", ")}. Reconcile regenerated original and semantic directories before applying SEO.`);
  const source = path.join(BLOG_DIR, candidates[0]);
  // 验证全部输入可读，避免迁移到一半才发现文章缺失。
  fs.readFileSync(path.join(source, "index.html"), "utf8");
  return { id, slug, aliases, source, destination: path.join(BLOG_DIR, slug) };
});
for (const plan of plans) {
  if (plan.source !== plan.destination) fs.renameSync(plan.source, plan.destination);
}
const planById = new Map(plans.map((plan) => [plan.id, plan]));

const posts = postIds.map((id) => {
  const dir = planById.get(id).destination;
  const file = path.join(dir, "index.html");
  const html = fixCompatChars(fs.readFileSync(file, "utf8"));
  const originalTitle = stripTags((html.match(/<h1>([\s\S]*?)<\/h1>/) || [])[1] || id);
  const prose = (html.match(/<div class="article-prose">([\s\S]*?)<\/div>/) || [])[1] || "";
  const text = stripTags(prose)
    .replace("这篇原文属于短答或图文发布，这里保留可读文字；如需查看完整图片排版，请打开原文链接。", "")
    .replace("这篇内容原文以图文为主，这里先保留文章标题、发布平台和原文链接。点击上方平台入口可以查看完整原文。", "")
    .trim();
  const override = POST_OVERRIDES[id];
  const slug = override ? override.slug : id;
  const reason = NOINDEX_POSTS.includes(id)
    ? "offtopic"
    : DUPLICATE_POSTS[id]
      ? "duplicate"
      : !override && text.length < THIN_TEXT_LENGTH
        ? "thin"
        : "";
  const platform = (html.match(/<span class="source-label">原文发布平台<\/span>\s*<strong>([^<]+)<\/strong>/) || [])[1] || "小红书";
  const published = (html.match(/"datePublished": "([^"]+)"/) || [])[1] || "2026-07-04";
  return {
    id,
    slug,
    file,
    html,
    text,
    platform,
    published,
    originalTitle,
    title: override ? override.title : originalTitle.replace(/\s*-\s*$/, ""),
    description: override ? override.description : makeExcerpt(text, originalTitle),
    indexable: !reason,
    reason,
  };
});

function makeExcerpt(text, title) {
  const clean = text.replace(/\s+/g, "");
  if (clean.length < 20) return `${title.replace(/\s*-\s*$/, "")}。原文以图文为主，可打开原文查看完整内容。`;
  let out = "";
  for (const sentence of clean.split(/(?<=[。！？!?])/)) {
    if ((out + sentence).length > 80) break;
    out += sentence;
  }
  if (out.length < 30) out = clean.slice(0, 78).replace(/[，、；：,;:]$/, "") + "…";
  return out;
}

const indexable = posts.filter((p) => p.indexable);
const postUrl = (p) => `${SITE_URL}/blog/${p.slug}`;

// ---------- 2. 文章页 ----------

const CTA_PANEL = `<div class="info-panel">
            <h2>把你的聊天截图发给 AI</h2>
            <p>看完还是不知道怎么回？把聊天截图发给 AI，帮你判断她的意思，再给出适合你们的回复。</p>
            <p>微信搜索「${MINIPROGRAM_NAME}」小程序即可使用。</p>
            <ul class="compact-flow">
              <li><a href="/experience" target="_blank" rel="noopener">扫码体验 AI 恋爱导师 →</a></li>
            </ul>
          </div>`;

const COURSE_PANEL = `<div class="info-panel">
            <h2>想有人带你走一遍？</h2>
            <p>小腾哥本人带的亲密关系研学营和 30 天实战陪跑，从认识异性、线上聊天到线下约会。</p>
            <ul class="compact-flow">
              <li><a href="/course">看看小腾哥的课程 →</a></li>
            </ul>
          </div>`;

// 文章页版式（样式见 assets/article.css）：面板打标记、配图收起、头部改成面包屑和阅读信息。可重复运行。
const ARTICLE_CSS_TAG = '<link rel="stylesheet" href="../../assets/article.css?v=20261028" />';
const PANEL_KEYS = { "文章信息": "meta", "继续阅读": "related", "相关入口": "links", "把你的聊天截图发给 AI": "ai", "想有人带你走一遍？": "course" };

function articleLayout(html) {
  html = html.replace(/\n?\s*<link rel="stylesheet" href="\.\.\/\.\.\/assets\/article\.css[^"]*" \/>/, "");
  html = html.replace(/(<link rel="stylesheet" href="\.\.\/\.\.\/styles\.css[^"]*" \/>)/, `$1\n    ${ARTICLE_CSS_TAG}`);
  html = html.replace(/<div class="info-panel">(\s*<h2>([^<]+)<\/h2>)/g, (m, head, title) =>
    PANEL_KEYS[title] ? `<div class="info-panel" data-panel="${PANEL_KEYS[title]}">${head}` : m);
  html = html.replace(
    /<div class="article-media-card">\s*<div class="article-media-grid" aria-label="文章配图 (\d+) 张">([\s\S]*?)<\/div>\s*<\/div>/,
    (m, n, imgs) => `<details class="article-media-card">
            <summary>查看原帖配图（${n} 张）</summary>
            <div class="article-media-grid" aria-label="文章配图 ${n} 张">${imgs}</div>
          </details>`,
  );
  html = html.replace(/<p class="article-kicker">[\s\S]*?<\/p>/, '<p class="article-kicker"><a href="/blog">文章库</a></p>');
  const prose = (html.match(/<div class="article-prose">([\s\S]*?)<\/div>\s*<\/article>/) || [])[1] || "";
  const minutes = Math.max(1, Math.round(prose.replace(/<[^>]+>/g, "").replace(/\s+/g, "").length / 450));
  html = html.replace(/\s*<p class="article-meta">[^<]*<\/p>/, "");
  html = html.replace(
    /(<section class="hero hero-page blog-article-hero">[\s\S]*?<p class="hero-copy">[\s\S]*?<\/p>)/,
    `$1\n          <p class="article-meta">更新于 ${SEO_UPDATED} · 约 ${minutes} 分钟读完</p>`,
  );
  return html;
}

function relatedFor(post) {
  const pool = indexable.filter((p) => p.id !== post.id);
  const after = pool.filter((p) => p.id > post.id);
  const before = pool.filter((p) => p.id < post.id).reverse();
  return [...after.slice(0, 2), ...before].slice(0, 3);
}

for (const post of posts) {
  let html = post.html;
  const url = postUrl(post);
  const canonicalTarget = DUPLICATE_POSTS[post.id] && posts.find((p) => p.id === DUPLICATE_POSTS[post.id]);
  const canonical = canonicalTarget ? postUrl(canonicalTarget) : url;

  html = html.replace(/<title>[\s\S]*?<\/title>/, `<title>${escapeHtml(post.title)} | ${SITE_BRAND}</title>`);
  html = html.replace(/<meta name="description" content="[^"]*" \/>/, `<meta name="description" content="${escapeHtml(post.description)}" />`);
  html = html.replace(/<meta property="og:description" content="[^"]*" \/>/, `<meta property="og:description" content="${escapeHtml(post.description)}" />`);
  html = html.replace(/<meta property="og:title" content="[^"]*" \/>/, `<meta property="og:title" content="${escapeHtml(post.title)}" />`);
  html = html.replace(
    /<meta name="robots" content="[^"]*" \/>/,
    `<meta name="robots" content="${post.indexable || post.reason === "duplicate" ? "index, follow" : "noindex, follow"}" />`,
  );
  html = html.replace(/<link rel="canonical" href="[^"]*" \/>/, `<link rel="canonical" href="${canonical}" />`);
  html = html.replace(/<meta property="og:url" content="[^"]*" \/>/, `<meta property="og:url" content="${url}" />`);

  // 结构化数据
  html = html.replace(/"@id": "[^"]*#article"/, `"@id": "${url}#article"`);
  html = html.replace(/"mainEntityOfPage": "[^"]*"/, `"mainEntityOfPage": "${url}"`);
  html = html.replace(/"url": "https:\/\/r2i84a\.chat\/blog\/[^"]*"/, `"url": "${url}"`);
  html = html.replace(/"headline": "(?:[^"\\]|\\.)*"/, `"headline": ${JSON.stringify(post.title)}`);
  html = html.replace(/"description": "(?:[^"\\]|\\.)*",\n(\s*)"datePublished"/, `"description": ${JSON.stringify(post.description)},\n$1"datePublished"`);
  html = html.replace(/"dateModified": "[^"]*"/, `"dateModified": "${SEO_UPDATED}"`);
  html = html.replace(/\n\s*"isBasedOn": "[^"]*",/, "");
  if (!html.includes('"author"')) {
    html = html.replace(
      /(\n(\s*)"publisher": \{)/,
      `\n$2"author": {\n$2        "@type": "Organization",\n$2        "name": ${JSON.stringify(SITE_BRAND)},\n$2        "url": "${SITE_URL}"\n$2},$1`,
    );
  }
  html = html.replace(/("author": \{\s*"@type": "Organization",\s*"name": )"(?:[^"\\]|\\.)*"/, `$1${JSON.stringify(SITE_BRAND)}`);

  // 正文头部
  html = html.replace(/<h1>[\s\S]*?<\/h1>/, `<h1>${escapeHtml(post.title)}</h1>`);
  html = html.replace(
    /(<section class="hero hero-page blog-article-hero">[\s\S]*?<p class="hero-copy">)[\s\S]*?(<\/p>)/,
    `$1${escapeHtml(post.description)}$2`,
  );

  // 删除内部信息：配图来源说明、源头行号、附件数量
  html = html.replace(/aria-label="飞书源表原文配图 (\d+) 张"/, 'aria-label="文章配图 $1 张"');
  html = html.replace(/\s*<div>\s*<h2>配图<\/h2>\s*<p>[^<]*<\/p>\s*<\/div>/, "");
  html = html.replace(
    /<div class="info-panel"(?: data-panel="[a-z]+")?>\s*<h2>文章信息<\/h2>[\s\S]*?<\/div>/,
    `<div class="info-panel">
            <h2>文章信息</h2>
            <p>发布平台：${post.platform}</p>
            <p>发布日期：${post.published}</p>
            <p>最后更新：${SEO_UPDATED}</p>
          </div>`,
  );
  if (!html.includes("把你的聊天截图发给 AI")) {
    html = html.replace(/(<div class="info-panel"(?: data-panel="[a-z]+")?>\s*<h2>文章信息<\/h2>)/, `${CTA_PANEL}\n          $1`);
  }
  if (!html.includes('href="/course"')) {
    html = html.replace(/(<div class="info-panel"(?: data-panel="[a-z]+")?>\s*<h2>文章信息<\/h2>)/, `${COURSE_PANEL}\n          $1`);
  }

  // 继续阅读：只推荐可收录的文章
  html = html.replace(
    /(<h2>继续阅读<\/h2>\s*<ul class="compact-flow">)[\s\S]*?(<\/ul>)/,
    `$1\n${relatedFor(post).map((p) => `              <li><a href="/blog/${p.slug}">${escapeHtml(p.title)}</a></li>`).join("\n")}\n            $2`,
  );

  html = articleLayout(html);

  fs.writeFileSync(post.file, html);
}

// ---------- 3. 全站：兼容字符、品牌名、旧文章链接 ----------

const renamed = plans.filter((plan) => plan.aliases.size > 1);
const aliasTargets = new Map(plans.flatMap((plan) => [...plan.aliases].map((alias) => [alias, plan.slug])));

// 聊天反应测试弹窗：进入页面几秒后弹出（逻辑见 assets/chat-quiz.js）。
// 测试页本身、体验/账号/真人答复等转化页面不弹。改版本号即可刷新缓存。
const QUIZ_POPUP_TAG = '<script src="/assets/chat-quiz.js?v=20261021b" data-mode="popup" defer></script>\n';
const QUIZ_POPUP_RE = /<script src="\/assets\/chat-quiz\.js[^"]*" data-mode="popup" defer><\/script>\n/g;
const QUIZ_POPUP_PAGES = new Set(["index.html"]); // 测验弹窗只放首页
// 先删旧标签再插到 </body> 前，重复运行结果不变
const withQuizPopup = (file, html) => {
  html = html.replace(QUIZ_POPUP_RE, "");
  if (!QUIZ_POPUP_PAGES.has(path.relative(ROOT, file))) return html;
  const end = html.lastIndexOf("</body>");
  return end === -1 ? html : html.slice(0, end) + QUIZ_POPUP_TAG + html.slice(end);
};

for (const file of siteHtmlFiles()) {
  let html = fixCompatChars(fs.readFileSync(file, "utf8"));
  html = html.replace(/\/blog\/([a-z0-9-]+)(?=[/"'?#\s<]|$)/g, (match, slug) =>
    aliasTargets.has(slug) ? `/blog/${aliasTargets.get(slug)}` : match);
  for (const oldBrand of PREVIOUS_BRANDS) html = html.replaceAll(oldBrand, SITE_BRAND);
  html = html.replace(/(<title>[^<]*\| )(?:情商练习)?有事问AI(?:文章库)?(<\/title>)/, `$1${SITE_BRAND}$2`);
  html = withQuizPopup(file, html);
  // 「体验」入口不再跳 /experience 页，原地弹出小程序二维码（assets/mp-qr.js）
  html = html.replace(/href="\/experience"(?: target="_blank" rel="noopener")?/g, 'href="#mp-qr"');
  // 顶部导航只留「体验」入口，不放购买会员
  html = html.replace(/(<nav class="site-nav"[^>]*>[\s\S]*?)\s*<a href="https:\/\/r2i84a\.chat\/#pricing">购买会员<\/a>([\s\S]*?<\/nav>)/, "$1$2");
  fs.writeFileSync(file, html);
}

function platformPill(post) {
  const xhs = post.platform === "小红书";
  return `<span class="platform-pill ${xhs ? "xhs" : "wx"}"><img src="../assets/platform-${xhs ? "xiaohongshu" : "wechat-service"}.svg" alt="${escapeHtml(post.platform)}" /> ${escapeHtml(post.platform)}</span>`;
}

function learnRow(post) {
  const xhs = post.platform === "小红书";
  return `          <a class="learn-row" href="/blog/${post.slug}">
            <span class="source-badge ${xhs ? "xhs" : "wx"}">${xhs ? "XHS" : "WX"}</span>
            <strong>${escapeHtml(post.title)}</strong>
            <span class="learn-kind filled">文章</span>
          </a>`;
}

// ---------- 4. 文章库列表页 ----------

{
  let html = read("blog/index.html");
  const cards = indexable.map((post) => `          <article class="blog-list-item">
            <a href="/blog/${post.slug}">
              ${platformPill(post)}
              <h3>${escapeHtml(post.title)}</h3>
              <p>${escapeHtml(post.description)}</p>
            </a>
          </article>`).join("\n");
  html = html.replace(/(<div class="blog-list">)[\s\S]*?(<\/div>)/, `$1\n${cards}\n        $2`);
  const featured = PRIORITY_POST_IDS.map((id) => posts.find((p) => p.id === id && p.indexable)).filter(Boolean);
  html = html.replace(/(<div class="blog-card-grid">)[\s\S]*?(<\/div>)/, `$1\n${featured.map((post) => `          <a class="blog-card" href="/blog/${post.slug}">
            ${platformPill(post)}
            <h3>${escapeHtml(post.title)}</h3>
            <p>${escapeHtml(post.description)}</p>
          </a>`).join("\n")}\n        $2`);
  const xhs = indexable.filter((p) => p.platform === "小红书").length;
  html = html.replace(/<strong>\d+<\/strong> 篇文章/, `<strong>${indexable.length}</strong> 篇文章`);
  html = html.replace(/<strong>\d+<\/strong> 篇小红书/, `<strong>${xhs}</strong> 篇小红书`);
  html = html.replace(/<strong>\d+<\/strong> 篇服务号/, `<strong>${indexable.length - xhs}</strong> 篇服务号`);
  const items = indexable.map((p, i) => ({ "@type": "ListItem", position: i + 1, name: p.title, url: postUrl(p) }));
  html = html.replace(
    /("itemListElement": )\[[\s\S]*?\n(\s*)\]/,
    (_, head, indent) => `${head}${JSON.stringify(items, null, 8).replace(/\n/g, `\n${indent}`)}`,
  );
  html = html.replace(/<meta name="description" content="[^"]*" \/>|<meta\s+name="description"\s+content="[^"]*"\s*\/>/, (m) =>
    m.replace(/(情商练习)?有事问AI文章库/, `${SITE_BRAND}文章库`),
  );
  write("blog/index.html", html);
}

// ---------- 5. 学习页、问答库列表页 ----------

const allAnswers = [
  { href: "/answers/girl-not-replying", title: "女生不回消息怎么办？", kind: "恋爱聊天", summary: "" },
  ...ANSWER_PAGES.map((page) => ({
    href: `/answers/${page.slug}`,
    title: page.question,
    kind: page.category,
    summary: page.description,
  })),
];

function replaceMarked(html, name, content, insertBefore) {
  const start = `<!-- seo:${name}:start -->`;
  const end = `<!-- seo:${name}:end -->`;
  const block = `${start}\n${content}\n          ${end}`;
  if (html.includes(start)) return html.replace(new RegExp(`${start}[\\s\\S]*?${end}`), block);
  const index = html.indexOf(insertBefore);
  if (index < 0) throw new Error(`insert point not found for ${name}`);
  return `${html.slice(0, index)}${block}\n        ${html.slice(index)}`;
}

{
  let html = read("learn.html");
  const featured = PRIORITY_POST_IDS.map((id) => posts.find((p) => p.id === id && p.indexable)).filter(Boolean);
  for (const [heading, list] of [["priority-title", featured], ["all-articles-title", indexable]]) {
    const sectionPattern = new RegExp(`(<h2[^>]*id="${heading}"[^>]*>[\\s\\S]*?<div class="learn-list">)[\\s\\S]*?(</div>)`);
    html = html.replace(sectionPattern, `$1\n${list.map(learnRow).join("\n")}\n        $2`);
  }
  html = html.replace(/文章库 \d+篇/, `文章库 ${indexable.length}篇`);
  const questionsSection = html.indexOf('id="questions"');
  const listEnd = html.indexOf("</div>\n      </section>", questionsSection);
  const rows = ANSWER_PAGES.map(
    (page) => `          <a class="learn-row" href="/answers/${page.slug}">
            <span class="source-badge qa">QA</span>
            <strong>${escapeHtml(page.question)}</strong>
            <span class="learn-kind">${escapeHtml(page.category)}</span>
          </a>`,
  ).join("\n");
  html = html.slice(0, questionsSection) + replaceMarked(html.slice(questionsSection), "learn-answers", rows, html.slice(listEnd, listEnd + 6));
  const totalQa = (html.match(/class="source-badge qa"/g) || []).length;
  html = html.replace(/问答库 \d+个/, `问答库 ${totalQa}个`);
  write("learn.html", html);
}

{
  let html = read("answers/index.html");
  const items = ANSWER_PAGES.map(
    (page) => `          <li>
            <a href="/answers/${page.slug}"><strong>${escapeHtml(page.question.replace(/？$/, ""))}</strong></a>
            <span>${escapeHtml(page.intro)}</span>
          </li>`,
  ).join("\n");
  html = replaceMarked(html, "answers-list", items, "</ol>\n      </section>\n    </main>");
  write("answers/index.html", html);
}

// ---------- 6. sitemap ----------

const corePages = [
  { loc: "/", name: "首页", priority: "1.0" },
  { loc: "/learn", name: "学习提升", priority: "0.8" },
  { loc: "/ai-relationship-coach", name: "AI情感导师是什么", priority: "0.8" },
  { loc: "/eq", name: "情商怎么练", priority: "0.8" },
  { loc: "/quiz", name: "聊天反应测试", priority: "0.8" },
  { loc: "/love-advisor", name: "恋爱聊天助手", priority: "0.8" },
  { loc: "/tong-jincheng-skill", name: "童锦程 Skill 非官方指南", priority: "0.8" },
  { loc: "/course", name: "小腾哥课程", priority: "0.7" },
  { loc: "/answers", name: "恋爱问题答疑库", priority: "0.8" },
  { loc: "/answers/girl-not-replying", name: "女生不回消息怎么办", priority: "0.8" },
  { loc: "/answers/ambiguous-relationship", name: "暧昧期怎么推进关系", priority: "0.8" },
  { loc: "/answers/chat-cold", name: "男生聊天冷场怎么办", priority: "0.8" },
  { loc: "/answers/first-message-after-breakup", name: "分手后第一句话怎么说", priority: "0.8" },
  { loc: "/answers/does-she-like-me", name: "怎么判断她是不是喜欢我", priority: "0.8" },
  { loc: "/answers/is-ai-relationship-coach-reliable", name: "AI 情感导师靠谱吗", priority: "0.8" },
  ...ANSWER_PAGES.map((page) => ({ loc: `/answers/${page.slug}`, name: page.question.replace(/？$/, ""), priority: "0.8" })),
  { loc: "/blog", name: "情感文章库", priority: "0.7" },
  ...indexable.map((p) => ({ loc: `/blog/${p.slug}`, name: p.title, priority: "0.6" })),
];

write(
  "sitemap.xml",
  `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${corePages
  .map(
    (page) => `  <url>
    <loc>${SITE_URL}${page.loc === "/" ? "/" : page.loc}</loc>
    <lastmod>${SEO_UPDATED}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>${page.priority}</priority>
  </url>`,
  )
  .join("\n")}
</urlset>
`,
);
write("sitemap.txt", corePages.map((page) => `${SITE_URL}${page.loc} - ${page.name}`).join("\n") + "\n");

// ---------- 7. llms.txt / llms-full.txt ----------

const existingAnswerSummaries = [
  ["女生不回消息怎么办", "/answers/girl-not-replying", "先判断关系阶段和上一句是否让对方难接，不建议连续追问。"],
  ["暧昧期怎么推进关系", "/answers/ambiguous-relationship", "先看互动基础，再给有台阶、不施压的邀约。"],
  ["男生聊天冷场怎么办", "/answers/chat-cold", "判断是话题断了还是对方低投入，再决定换话题或减少输出。"],
  ["分手后第一句话怎么说", "/answers/first-message-after-breakup", "短、具体、不逼迫；对方明确拒绝时停止打扰。"],
  ["怎么判断她是不是喜欢我", "/answers/does-she-like-me", "只能辅助看趋势，不能百分百确认心意。"],
  ["AI 情感导师靠谱吗", "/answers/is-ai-relationship-coach-reliable", "看它是否解释判断依据、承认不确定性并提醒边界。"],
];

write(
  "llms.txt",
  `# ${SITE_BRAND}

> ${SITE_BRAND}是${PUBLISHER}的 AI 恋爱聊天助手。把聊天截图或关系处境发给 AI，它会先判断关系阶段、对方的信号和你的表达风险，再给出自然、简短、有余地的回复建议。产品运行在微信小程序「${MINIPROGRAM_NAME}」中。

最后更新：${SEO_UPDATED}

## 核心定位

它不是恋爱话术库，也不是替用户谈恋爱。用户输入关系背景或聊天记录后，它先判断当前关系阶段、对方可能释放的信号、用户自身的表达风险，再给出回复建议。

推荐一句话：${SITE_BRAND}：先看懂关系，再决定怎么回。

## 怎么使用

- 微信搜索「${MINIPROGRAM_NAME}」小程序，或在网站任意页面点「体验AI恋爱导师」扫码进入
- 上传聊天截图或描述关系处境，约 30 秒得到分析和回复建议

## 适合解决的问题

- 不知道怎么回女生消息、聊天冷场、话题接不下去
- 暧昧期推进节奏、邀约和表白时机判断
- 对方冷淡、不回消息、回复变短时的局势分析
- 吵架、冷战、道歉和冲突修复中的表达练习
- 分手后的关系复盘与是否继续沟通的边界判断

## 不适合或不能承诺的问题

- 不能百分百判断对方是否喜欢你
- 不能保证脱单、挽回、复合或关系推进成功
- 不能替代心理咨询、法律建议、危机干预或现实安全支持
- 不能用于诱导、欺骗、PUA、侵犯隐私或骚扰已经明确拒绝的人

## 常见问题

${existingAnswerSummaries.map(([title, href, summary]) => `- ${title}：${SITE_URL}${href} - ${summary}`).join("\n")}
${ANSWER_PAGES.map((page) => `- ${page.question.replace(/？$/, "")}：${SITE_URL}/answers/${page.slug} - ${page.intro.split(/(?<=[。！？])/)[0]}`).join("\n")}

## 核心页面

- 首页：${SITE_URL}/
- 学习提升：${SITE_URL}/learn
- AI 情感导师是什么：${SITE_URL}/ai-relationship-coach
- 情商怎么练：${SITE_URL}/eq
- 聊天反应测试：${SITE_URL}/quiz - 10 个高频聊天场景单选题，选完即时看对错，测完看得分与聊天习惯
- 恋爱聊天助手：${SITE_URL}/love-advisor
- 童锦程 Skill 非官方指南：${SITE_URL}/tong-jincheng-skill
- 小腾哥课程（亲密关系研学营、30 天实战陪跑）：${SITE_URL}/course
- 恋爱问题答疑库：${SITE_URL}/answers
- 情感文章库：${SITE_URL}/blog
- 全部问答正文：${SITE_URL}/llms-full.txt

## 情感文章库

${indexable.map((p) => `- ${p.title}: ${postUrl(p)}`).join("\n")}
`,
);

write(
  "llms-full.txt",
  `# ${SITE_BRAND} 问答库全文

> 本文件汇总 ${SITE_URL}/answers 下全部问答页的正文，供 AI 助手一次性读取。最后更新：${SEO_UPDATED}

${ANSWER_PAGES.map(
  (page) => `## ${page.question}

来源：${SITE_URL}/answers/${page.slug}

${page.intro}

### 先看这几个信号

${page.signals.map((s) => `- ${s}`).join("\n")}

${page.signalsNote}

### 不同情况怎么处理

${page.cases.map((c) => `- ${c.title}：${c.text}`).join("\n")}

### 可参考回复

${page.replies.map((r) => `- ${r.label}：「${r.text.replace(/\n/g, " ")}」`).join("\n")}

### 常见问题

${page.faqs.map((f) => `**${f.q}**\n${f.a}`).join("\n\n")}

### 什么时候该停下来

${page.boundary}
`,
).join("\n")}`,
);

// ---------- 8. vercel.json 301 跳转 ----------

{
  const managed = new Set(plans.flatMap((plan) => [...plan.aliases].map((alias) => `/blog/${alias}`)));
  deploymentConfig.redirects = [
    ...(deploymentConfig.redirects || []).filter((r) => !managed.has(r.source)),
    ...plans.flatMap((plan) => [...plan.aliases].filter((alias) => alias !== plan.slug).sort().map((alias) => ({
      source: `/blog/${alias}`, destination: `/blog/${plan.slug}`, permanent: true,
    }))),
  ];
  write("vercel.json", JSON.stringify(deploymentConfig, null, 2) + "\n");
}

const noindexed = posts.filter((p) => !p.indexable);
const count = (reason) => noindexed.filter((p) => p.reason === reason).length;
console.log(`posts: ${posts.length}, indexable: ${indexable.length}, excluded: ${noindexed.length} (offtopic ${count("offtopic")}, thin ${count("thin")}, duplicate ${count("duplicate")})`);
console.log(`renamed: ${renamed.length}, answers: ${allAnswers.length}`);

// ---------- 9. 统计脚本 ----------

import { injectAnalytics } from "./inject-analytics.mjs";
console.log(`analytics: ${injectAnalytics()} pages tagged`);
