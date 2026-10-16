// 渲染 tools/answer-pages-data.mjs 里的问答页到 answers/<slug>.html。
// 用法：node tools/build-answer-pages.mjs（之后再跑 node tools/apply-seo.mjs 更新列表页、sitemap、llms.txt）
// 页面结构沿用 answers/girl-not-replying.html。
import fs from "node:fs";
import path from "node:path";
import { ANSWER_PAGES } from "./answer-pages-data.mjs";
import { SITE_URL, SITE_BRAND, MINIPROGRAM_NAME, PUBLISHER, SEO_UPDATED, POST_OVERRIDES } from "./seo-config.mjs";

const ROOT = process.cwd();
const STYLE_VERSION = "202607060725";
const SCRIPT_VERSION = "202607060715";

// 站内已有问答页，供「推荐阅读」使用。
const EXISTING_ANSWERS = {
  "girl-not-replying": "女生不回消息怎么办",
  "ambiguous-relationship": "暧昧期怎么推进关系",
  "chat-cold": "男生聊天冷场怎么办",
  "first-message-after-breakup": "分手后第一句话怎么说",
  "does-she-like-me": "怎么判断她是不是喜欢我",
  "is-ai-relationship-coach-reliable": "AI 情感导师靠谱吗",
};

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function relatedLink(ref) {
  if (ref.startsWith("/blog/")) {
    const slug = ref.slice("/blog/".length);
    const post = Object.values(POST_OVERRIDES).find((item) => item.slug === slug);
    if (!post) throw new Error(`unknown blog ref ${ref}`);
    return { href: ref, title: post.title, kind: "文章" };
  }
  const page = ANSWER_PAGES.find((item) => item.slug === ref);
  const title = page ? page.question.replace(/？$/, "") : EXISTING_ANSWERS[ref];
  if (!title) throw new Error(`unknown answer ref ${ref}`);
  return { href: `/answers/${ref}`, title, kind: "问答" };
}

function jsonLd(page, url) {
  return JSON.stringify({
    "@context": "https://schema.org",
    "@graph": [
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
        "@type": "FAQPage",
        mainEntity: page.faqs.map((faq) => ({
          "@type": "Question",
          name: faq.q,
          acceptedAnswer: { "@type": "Answer", text: faq.a },
        })),
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: SITE_BRAND, item: `${SITE_URL}/` },
          { "@type": "ListItem", position: 2, name: "恋爱问题答疑库", item: `${SITE_URL}/answers` },
          { "@type": "ListItem", position: 3, name: page.question, item: url },
        ],
      },
    ],
  });
}

