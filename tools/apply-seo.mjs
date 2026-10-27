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
import { ANSWER_PAGES, ALL_ANSWER_PAGES } from "./answer-pages-data.mjs";
import { ARTICLE_PAGES } from "./article-pages-data.mjs";
import {
  STYLE_VERSION,
  siteHeader,
  siteFooter,
  articleHero,
  editorByline,
  ctaSection,
  authorCard,
  relatedBlock,
  metaFoot,
} from "./article-shell.mjs";

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

// 已经写进 tools/article-pages-data.mjs 的文章：页面由 build-article-pages.mjs 生成，
// 这里只用数据里的标题和一句话结论，正文结构不再动。
const articleDataBySlug = new Map(ARTICLE_PAGES.map((page) => [page.slug, page]));
const dataProseText = (page) =>
  [
    page.verdict,
    ...page.replies.flatMap((r) => [r.she, r.text, r.why]),
    ...page.stages.flatMap((s) => [s.when, s.what, s.note]),
    ...page.judgment,
    ...page.donts.flatMap((d) => [d.say, d.why]),
    page.quote ? page.quote.text : "",
  ].join("");

// 正文：还没换版式的旧文章是 div.article-prose，换过之后是 article.prose，两种都认
const proseOf = (html) => {
  const legacy = html.match(/<div class="article-prose">([\s\S]*?)<\/div>\s*<\/article>/);
  if (legacy) return legacy[1];
  const shelled = html.match(/<article class="prose">([\s\S]*?)<\/article>/);
  return shelled ? shelled[1] : "";
};

