// 按定稿生成文章页：tools/article-pages-data.mjs → blog/<slug>/index.html。
// 用法：node tools/build-article-pages.mjs（之后再跑 node tools/apply-seo.mjs 更新列表页、sitemap、llms.txt）
// 结构、类名照 网站SEO_GEO/文章页设计稿.html；外壳在 tools/article-shell.mjs。
import fs from "node:fs";
import path from "node:path";
import { ARTICLE_PAGES } from "./article-pages-data.mjs";
import { POST_OVERRIDES, SITE_URL, SITE_BRAND } from "./seo-config.mjs";
import {
  STYLE_VERSION,
  escapeHtml,
  siteHeader,
  siteFooter,
  articleHero,
  authorByline,
  replyCard,
  stageBlock,
  dontsBlock,
  quoteBlock,
  inlineCta,
  tocBlock,
  ctaSection,
  authorCard,
  relatedBlock,
  metaFoot,
  overlays,
  jsonLd,
} from "./article-shell.mjs";

const ROOT = process.cwd();
const DEFAULT_OG_IMAGE = `${SITE_URL}/assets/relationship-ai-workbench.png`;

// slug → 标题 / 摘要 / 分类，供「接着读」和校验用
const bySlug = new Map();
for (const page of ARTICLE_PAGES) bySlug.set(page.slug, { title: page.title, summary: page.verdict, category: page.category });
for (const [id, post] of Object.entries(POST_OVERRIDES)) {
  if (!bySlug.has(post.slug)) bySlug.set(post.slug, { title: post.title, summary: post.description, category: "" });
}

const countText = (value) => value.replace(/<[^>]+>/g, "").replace(/\s+/g, "").length;

function readingMinutes(page) {
  const chars =
    countText(page.verdict) +
    page.replies.reduce((n, r) => n + countText(r.text) + countText(r.why) + countText(r.she), 0) +
    page.stages.reduce((n, s) => n + countText(s.when + s.what + s.note), 0) +
    page.judgment.reduce((n, p) => n + countText(p), 0) +
    page.donts.reduce((n, d) => n + countText(d.say + d.why), 0) +
    (page.quote ? countText(page.quote.text) : 0);
  return Math.max(1, Math.round(chars / 400));
}

function existingMeta(slug) {
  const file = path.join(ROOT, "blog", slug, "index.html");
  const out = {};
  if (!fs.existsSync(file)) return out;
  const html = fs.readFileSync(file, "utf8");
  const ogImage = html.match(/<meta property="og:image" content="([^"]+)"/);
  if (ogImage) out.image = ogImage[1];
  const published = html.match(/"datePublished": "([^"]+)"/);
  if (published) out.published = published[1];
  return out;
}

function relatedFor(page) {
  const refs = page.related || [];
  if (!refs.length) return [];
  return refs.slice(0, 3).map((slug) => {
    const target = bySlug.get(slug);
    if (!target) throw new Error(`article ${page.slug}: related 里的 ${slug} 不是已有文章`);
    return { slug, title: target.title, summary: target.summary, category: target.category || "情感文章" };
  });
}

function renderPage(page) {
  const url = `${SITE_URL}/blog/${page.slug}`;
  const meta = existingMeta(page.slug);
  const published = page.published || meta.published || "2026-07-04";
  const minutes = readingMinutes(page);
  const fromCourse = Boolean(page.quote);
  const related = relatedFor(page);

  const body = [
    `        <h2 id="s1"><span class="num">01</span>可以直接发的回复</h2>`,
    page.replies.map(replyCard).join("\n"),
    inlineCta(),
    `        <h2 id="s2"><span class="num">02</span>先判断：她现在是哪种状态</h2>`,
    stageBlock(page.stages),
    page.judgment.map((p) => `        <p>${p}</p>`).join("\n"),
    `        <h2 id="s3"><span class="num">03</span>别这样回</h2>`,
    dontsBlock(page.donts),
    page.quote ? quoteBlock(page.quote) : "",
  ]
    .filter(Boolean)
    .join("\n\n");

  return `<!DOCTYPE html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${escapeHtml(page.title)} | ${SITE_BRAND}</title>
    <meta name="description" content="${escapeHtml(page.verdict)}" />
    <meta name="robots" content="index, follow" />
    <link rel="canonical" href="${url}" />
    <meta property="og:type" content="article" />
    <meta property="og:title" content="${escapeHtml(page.title)}" />
    <meta property="og:description" content="${escapeHtml(page.verdict)}" />
    <meta property="og:url" content="${url}" />
    <meta property="og:image" content="${meta.image || DEFAULT_OG_IMAGE}" />
    <link rel="stylesheet" href="../../assets/tokens.css?v=${STYLE_VERSION}" />
    <link rel="stylesheet" href="../../assets/article.css?v=${STYLE_VERSION}" />
    <script type="application/ld+json">
${jsonLd({
  url,
  title: page.title,
  description: page.verdict,
  published,
  image: meta.image || DEFAULT_OG_IMAGE,
  category: page.category,
})}
    </script>
  </head>
  <body>
${siteHeader()}

${articleHero({
  category: page.category,
  title: page.title,
  verdict: page.verdict,
  minutes,
  byline: authorByline({ minutes, fromCourse }),
})}

    <div class="layout">
      <main>

      <article class="prose">
${body}
      </article>

${ctaSection()}

${authorCard({ fromCourse })}

${relatedBlock(related)}

${metaFoot({ platform: page.platform, published })}
      </main>

${tocBlock({
  items: [
    { id: "s1", label: "可以直接发的回复" },
    { id: "s2", label: "先判断她的状态" },
    { id: "s3", label: "别这样回" },
  ],
})}
    </div>
${siteFooter()}

${overlays()}
  </body>
</html>
`;
}

for (const page of ARTICLE_PAGES) {
  const dir = path.join(ROOT, "blog", page.slug);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, "index.html"), renderPage(page));
  console.log(`generated blog/${page.slug}/index.html`);
}
console.log(`article pages: ${ARTICLE_PAGES.length}`);
