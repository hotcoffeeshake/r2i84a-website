import fs from "node:fs";
import path from "node:path";
import { ALL_ANSWER_PAGES } from "./answer-pages-data.mjs";
import { SITE_URL, SITE_BRAND, SEO_UPDATED, PUBLISHER } from "./seo-config.mjs";
import { siteHeader, siteFooter, articleHero, editorByline, stageBlock, replyCard, dontsBlock, inlineCta, ctaSection, authorCard, tocBlock, overlays, escapeHtml, STYLE_VERSION } from "./article-shell.mjs";
const ROOT = process.cwd();
const pageBySlug = new Map(ALL_ANSWER_PAGES.map((p) => [p.slug, p]));
function related(page) { return (page.related || []).map((slug) => { if (slug.startsWith("/blog/")) return { href: slug, title: slug.slice(6), summary: "相关情感文章", category: "文章" }; const p = pageBySlug.get(slug); return p ? { href: `/answers/${slug}`, title: p.question.replace(/？$/, ""), summary: p.verdict, category: p.category } : null; }).filter(Boolean); }
function faqBlock(faqs) { return `        <section class="faq" id="faq"><h2><span class="num">04</span>常见问题</h2>${faqs.map((f) => `<details><summary>${escapeHtml(f.q)}</summary><p>${escapeHtml(f.a)}</p></details>`).join("\n")}</section>`; }
function relatedBlock(items) { return `      <section class="related"><h3>相关问题</h3><div class="related-list">${items.map((x) => `<a href="${x.href}"><span class="tag-light">${escapeHtml(x.category)}</span><b>${escapeHtml(x.title)}</b><span class="sum">${escapeHtml(x.summary)}</span></a>`).join("\n")}</div></section>`; }
function render(page) {
  const url = `${SITE_URL}/answers/${page.slug}`;
  const stages = (page.cases || []).slice(0, 3).map((x, i) => ({ when: x.title, what: i === 2 ? "先停一下" : "可以继续观察", note: x.text, warn: i === 2 }));
  const replies = (page.replies || []).slice(0, 3).map((r) => ({ she: r.label, text: r.text, why: page.replyNote || "具体、轻松，给对方接话和拒绝的空间。" }));
  const hero = articleHero({ category: page.category, title: page.question, verdict: page.verdict || page.description, label: "一句话结论", byline: editorByline({ minutes: 4 }) });
  const toc = [{ id: "signals", label: "01 先看这几个信号" }, { id: "reply", label: "02 可以直接发的回复" }, { id: "donts", label: "03 别这样回" }, { id: "faq", label: "04 常见问题" }, { id: "boundary", label: "什么时候该停" }];
  const donts = [{ say: "连续追问“你怎么了？”", why: "把一次短回复放大成压力。" }, { say: "马上解释和证明自己", why: "先停下来读上下文，再决定下一句。" }];
  const ld = { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: (page.faqs || []).map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })), author: { "@type": "Person", name: "小腾哥" } };
  return `<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(page.seoTitle)} | ${SITE_BRAND}</title><meta name="description" content="${escapeHtml(page.description)}"><meta name="robots" content="index, follow"><link rel="canonical" href="${url}"><meta property="og:title" content="${escapeHtml(page.question)}"><meta property="og:description" content="${escapeHtml(page.description)}"><link rel="stylesheet" href="../assets/tokens.css?v=${STYLE_VERSION}"><link rel="stylesheet" href="../assets/article.css?v=${STYLE_VERSION}"><script type="application/ld+json">${JSON.stringify(ld)}</script></head><body>${siteHeader()}${hero}<div class="layout"><main class="prose">
        <section id="signals"><h2><span class="num">01</span>先看这几个信号</h2>${stageBlock(stages)}<p>${escapeHtml(page.signalsNote || page.verdict)}</p></section>
        <section id="reply"><h2><span class="num">02</span>可以直接发的回复</h2>${replies.map(replyCard).join("\n")}</section>${inlineCta()}
        <section id="donts"><h2><span class="num">03</span>别这样回</h2>${dontsBlock(donts)}</section>${faqBlock(page.faqs || [])}
        <section id="boundary" class="boundary"><h2>什么时候该停</h2><p>${escapeHtml(page.boundary)}</p></section>
        ${ctaSection()}${authorCard({ fromCourse: false })}${relatedBlock(related(page))}<div class="meta-foot"><span>最后更新：${SEO_UPDATED}</span><a href="/answers">返回问答库</a></div></main>${tocBlock({ items: toc })}</div>${siteFooter()}${overlays()}<script src="../assets/article.js?v=${STYLE_VERSION}" defer></script><script src="../assets/mp-qr.js?v=${STYLE_VERSION}" defer></script></body></html>`;
}
for (const page of ALL_ANSWER_PAGES) { fs.writeFileSync(path.join(ROOT, "answers", `${page.slug}.html`), render(page)); console.log(`generated answers/${page.slug}.html`); }
