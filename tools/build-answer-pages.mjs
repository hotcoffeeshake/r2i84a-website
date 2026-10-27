// 按定稿生成问答页：tools/answer-pages-data.mjs → answers/<slug>.html。
// 用法：node tools/build-answer-pages.mjs（之后再跑 node tools/apply-seo.mjs 更新列表页、sitemap、llms.txt）
// 外壳、组件和文章页共用 tools/article-shell.mjs，结构照 网站SEO_GEO/实施规范_其余页面改版.md 第 4 节。
// 小节只渲染数据里有的字段，不补写数据里没有的内容。
import fs from "node:fs";
import path from "node:path";
import { ALL_ANSWER_PAGES } from "./answer-pages-data.mjs";
import { ARTICLE_PAGES } from "./article-pages-data.mjs";
import { POST_OVERRIDES, SITE_URL, SITE_BRAND, PUBLISHER, SEO_UPDATED } from "./seo-config.mjs";
import {
  STYLE_VERSION,
  escapeHtml,
  siteHeader,
  siteFooter,
  articleHero,
  editorByline,
  replyCard,
  stageBlock,
  inlineCta,
  tocBlock,
  ctaSection,
  authorCard,
  overlays,
} from "./article-shell.mjs";

const ROOT = process.cwd();
const OG_IMAGE = `${SITE_URL}/assets/relationship-ai-workbench.png`;
const pageBySlug = new Map(ALL_ANSWER_PAGES.map((page) => [page.slug, page]));

// 「相关问题」里的文章链接：数据里可能是旧网址（qinggan-0xx 或改名前的 slug），
// 按 POST_OVERRIDES 的原始 ID 和 vercel.json 里的跳转历史找到现在的文章。
const redirects = JSON.parse(fs.readFileSync(path.join(ROOT, "vercel.json"), "utf8")).redirects || [];
const blogAliases = new Map();
for (const [id, post] of Object.entries(POST_OVERRIDES)) {
  const aliases = new Set([`/blog/${id}`, `/blog/${post.slug}`]);
  let changed = true;
  while (changed) {
    changed = false;
    for (const { source, destination } of redirects) {
      if (!source.startsWith("/blog/") || !destination.startsWith("/blog/")) continue;
      if ((aliases.has(source) || aliases.has(destination)) && !(aliases.has(source) && aliases.has(destination))) {
        aliases.add(source);
        aliases.add(destination);
        changed = true;
      }
    }
  }
  for (const alias of aliases) blogAliases.set(alias, post);
}
const articleSummary = new Map(ARTICLE_PAGES.map((page) => [page.slug, page.verdict]));

function relatedItem(ref, page) {
  if (ref.startsWith("/blog/")) {
    const post = blogAliases.get(ref);
    if (!post) throw new Error(`answer ${page.slug}: related 里的 ${ref} 找不到对应文章`);
    return { href: `/blog/${post.slug}`, tag: "文章", title: post.title, summary: articleSummary.get(post.slug) || post.description };
  }
  const target = pageBySlug.get(ref);
  if (!target) throw new Error(`answer ${page.slug}: related 里的 ${ref} 不是已有问答页`);
  return { href: `/answers/${ref}`, tag: target.group, title: target.question, summary: target.intro };
}

function relatedSection(items) {
  if (!items.length) return "";
  return `      <section class="related">
        <h3>相关问题</h3>
        <div class="related-list">
${items
  .map(
    (item) => `          <a href="${item.href}"><span class="tag-light">${escapeHtml(item.tag)}</span><b>${escapeHtml(item.title)}</b><span class="sum">${escapeHtml(item.summary)}</span></a>`,
  )
  .join("\n")}
        </div>
      </section>`;
}

const countText = (value) => String(value || "").replace(/\s+/g, "").length;

function readingMinutes(page) {
  const parts = [
    page.intro,
    page.replyNote,
    ...(page.replies || []).map((r) => r.label + r.text),
    ...(page.signals || []),
    page.signalsNote,
    page.casesNote,
    ...(page.cases || []).map((c) => `${c.title}${c.text}`),
    page.stepsNote,
    ...(page.steps || []),
    ...(page.faqs || []).map((f) => f.q + f.a),
    page.boundary,
  ];
  return Math.max(1, Math.round(parts.reduce((n, p) => n + countText(p), 0) / 400));
}