const posts = postIds.map((id) => {
  const dir = planById.get(id).destination;
  const file = path.join(dir, "index.html");
  const html = fixCompatChars(fs.readFileSync(file, "utf8"));
  const override = POST_OVERRIDES[id];
  const slug = override ? override.slug : id;
  const data = articleDataBySlug.get(slug);
  const originalTitle = stripTags((html.match(/<h1>([\s\S]*?)<\/h1>/) || [])[1] || id);
  const prose = data ? dataProseText(data) : proseOf(html);
  const text = stripTags(prose)
    .replace("这篇原文属于短答或图文发布，这里保留可读文字；如需查看完整图片排版，请打开原文链接。", "")
    .replace("这篇内容原文以图文为主，这里先保留文章标题、发布平台和原文链接。点击上方平台入口可以查看完整原文。", "")
    .trim();
  const reason = NOINDEX_POSTS.includes(id)
    ? "offtopic"
    : DUPLICATE_POSTS[id]
      ? "duplicate"
      : !override && !data && text.length < THIN_TEXT_LENGTH
        ? "thin"
        : "";
  const platform =
    (data && data.platform) ||
    (html.match(/<span class="source-label">原文发布平台<\/span>\s*<strong>([^<]+)<\/strong>/) || [])[1] ||
    (html.match(/<span data-platform="([^"]+)">/) || [])[1] ||
    "小红书";
  const published = (data && data.published) || (html.match(/"datePublished": "([^"]+)"/) || [])[1] || "2026-07-04";
  return {
    id,
    slug,
    file,
    html,
    text,
    data,
    platform,
    published,
    originalTitle,
    title: data ? data.title : override ? override.title : originalTitle.replace(/\s*-\s*$/, ""),
    description: data ? data.verdict : override ? override.description : makeExcerpt(text, originalTitle),
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

function relatedFor(post) {
  const pool = indexable.filter((p) => p.id !== post.id);
  const after = pool.filter((p) => p.id > post.id);
  const before = pool.filter((p) => p.id < post.id).reverse();
  return [...after.slice(0, 2), ...before].slice(0, 3);
}

const relatedCards = (post) =>
  relatedFor(post).map((p) => ({
    slug: p.slug,
    title: p.title,
    summary: p.description,
    category: (articleDataBySlug.get(p.slug) || {}).category || "情感文章",
  }));

// 还没写进 tools/article-pages-data.mjs 的旧文章：同样套新外壳（页头、深色标题区、页脚、收尾），
// 标题区用现有 description 代替一句话结论（标签「这篇讲什么」），正文保留原文，
// 去掉原帖配图和顶部原文平台条，不放文中行动条和目录。
function legacyShell(post) {
  // 第一次转换时正文在旧结构 .article-prose 里；转换过的页面正文在 <article class="prose"> 里，重复运行时从这里取，模板改了才会跟着更新
  const proseMatch =
    post.html.match(/<div class="article-prose">([\s\S]*?)<\/div>\s*<\/article>/) ||
    post.html.match(/<article class="prose">([\s\S]*?)<\/article>/);
  if (!proseMatch) return null;
  const prose = proseMatch[1].trim();
  const minutes = Math.max(1, Math.round(stripTags(prose).replace(/\s+/g, "").length / 450));

  const bodyOpen = post.html.indexOf("<body>");
  const bodyClose = post.html.lastIndexOf("</body>");
  if (bodyOpen < 0 || bodyClose < 0) throw new Error(`article ${post.slug}: 找不到 <body>`);

  let head = post.html.slice(0, bodyOpen);
  // 文章页不再加载 styles.css（旧的橙色/白色变量会覆盖新配色）
  head = head.replace(/\s*<link rel="stylesheet" href="\.\.\/\.\.\/(?:styles\.css|assets\/(?:article|tokens)\.css)[^"]*" \/>/g, "");
  head = head.replace(
    "</head>",
    `    <link rel="stylesheet" href="../../assets/tokens.css?v=${STYLE_VERSION}" />\n    <link rel="stylesheet" href="../../assets/article.css?v=${STYLE_VERSION}" />\n  </head>`,
  );

  const body = `<body>
${siteHeader()}

${articleHero({
  category: null,
  title: post.title,
  verdict: post.description,
  label: "这篇讲什么",
  byline: editorByline({ minutes }),
})}

    <div class="layout">
      <main>

      <article class="prose">
${prose}
      </article>

${ctaSection()}

${authorCard({ fromCourse: false })}

${relatedBlock(relatedCards(post))}

${metaFoot({ platform: post.platform, published: post.published })}
      </main>
    </div>
${siteFooter()}
  </body>`;
  return head + body + post.html.slice(bodyClose + "</body>".length);
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

  if (post.data) {
    // 页面由 build-article-pages.mjs 按定稿生成，正文结构已经对了，这里只统一 head。
    html = html.replace(/<h1>[\s\S]*?<\/h1>/, `<h1>${escapeHtml(post.title)}</h1>`);
  } else {
    const shelled = legacyShell({ ...post, html });
    if (shelled) html = shelled;
  }

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
  // 文章页统一页头和页脚（照定稿；首页和其它静态页不在这次范围内）
  if (/^blog\/.+\/index\.html$/.test(path.relative(ROOT, file).split(path.sep).join("/"))) {
    html = html.replace(/<header class="site-header">[\s\S]*?<\/header>/, siteHeader().trim());
    html = html.replace(/<footer class="site-footer">[\s\S]*?<\/footer>/, siteFooter().trim());
  }
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

const allAnswers = ALL_ANSWER_PAGES.map((page) => ({
    href: `/answers/${page.slug}`,
    title: page.question,
    kind: page.category,
    summary: page.description,
  }));

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
  const rows = ALL_ANSWER_PAGES.map(
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
  const items = ALL_ANSWER_PAGES.map(
    (page) => `          <li>
            <a href="/answers/${page.slug}"><strong>${escapeHtml(page.question.replace(/？$/, ""))}</strong></a>
            <span>${escapeHtml(page.intro)}</span>
          </li>`,
  ).join("\n");
  if (html.includes("<!-- seo:answers-list:start -->")) {
    html = replaceMarked(html, "answers-list", items, "</ol>\n      </section>\n    </main>");
    write("answers/index.html", html);
  }
}

// ---------- 5b. 目录页统一模板 ----------
function directoryDocument({ title, description, intro, groups, shortcuts = false }) {
  const cards = groups.map((group, index) => `<section class="directory-group"><h2><span class="num">${String(index + 1).padStart(2, "0")}</span>${escapeHtml(group.title)}</h2><div class="directory-grid">${group.items.map((item) => `<a class="directory-card" href="${item.href}"><span class="tag-light">${escapeHtml(item.tag || "情感")}</span><b>${escapeHtml(item.title)}</b><span>${escapeHtml(item.summary || "按场景整理的判断和回复。")}</span></a>`).join("")}</div></section>`).join("");
  const shortcutHtml = shortcuts ? `<div class="directory-shortcuts"><a href="/quiz"><b>聊天反应测试</b><span>先测自己的卡点</span></a><a href="/answers"><b>问答库</b><span>按问题查答案</span></a><a href="/blog"><b>文章库</b><span>按主题系统读</span></a></div>` : "";
  return `<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(title)} | ${SITE_BRAND}</title><meta name="description" content="${escapeHtml(description)}"><meta name="robots" content="index, follow"><link rel="canonical" href="${SITE_URL}/${title === "学习提升" ? "learn" : title === "情感文章库" ? "blog" : "answers"}"><link rel="stylesheet" href="${title === "学习提升" ? "" : "../"}assets/tokens.css?v=${STYLE_VERSION}"><link rel="stylesheet" href="${title === "学习提升" ? "" : "../"}assets/article.css?v=${STYLE_VERSION}"></head><body>${siteHeader({ progress: true })}<section class="hero"><div class="hero-in"><div class="crumbs"><a href="/learn">学习提升</a><span>/</span><span>${escapeHtml(title)}</span></div><h1>${escapeHtml(title)}</h1><div class="verdict"><div class="label">这里有什么</div><p>${escapeHtml(intro)}</p></div></div></section><div class="directory layout"><main class="prose">${shortcutHtml}${cards}${ctaSection()}</main></div>${siteFooter()}<script src="${title === "学习提升" ? "" : "../"}assets/mp-qr.js?v=${STYLE_VERSION}" defer></script></body></html>`;
}
{
  const articleItems = indexable.map((p) => ({ href: `/blog/${p.slug}`, title: p.title, summary: p.description, tag: articleDataBySlug.get(p.slug)?.category || "情感文章" }));
  const featured = PRIORITY_POST_IDS.map((id) => posts.find((p) => p.id === id && p.indexable)).filter(Boolean).map((p) => ({ href: `/blog/${p.slug}`, title: p.title, summary: p.description, tag: articleDataBySlug.get(p.slug)?.category || "优先阅读" }));
  const answerItems = ALL_ANSWER_PAGES.map((p) => ({ href: `/answers/${p.slug}`, title: p.question.replace(/？$/, ""), summary: p.description, tag: p.category }));
  const answerGroups = ["她回了一句话", "判断她的态度", "约会和推进", "吵架和复联"].map((title) => ({ title, items: answerItems.filter((x) => ({ "她回了一句话": ["她回了一句话", "恋爱聊天"], "判断她的态度": ["判断她的态度"], "约会和推进": ["约会和推进", "暧昧推进"], "吵架和复联": ["吵架和复联"] }[title]).includes(x.tag)) }));
  const nonempty = answerGroups.filter((g) => g.items.length);
  write("learn.html", directoryDocument({ title: "学习提升", description: "按问题查问答、按主题读文章，先找到自己的聊天卡点。", intro: "先看 2 分钟测试找到自己的卡点，再按问题查问答、按主题读文章。", shortcuts: true, groups: [{ title: "优先阅读", items: featured }, { title: "问答库精选（6 个）", items: answerItems.slice(0, 6) }, { title: "全部文章", items: articleItems }] }));
  write("blog/index.html", directoryDocument({ title: "情感文章库", description: "按场景整理的聊天和约会文章，每篇先给结论和能直接发的回复。", intro: "按场景整理的聊天和约会文章，每篇先给结论和能直接发的回复。", groups: [{ title: "先读这几篇", items: featured }, ...Object.entries(articleItems.reduce((m, item) => ((m[item.tag] ||= []).push(item), m), {})).map(([title, items]) => ({ title, items }))] }));
  write("answers/index.html", directoryDocument({ title: "问答库", description: "她回了一句话、你不知道怎么接？按问题查，一页一个答案。", intro: "她回了一句话、你不知道怎么接？按问题查，一页一个答案。", groups: nonempty }));
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
