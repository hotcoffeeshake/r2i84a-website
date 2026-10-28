// 生成专题页：tools/topic-pages-data.mjs → eq.html、love-advisor.html、ai-relationship-coach.html、tong-jincheng-skill.html。
// 用法：node tools/build-topic-pages.mjs（之后再跑 node tools/apply-seo.mjs）
// <head> 里的标题、描述、canonical、结构化数据保留原页面的，只换样式表；<body> 按定稿外壳重新生成。可重复运行。
import fs from "node:fs";
import path from "node:path";
import { TOPIC_PAGES } from "./topic-pages-data.mjs";
import { ALL_ANSWER_PAGES } from "./answer-pages-data.mjs";
import {
  STYLE_VERSION,
  escapeHtml,
  siteHeader,
  siteFooter,
  articleHero,
  replyCard,
  stageBlock,
  tocBlock,
  ctaSection,
  authorCard,
  overlays,
} from "./article-shell.mjs";

const ROOT = process.cwd();
const answerBySlug = new Map(ALL_ANSWER_PAGES.map((page) => [page.slug, page]));

function cleanHead(head) {
  return head
    .replace(/\s*<link rel="stylesheet" href="[^"]*(?:styles\.css|tokens\.css|article\.css)[^"]*" \/>/g, "")
    .replace(/\s*<style id="mp-float-style">[\s\S]*?<\/style>/g, "")
    .replace(/\s*<script src="\/assets\/[a-z-]+\.js[^"]*" defer><\/script>/g, "")
    .replace(
      /\s*<\/head>\s*$/,
      `\n    <link rel="stylesheet" href="./assets/tokens.css?v=${STYLE_VERSION}" />\n    <link rel="stylesheet" href="./assets/article.css?v=${STYLE_VERSION}" />\n  </head>`,
    );
}

function block(b) {
  if (b.type === "p") return `        <p>${escapeHtml(b.text)}</p>`;
  if (b.type === "checklist") {
    return `        <ul class="checklist${b.warn ? " warn" : ""}">\n${b.items.map((x) => `          <li>${escapeHtml(x)}</li>`).join("\n")}\n        </ul>`;
  }
  if (b.type === "cards") {
    const html = stageBlock(
      b.items.map((x, i) => ({ when: x.label || String(i + 1).padStart(2, "0"), what: x.title, note: x.text })),
    );
    return b.items.length === 4 || b.items.length === 2 ? html.replace('<div class="stage">', '<div class="stage four">') : html;
  }
  if (b.type === "copy") return replyCard({ she: b.label, text: b.text });
  if (b.type === "faq") {
    return `        <div class="faq">\n${b.items
      .map((f) => `          <details><summary>${escapeHtml(f.q)}</summary><p>${escapeHtml(f.a)}</p></details>`)
      .join("\n")}\n        </div>`;
  }
  throw new Error(`unknown block type ${b.type}`);
}

function relatedSection(slugs, file) {
  const items = slugs.map((slug) => {
    const page = answerBySlug.get(slug);
    if (!page) throw new Error(`${file}: related 里的 ${slug} 不是已有问答页`);
    return page;
  });
  return `      <section class="related">
        <h3>推荐阅读</h3>
        <div class="related-list">
${items
  .map(
    (p) => `          <a href="/answers/${p.slug}"><span class="tag-light">${escapeHtml(p.group)}</span><b>${escapeHtml(p.question)}</b><span class="sum">${escapeHtml(p.intro)}</span></a>`,
  )
  .join("\n")}
        </div>
      </section>`;
}

function renderBody(page) {
  const secs = page.sections.map((sec, i) => ({ id: `s${i + 1}`, ...sec }));
  const body = [
    `        <p>${escapeHtml(page.intro)}</p>`,
    ...secs.map((sec, i) =>
      [`        <h2 id="${sec.id}"><span class="num">${String(i + 1).padStart(2, "0")}</span>${escapeHtml(sec.title)}</h2>`, ...sec.blocks.map(block)].join("\n"),
    ),
  ].join("\n\n");
  const toc = secs.length >= 3 ? tocBlock({ items: secs.map((s) => ({ id: s.id, label: s.title })) }) : "";

  return `<body>
${siteHeader()}

${articleHero({ title: page.title, verdict: page.verdict, label: "这页讲什么", root: { href: "/learn", label: "学习提升" } })}

    <div class="layout">
      <main>

      <article class="prose">
${body}
      </article>

${ctaSection()}
${page.author ? `\n${authorCard({ fromCourse: false })}\n` : ""}
${relatedSection(page.related, page.file)}
      </main>
${toc ? `\n${toc}` : ""}
    </div>
${siteFooter()}

${overlays()}
  </body>`;
}

for (const page of TOPIC_PAGES) {
  const file = path.join(ROOT, page.file);
  const html = fs.readFileSync(file, "utf8");
  const headEnd = html.indexOf("<body");
  if (headEnd < 0) throw new Error(`${page.file}: 找不到 <body>`);
  const out = `${cleanHead(html.slice(0, headEnd))}\n  ${renderBody(page)}\n</html>\n`;
  fs.writeFileSync(file, out);
  console.log(`generated ${page.file}`);
}
console.log(`topic pages: ${TOPIC_PAGES.length}`);