function renderPage(page) {
  const url = `${SITE_URL}/answers/${page.slug}`;
  const sections = [
    { id: "signals", title: "先看这几个信号" },
    { id: "moves", title: "不同情况怎么处理" },
    { id: "reply", title: "可参考回复" },
    { id: "faq", title: "常见问题" },
    { id: "boundary", title: "什么时候该停下来" },
  ];
  const related = page.related.map(relatedLink);

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
    <meta property="og:image" content="${SITE_URL}/assets/relationship-ai-workbench.png" />
    <link rel="stylesheet" href="../styles.css?v=${STYLE_VERSION}" />
    <script type="application/ld+json">${jsonLd(page, url)}</script>
  </head>
  <body>
    <div class="qa-page-shell">

    <header class="site-header">
      <a class="brand" href="/" aria-label="${SITE_BRAND} 首页">
        <span>${SITE_BRAND}</span>
        <small>聊天复盘 · 关系判断</small>
      </a>
      <nav class="site-nav" aria-label="主导航">
        <a href="https://r2i84a.chat/#pricing">购买会员</a>
        <a href="/experience" target="_blank" rel="noopener">体验AI恋爱导师</a>
        <a href="/learn">学习提升</a>
      </nav>
    </header>
      <main>
        <section class="qa-hero">
          <div class="qa-hero-inner">
            <nav class="qa-breadcrumb" aria-label="面包屑">
              <a href="/answers">恋爱问题答疑库</a>
              <span>/</span>
              <span>${escapeHtml(page.question)}</span>
            </nav>
            <h1>${escapeHtml(page.question)}</h1>
            <p class="qa-subtitle">${escapeHtml(page.subtitle)}</p>
            <p class="qa-intro">${escapeHtml(page.intro)}</p>
            <p class="qa-updated" style="margin-top:12px;font-size:.875rem;opacity:.65">最后更新：${SEO_UPDATED}</p>
          </div>
        </section>

        <section class="qa-layout">
          <article class="qa-main">

            <section class="qa-section" id="signals">
              <div class="qa-section-heading"><h2>先看这几个信号</h2></div>
              <ul class="qa-check-list">
${page.signals.map((item) => `                <li>${escapeHtml(item)}</li>`).join("\n")}
              </ul>
              <div class="qa-prose">
                <p>${escapeHtml(page.signalsNote)}</p>
              </div>
            </section>
            <section class="qa-section" id="moves">
              <div class="qa-section-heading"><h2>不同情况怎么处理</h2></div>
              <div class="qa-card-grid">
${page.cases
  .map(
    (item) => `                <div class="qa-card">
                  <h3>${escapeHtml(item.title)}</h3>
                  <p>${escapeHtml(item.text)}</p>
                </div>`,
  )
  .join("\n")}
              </div>
              <ol class="qa-ordered-list">
${page.steps.map((item) => `                <li>${escapeHtml(item)}</li>`).join("\n")}
              </ol>
            </section>
            <section class="qa-section" id="reply">
              <div class="qa-section-heading"><h2>可参考回复</h2></div>
              <div class="qa-prose">
                <p>${escapeHtml(page.replyNote)}</p>
              </div>
${page.replies
  .map(
    (reply, index) => `              <div class="qa-reply-card">
                <div class="qa-reply-head">
                  <span>${escapeHtml(reply.label)}</span>
                  <button class="qa-copy-button" type="button" data-copy-target="${page.slug}-copy-${index + 1}">复制</button>
                </div>
                <pre id="${page.slug}-copy-${index + 1}"><code>${escapeHtml(reply.text)}</code></pre>
              </div>`,
  )
  .join("\n")}
            </section>

            <section class="qa-section" id="faq">
              <div class="qa-section-heading"><h2>常见问题</h2></div>
              <div class="qa-faq-list">
${page.faqs
  .map(
    (faq, index) => `                <div class="qa-faq-item">
                  <button class="qa-faq-toggle" type="button" aria-expanded="${index === 0 ? "true" : "false"}">
                    <span>${escapeHtml(faq.q)}</span>
                    <span class="qa-faq-icon">⌄</span>
                  </button>
                  <div class="qa-faq-answer">${escapeHtml(faq.a)}</div>
                </div>`,
  )
  .join("\n")}
              </div>
            </section>

            <section class="qa-section" id="boundary">
              <div class="qa-section-heading"><h2>什么时候该停下来</h2></div>
              <div class="qa-prose">
                <p>${escapeHtml(page.boundary)}</p>
              </div>
            </section>
          </article>

          <aside class="qa-sidebar" aria-label="页面侧栏">
            <div class="qa-cta-card">
              <h2>把你的聊天截图发给 AI</h2>
              <p>每段关系的情况都不一样。把聊天截图发给 AI，帮你判断她这句话的意思，再给出适合你们的回复。</p>
              <p>微信搜索「${MINIPROGRAM_NAME}」小程序即可使用。</p>
              <a href="/experience" target="_blank" rel="noopener">扫码体验 →</a>
            </div>

            <div class="qa-sidebar-card">
              <h2>本页内容</h2>
              <nav class="qa-toc" aria-label="本页内容">
${sections.map((item, index) => `                <a class="${index === 0 ? "active" : ""}" href="#${item.id}">${item.title}</a>`).join("\n")}
              </nav>
            </div>

            <div class="qa-sidebar-card">
              <h2>推荐阅读</h2>
              <div class="qa-side-links">
${related.map((item) => `                <a class="qa-side-link" href="${item.href}"><strong>${escapeHtml(item.title)}</strong><span>${item.kind}</span></a>`).join("\n")}
              </div>
            </div>
          </aside>
        </section>

        <section class="qa-bottom-cta">
          <div class="qa-bottom-cta-inner">
            <div>
              <strong>还有别的问题？</strong>
              <a href="/answers">查看全部问答 →</a>
            </div>
            <a class="qa-bottom-primary" href="/experience" target="_blank" rel="noopener">直接体验 AI 导师</a>
          </div>
        </section>
      </main>

    <footer class="site-footer">
      <p>© 2026 ${PUBLISHER}. ${SITE_BRAND}是聊天复盘与 AI 恋爱导师项目。</p>
      <div>
        <a href="https://r2i84a.chat/#pricing">购买会员</a>
        <a href="/experience" target="_blank" rel="noopener">体验AI恋爱导师</a>
        <a href="/learn">学习提升</a>
      </div>
    </footer>
    </div>
    <script src="../script.js?v=${SCRIPT_VERSION}"></script>
  </body>
</html>
`;
}

for (const page of ANSWER_PAGES) {
  const filePath = path.join(ROOT, "answers", `${page.slug}.html`);
  fs.writeFileSync(filePath, renderPage(page));
  console.log(`generated answers/${page.slug}.html`);
}