/** 按数据生成小节：有内容才出现，编号按出现顺序排 */
function sections(page) {
  const list = [];
  if (page.replies && page.replies.length) {
    list.push({
      id: "reply",
      title: page.replyTitle || "可以直接发的回复",
      html: [
        page.replyNote ? `        <p>${escapeHtml(page.replyNote)}</p>` : "",
        page.replies.map((r) => replyCard({ she: r.label, text: r.text, why: r.why })).join("\n"),
      ],
      after: inlineCta(),
    });
  }
  if (page.signals && page.signals.length) {
    list.push({
      id: "signals",
      title: page.signalsTitle || "先看这几个信号",
      html: [
        `        <ul class="checklist">\n${page.signals.map((s) => `          <li>${escapeHtml(s)}</li>`).join("\n")}\n        </ul>`,
        page.signalsNoteTitle ? `        <h3>${escapeHtml(page.signalsNoteTitle)}</h3>` : "",
        page.signalsNote ? `        <p>${escapeHtml(page.signalsNote)}</p>` : "",
      ],
    });
  }
  if (page.cases && page.cases.length) {
    const stage = stageBlock(
      page.cases.map((c, i) => ({ when: c.label || `情况 ${i + 1}`, what: c.title, note: c.text, warn: Boolean(c.warn) })),
    );
    list.push({
      id: "cases",
      title: page.casesTitle || "不同情况怎么处理",
      html: [
        page.casesNote ? `        <p>${escapeHtml(page.casesNote)}</p>` : "",
        page.cases.length === 4 ? stage.replace('<div class="stage">', '<div class="stage four">') : stage,
      ],
    });
  }
  if (page.steps && page.steps.length) {
    list.push({
      id: "steps",
      title: page.stepsTitle || "接下来怎么做",
      html: [
        page.stepsNote ? `        <p>${escapeHtml(page.stepsNote)}</p>` : "",
        `        <ol class="steps">\n${page.steps.map((s) => `          <li>${escapeHtml(s)}</li>`).join("\n")}\n        </ol>`,
      ],
    });
  }
  if (page.faqs && page.faqs.length) {
    list.push({
      id: "faq",
      title: "常见问题",
      html: [
        `        <div class="faq">\n${page.faqs
          .map((f) => `          <details><summary>${escapeHtml(f.q)}</summary><p>${escapeHtml(f.a)}</p></details>`)
          .join("\n")}\n        </div>`,
      ],
    });
  }
  return list;
}

function jsonLd(page, url) {
  const graph = [
    {
      "@type": "WebPage",
      "@id": `${url}#webpage`,
      url,
      name: `${page.seoTitle} | ${SITE_BRAND}`,
      inLanguage: "zh-CN",
      description: page.description,
      dateModified: SEO_UPDATED,
      publisher: { "@type": "Organization", name: PUBLISHER, url: SITE_URL },
    },
    {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: SITE_BRAND, item: `${SITE_URL}/` },
        { "@type": "ListItem", position: 2, name: "问答库", item: `${SITE_URL}/answers` },
        { "@type": "ListItem", position: 3, name: page.question, item: url },
      ],
    },
  ];
  if (page.faqs && page.faqs.length) {
    graph.push({
      "@type": "FAQPage",
      mainEntity: page.faqs.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
    });
  }
  return JSON.stringify({ "@context": "https://schema.org", "@graph": graph }, null, 2);
}

function renderPage(page) {
  const url = `${SITE_URL}/answers/${page.slug}`;
  const minutes = readingMinutes(page);
  const secs = sections(page);
  const body = secs
    .map((sec, i) =>
      [
        `        <h2 id="${sec.id}"><span class="num">${String(i + 1).padStart(2, "0")}</span>${escapeHtml(sec.title)}</h2>`,
        ...sec.html.filter(Boolean),
        sec.after || "",
      ]
        .filter(Boolean)
        .join("\n"),
    )
    .join("\n\n");
  const stop = page.boundary
    ? `        <section class="stop" id="stop">
          <h2>${escapeHtml(page.boundaryTitle || "什么时候该停")}</h2>
          <p>${escapeHtml(page.boundary)}</p>
        </section>`
    : "";
  const tocItems = [...secs.map((s) => ({ id: s.id, label: s.title })), ...(page.boundary ? [{ id: "stop", label: page.boundaryTitle || "什么时候该停" }] : [])];

  return `<!DOCTYPE html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${escapeHtml(page.seoTitle)} | ${SITE_BRAND}</title>
    <meta name="description" content="${escapeHtml(page.description)}" />
    <meta name="robots" content="index, follow" />
    <link rel="canonical" href="${url}" />
    <meta property="og:type" content="article" />
    <meta property="og:title" content="${escapeHtml(page.question)}" />
    <meta property="og:description" content="${escapeHtml(page.description)}" />
    <meta property="og:url" content="${url}" />
    <meta property="og:image" content="${OG_IMAGE}" />
    <link rel="stylesheet" href="../assets/tokens.css?v=${STYLE_VERSION}" />
    <link rel="stylesheet" href="../assets/article.css?v=${STYLE_VERSION}" />
    <script type="application/ld+json">
${jsonLd(page, url)}
    </script>
  </head>
  <body>
${siteHeader()}

${articleHero({
  category: page.group,
  title: page.question,
  verdict: page.intro,
  minutes,
  byline: editorByline({ minutes }),
  root: { href: "/answers", label: "问答库" },
})}

    <div class="layout">
      <main>

      <article class="prose">
${body}
${stop}
      </article>

${ctaSection()}

${authorCard({ fromCourse: false })}

${relatedSection((page.related || []).map((ref) => relatedItem(ref, page)))}

      <div class="meta-foot"><span>最后更新：${SEO_UPDATED}</span><a href="/answers">返回问答库</a></div>
      </main>

${tocBlock({ items: tocItems })}
    </div>
${siteFooter()}

${overlays()}
  </body>
</html>
`;
}

for (const page of ALL_ANSWER_PAGES) {
  fs.writeFileSync(path.join(ROOT, "answers", `${page.slug}.html`), renderPage(page));
  console.log(`generated answers/${page.slug}.html`);
}
console.log(`answer pages: ${ALL_ANSWER_PAGES.length}`);
